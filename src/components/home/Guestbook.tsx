'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useLocaleStore } from '@/lib/stores/localeStore';

type Message = {id:string; name:string; message:string; created_at:string; region:string};
type Turnstile = {render:(el:HTMLElement,opts:Record<string,unknown>)=>string; reset:(id:string)=>void; remove:(id:string)=>void};
declare global { interface Window { turnstile?:Turnstile } }
const endpoint=process.env.NEXT_PUBLIC_GUESTBOOK_API?.replace(/\/$/,'');
const sitekey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const enabled=Boolean(endpoint&&sitekey);
type Failure = 'network' | 'verification' | 'rate' | 'input' | 'service';
class GuestbookError extends Error {
 constructor(public kind: Failure) { super(kind); }
}
async function requestMessages(init: RequestInit = {}, signal?: AbortSignal) {
 const controller = new AbortController();
 const abort = () => controller.abort();
 signal?.addEventListener('abort', abort, {once:true});
 const timer = window.setTimeout(abort, 15000);
 try {
  let response: Response;
  try { response = await fetch(endpoint+'/messages', {...init, signal:controller.signal}); }
  catch { throw new GuestbookError('network'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
   const code = data?.error;
   throw new GuestbookError(response.status===429?'rate':
    code==='verification_failed'||code==='verification_required'?'verification':
    response.status===400||response.status===413?'input':'service');
  }
  if (!data) throw new GuestbookError('service');
  return data;
 } finally { window.clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
function failureText(kind: Failure, zh: boolean) {
 const copy = {
  network: [
   '留言列表未能加载。无法连接留言服务。请尝试开启代理/VPN后刷新网页重试。输入内容仍保留在当前页面；请勿连续重复提交。',
   'The message list could not be loaded. Cannot connect to the guestbook service. Please try enabling a proxy/VPN, then refresh the page and try again. Your text remains on the current page; please avoid repeated submissions.'
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
 const [name,setName]=useState('');const [message,setMessage]=useState('');
 const [token,setToken]=useState('');
 const [ready,setReady]=useState(false);
 const [verificationError,setVerificationError]=useState(false);
 const widget=useRef<HTMLDivElement>(null);const widgetId=useRef<string|null>(null);
 useEffect(()=>{
  if(!endpoint)return;
  const controller=new AbortController();
  setLoading(true);setLoadError(null);
  requestMessages({},controller.signal).then(data=>{
   if(controller.signal.aborted)return;
   if(!Array.isArray(data.messages))throw new GuestbookError('service');
   setMessages(data.messages);
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
  e.preventDefault();if(!enabled||!token||status==='posting')return;
  setStatus('posting');setPostError(null);
  try {
   const result=await requestMessages({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,message,token})});
   if(result.status!=='pending'||typeof result.id!=='string')throw new GuestbookError('service');
   setMessage('');setStatus('pending');setLoadError(null);
  } catch(e) {setStatus('error');setPostError(e instanceof GuestbookError?e.kind:'service');}
  finally {setToken('');if(widgetId.current)window.turnstile?.reset(widgetId.current);}
 }
 return <section id="guestbook" className="guestbook-section scroll-mt-28">
  <h2 className="section-title">{zh?'留言':'Guestbook'}</h2>
  <form onSubmit={submit} className="guestbook-form">
   <label htmlFor="guest-name">{zh?'你的名字（选填）':'Your name (optional)'}</label>
   <input id="guest-name" autoComplete="nickname" maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder={zh?'不填则显示为「一位访客」':'Leave blank to post as a visitor'}/>
   <label htmlFor="guest-message">{zh?'留言内容':'Your message'}</label>
   <textarea id="guest-message" required maxLength={2000} rows={5} value={message} onChange={e=>setMessage(e.target.value)} placeholder={zh?'打个招呼，分享一个想法，或留下你来过的痕迹。':'Say hi, share a thought, or leave a little sign that you were here.'}/>
   <div className="guestbook-count">{message.length} / 2000</div>
   {enabled&&<><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setReady(true)} onError={()=>setVerificationError(true)}/><div ref={widget}/></>}
   {verificationError&&<p role="status">{zh?'人机验证暂未完成。若验证框无法加载，可尝试开启代理/VPN或切换网络，再重新验证。输入内容仍保留在当前页面。':'Verification did not complete. If the verification box cannot load, try a proxy/VPN or another network, then verify again. Your text remains on this page.'}</p>}
   <button className="guestbook-submit" type="submit" disabled={!enabled||!token||!message.trim()||status==='posting'}>{status==='posting'?(zh?'正在提交…':'Posting…'):(zh?'发布留言':'Post message')}</button>
   <p role="status" aria-live="polite">{status==='pending'?(zh?'已收到，审核后会显示在这里。谢谢你的留言！':'Received — your message will appear after review. Thank you!'):postError?failureText(postError,zh):''}</p>
   {loadError&&status!=='posting'&&status!=='pending'&&!postError&&<p role="status">{loadError!=='network'&&(zh?'留言列表未能加载。':'Could not load messages. ')}{failureText(loadError,zh)}</p>}
   {loading&&status==='idle'&&<p role="status">{zh?'正在读取留言…':'Loading messages…'}</p>}

  </form>
  <div className="guestbook-messages">{messages.map(m=><article key={m.id} className="guestbook-entry"><header><h3>{m.name|| (zh?'一位访客':'A visitor')}</h3><time dateTime={m.created_at}>{new Intl.DateTimeFormat(zh?'zh-CN':'en-GB',{year:'numeric',month:'short',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(m.created_at))}</time></header><p>{m.message}</p><small>{zh?'IP 属地：':'IP region: '}{m.region|| (zh?'未知':'Unknown')}</small></article>)}</div>
  {enabled&&messages.length===0&&status==='idle'&&!loading&&!loadError&&<p className="guestbook-notice">{zh?'这里还没有公开留言，欢迎留下第一句话。':'No public messages yet. Be the first to say hello.'}</p>}
  <p className="guestbook-notice">{zh?'也可以使用下方的 GitHub 留言入口，登录 GitHub 留言。':'You can also sign in to GitHub and leave a message using the link below.'}</p>
  <a className="guestbook-archive" href="https://github.com/Lufei-lee/Lufei-lee.github.io/discussions/1" target="_blank" rel="noreferrer">{zh?'原 GitHub 留言板 ↗':'Original GitHub guestbook ↗'}</a>
 </section>;
}
