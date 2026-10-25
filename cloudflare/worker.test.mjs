import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { handle, regionLabel } from './worker.mjs';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const DB = {prepare(sql) {
    const statement = sqlite.prepare(sql);
    let args = [];
    return {bind(...values) {args = values; return this;},
      async all() {return {results:statement.all(...args)};},
      async first() {return statement.get(...args);},
      async run() {return statement.run(...args);}};
  }};
  return {sqlite, env:{DB, TURNSTILE_SECRET:'local-test-secret'}};
}
const data = {name:'访客', message:'你好，宇宙。', token:'test-only-token'};
function post(body=data, origin='https://lufei-lee.github.io', ip='192.0.2.1') {
  const request = new Request('https://example.test/messages', {method:'POST',
    headers:{'Content-Type':'application/json',Origin:origin,'CF-Connecting-IP':ip}, body:JSON.stringify(body)});
  Object.defineProperty(request, 'cf', {value:{country:'CN', region:'Shanghai'}});
  return request;
}
const valid = async () => Response.json({success:true, hostname:'lufei-lee.github.io', action:'guestbook'});

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
  const result=await handle(post(),env,valid,{waitUntil:p=>background.push(p)});
  await Promise.all(background);
  assert.equal(result.status,202);assert.equal(sent.length,1);
  assert.equal(sent[0].to,'1191743253@qq.com');
  assert.ok(!sent[0].text.includes(data.message));
  assert.equal(sqlite.prepare('SELECT status FROM messages').get().status,'pending');
  assert.equal((await handle(post(),env,async()=>Response.json({success:false}))).status,403);
  assert.equal(sent.length,1);
  sqlite.close();
});

test('notification failure does not lose an accepted message', async (t) => {
  const {sqlite,env}=fixture();
  t.mock.method(console,'error',()=>{});
  env.NOTIFY_FROM='guestbook@example.test';env.EMAIL={async send(){throw Error('offline');}};
  assert.equal((await handle(post(),env,valid)).status,202);
  assert.equal(sqlite.prepare('SELECT status FROM messages').get().status,'pending');
  sqlite.close();
});

test('valid input persists privately; approval makes only public fields visible', async () => {
  const {sqlite,env} = fixture();
  const response = await handle(post({...data, message:"<script>alert('x')</script>"}), env, valid);
  assert.equal(response.status,202);
  const {id} = await response.json();
  const row = sqlite.prepare('SELECT * FROM messages WHERE id=?').get(id);
  assert.equal(row.status,'pending');
  assert.equal(row.region,'中国 · Shanghai');
  assert.equal(row.message,"<script>alert('x')</script>"); // Frontend renders React text, never HTML.
  let publicData = await (await handle(new Request('https://example.test/messages'),env)).json();
  assert.equal(publicData.messages.length,0);
  sqlite.prepare("UPDATE messages SET status='approved' WHERE id=?").run(id);
  publicData = await (await handle(new Request('https://example.test/messages'),env)).json();
  assert.deepEqual(Object.keys(publicData.messages[0]).sort(),['id','name','message','created_at','region'].sort());
  assert.ok(!JSON.stringify(publicData).includes('192.0.2.1'));
  sqlite.close();
});
test('invalid token, hostname and action never write messages', async () => {
  const {sqlite,env} = fixture();
  for (const v of [{success:false},{success:true,hostname:'other.example',action:'guestbook'},{success:true,hostname:'lufei-lee.github.io',action:'other'}]) {
    assert.equal((await handle(post(),env,async()=>Response.json(v))).status,403);
  }
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get().n,0);
  sqlite.close();
});
test('bad input and oversized bodies are rejected', async () => {
  const {sqlite,env} = fixture();
  for (const body of [null,[],{...data,message:'  '},{...data,name:'x'.repeat(41)},{...data,message:'x'.repeat(2001)},{...data,token:''}]) {
    assert.equal((await handle(post(body),env,valid)).status,400);
  }
  assert.equal((await handle(post({...data,message:'x'.repeat(20000)}),env,valid)).status,413);
  sqlite.close();
});
test('cross-origin posting is rejected and legitimate preflight succeeds', async () => {
  const {sqlite,env} = fixture();
  assert.equal((await handle(post(data,'https://evil.example'),env,valid)).status,403);
  const response = await handle(new Request('https://example.test/messages',{method:'OPTIONS',headers:{Origin:'https://lufei-lee.github.io'}}),env);
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://lufei-lee.github.io');
  sqlite.close();
});
test('rate limit caps three successful submissions per IP window', async () => {
  const {sqlite,env} = fixture();
  for (let i=0;i<3;i++) assert.equal((await handle(post(),env,valid)).status,202);
  assert.equal((await handle(post(),env,valid)).status,429);
  assert.equal((await handle(post(data,undefined,'192.0.2.2'),env,valid)).status,202);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get().n,4);
  const fingerprints=sqlite.prepare('SELECT fingerprint FROM rate_limits').all();
  assert.ok(fingerprints.every(x=>/^[a-f0-9]{64}$/.test(x.fingerprint)));
  sqlite.close();
});
test('missing service configuration and verification outage fail closed', async () => {
  const {sqlite,env} = fixture();
  assert.equal((await worker.fetch(post(),{})).status,503);
  assert.equal((await handle(post(),env,async()=>{throw new Error('offline');})).status,503);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get().n,0);
  assert.equal(regionLabel({country:'XX'}),'');
  sqlite.close();
});
