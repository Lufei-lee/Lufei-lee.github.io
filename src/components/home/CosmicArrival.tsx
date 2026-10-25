'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocaleStore } from '@/lib/stores/localeStore';

const DURATION = 20000;
const clamp = (v:number) => Math.max(0,Math.min(1,v));
const smooth = (v:number) => {const x=clamp(v);return x*x*(3-2*x);};
const random = (i:number) => {const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};

// A small procedural gas field supplies texture without image downloads.
function gasTexture(cold=false) {
 const texture=document.createElement('canvas');texture.width=440;texture.height=280;
 const context=texture.getContext('2d')!;const image=context.createImageData(440,280);
 const hash=(x:number,y:number)=>random(x+y*173);
 const noise=(x:number,y:number)=>{
  const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
  return (hash(ix,iy)*(1-fx)+hash(ix+1,iy)*fx)*(1-fy)+(hash(ix,iy+1)*(1-fx)+hash(ix+1,iy+1)*fx)*fy;
 };
 for(let y=0;y<280;y++)for(let x=0;x<440;x++){
  const nx=(x-220)/220,ny=(y-140)/140,r=Math.hypot(nx,ny),a=Math.atan2(ny,nx);
  let value=0,amp=.56,freq=2.4;
  for(let octave=0;octave<5;octave++){value+=noise(nx*freq+17+Math.sin(a+r*4)*.5,ny*freq+31)*amp;freq*=2.05;amp*=.51;}
  const ribbons=Math.pow(clamp(1-Math.abs(Math.sin(a*3+r*14+value*9))),3);
  const density=Math.pow(clamp((value-.22)*2.1),1.7)*clamp((1-r)*3)+ribbons*.18*clamp(1-r);
  const i=(y*440+x)*4;
  image.data[i]=cold?65+value*85:180+value*75;
  image.data[i+1]=cold?100+value*100:55+value*160;
  image.data[i+2]=cold?180+value*75:20+value*130;
  image.data[i+3]=clamp(density)*235;
 }
 context.putImageData(image,0,0);return texture;
}

type SpotifyPlayback = {data:{isPaused:boolean;isBuffering:boolean}};
type SpotifyController = {
 play:()=>void;pause:()=>void;destroy:()=>void;
 addListener:(name:string,callback:(event:SpotifyPlayback)=>void)=>void;
};
type SpotifyAPI = {createController:(element:HTMLElement,options:{uri:string;width:string;height:number},callback:(controller:SpotifyController)=>void)=>void};
declare global {interface Window {onSpotifyIframeApiReady?:(api:SpotifyAPI)=>void}}
let spotifyAPI:Promise<SpotifyAPI>|undefined;
function loadSpotify() {
 if(!spotifyAPI)spotifyAPI=new Promise<SpotifyAPI>((resolve,reject)=>{
  window.onSpotifyIframeApiReady=resolve;
  const script=document.createElement('script');script.src='https://open.spotify.com/embed/iframe-api/v1';script.async=true;
  script.onerror=()=>{spotifyAPI=undefined;script.remove();reject(new Error('music_unavailable'));};
  document.head.appendChild(script);
 });
 return spotifyAPI;
}

export default function CosmicArrival() {
 const [visible,setVisible]=useState(false),[allowMotion,setAllowMotion]=useState(false);
 const [phase,setPhase]=useState(0),[sound,setSound]=useState(false),[soundError,setSoundError]=useState(false);
 const [musicReady,setMusicReady]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null),dialog=useRef<HTMLDivElement>(null);
 const skip=useRef<HTMLButtonElement>(null),music=useRef<HTMLButtonElement>(null);
 const playerHost=useRef<HTMLDivElement>(null),player=useRef<SpotifyController|null>(null);
 const zh=useLocaleStore(s=>s.locale)==='zh';
 function dismiss(){setVisible(false);player.current?.pause();setSound(false);}
 function toggleSound(){if(!player.current)return;if(sound)player.current.pause();else player.current.play();}
 useEffect(()=>{
  if(!visible||!playerHost.current)return;
  let cancelled=false,active:SpotifyController|undefined;
  const host=playerHost.current;const mount=document.createElement('div');host.appendChild(mount);
  const timeout=setTimeout(()=>{if(!cancelled)setSoundError(true);},12000);
  loadSpotify().then(api=>{
   if(cancelled)return;
   api.createController(mount,{uri:'spotify:track:6pWgRkpqVfxnj3WuIcJ7WP',width:'100%',height:80},controller=>{
    if(cancelled){controller.destroy();return;}
    active=controller;player.current=controller;
    controller.addListener('ready',()=>{
     if(cancelled)return;
     clearTimeout(timeout);setMusicReady(true);setSoundError(false);
     controller.play(); // Try audible autoplay; keep the native Play button if blocked.
    });
    controller.addListener('playback_update',event=>{if(!cancelled)setSound(!event.data.isPaused&&!event.data.isBuffering);});
   });
  }).catch(()=>{if(!cancelled)setSoundError(true);});
  return ()=>{cancelled=true;clearTimeout(timeout);active?.pause();active?.destroy();player.current=null;host.replaceChildren();};
 },[visible]);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const id=requestAnimationFrame(()=>{
   setAllowMotion(true);
   try {if(sessionStorage.getItem('cosmic-arrival-v2'))return;sessionStorage.setItem('cosmic-arrival-v2','seen');}catch{}
   setVisible(true);
  });
  return ()=>cancelAnimationFrame(id);
 },[]);
 useEffect(()=>{
  if(!visible)return;
  const previous=document.activeElement as HTMLElement|null,oldOverflow=document.body.style.overflow;
  skip.current?.focus();document.body.style.overflow='hidden';
  const el=canvas.current,ctx=el?.getContext('2d',{alpha:false});
  if(!el||!ctx){setVisible(false);document.body.style.overflow=oldOverflow;return;}
  let width=innerWidth,height=innerHeight,frame=0,lastPhase=-1,lastFrame=0;
  function resize(){
   width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);
   el!.width=Math.round(width*dpr);el!.height=Math.round(height*dpr);ctx!.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();window.addEventListener('resize',resize);
  const plasma=gasTexture(),nebula=gasTexture(true);
  const particles=Array.from({length:width<600?720:1400},(_,i)=>({a:random(i)*Math.PI*2,r:Math.sqrt(random(i+1600)),z:random(i+3200),s:.3+random(i+4800)*1.4}));
  const nodes=Array.from({length:160},(_,i)=>({x:(random(i+6400)-.5)*2.6,y:(random(i+6600)-.5)*1.8,z:random(i+6800),s:random(i+7000)}));
  const links:{a:typeof nodes[0];b:typeof nodes[0];strength:number}[]=[];
  nodes.forEach((a,i)=>nodes.slice(i+1).forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<.32)links.push({a,b,strength:1-d/.32});}));
  const start=performance.now();
  function glow(x:number,y:number,r:number,color:string,alpha:number){
   if(r<=0||alpha<=0)return;
   const g=ctx!.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.25,`rgba(${color},${alpha*.35})`);g.addColorStop(1,`rgba(${color},0)`);
   ctx!.fillStyle=g;ctx!.fillRect(x-r,y-r,r*2,r*2);
  }
  const draw=(now:number)=>{
   // Bound drawing work to 30 fps on high-refresh and mobile displays.
   if(now-lastFrame<32){frame=requestAnimationFrame(draw);return;}lastFrame=now;
   const seconds=(now-start)/1000,t=clamp(seconds/20);
   const p=seconds<4?0:seconds<9?1:seconds<13.5?2:3;
   if(p!==lastPhase){setPhase(p);lastPhase=p;}
   const cx=width*.5,cy=height*.44,unit=Math.max(width,height)*.67;
   ctx.fillStyle='#02040d';ctx.fillRect(0,0,width,height);
   const bloom=smooth(seconds/2.8)*(1-smooth((seconds-6)/5));
   const expansion=smooth((seconds-2.5)/7),web=smooth((seconds-11.5)/4);
   glow(cx,cy,unit*.9,'35,65,137',.32+.18*web);
   glow(cx-unit*.3,cy-unit*.18,unit*.55,'92,32,113',.15*expansion);
   glow(cx+unit*.38,cy+unit*.08,unit*.5,'20,101,128',.15*web);
   ctx.globalCompositeOperation='screen';
   const fieldSize=unit*(.15+expansion*1.35);
   ctx.save();ctx.translate(cx,cy);ctx.rotate(-.18+seconds*.009);
   ctx.globalAlpha=(.25+bloom*.75)*(1-web);
   ctx.drawImage(plasma,-fieldSize,-fieldSize*.64,fieldSize*2,fieldSize*1.28);
   ctx.globalAlpha=smooth((seconds-7)/5)*.65;
   ctx.drawImage(nebula,-unit*1.2,-unit*.7,unit*2.4,unit*1.4);ctx.restore();
   // Slowly swirling plasma layers expand across the entire field of view.
   for(let k=0;k<15;k++){
    const a=k*2.39996+seconds*.025,r=(.03+expansion*.6)*unit*Math.sqrt((k+1)/15);
    glow(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.55,unit*(.13+.12*expansion),k%2?'184,55,23':'40,97,170',(.05+bloom*.11)*(1-web*.85));
   }
   if(seconds<11){
    for(let ring=0;ring<7;ring++){
     const spread=smooth((seconds-1.4-ring*.29)/7);if(spread<=0)continue;
     ctx.strokeStyle=`rgba(245,182,109,${.14*(1-spread)*(1-web)})`;ctx.lineWidth=1;
     ctx.beginPath();ctx.ellipse(cx,cy,unit*(.01+spread*1.3),unit*(.006+spread*.48),-.18,0,Math.PI*2);ctx.stroke();
    }
   }
   particles.forEach((star,i)=>{
    const reach=(.003+Math.pow(expansion,1.5)*1.6)*star.r;
    const angle=star.a+seconds*.012*(1-star.z);
    const x=cx+Math.cos(angle)*reach*unit,y=cy+Math.sin(angle)*reach*unit*.65;
    const fade=(.15+.7*expansion)*(1-web*.78),size=star.s*(.4+expansion*.65);
    ctx.fillStyle=i%4===0?`rgba(255,191,119,${fade})`:`rgba(178,213,255,${fade})`;
    if(seconds>3&&seconds<9){
     const tail=.01+.07*Math.sin(clamp((seconds-3)/6)*Math.PI)*(1-star.z);
     ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=size*.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(cx+(x-cx)*(1-tail),cy+(y-cy)*(1-tail));ctx.stroke();
    }else{ctx.fillRect(x,y,size,size);}
   });
   // A mottled last-scattering surface gives way to filaments and galaxy knots.
   const cmb=smooth((seconds-6)/2.8)*(1-smooth((seconds-11.5)/2.5));
   if(cmb>.01)for(let i=0;i<130;i++){
    const x=cx+(random(i+8000)-.5)*width*1.2,y=cy+(random(i+8300)-.5)*height;
    glow(x,y,unit*(.025+random(i+8500)*.055),i%3?'47,117,195':'239,132,68',cmb*.12);
   }
   if(web>0){
    const zoom=1+smooth((seconds-13.5)/6.5)*.2,scale=Math.min(width*.48,height*.72)*zoom;
    const project=(n:typeof nodes[0])=>({x:cx+n.x*scale+Math.sin(seconds*.04+n.z)*15,y:cy+n.y*scale*.72});
    links.forEach(({a,b,strength})=>{
     const aa=project(a),bb=project(b);ctx.strokeStyle=`rgba(93,159,218,${web*strength*.7})`;ctx.lineWidth=.8+strength*1.4;
     ctx.beginPath();ctx.moveTo(aa.x,aa.y);ctx.quadraticCurveTo((aa.x+bb.x)/2+12,(aa.y+bb.y)/2-9,bb.x,bb.y);ctx.stroke();
     for(let j=1;j<30;j++){const f=j/30;ctx.fillStyle=`rgba(167,210,249,${web*strength*.9})`;ctx.fillRect(aa.x+(bb.x-aa.x)*f+Math.sin(j*4+a.z)*4,aa.y+(bb.y-aa.y)*f+Math.cos(j*3)*4,1.2,1.2);}
    });
    nodes.forEach(n=>{
     const a=project(n);glow(a.x,a.y,10+n.s*20,n.s>.7?'255,210,142':'111,185,255',web*(.2+n.s*.5));
     ctx.fillStyle=`rgba(240,238,224,${web*.9})`;ctx.beginPath();ctx.ellipse(a.x,a.y,.7+n.s*2.6,.5+n.s*.85,n.z*6,0,Math.PI*2);ctx.fill();
    });
   }
   const core=(1-smooth((seconds-4)/6));
   glow(cx,cy,unit*(.012+bloom*.25),'255,165,69',core*.7);
   glow(cx,cy,unit*(.004+bloom*.045),'255,236,191',core*.95);
   // Gentle lens flare, without flashing or a full-screen white frame.
   if(core>.01){ctx.save();ctx.translate(cx,cy);ctx.scale(1,.012);glow(0,0,unit*(.14+bloom*.5),'255,207,142',core*.4);ctx.restore();}
   ctx.globalCompositeOperation='source-over';
   const shade=ctx.createLinearGradient(0,0,0,height);shade.addColorStop(0,'rgba(2,4,13,.36)');shade.addColorStop(.48,'rgba(2,4,13,0)');shade.addColorStop(1,'rgba(2,4,13,.95)');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
   const fadeOut=smooth((seconds-19)/1);if(fadeOut){ctx.fillStyle=`rgba(2,4,13,${fadeOut*.7})`;ctx.fillRect(0,0,width,height);}
   if(t<1)frame=requestAnimationFrame(draw);else setVisible(false);
  };
  frame=requestAnimationFrame(draw);
  const safety=setTimeout(()=>setVisible(false),DURATION+1000);
  const keydown=(e:KeyboardEvent)=>{
   if(e.key==='Escape')setVisible(false);
   if(e.key==='Tab'){
    const focusable=dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],iframe');
    const first=focusable?.[0],last=focusable?.[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
  };
  window.addEventListener('keydown',keydown);
  return ()=>{cancelAnimationFrame(frame);clearTimeout(safety);window.removeEventListener('resize',resize);window.removeEventListener('keydown',keydown);document.body.style.overflow=oldOverflow;previous?.focus();};
 },[visible]);
 if(!visible)return allowMotion?<div className="arrival-replay"><button onClick={()=>{setPhase(0);setSound(false);setSoundError(false);setMusicReady(false);setVisible(true);}}>{zh?'回看宇宙开场':'Replay the cosmic opening'} ↗</button></div>:null;
 const titles=zh?['时间的黎明','空间，正在展开','光，终于自由','亿万星系，在此相遇']:['The dawn of time','Space unfolds','Light breaks free','A Universe of connections'];
 const descriptions=zh?['从炽热而致密的早期宇宙开始。','膨胀拉开距离，也将微小起伏铺向辽阔。','约 38 万年后，宇宙渐渐透明，古老的光开始远行。','引力将起伏织成宇宙网。138 亿年后，我们望向星空。']:['A beginning in a hot, dense early Universe.','Expansion stretches space and carries tiny fluctuations outward.','After about 380,000 years, the Universe becomes transparent.','Gravity weaves a cosmic web. 13.8 billion years later, we look up.'];
 const eras=['I · ORIGIN','II · EXPANSION','III · FIRST LIGHT','IV · COSMIC WEB'];
 return <div ref={dialog} className="cosmic-arrival" role="dialog" aria-modal="true" aria-labelledby="arrival-title">
  <canvas ref={canvas} aria-hidden="true"/>
  <div className="arrival-top"><span>LUFEI <i>/</i> COSMIC OVERTURE</span><div className="arrival-controls"><button ref={music} aria-pressed={sound} disabled={!musicReady} onClick={toggleSound}>{sound?(zh?'暂停原声':'Pause music'):(zh?'播放原声':'Play music')} <span aria-hidden="true">{sound?'♫':'♪'}</span></button><button ref={skip} onClick={dismiss}>{zh?'进入主页':'Enter site'} ↗</button></div></div>
  <div className="arrival-music"><div ref={playerHost}/><p>{soundError?(zh?'原声暂未连接，可稍后重播开场。':'Soundtrack unavailable. Try replaying the opening later.'):sound?(zh?'正在播放《星际穿越》原声':'Playing the Interstellar soundtrack'):(zh?'尝试自动播放 · 若无声，请点击播放器 ▶':'Autoplay enabled · If silent, press ▶ in the player')}</p><a href="https://open.spotify.com/track/6pWgRkpqVfxnj3WuIcJ7WP" target="_blank" rel="noreferrer">Cornfield Chase · Hans Zimmer ↗</a><small>{zh?'Spotify 官方播放器 · 播放范围由平台决定':'Official Spotify player · Playback availability varies'}</small></div>
  <div className="arrival-coordinate" aria-hidden="true">{eras[phase]}<br/>13.8 BILLION YEARS / ONE SKY</div>
  <div className="arrival-copy" key={phase}><p>{zh?'宇宙序曲':'A COSMIC OVERTURE'} <span aria-hidden="true">/ 0{phase+1}</span></p><h2 id="arrival-title">{titles[phase]}</h2><div>{descriptions[phase]}</div></div>
  <div className="arrival-bottom"><span>{zh?'宇宙演化意象 · INTERSTELLAR':'An impression of cosmic evolution · INTERSTELLAR'}</span><span>0{phase+1} <i>/</i> 04</span></div>
  <div className="arrival-progress"/>
 </div>;
}
