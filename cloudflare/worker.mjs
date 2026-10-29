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
    subject: '个人主页有一条新留言',
    text: `你的主页收到了一条新留言。\n留言编号：${id}\n请登录 Cloudflare 查看或管理内容：\nhttps://dash.cloudflare.com/accac395ad886d225f1660a1956b8751/workers/d1/databases/573d8668-71ba-4300-a636-deea6bc77578/studio\n\n此邮件仅为通知，留言已直接公开，可在后台隐藏或删除。`,
  });
}

export async function handle(request, env, context) {
  const url = new URL(request.url);
  const path = url.pathname;
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
  if (path !== '/messages' && path !== '/health' && path !== '/visits' && !likeMatch) return json({error:'not_found'}, 404);
  // Retain the existing private key for HMAC continuity only; no CAPTCHA calls.
  if (!env.DB || !env.TURNSTILE_SECRET) return json({error:'service_unavailable'}, 503);
  if (path === '/health' && request.method === 'GET') {
    await env.DB.prepare('SELECT id FROM messages LIMIT 1').all();
    return json({status:'ok', service:'lufei-guestbook', moderation:'post-publication', features:['replies','likes']});
  }
  if (path === '/visits' && request.method === 'POST') {
    if (origin !== ORIGIN) return json({error:'origin_not_allowed'},403);
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json({error:'invalid_content_type'},415);
    let body; try {body=await readBody(request);} catch {return json({error:'invalid_body'},400);}
    if (!/^[a-f0-9-]{36}$/i.test(body?.visitor_id||'')) return json({error:'invalid_visitor'},400);
    const ip=request.headers.get('CF-Connecting-IP');
    if(!ip)return json({error:'service_unavailable'},503);
    const now=Date.now(), bucket=Math.floor(now/600000);
    const key=await fingerprint(ip,`uv-rate:${bucket}`,env.TURNSTILE_SECRET);
    const rate=await env.DB.prepare('INSERT INTO rate_limits(fingerprint,count,expires_at) VALUES (?,1,?) ON CONFLICT(fingerprint) DO UPDATE SET count=count+1 RETURNING count').bind(key,(bucket+1)*600000).first();
    await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
    if(rate.count>120)return json({error:'rate_limited'},429);
    const day=new Date(now+8*3600000).toISOString().slice(0,10);
    const visitor=await fingerprint(body.visitor_id,`daily-uv:${day}`,env.TURNSTILE_SECRET);
    await env.DB.prepare('INSERT OR IGNORE INTO daily_visitors(day,visitor_hash) VALUES (?,?)').bind(day,visitor).run();
    return json({status:'ok'});
  }
  if (path === '/messages' && request.method === 'GET') {
    const parent=url.searchParams.get('parent_id');
    const thread=url.searchParams.get('thread');
    const validId=id=>/^[a-f0-9-]{36}$/i.test(id);
    if ((parent&&!validId(parent))||(thread&&!validId(thread)))return json({error:'invalid_cursor'},400);
    let cursor;
    try {cursor=url.searchParams.has('after')?JSON.parse(url.searchParams.get('after')):null;} catch {return json({error:'invalid_cursor'},400);}
    if(cursor&&(!Array.isArray(cursor)||cursor.length!==2||typeof cursor[0]!=='string'||!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(cursor[0])||!validId(cursor[1])))return json({error:'invalid_cursor'},400);
    const fields=`m.id,m.name,m.message,m.created_at,m.region,
      (SELECT COUNT(*) FROM message_likes l WHERE l.message_id=m.id) AS likes,
      (SELECT COUNT(*) FROM message_replies r JOIN messages c ON c.id=r.message_id WHERE r.parent_id=m.id AND c.status='approved') AS reply_count,
      (SELECT t.target_id FROM reply_targets t WHERE t.message_id=m.id) AS reply_to_id,
      (SELECT CASE WHEN target.status='approved' THEN target.name ELSE NULL END FROM reply_targets t LEFT JOIN messages target ON target.id=t.target_id WHERE t.message_id=m.id) AS reply_to_name`;
    const encode=(rows,size=20)=>rows.length>size?JSON.stringify([rows[size-1].created_at,rows[size-1].id]):null;
    if(parent){
      const args=[parent];
      if(cursor)args.push(cursor[0],cursor[0],cursor[1]);
      const {results}=await env.DB.prepare(`SELECT ${fields} FROM messages m JOIN message_replies r ON r.message_id=m.id
       JOIN messages p ON p.id=r.parent_id WHERE r.parent_id=? AND m.status='approved' AND p.status='approved'
       ${cursor?'AND (m.created_at<? OR (m.created_at=? AND m.id<?))':''}
       ORDER BY m.created_at DESC,m.id DESC LIMIT 6`).bind(...args).all();
      return json({messages:results.slice(0,5),next_cursor:encode(results,5)});
    }
    if(thread&&!await env.DB.prepare("SELECT id FROM messages WHERE id=? AND status='approved'").bind(thread).first())return json({error:'target_unavailable'},404);
    const args=[];let filter='';
    if(thread){filter='AND m.id=COALESCE((SELECT parent_id FROM message_replies WHERE message_id=?),?)';args.push(thread,thread);}
    else if(cursor){filter='AND (m.created_at<? OR (m.created_at=? AND m.id<?))';args.push(cursor[0],cursor[0],cursor[1]);}
    const {results}=await env.DB.prepare(`SELECT ${fields} FROM messages m WHERE m.status='approved' AND NOT EXISTS
      (SELECT 1 FROM message_replies r WHERE r.message_id=m.id) ${filter}
      ORDER BY m.created_at DESC,m.id DESC LIMIT 21`).bind(...args).all();
    const roots=results.slice(0,20);
    const messages=roots.map(m=>({...m,replies:[],replies_cursor:null}));
    return json({messages,next_cursor:thread?null:encode(results)});
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
  let rootId=null;
  if (targetId) {
    const target = await env.DB.prepare(`SELECT m.id FROM messages m WHERE m.id=? AND m.status='approved'
      AND (NOT EXISTS(SELECT 1 FROM message_replies r WHERE r.message_id=m.id) OR
      EXISTS(SELECT 1 FROM message_replies r JOIN messages p ON p.id=r.parent_id WHERE r.message_id=m.id AND p.status='approved'))`).bind(targetId).first();
    if (!target) return json({error:'target_unavailable'},404);
    if(!likeMatch){const relation=await env.DB.prepare('SELECT parent_id FROM message_replies WHERE message_id=?').bind(targetId).first();rootId=relation?.parent_id??targetId;}
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
  const insert = env.DB.prepare("INSERT INTO messages(id, name, message, created_at, region, status) VALUES (?, ?, ?, ?, ?, 'approved')")
    .bind(id, name, message, new Date(now).toISOString(), regionLabel(request.cf));
  // D1 batch is transactional: a reply can never become an orphaned root message.
  if (body.parent_id) await env.DB.batch([insert,env.DB.prepare('INSERT INTO message_replies(message_id,parent_id) VALUES (?,?)').bind(id,rootId),env.DB.prepare('INSERT INTO reply_targets(message_id,target_id) VALUES (?,?)').bind(id,body.parent_id)]);
  else await insert.run();
  if (env.EMAIL && env.NOTIFY_FROM) {
    // Notification failure must not turn a saved message into a failed submission.
    const notification = notifyOwner(env, id).catch(() => console.error('guestbook_notification_failed', id));
    if (context?.waitUntil) context.waitUntil(notification);
    else await notification;
  }
  // Preserve the response expected by cached older clients during rollout. Publication is immediate in both versions.
  return json({status:body.api_version===2?'approved':'pending',published:true,id,root_id:rootId,message:{id,name,message,created_at:new Date(now).toISOString(),region:regionLabel(request.cf),likes:0,reply_count:0,replies:[]}},201);
}

export default {
  async fetch(request, env, context) {
    try { return await handle(request, env, context); }
    catch { return json({error:'service_unavailable'}, 503); }
  },
};
