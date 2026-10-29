'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

type Counter={no_onload?:boolean;count?:(options:{path:string;title:string})=>void};
declare global {interface Window {goatcounter?:Counter}}
let lastPath:string|undefined;
const pending:{path:string;title:string}[]=[];
function flush(){if(window.goatcounter?.count){while(pending.length)window.goatcounter.count(pending.shift()!);}}
function dailyVisit(){
 const endpoint=process.env.NEXT_PUBLIC_GUESTBOOK_API?.replace(/\/$/,'');
 if(!endpoint||navigator.doNotTrack==='1')return;
 try {
  const key='lufei-analytics-browser-v1';
  let id=localStorage.getItem(key);
  if(!id||!/^[a-f0-9-]{36}$/i.test(id)){id=crypto.randomUUID();localStorage.setItem(key,id);}
  // Server owns the Beijing date and deduplicates retries; no client clock or IP stored.
  void fetch(endpoint+'/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor_id:id}),keepalive:true}).catch(()=>{});
 } catch {/* No persistent storage: do not invent a new unique visitor on each refresh. */}
}
export default function PrivateAnalytics(){
 const path=usePathname();
 const code=process.env.NEXT_PUBLIC_GOATCOUNTER_CODE;
 useEffect(()=>{
  if(!code||!path||lastPath===path)return;
  lastPath=path;
  pending.push({path,title:document.title});
  dailyVisit();
  if(!document.querySelector('script[data-goatcounter]')){
   window.goatcounter={...window.goatcounter,no_onload:true};
   const script=document.createElement('script');
   script.async=true;script.src='https://gc.zgo.at/count.js';
   script.dataset.goatcounter=`https://${code}.goatcounter.com/count`;
   script.onload=flush;
   script.onerror=()=>{script.remove();lastPath=undefined;};
   document.body.appendChild(script);
  }
  flush();
 },[code,path]);
 return null;
}
