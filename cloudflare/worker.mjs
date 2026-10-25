const ORIGIN = 'https://lufei-lee.github.io';
const HOSTNAME = 'lufei-lee.github.io';
const MAX_BODY = 16384;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ORIGIN,
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }});
}

async function readBody(request) {
  if (!request.body) throw new Error('invalid_body');
  const reader = request.body.getReader();
  const parts = []; let size = 0;
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); throw new Error('body_too_large'); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function regionLabel(cf = {}) {
  // Cloudflare's network metadata, never a client-provided body field.
  if (!/^[A-Z]{2}$/.test(cf.country || '') || cf.country === 'XX') return '';
  let country = cf.country;
  try { country = new Intl.DisplayNames(['zh-CN'], {type: 'region'}).of(country); } catch { /* ISO fallback. */ }
  const region = typeof cf.region === 'string' ? cf.region.slice(0, 80) : '';
  return [country, region].filter(Boolean).join(' · ');
}

async function fingerprint(ip, window, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${window}:${ip}`));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export async function handle(request, env, verifyFetch = fetch) {
  const path = new URL(request.url).pathname;
  const origin = request.headers.get('Origin');
  if (origin && origin !== ORIGIN) return json({error:'origin_not_allowed'}, 403);
  if (request.method === 'OPTIONS') {
    if (origin !== ORIGIN) return json({error:'origin_not_allowed'}, 403);
    return new Response(null, {status:204, headers:{
      'Access-Control-Allow-Origin':ORIGIN,
      'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
      'Access-Control-Max-Age':'86400',
      'Vary':'Origin',
    }});
  }
  if (path !== '/messages' && path !== '/health') return json({error:'not_found'}, 404);
  if (!env.DB || !env.TURNSTILE_SECRET) return json({error:'service_unavailable'}, 503);
  if (path === '/health' && request.method === 'GET') {
    await env.DB.prepare('SELECT id FROM messages LIMIT 1').all();
    return json({status:'ok', service:'lufei-guestbook', moderation:'required'});
  }
  if (path === '/messages' && request.method === 'GET') {
    const {results} = await env.DB.prepare("SELECT id, name, message, created_at, region FROM messages WHERE status = 'approved' ORDER BY created_at DESC, id DESC LIMIT 50").all();
    return json({messages:results});
  }
  if (path !== '/messages' || request.method !== 'POST') return json({error:'method_not_allowed'}, 405);
  if (origin !== ORIGIN) return json({error:'origin_not_allowed'}, 403);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json({error:'invalid_content_type'}, 415);
  let body;
  try { body = await readBody(request); }
  catch (error) { return json({error:error.message === 'body_too_large' ? 'body_too_large' : 'invalid_body'}, error.message === 'body_too_large' ? 413 : 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({error:'invalid_body'}, 400);
  if (body.name !== undefined && typeof body.name !== 'string') return json({error:'invalid_name'}, 400);
  const name = (body.name || '').trim();
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (name.length > 40 || !message || message.length > 2000) return json({error:'invalid_message'}, 400);
  if (typeof body.token !== 'string' || !body.token || body.token.length > 2048) return json({error:'verification_required'}, 400);
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return json({error:'service_unavailable'}, 503);
  let verification;
  try {
    const response = await verifyFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET, response:body.token, remoteip:ip}),
      signal:AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('verification_unavailable');
    verification = await response.json();
  } catch { return json({error:'verification_unavailable'}, 503); }
  if (verification.success !== true || verification.hostname !== HOSTNAME || verification.action !== 'guestbook') return json({error:'verification_failed'}, 403);
  const now = Date.now(); const window = Math.floor(now / 600000);
  const key = await fingerprint(ip, window, env.TURNSTILE_SECRET);
  // An atomic counter prevents parallel submissions from skipping the limit.
  // Only a keyed, short-lived fingerprint is retained; the raw IP is never stored.
  const rate = await env.DB.prepare('INSERT INTO rate_limits(fingerprint, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(fingerprint) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(key, (window + 1) * 600000).first();
  await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
  if (rate.count > 3) return json({error:'too_many_messages'}, 429);
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO messages(id, name, message, created_at, region, status) VALUES (?, ?, ?, ?, ?, 'pending')")
    .bind(id, name, message, new Date(now).toISOString(), regionLabel(request.cf)).run();
  return json({status:'pending', id}, 202);
}

export default {
  async fetch(request, env) {
    try { return await handle(request, env); }
    catch { return json({error:'service_unavailable'}, 503); }
  },
};
