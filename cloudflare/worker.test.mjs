import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { handle, regionLabel } from './worker.mjs';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const DB = {async batch(statements) { sqlite.exec('BEGIN'); try {const result=await Promise.all(statements.map(s=>s.run()));sqlite.exec('COMMIT');return result;} catch(e) {sqlite.exec('ROLLBACK');throw e;} },prepare(sql) {
    const statement = sqlite.prepare(sql);
    let args = [];
    return {bind(...values) {args = values; return this;},
      async all() {return {results:statement.all(...args)};},
      async first() {return statement.get(...args);},
      async run() {return statement.run(...args);}};
  }};
  return {sqlite, env:{DB, TURNSTILE_SECRET:'local-test-secret'}};
}
const data = {api_version:2,name:'访客', message:'你好，宇宙。'};
function post(body=data, origin='https://lufei-lee.github.io', ip='192.0.2.1') {
  const request = new Request('https://example.test/messages', {method:'POST',
    headers:{'Content-Type':'application/json',Origin:origin,'CF-Connecting-IP':ip}, body:JSON.stringify(body)});
  Object.defineProperty(request, 'cf', {value:{country:'CN', region:'Shanghai'}});
  return request;
}

test('region includes a provided city, deduplicates it, and handles missing geolocation', () => {
  assert.equal(regionLabel({country:'CN',region:'Guangdong',city:'Shenzhen'}),'中国 · Guangdong · Shenzhen');
  assert.equal(regionLabel({country:'CN',region:'Shanghai',city:'Shanghai'}),'中国 · Shanghai');
  assert.equal(regionLabel({country:'US',city:'Austin'}),'美国 · Austin');
  assert.equal(regionLabel({country:'XX',city:'Unknown'}),'');
  assert.equal(regionLabel({country:'CN',region:'Shanghai',city:null}),'中国 · Shanghai');
});

test('optional notification follows persistence and never changes moderation', async () => {
  const {sqlite,env}=fixture();const sent=[];const background=[];
  env.NOTIFY_FROM='guestbook@example.test';
  env.EMAIL={async send(mail){assert.equal(sqlite.prepare('SELECT count(*) AS n FROM messages').get().n,1);sent.push(mail);}};
  const result=await handle(post(),env,{waitUntil:p=>background.push(p)});
  await Promise.all(background);
  assert.equal(result.status,201);assert.equal(sent.length,1);
  assert.equal(sent[0].to,'1191743253@qq.com');
  assert.ok(!sent[0].text.includes(data.message));
  assert.equal(sqlite.prepare('SELECT status FROM messages').get().status,'approved');

  sqlite.close();
});

test('notification failure does not lose an accepted message', async (t) => {
  const {sqlite,env}=fixture();
  t.mock.method(console,'error',()=>{});
  env.NOTIFY_FROM='guestbook@example.test';env.EMAIL={async send(){throw Error('offline');}};
  assert.equal((await handle(post(),env)).status,201);
  assert.equal(sqlite.prepare('SELECT status FROM messages').get().status,'approved');
  sqlite.close();
});

test('valid input is public immediately with only public fields', async () => {
  const {sqlite,env} = fixture();
  const response = await handle(post({...data, message:"<script>alert('x')</script>"}), env);
  assert.equal(response.status,201);
  const {id} = await response.json();
  const row = sqlite.prepare('SELECT * FROM messages WHERE id=?').get(id);
  assert.equal(row.status,'approved');
  assert.equal(row.region,'中国 · Shanghai');
  assert.equal(row.message,"<script>alert('x')</script>"); // Frontend renders React text, never HTML.
  let publicData = await (await handle(new Request('https://example.test/messages'),env)).json();
  assert.equal(publicData.messages.length,1);
  sqlite.prepare("UPDATE messages SET status='approved' WHERE id=?").run(id);
  publicData = await (await handle(new Request('https://example.test/messages'),env)).json();
  assert.deepEqual(Object.keys(publicData.messages[0]).sort(),['id','name','message','created_at','region','likes','replies','replies_cursor','reply_count','reply_to_id','reply_to_name'].sort());
  assert.ok(!JSON.stringify(publicData).includes('192.0.2.1'));
  sqlite.close();
});
test('bad input and oversized bodies are rejected', async () => {
  const {sqlite,env} = fixture();
  for (const body of [null,[],{...data,message:'  '},{...data,name:'x'.repeat(41)},{...data,message:'x'.repeat(2001)}]) {
    assert.equal((await handle(post(body),env)).status,400);
  }
  assert.equal((await handle(post({...data,message:'x'.repeat(20000)}),env)).status,413);
  sqlite.close();
});
test('cross-origin posting is rejected and legitimate preflight succeeds', async () => {
  const {sqlite,env} = fixture();
  assert.equal((await handle(post(data,'https://evil.example'),env)).status,403);
  const response = await handle(new Request('https://example.test/messages',{method:'OPTIONS',headers:{Origin:'https://lufei-lee.github.io'}}),env);
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://lufei-lee.github.io');
  sqlite.close();
});
test('rate limit caps three successful submissions per IP window', async () => {
  const {sqlite,env} = fixture();
  for (let i=0;i<3;i++) assert.equal((await handle(post(),env)).status,201);
  assert.equal((await handle(post(),env)).status,429);
  assert.equal((await handle(post(data,undefined,'192.0.2.2'),env)).status,201);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get().n,4);
  const fingerprints=sqlite.prepare('SELECT fingerprint FROM rate_limits').all();
  assert.ok(fingerprints.every(x=>/^[a-f0-9]{64}$/.test(x.fingerprint)));
  sqlite.close();
});
test('missing service configuration and client address fail closed', async () => {
  const {sqlite,env} = fixture();
  assert.equal((await worker.fetch(post(),{})).status,503);
  const withoutIP=post();withoutIP.headers.delete('CF-Connecting-IP');
  assert.equal((await handle(withoutIP,env)).status,503);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get().n,0);
  assert.equal(regionLabel({country:'XX'}),'');
  sqlite.close();
});

test('reply-to-reply publishes immediately under original root; hidden targets reject new replies',async()=>{
 const {sqlite,env}=fixture();const {id}=await (await handle(post(),env)).json();
 const response=await handle(post({...data,parent_id:id}),env);
 assert.equal(response.status,201);const reply=await response.json();
 const second=await (await handle(post({...data,parent_id:reply.id}),env)).json();
 assert.equal(second.status,'approved');assert.equal(second.root_id,id);
 assert.equal(sqlite.prepare('SELECT parent_id FROM message_replies WHERE message_id=?').get(second.id).parent_id,id);
 assert.equal(sqlite.prepare('SELECT target_id FROM reply_targets WHERE message_id=?').get(second.id).target_id,reply.id);
 const read=async()=> (await (await handle(new Request('https://example.test/messages'),env)).json()).messages;
 assert.equal((await read())[0].reply_count,2);assert.equal((await read())[0].replies.length,0);
 sqlite.prepare("UPDATE messages SET status='rejected' WHERE id=?").run(reply.id);
 assert.equal((await read())[0].reply_count,1);
 assert.equal((await handle(post({...data,parent_id:reply.id}),env)).status,404);
 const listed=await (await handle(new Request('https://example.test/messages?parent_id='+id),env)).json();
 assert.equal(listed.messages[0].reply_to_name,null);
 sqlite.prepare("UPDATE messages SET status='rejected' WHERE id=?").run(id);
 assert.deepEqual(await read(),[]);sqlite.close();
});
test('likes without CAPTCHA are idempotent, reversible and never expose visitor hashes',async()=>{
 const {sqlite,env}=fixture();const {id}=await (await handle(post(),env)).json();
 const like=(liked=true,visitor_id='11111111-1111-4111-8111-111111111111')=>new Request(`https://example.test/messages/${id}/like`,{method:'POST',headers:{Origin:'https://lufei-lee.github.io','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify({visitor_id,liked})});
 sqlite.prepare("UPDATE messages SET status='rejected' WHERE id=?").run(id);
 assert.equal((await handle(like(),env)).status,404);
 sqlite.prepare("UPDATE messages SET status='approved' WHERE id=?").run(id);
 for(let i=0;i<2;i++)assert.equal((await (await handle(like(),env)).json()).likes,1);
 assert.equal((await (await handle(like(true,'22222222-2222-4222-8222-222222222222'),env)).json()).likes,2);
 assert.equal((await (await handle(like(false),env)).json()).likes,1);
 assert.equal((await (await handle(like(false),env)).json()).likes,1);
 const result=await (await handle(new Request('https://example.test/messages'),env)).json();
 assert.equal(result.messages[0].likes,1);assert.ok(!JSON.stringify(result).includes('visitor_hash'));
 sqlite.close();
});

test('failed reply linking rolls back the new public message',async()=>{
 const {sqlite,env}=fixture();const {id}=await (await handle(post(),env)).json();
 sqlite.prepare("UPDATE messages SET status='approved' WHERE id=?").run(id);
 sqlite.exec("CREATE TRIGGER fail_reply BEFORE INSERT ON message_replies BEGIN SELECT RAISE(ABORT,'test failure'); END;");
 await assert.rejects(()=>handle(post({...data,parent_id:id}),env));
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get().n,1);sqlite.close();
});
test('likes enforce their independent limit and reject a hidden reply thread',async()=>{
 const {sqlite,env}=fixture();const {id}=await (await handle(post(),env)).json();
 sqlite.prepare("UPDATE messages SET status='approved' WHERE id=?").run(id);
 const reply=await (await handle(post({...data,parent_id:id}),env)).json();
 sqlite.prepare("UPDATE messages SET status='approved' WHERE id=?").run(reply.id);
 const like=()=>new Request(`https://example.test/messages/${reply.id}/like`,{method:'POST',headers:{Origin:'https://lufei-lee.github.io','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify({visitor_id:'11111111-1111-4111-8111-111111111111',liked:true})});
 for(let i=0;i<30;i++)assert.equal((await handle(like(),env)).status,200);
 assert.equal((await handle(like(),env)).status,429);
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM message_likes').get().n,1);
 sqlite.prepare("UPDATE messages SET status='rejected' WHERE id=?").run(id);
 assert.equal((await handle(like(),env)).status,404);sqlite.close();
});

test('keyset pagination includes every root and reply once, including equal timestamps',async()=>{
 const {sqlite,env}=fixture();
 const insert=sqlite.prepare("INSERT INTO messages VALUES (?,?,?,?,?,'approved')");
 const ids=Array.from({length:45},()=>crypto.randomUUID()).sort();
 for(const id of ids)insert.run(id,'name','text','2026-10-29T01:00:00.000Z','');
 const seen=[];let cursor=null;
 do{
  const data=await (await handle(new Request('https://example.test/messages'+(cursor?'?after='+encodeURIComponent(cursor):'')),env)).json();
  seen.push(...data.messages.map(m=>m.id));cursor=data.next_cursor;
 }while(cursor);
 assert.deepEqual(seen,[...ids].reverse());
 const parent=ids[0], replies=Array.from({length:44},()=>crypto.randomUUID()).sort();
 for(const id of replies){insert.run(id,'reply','text','2026-10-29T02:00:00.000Z','');sqlite.prepare('INSERT INTO message_replies VALUES (?,?)').run(id,parent);}
 const root=await (await handle(new Request('https://example.test/messages?thread='+parent),env)).json();
 assert.equal(root.messages[0].reply_count,44);assert.equal(root.messages[0].replies.length,0);
 const replyIds=[];cursor=null;
 do{const d=await (await handle(new Request('https://example.test/messages?parent_id='+parent+(cursor?'&after='+encodeURIComponent(cursor):'')),env)).json();assert.ok(d.messages.length<=5);replyIds.push(...d.messages.map(m=>m.id));cursor=d.next_cursor;}while(cursor);
 assert.deepEqual(replyIds,[...replies].reverse());
 const deep=await (await handle(new Request('https://example.test/messages?thread='+replies.at(-1)),env)).json();
 assert.equal(deep.messages[0].id,parent);
 sqlite.prepare("UPDATE messages SET status='pending' WHERE id=?").run(parent);
 assert.equal((await (await handle(new Request('https://example.test/messages?parent_id='+parent),env)).json()).messages.length,0);
 assert.equal((await handle(new Request('https://example.test/messages?after=bad'),env)).status,400);
 sqlite.close();
});
test('daily UV deduplicates refreshes and changes day at Beijing midnight; no public stats',async(t)=>{
 const {sqlite,env}=fixture();const id=crypto.randomUUID();
 let now=Date.parse('2026-10-29T15:59:00Z');t.mock.method(Date,'now',()=>now);
 const visit=()=>new Request('https://example.test/visits',{method:'POST',headers:{Origin:'https://lufei-lee.github.io','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.8'},body:JSON.stringify({visitor_id:id})});
 for(let i=0;i<5;i++)assert.equal((await handle(visit(),env)).status,200);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM daily_visitors').get().n,1);
 now=Date.parse('2026-10-29T16:00:00Z');await handle(visit(),env);
 const rows=sqlite.prepare('SELECT * FROM daily_visitors ORDER BY day').all();
 assert.deepEqual(rows.map(r=>r.day),['2026-10-29','2026-10-30']);
 assert.notEqual(rows[0].visitor_hash,rows[1].visitor_hash);assert.ok(!JSON.stringify(rows).includes(id));
 assert.equal((await handle(new Request('https://example.test/visits'),env)).status,405);
 sqlite.close();
});

test('admin deletion cleans dependent records and preserves replies to a deleted reply',async()=>{
 const {sqlite,env}=fixture();sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA recursive_triggers=ON;');
 const root=await (await handle(post(),env)).json();
 const a=await (await handle(post({...data,parent_id:root.id}),env)).json();
 const b=await (await handle(post({...data,parent_id:a.id}),env)).json();
 sqlite.prepare('DELETE FROM messages WHERE id=?').run(a.id);
 assert.equal(sqlite.prepare('SELECT target_id FROM reply_targets WHERE message_id=?').get(b.id).target_id,null);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM messages').get().n,2);
 sqlite.prepare('DELETE FROM messages WHERE id=?').run(root.id);
 for(const table of ['messages','message_replies','reply_targets','message_likes'])assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM '+table).get().n,0);
 sqlite.close();
});
