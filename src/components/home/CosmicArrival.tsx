'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocaleStore } from '@/lib/stores/localeStore';

// A deterministic teaching animation, not a physical simulation.
export default function CosmicArrival() {
  const [visible,setVisible]=useState(false);
  const [allowMotion,setAllowMotion]=useState(false);
  const [phase,setPhase]=useState(0);
  const canvas=useRef<HTMLCanvasElement>(null);
  const button=useRef<HTMLButtonElement>(null);
  const zh=useLocaleStore(s=>s.locale)==='zh';
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const firstFrame=requestAnimationFrame(()=>{
      setAllowMotion(true);
      try { if(sessionStorage.getItem('cosmic-arrival-v1'))return; sessionStorage.setItem('cosmic-arrival-v1','seen'); } catch { /* Animation still works with storage disabled. */ }
      setVisible(true);
    });
    return ()=>cancelAnimationFrame(firstFrame);
  },[]);
  useEffect(()=>{
    if(!visible)return;
    const previous=document.activeElement as HTMLElement|null;
    button.current?.focus();
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const el=canvas.current;const ctx=el?.getContext('2d');
    if(!el||!ctx){setVisible(false);document.body.style.overflow=oldOverflow;return;}
    let frame=0;const start=performance.now();let lastPhase=-1;
    const w=900,h=560;el.width=w*2;el.height=h*2;ctx.scale(2,2);
    const nodes=Array.from({length:78},(_,i)=>({x:70+(Math.sin(i*127.1)*43758.5453%1+1)%1*760,y:40+(Math.sin(i*311.7)*96453.92%1+1)%1*480}));
    const draw=(now:number)=>{
      const t=Math.min((now-start)/5200,1);const p=Math.min(2,Math.floor(t*3));
      if(p!==lastPhase){setPhase(p);lastPhase=p;}
      ctx.clearRect(0,0,w,h);
      const growth=Math.min(1,Math.max(0,(t-.16)/.64));
      // A CMB-like field resolves into filaments as the view opens outward.
      for(let i=0;i<240;i++){
        const angle=i*2.39996;const radius=Math.sqrt(i/240)*230;
        const target=nodes[i%nodes.length];
        const x=(450+Math.cos(angle)*radius)*(1-growth)+target.x*growth;
        const y=(280+Math.sin(angle)*radius*.7)*(1-growth)+target.y*growth;
        ctx.fillStyle=i%3===0?'rgba(231,191,120,.75)':'rgba(163,198,220,.65)';
        ctx.beginPath();ctx.arc(x,y,1.2+(1-growth)*4,0,Math.PI*2);ctx.fill();
      }
      ctx.lineWidth=.65;
      for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j];const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d>105)continue;
        ctx.strokeStyle='rgba(157,195,218,'+growth*(1-d/105)*.65+')';
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
      ctx.strokeStyle='rgba(232,198,139,'+(1-t)*.4+')';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(450,280,40+t*430,24+t*210,0,0,Math.PI*2);ctx.stroke();
      if(t<1)frame=requestAnimationFrame(draw);else setVisible(false);
    };
    frame=requestAnimationFrame(draw);
    const safety=setTimeout(()=>setVisible(false),5800);
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setVisible(false);};
    window.addEventListener('keydown',escape);
    return ()=>{cancelAnimationFrame(frame);clearTimeout(safety);window.removeEventListener('keydown',escape);document.body.style.overflow=oldOverflow;previous?.focus();};
  },[visible]);
  if(!visible)return allowMotion?<div className="arrival-replay"><button onClick={()=>{setPhase(0);setVisible(true);}}>{zh?'回看宇宙开场':'Replay the cosmic opening'} ↗</button></div>:null;
  const labels=zh?['一束古老的光','微小起伏，长成宇宙网','在宇宙的一隅，相遇']:['An ancient light','Small ripples become a cosmic web','A meeting in one corner of the Universe'];
  return <div className="cosmic-arrival" role="dialog" aria-modal="true" aria-labelledby="arrival-title">
    <div className="arrival-top"><span>LUFEI / COSMIC FIELD NOTES</span><button ref={button} onClick={()=>setVisible(false)} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();button.current?.focus();}}}>{zh?'跳过 · 进入主页':'Skip · Enter'} ↗</button></div>
    <canvas ref={canvas} aria-hidden="true"/>
    <div className="arrival-copy"><p>01 — 13.8 Gyr — NOW</p><h2 id="arrival-title">{labels[phase]}</h2><span>{zh?'从早期宇宙的微光，到今天连接星系的纤维。':'From the early afterglow to the filaments connecting galaxies.'}</span><small>{zh?'演化意象 · 非数值模拟':'An artistic sequence, not a numerical simulation'}</small></div>
    <div className="arrival-progress"/>
  </div>;
}
