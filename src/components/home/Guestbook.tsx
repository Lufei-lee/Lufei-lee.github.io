'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Script from 'next/script';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { formatGuestbookTime } from '@/lib/guestbookTime';

type Message = {id:string; name:string; message:string; created_at:string; region:string; likes?:number; replies?:Message[]};
type Turnstile = {render:(el:HTMLElement,opts:Record<string,unknown>)=>string; reset:(id:string)=>void; remove:(id:string)=>void};
declare global { interface Window { turnstile?:Turnstile } }
const endpoint=process.env.NEXT_PUBLIC_GUESTBOOK_API?.replace(/\/$/,'');
const sitekey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const enabled=Boolean(endpoint&&sitekey);
const draftKey='lufei-guestbook-draft-v1';
type ReplyTarget = {id:string;name:string};
type Draft = {name:string;message:string;parent:ReplyTarget|null;unavailable:boolean};
const emptyDraft:Draft={name:'',message:'',parent:null,unavailable:false};
let currentDraft:Draft|undefined;
const draftListeners=new Set<()=>void>();
function subscribeDraft(listener:()=>void) {
 draftListeners.add(listener);
 return ()=>{draftListeners.delete(listener);};
}
function getDraftSnapshot():Draft {
 if(currentDraft)return currentDraft;
 try {
  const stored=sessionStorage.getItem(draftKey);
  const draft=stored?JSON.parse(stored):null;
  currentDraft={
   name:typeof draft?.name==='string'?draft.name.slice(0,40):'',
   message:typeof draft?.message==='string'?draft.message.slice(0,2000):'',
   parent:typeof draft?.parent?.id==='string'&&/^[a-f0-9-]{36}$/i.test(draft.parent.id)&&typeof draft.parent.name==='string'?{id:draft.parent.id,name:draft.parent.name.slice(0,40)}:null,
   unavailable:false,
  };
 } catch {currentDraft={...emptyDraft,unavailable:true};}
 return currentDraft;
}
function saveDraft(name:string,message:string,parent:ReplyTarget|null=currentDraft?.parent??null) {
 let saved=true;
 try {
  if(name||message||parent)sessionStorage.setItem(draftKey,JSON.stringify({name,message,parent}));
  else sessionStorage.removeItem(draftKey);
 } catch {saved=false;}
 currentDraft={name,message,parent,unavailable:!saved};
 draftListeners.forEach(listener=>listener());
 return saved;
}
const likesKey='lufei-guestbook-likes-v1';
let memoryVisitor='';
function visitorId() {
 try {
  const stored=localStorage.getItem('lufei-guestbook-visitor-v1');
  if(stored&&/^[a-f0-9-]{36}$/i.test(stored))return stored;
  const id=memoryVisitor||(memoryVisitor=crypto.randomUUID());
  localStorage.setItem('lufei-guestbook-visitor-v1',id);return id;
 } catch {return memoryVisitor||(memoryVisitor=crypto.randomUUID());}
}
type Failure = 'target' | 'network' | 'verification' | 'rate' | 'input' | 'service';
class GuestbookError extends Error {
 constructor(public kind: Failure) { super(kind); }
}
async function requestMessages(init: RequestInit = {}, signal?: AbortSignal, path = '/messages') {
 const controller = new AbortController();
 const abort = () => controller.abort();
 signal?.addEventListener('abort', abort, {once:true});
 const timer = window.setTimeout(abort, 15000);
 try {
  let response: Response;
  try { response = await fetch(endpoint+path, {...init, signal:controller.signal}); }
  catch { throw new GuestbookError('network'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
   const code = data?.error;
   throw new GuestbookError(response.status===404?'target':response.status===429?'rate':
    code==='verification_failed'||code==='verification_required'?'verification':
    response.status===400||response.status===413?'input':'service');
  }
  if (!data) throw new GuestbookError('service');
  return data;
 } finally { window.clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
function failureText(kind: Failure, zh: boolean) {
 const copy = {
  target:['这条留言已不再公开，请刷新列表，或取消回复后作为新留言提交。输入内容仍保留。','This message is no longer public. Refresh the list or cancel the reply to post a new message. Your text is preserved.'],
  network: [
   '留言服务无法加载，当前你无法留言/查看已有留言，请尝试开启代理/VPN后刷新网页重试。输入内容仍保留在当前页面；请勿连续重复提交。',
   'The guestbook service could not load. You cannot currently post or view messages. Please try enabling a proxy/VPN, then refresh the page and try again. Your text remains on the current page; please avoid repeated submissions.'
  ],
  verification: ['验证已过期或未通过，请重新完成人机验证后提交。输入内容仍保留在当前页面。','Verification expired or failed. Complete a fresh verification and submit again. Your text remains on this page.'],
  rate: ['提交次数较多，请约 10 分钟后再试。输入内容仍保留在当前页面。','Too many submissions. Please try again in about 10 minutes. Your text remains on this page.'],
  input: ['请检查昵称和留言长度，留言不能为空。输入内容仍保留在当前页面。','Check the name and message lengths; the message cannot be empty. Your text remains on this page.'],
  service: ['留言服务暂时不可用，请稍后重试。输入内容仍保留在当前页面。','The guestbook service is temporarily unavailable. Please retry later. Your text remains on this page.'],
 };
 return copy[kind][zh?0:1];
}
export default function Guestbook() {
 const zh=useLocaleStore(s=>s.locale)==='zh';
 const [messages,setMessages]=useState<Message[]>([]);
 const [status,setStatus]=useState<'idle'|'posting'|'pending'|'error'>('idle');
 const [loading,setLoading]=useState(Boolean(endpoint));
 const [loadError,setLoadError]=useState<Failure|null>(null);
 const [postError,setPostError]=useState<Failure|null>(null);
 const {name,message,parent,unavailable:draftUnavailable}=useSyncExternalStore(subscribeDraft,getDraftSnapshot,()=>emptyDraft);
 const [liked,setLiked]=useState<string[]>([]);
 const [liking,setLiking]=useState<string|null>(null);
 const [likeNotice,setLikeNotice]=useState('');
 const form=useRef<HTMLFormElement>(null);
 const likeLock=useRef(false);
 const [token,setToken]=useState('');
 const [ready,setReady]=useState(false);
 const [verificationError,setVerificationError]=useState(false);
 const widget=useRef<HTMLDivElement>(null);const widgetId=useRef<string|null>(null);
 function refreshPage() {
  if(!saveDraft(name,message)&&(name||message))return;
  window.location.reload();
 }
 useEffect(()=>{
  if(!endpoint)return;
  const controller=new AbortController();
  requestMessages({},controller.signal).then(data=>{
   if(controller.signal.aborted)return;
   if(!Array.isArray(data.messages))throw new GuestbookError('service');
   setMessages(data.messages);
   try {const saved=JSON.parse(localStorage.getItem(likesKey)||'[]');if(Array.isArray(saved))setLiked(saved.filter((id:unknown)=>typeof id==='string'));} catch {/* Likes still work for this visit. */}
  }).catch(e=>{if(!controller.signal.aborted)setLoadError(e instanceof GuestbookError?e.kind:'service');})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[]);
 useEffect(()=>{
  if(!ready||!widget.current||!window.turnstile||!sitekey)return;
  widgetId.current=window.turnstile.render(widget.current,{sitekey,action:'guestbook',theme:'auto',size:widget.current.clientWidth<300?'compact':'normal',language:zh?'zh-cn':'en',callback:(t:string)=>{setToken(t);setVerificationError(false);},'expired-callback':()=>setToken(''),'error-callback':()=>{setToken('');setVerificationError(true);}});
  return ()=>{if(widgetId.current)window.turnstile?.remove(widgetId.current);setToken('');};
 },[ready,zh]);
 async function submit(e:React.FormEvent) {
  e.preventDefault();if(!enabled||!token||status==='posting'||likeLock.current)return;
  setStatus('posting');setPostError(null);
  try {
   const result=await requestMessages({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,message,token,...(parent?{parent_id:parent.id}:{})})});
   if(result.status!=='pending'||typeof result.id!=='string')throw new GuestbookError('service');
   saveDraft('','',null);setStatus('pending');setLoadError(null);
  } catch(e) {setStatus('error');setPostError(e instanceof GuestbookError?e.kind:'service');}
  finally {setToken('');if(widgetId.current)window.turnstile?.reset(widgetId.current);}
 }
 function replyTo(m:Message) {
  saveDraft(name,message,{id:m.id,name:m.name});setStatus('idle');setPostError(null);
  form.current?.scrollIntoView({behavior:'smooth',block:'center'});
  document.getElementById('guest-message')?.focus({preventScroll:true});
 }
 async function likeMessage(m:Message) {
  if(likeLock.current||status==='posting')return;
  if(!token) {
   setLikeNotice(zh?'请先完成上方人机验证，再点击点赞。':'Complete the verification above, then click Like.');
   widget.current?.scrollIntoView({behavior:'smooth',block:'center'});return;
  }
  likeLock.current=true;setLiking(m.id);setLikeNotice('');
  try {
   const next=!liked.includes(m.id);
   const result=await requestMessages({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,visitor_id:visitorId(),liked:next})},undefined,`/messages/${m.id}/like`);
   if(result.id!==m.id||!Number.isSafeInteger(result.likes)||result.likes<0||result.liked!==next)throw new GuestbookError('service');
   setMessages(current=>current.map(root=>({...root,...(root.id===m.id?{likes:result.likes}:{}),replies:root.replies?.map(r=>r.id===m.id?{...r,likes:result.likes}:r)})));
   const ids=next?[...new Set([...liked,m.id])]:liked.filter(id=>id!==m.id);
   setLiked(ids);try {localStorage.setItem(likesKey,JSON.stringify(ids));}catch {/* In-memory state remains available. */}
  } catch(e) {setLikeNotice(failureText(e instanceof GuestbookError?e.kind:'service',zh));}
  finally {likeLock.current=false;setLiking(null);setToken('');if(widgetId.current)window.turnstile?.reset(widgetId.current);}
 }
 function entry(m:Message,isReply=false) {
  return <article key={m.id} className={`guestbook-entry${isReply?' guestbook-reply':''}`}>
   <header><h3>{m.name||(zh?'一位访客':'A visitor')}</h3><time dateTime={m.created_at} title={zh?'北京时间（UTC+8）':'Beijing time (UTC+8)'}>{formatGuestbookTime(m.created_at)||(zh?'时间未知':'Time unavailable')}</time></header>
   <p>{m.message}</p><small>{zh?'IP 属地：':'IP region: '}{m.region||(zh?'未知':'Unknown')}</small>
   <div className="guestbook-actions">
    <button type="button" aria-pressed={liked.includes(m.id)} disabled={!enabled||!!liking||status==='posting'} onClick={()=>likeMessage(m)}>{liking===m.id?(zh?'处理中…':'Saving…'):liked.includes(m.id)?(zh?'♥ 已赞':'♥ Liked'):(zh?'♡ 点赞':'♡ Like')} · {m.likes??0}</button>
    {!isReply&&<button type="button" disabled={!enabled||status==='posting'} onClick={()=>replyTo(m)}>{zh?'回复':'Reply'}</button>}
   </div>
   {!isReply&&!!m.replies?.length&&<div className="guestbook-replies" aria-label={zh?'留言回复':'Replies'}>{m.replies.map(r=>entry(r,true))}</div>}
  </article>;
 }
 return <section id="guestbook" className="guestbook-section scroll-mt-28">
  <h2 className="section-title">{zh?'留言':'Guestbook'}</h2>
  <form ref={form} onSubmit={submit} className="guestbook-form">
   {parent&&<div className="guestbook-reply-target"><span>{zh?'正在回复：':'Replying to: '}{parent.name||(zh?'一位访客':'A visitor')}</span><button type="button" disabled={status==='posting'} onClick={()=>saveDraft(name,message,null)}>{zh?'取消回复':'Cancel reply'}</button></div>}
   <label htmlFor="guest-name">{zh?'你的名字（选填）':'Your name (optional)'}</label>
   <input id="guest-name" autoComplete="nickname" maxLength={40} value={name} disabled={status==='posting'} onChange={e=>saveDraft(e.target.value,message)} placeholder={zh?'不填则显示为「一位访客」':'Leave blank to post as a visitor'}/>
   <label htmlFor="guest-message">{zh?'留言内容':'Your message'}</label>
   <textarea id="guest-message" required maxLength={2000} rows={5} value={message} disabled={status==='posting'} onChange={e=>saveDraft(name,e.target.value)} placeholder={zh?'打个招呼，分享一个想法，或留下你来过的痕迹。':'Say hi, share a thought, or leave a little sign that you were here.'}/>
   <div className="guestbook-count">{message.length} / 2000</div>
   <p className="guestbook-notice" role="status">{draftUnavailable?(zh?'浏览器暂时无法保存草稿，请先复制输入内容再手动刷新。':'Your browser could not save the draft. Copy your text before refreshing manually.'):(zh?'草稿保留在当前标签页，刷新后可恢复；提交成功后自动清除。':'Your draft stays in this tab across refreshes and is cleared after a successful submission.')}</p>
   {enabled&&<><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setReady(true)} onError={()=>setVerificationError(true)}/><div ref={widget}/></>}
   {verificationError&&<p role="status">{zh?'人机验证暂未完成。若验证框无法加载，可尝试开启代理/VPN或切换网络，再重新验证。输入内容仍保留在当前页面。':'Verification did not complete. If the verification box cannot load, try a proxy/VPN or another network, then verify again. Your text remains on this page.'}</p>}
   <button className="guestbook-submit" type="submit" disabled={!enabled||!token||!message.trim()||status==='posting'||!!liking}>{status==='posting'?(zh?'正在提交…':'Posting…'):parent?(zh?'提交回复':'Post reply'):(zh?'发布留言':'Post message')}</button>
   <p role="status" aria-live="polite" className={postError&&status!=='pending'?'guestbook-error':undefined}>{postError&&status!=='pending'&&<span aria-hidden="true">✕ </span>}{status==='pending'?(zh?'已收到，审核后会显示在这里。谢谢你的留言！':'Received — your message will appear after review. Thank you!'):postError?failureText(postError,zh):''}</p>
   {loadError&&status!=='posting'&&status!=='pending'&&!postError&&<p role="status" className="guestbook-error"><span aria-hidden="true">✕ </span>{loadError!=='network'&&(zh?'留言列表未能加载。':'Could not load messages. ')}{failureText(loadError,zh)}</p>}
   {(loadError||postError==='network'||verificationError)&&status!=='posting'&&status!=='pending'&&<button type="button" className="guestbook-refresh" onClick={refreshPage}>{zh?'刷新网页':'Refresh page'}</button>}
   {loading&&status==='idle'&&<p role="status">{zh?'正在读取留言…':'Loading messages…'}</p>}

  </form>
  {messages.length>0&&<p className="guestbook-notice">{zh?'留言时间均为北京时间（UTC+8），采用24小时制。':'All message times are in Beijing time (UTC+8), using the 24-hour clock.'}</p>}
  <p className="guestbook-notice">{zh?'留言与回复均需审核后公开。点赞需完成人机验证，同一浏览器对每条留言可赞一次，再次点击可取消。':'Messages and replies appear after review. Likes require verification; each browser can like a message once and click again to undo.'}</p>
  {likeNotice&&<p role="status" className="guestbook-error">{likeNotice}</p>}
  <div className="guestbook-messages">{messages.map(m=>entry(m))}</div>
  {enabled&&messages.length===0&&status==='idle'&&!loading&&!loadError&&<p className="guestbook-notice">{zh?'这里还没有公开留言，欢迎留下第一句话。':'No public messages yet. Be the first to say hello.'}</p>}
  <p className="guestbook-notice">{zh?'也可以使用下方的 GitHub 留言入口，登录 GitHub 留言。':'You can also sign in to GitHub and leave a message using the link below.'}</p>
  <a className="guestbook-archive" href="https://github.com/Lufei-lee/Lufei-lee.github.io/discussions/1" target="_blank" rel="noreferrer">{zh?'原 GitHub 留言板 ↗':'Original GitHub guestbook ↗'}</a>
 </section>;
}
