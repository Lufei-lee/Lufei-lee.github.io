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
export default function Guestbook() {
 const zh=useLocaleStore(s=>s.locale)==='zh';
 const [messages,setMessages]=useState<Message[]>([]);
 const [status,setStatus]=useState<'idle'|'loading'|'posting'|'pending'|'error'>(endpoint?'loading':'idle');
 const [name,setName]=useState('');const [message,setMessage]=useState('');
 const [token,setToken]=useState('');
 const [ready,setReady]=useState(false);
 const widget=useRef<HTMLDivElement>(null);const widgetId=useRef<string|null>(null);
 useEffect(()=>{
  if(!endpoint)return;
  const controller=new AbortController();
  fetch(endpoint+'/messages',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(!Array.isArray(data.messages))throw Error();setMessages(data.messages);setStatus('idle');}).catch(e=>{if(e.name!=='AbortError')setStatus('error');});
  return ()=>controller.abort();
 },[]);
 useEffect(()=>{
  if(!ready||!widget.current||!window.turnstile||!sitekey)return;
  widgetId.current=window.turnstile.render(widget.current,{sitekey,action:'guestbook',theme:'auto',size:widget.current.clientWidth<300?'compact':'normal',language:zh?'zh-CN':'en',callback:(t:string)=>setToken(t),'expired-callback':()=>setToken(''),'error-callback':()=>{setToken('');setStatus('error');}});
  return ()=>{if(widgetId.current)window.turnstile?.remove(widgetId.current);setToken('');};
 },[ready,zh]);
 async function submit(e:React.FormEvent) {
  e.preventDefault();if(!enabled||!token||status==='posting')return;
  setStatus('posting');
  try {
   const res=await fetch(endpoint+'/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,message,token})});
   if(!res.ok)throw Error();
   setMessage('');setStatus('pending');
  } catch {setStatus('error');}
  finally {setToken('');if(widgetId.current)window.turnstile?.reset(widgetId.current);}
 }
 return <section id="guestbook" className="guestbook-section scroll-mt-28">
  <p className="reading-kicker">LEAVE A MESSAGE</p>
  <h2 className="section-title">{zh?'留下一句话':'Leave a message'}</h2>
  <form onSubmit={submit} className="guestbook-form">
   <label htmlFor="guest-name">{zh?'你的名字（选填）':'Your name (optional)'}</label>
   <input id="guest-name" autoComplete="nickname" maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder={zh?'不填则显示为「一位访客」':'Leave blank to post as a visitor'}/>
   <label htmlFor="guest-message">{zh?'留言内容':'Your message'}</label>
   <textarea id="guest-message" required maxLength={2000} rows={5} value={message} onChange={e=>setMessage(e.target.value)} placeholder={zh?'打个招呼，分享一个想法，或留下你来过的痕迹。':'Say hi, share a thought, or leave a little sign that you were here.'}/>
   <div className="guestbook-count">{message.length} / 2000</div>
   {enabled&&<><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setReady(true)} onError={()=>setStatus('error')}/><div ref={widget}/></>}
   <button className="guestbook-submit" type="submit" disabled={!enabled||!token||!message.trim()||status==='posting'}>{status==='posting'?(zh?'正在提交…':'Posting…'):(zh?'发布留言':'Post message')}</button>
   <p role="status" aria-live="polite">{status==='pending'?(zh?'已收到，审核后会显示在这里。谢谢你的留言！':'Received — your message will appear after review. Thank you!'):status==='error'?(zh?'暂时无法连接留言服务，或验证已失效。请稍后重试；输入内容已保留。':'Could not connect or verification expired. Please retry; your text is preserved.'):status==='loading'?(zh?'正在读取留言…':'Loading messages…'):''}</p>
  </form>
  <div className="guestbook-messages">{messages.map(m=><article key={m.id} className="guestbook-entry"><header><h3>{m.name|| (zh?'一位访客':'A visitor')}</h3><time dateTime={m.created_at}>{new Intl.DateTimeFormat(zh?'zh-CN':'en-GB',{year:'numeric',month:'short',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(m.created_at))}</time></header><p>{m.message}</p><small>{zh?'IP 属地：':'IP region: '}{m.region|| (zh?'未知':'Unknown')}</small></article>)}</div>
  {enabled&&messages.length===0&&status==='idle'&&<p className="guestbook-notice">{zh?'这里还没有公开留言，欢迎留下第一句话。':'No public messages yet. Be the first to say hello.'}</p>}
  <p className="guestbook-notice">{zh?'也可以使用下方的 GitHub 留言入口，登录 GitHub 留言。':'You can also sign in to GitHub and leave a message using the link below.'}</p>
  <a className="guestbook-archive" href="https://github.com/Lufei-lee/Lufei-lee.github.io/discussions/1" target="_blank" rel="noreferrer">{zh?'原 GitHub 留言板 ↗':'Original GitHub guestbook ↗'}</a>
 </section>;
}
