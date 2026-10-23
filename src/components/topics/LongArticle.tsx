'use client';
import Image from 'next/image';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { articles, type ArticleKey } from './articles';
import { figures, type Figure } from './figures';
import { maths } from './maths';
import { deeperReading, openings } from './deeper-reading';

function SourcedFigure({figure, lang, hero=false}:{figure:Figure;lang:0|1;hero?:boolean}) {
  return <figure className={hero?'essay-hero':'essay-secondary'}>
    <a href={'/topics/'+figure.file} target="_blank" rel="noreferrer" className={figure.paper?'figure-surface paper':'figure-surface'} aria-label={lang?'打开完整图片':'Open full image'}>
      <Image src={'/topics/'+figure.file} alt={figure.caption[lang]} width={1200} height={680} priority={hero} unoptimized/>
    </a>
    <figcaption>{figure.caption[lang]}<br/><a href={figure.source} target="_blank" rel="noreferrer">{figure.credit} ↗</a>{figure.license&&<> · <a href={figure.license}>{lang?'许可':'License'}</a></>} · {lang?'原图未改绘；点击可放大':'Unmodified artwork; click to enlarge'}</figcaption>
  </figure>;
}
export default function LongArticle({topic}:{topic:ArticleKey}) {
  const zh=useLocaleStore(s=>s.locale)==='zh';
  const a=articles[topic]; const lang:0|1=zh?1:0;
  const sections=[...a.sections,...deeperReading[topic]];
  return <article className="academic-frame long-article">
    <div className="article-tools"><Link href="/">{zh?'← 返回主页':'← Home'}</Link><button onClick={()=>window.print()}>{zh?'打印 / 保存 PDF':'Print / Save PDF'}</button></div>
    <header className="essay-header"><p className="reading-kicker">{zh?'科学与市场 · 长篇阅读':'SCIENCE & MARKETS · LONG READ'}</p><h1>{a.title[lang]}</h1><p>{a.subtitle[lang]}</p><span>{zh?'入门长读 · 约 15 分钟':'An introductory essay · about 15 minutes'}</span></header>
    <SourcedFigure figure={figures[topic].hero} lang={lang} hero/>
    <div className="essay-layout">
      <nav className="essay-toc" aria-label={zh?'文章目录':'Contents'}><strong>{zh?'本文内容':'ON THIS PAGE'}</strong>{sections.map((s,i)=><a href={'#part-'+i} key={s[0]}><span>{String(i+1).padStart(2,'0')}</span>{s[lang]}</a>)}<a href="#equations">{zh?'公式与符号':'Equations'}</a><a href="#classics">{zh?'经典文献':'Classic reading'}</a></nav>
      <div className="essay-body"><p className="essay-opening">{openings[topic][lang]}</p>
        {sections.map((s,i)=><section id={'part-'+i} key={s[0]}><p className="reading-kicker">{String(i+1).padStart(2,'0')}</p><h2>{s[lang]}</h2>{s[zh?3:2].split('\n').map((p,j)=><p key={j}>{p}</p>)}{figures[topic].inline.filter(f=>f.after===i).map(f=><SourcedFigure key={f.figure.file} figure={f.figure} lang={lang}/>)}</section>)}
        <section id="equations"><h2>{zh?'把概念写成公式':'The ideas in equations'}</h2>{a.equations.map((e,i)=><figure className="equation-card" key={e[0]}><div className="math-scroll" tabIndex={0} aria-label={zh?'数学公式':'Mathematical expression'} dangerouslySetInnerHTML={{__html:katex.renderToString(maths[topic][i],{displayMode:true,throwOnError:true,trust:false,output:'htmlAndMathml'})}}/><figcaption><span className="equation-number">({i+1})</span> {e[zh?2:1]}</figcaption></figure>)}</section>
        <section id="classics" className="classic-list"><h2>{zh?'经典文献 · 从哪里读起':'Classic reading · where to begin'}</h2><p>{zh?'不必一开始就读懂全部推导。可以先看论文提出了什么问题、用了哪些图，再回头检查假设。部分期刊全文需要机构访问。':'There is no need to master every derivation at once. Start with the question and the figures, then return to the assumptions. Some journal full texts require institutional access.'}</p>{a.refs.map((r,i)=><div key={r[0]}><span>0{i+1} / {r[0]}</span><a href={r[2]} target="_blank" rel="noreferrer">{r[1]} ↗</a><p>{r[zh?4:3]}</p></div>)}</section>
      </div>
    </div>
    <nav className="essay-next" aria-label={zh?'继续探索':'Explore another field'}>{Object.entries(articles).filter(([k])=>k!==topic).map(([k,v])=><Link href={k==='dark-sector'?'/dark-matter-dark-energy/':'/'+k+'/'} key={k}>{v.title[lang]} →</Link>)}</nav>
  </article>;
}
