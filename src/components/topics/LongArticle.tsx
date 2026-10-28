'use client';
import Image from 'next/image';
import { Fragment } from 'react';
import Link from 'next/link';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { articles, type ArticleKey } from './articles';
import { figures, type Figure } from './figures';
import { maths, equationPlacements } from './maths';
import { openings } from './deeper-reading';
import { plainLanguage } from './plain-language';
import { explanations } from './explanations';
import DarkSectorResearch from './DarkSectorResearch';
import BaoResearch from './BaoResearch';
import ArticleNavigation, { type ArticleSection } from './ArticleNavigation';

function EquationCaption({ text }: { text: string }) {
  return <>{text.split('ϕ').map((part, index) => <Fragment key={index}>
    {index > 0 && <span dangerouslySetInnerHTML={{ __html: katex.renderToString(String.raw`\varphi`, { throwOnError: true, trust: false, output: 'htmlAndMathml' }) }} />}
    {part}
  </Fragment>)}</>;
}

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
  const sections=plainLanguage[topic];
  const contents: ArticleSection[] = sections.map((section, i) => ({ id: 'part-'+i, title: section[lang], number: String(i+1).padStart(2,'0') }));
  if(topic==='dark-sector') contents.push(
    {id:'pandax',title:zh?'交大 PandaX 实验':'PandaX at SJTU',number:'09'},
    {id:'my-dark-energy-research',title:zh?'我的暗能量研究':'My dark-energy research',number:'10'}
  );
  contents.push({id:'classics',title:zh?'经典文献':'Classic reading'});
  return <article id="article-top" className="academic-frame long-article">
    <div className="article-tools"><Link href="/">{zh?'← 返回主页':'← Home'}</Link><button onClick={()=>window.print()}>{zh?'打印 / 保存 PDF':'Print / Save PDF'}</button></div>
    <header className="essay-header"><h1>{a.title[lang]}</h1><p>{a.subtitle[lang]}</p></header>
    <SourcedFigure figure={figures[topic].hero} lang={lang} hero/>
    <div className="essay-layout">
      <ArticleNavigation key={topic} sections={contents} zh={zh}/>
      <div className="essay-body"><p className="essay-opening">{openings[topic][lang]}</p>
        {sections.map((s,i)=><section id={'part-'+i} key={s[0]}><p className="reading-kicker">{String(i+1).padStart(2,'0')}</p><h2>{s[lang]}</h2>{s[zh?3:2].split('\n').map((p,j)=><Fragment key={j}><p>{p}</p>{equationPlacements[topic].filter(e=>e.section===i&&e.paragraph===j).map(({equation:n})=><figure className="equation-card" key={n}><div className="math-scroll" tabIndex={0} aria-label={zh?'数学公式':'Mathematical expression'} dangerouslySetInnerHTML={{__html:katex.renderToString(maths[topic][n],{displayMode:true,throwOnError:true,trust:false,output:'htmlAndMathml'})}}/><figcaption><EquationCaption text={a.equations[n][zh?2:1]}/></figcaption></figure>)}</Fragment>)}{explanations[topic][i][lang]&&<p>{explanations[topic][i][lang]}</p>}{topic==='machine-learning'&&i===5&&<p><Link href="/dark-matter-dark-energy/#my-dark-energy-research">{zh?'相关研究：我的研究——让更多暗能量模型算得更快 →':'Related work: faster predictions for a wider range of dark-energy models →'}</Link></p>}{topic==='cosmology'&&i===6&&<BaoResearch zh={zh}/>}{figures[topic].inline.filter(f=>f.after===i).map(f=><SourcedFigure key={f.figure.file} figure={f.figure} lang={lang}/>)}</section>)}
        {topic==='dark-sector'&&<DarkSectorResearch zh={zh}/>}
        <section id="classics" className="classic-list"><h2>{zh?'经典文献 · 从哪里读起':'Classic reading · where to begin'}</h2>{a.refs.map((r,i)=><div key={r[0]}><span>0{i+1} / {r[0]}</span><a href={r[2]} target="_blank" rel="noreferrer">{r[1]} ↗</a><p>{r[zh?4:3]}</p></div>)}</section>
      </div>
    </div>
    <nav className="essay-next" aria-label={zh?'继续探索':'Explore another field'}>{Object.entries(articles).filter(([k])=>k!==topic).map(([k,v])=><Link href={k==='dark-sector'?'/dark-matter-dark-energy/':'/'+k+'/'} key={k}>{v.title[lang]} →</Link>)}</nav>
  </article>;
}
