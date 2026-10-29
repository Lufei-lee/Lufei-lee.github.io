const ORIGIN = 'https://lufei-lee.github.io';
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
  const clean = value => typeof value === 'string' ? value.trim().slice(0, 80) : '';
  const region = clean(cf.region), city = clean(cf.city);
  // Cities are approximate network locations; never infer a missing city.
  return [...new Set([country, region, city].filter(Boolean))].join(' · ');
}

async function fingerprint(ip, window, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${window}:${ip}`));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

// Dormant until a verified sender and EMAIL binding are explicitly configured.
export async function notifyOwner(env, id) {
  if (!env.EMAIL || !env.NOTIFY_FROM) return;
  await env.EMAIL.send({
    from: env.NOTIFY_FROM,
    to: '1191743253@qq.com',
    subject: '个人主页有一条新留言待审核',
    text: `你的主页收到了一条新留言。\n留言编号：${id}\n请登录 Cloudflare 查看内容并审核：\nhttps://dash.cloudflare.com/accac395ad886d225f1660a1956b8751/workers/d1/databases/573d8668-71ba-4300-a636-deea6bc77578/studio\n\n此邮件仅为通知，留言仍需审核后才会公开。`,
  });
}

export async function handle(request, env, context) {
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
  const likeMatch = path.match(/^\/messages\/([a-f0-9-]{36})\/like$/i);
  if (path !== '/messages' && path !== '/health' && !likeMatch) return json({error:'not_found'}, 404);
  // Retain the existing private key for HMAC continuity only; no CAPTCHA calls.
  if (!env.DB || !env.TURNSTILE_SECRET) return json({error:'service_unavailable'}, 503);
  if (path === '/health' && request.method === 'GET') {
    await env.DB.prepare('SELECT id FROM messages LIMIT 1').all();
    return json({status:'ok', service:'lufei-guestbook', moderation:'required', features:['replies','likes']});
  }
  if (path === '/messages' && request.method === 'GET') {
    const {results} = await env.DB.prepare(`SELECT m.id, m.name, m.message, m.created_at, m.region,
      (SELECT COUNT(*) FROM message_likes l WHERE l.message_id=m.id) AS likes
      FROM messages m WHERE m.status='approved' AND NOT EXISTS
      (SELECT 1 FROM message_replies r WHERE r.message_id=m.id)
      ORDER BY m.created_at DESC, m.id DESC LIMIT 50`).all();
    let replies = [];
    if (results.length) {
      const rows = await env.DB.prepare(`SELECT m.id, m.name, m.message, m.created_at, m.region, r.parent_id,
        (SELECT COUNT(*) FROM message_likes l WHERE l.message_id=m.id) AS likes
        FROM messages m JOIN message_replies r ON r.message_id=m.id
        WHERE m.status='approved' AND r.parent_id IN (${results.map(()=>'?').join(',')})
        ORDER BY m.created_at ASC, m.id ASC LIMIT 500`).bind(...results.map(m=>m.id)).all();
      replies = rows.results;
    }
    return json({messages:results.map(m=>({...m,replies:replies.filter(r=>r.parent_id===m.id)}))});
  }
  if ((path !== '/messages' && !likeMatch) || request.method !== 'POST') return json({error:'method_not_allowed'}, 405);
  if (origin !== ORIGIN) return json({error:'origin_not_allowed'}, 403);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json({error:'invalid_content_type'}, 415);
  let body;
  try { body = await readBody(request); }
  catch (error) { return json({error:error.message === 'body_too_large' ? 'body_too_large' : 'invalid_body'}, error.message === 'body_too_large' ? 413 : 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({error:'invalid_body'}, 400);
  if (body.name !== undefined && typeof body.name !== 'string') return json({error:'invalid_name'}, 400);
  const name = (body.name || '').trim();
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!likeMatch && (name.length > 40 || !message || message.length > 2000)) return json({error:'invalid_message'}, 400);
  if (likeMatch && (typeof body.visitor_id !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.visitor_id) || typeof body.liked !== 'boolean')) return json({error:'invalid_like'},400);
  if (body.parent_id !== undefined && (typeof body.parent_id !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.parent_id))) return json({error:'invalid_parent'},400);
  const targetId = likeMatch?.[1] || body.parent_id;
  if (targetId) {
    const target = await env.DB.prepare(`SELECT m.id FROM messages m WHERE m.id=? AND m.status='approved'
      AND (NOT EXISTS(SELECT 1 FROM message_replies r WHERE r.message_id=m.id) OR
      EXISTS(SELECT 1 FROM message_replies r JOIN messages p ON p.id=r.parent_id WHERE r.message_id=m.id AND p.status='approved'))`).bind(targetId).first();
    if (!target) return json({error:'target_unavailable'},404);
    if (!likeMatch && await env.DB.prepare('SELECT message_id FROM message_replies WHERE message_id=?').bind(targetId).first()) return json({error:'invalid_parent'},400);
  }
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return json({error:'service_unavailable'}, 503);
  const now = Date.now(); const window = Math.floor(now / 600000);
  const key = await fingerprint(ip, `${likeMatch?'like':'post'}:${window}`, env.TURNSTILE_SECRET);
  // An atomic counter prevents parallel submissions from skipping the limit.
  // Only a keyed, short-lived fingerprint is retained; the raw IP is never stored.
  const rate = await env.DB.prepare('INSERT INTO rate_limits(fingerprint, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(fingerprint) DO UPDATE SET count = count + 1 RETURNING count')
    .bind(key, (window + 1) * 600000).first();
  await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
  if (rate.count > (likeMatch ? 30 : 3)) return json({error:'too_many_messages'}, 429);
  if (likeMatch) {
    const visitor = await fingerprint(body.visitor_id, 'like-visitor-v1', env.TURNSTILE_SECRET);
    if (body.liked) await env.DB.prepare('INSERT OR IGNORE INTO message_likes(message_id, visitor_hash, created_at) VALUES (?,?,?)').bind(targetId,visitor,new Date(now).toISOString()).run();
    else await env.DB.prepare('DELETE FROM message_likes WHERE message_id=? AND visitor_hash=?').bind(targetId,visitor).run();
    const count = await env.DB.prepare('SELECT COUNT(*) AS likes FROM message_likes WHERE message_id=?').bind(targetId).first();
    return json({id:targetId,liked:body.liked,likes:count.likes});
  }
  const id = crypto.randomUUID();
  const insert = env.DB.prepare("INSERT INTO messages(id, name, message, created_at, region, status) VALUES (?, ?, ?, ?, ?, 'pending')")
    .bind(id, name, message, new Date(now).toISOString(), regionLabel(request.cf));
  // D1 batch is transactional: a reply can never become an orphaned root message.
  if (body.parent_id) await env.DB.batch([insert,env.DB.prepare('INSERT INTO message_replies(message_id,parent_id) VALUES (?,?)').bind(id,body.parent_id)]);
  else await insert.run();
  if (env.EMAIL && env.NOTIFY_FROM) {
    // Notification failure must not turn a saved message into a failed submission.
    const notification = notifyOwner(env, id).catch(() => console.error('guestbook_notification_failed', id));
    if (context?.waitUntil) context.waitUntil(notification);
    else await notification;
  }
  return json({status:'pending', id}, 202);
}

export default {
  async fetch(request, env, context) {
    try { return await handle(request, env, context); }
    catch { return json({error:'service_unavailable'}, 503); }
  },
};
