'use client';

import { ArrowLeft, BookOpen, CircleDot, Telescope } from 'lucide-react';
import Link from 'next/link';
import { useLocaleStore } from '@/lib/stores/localeStore';

export type TopicKey = 'cosmology' | 'large-scale-structure' | 'dark-sector' | 'machine-learning';

type TopicCopy = {
  eyebrow: string;
  title: string;
  summary: string;
  definition: string;
  questions: string[];
  methods: Array<[string, string]>;
  importance: string;
  figureCaption: string;
};

const topics: Record<TopicKey, { en: TopicCopy; zh: TopicCopy }> = {
  cosmology: {
    en: {
      eyebrow: 'Research interest 01', title: 'Cosmology',
      summary: 'Cosmology studies the Universe as a physical system: its origin, composition, geometry, evolution, and possible future.',
      definition: 'Modern cosmology combines general relativity, particle physics, astronomy, and statistics. A standard working picture begins with a hot early Universe, follows the formation of atoms and the cosmic microwave background, and then traces how gravity builds stars, galaxies, and the cosmic web.',
      questions: ['How did the Universe begin and evolve?', 'What determines its expansion history?', 'How did tiny early fluctuations become galaxies?', 'What is the Universe made of?'],
      methods: [['Theory', 'Relativity and physical models describe expansion and gravity.'], ['Observation', 'Telescopes measure light, distance, redshift, and the microwave background.'], ['Computation', 'Numerical calculations connect models with complex observables.']],
      importance: 'Cosmology links the very largest scales to fundamental physics. It lets us test ideas about gravity, matter, and the early Universe using measurable patterns in the sky.',
      figureCaption: 'A schematic history of the Universe; time runs from left to right and is not to scale.',
    },
    zh: {
      eyebrow: '研究兴趣 01', title: '宇宙学',
      summary: '宇宙学把整个宇宙视为一个物理系统，研究它的起源、组成、几何、演化以及可能的未来。',
      definition: '现代宇宙学综合广义相对论、粒子物理、天文学和统计学。常见的研究图景从炽热的早期宇宙出发，经过原子形成和宇宙微波背景，再追踪引力如何逐步形成恒星、星系和宇宙网。',
      questions: ['宇宙如何起源并演化？', '什么决定宇宙的膨胀历史？', '早期微小涨落如何形成星系？', '宇宙由哪些成分构成？'],
      methods: [['理论', '用相对论和物理模型描述膨胀与引力。'], ['观测', '通过望远镜测量光、距离、红移和微波背景。'], ['计算', '用数值计算把模型与复杂观测量联系起来。']],
      importance: '宇宙学把最大的空间尺度与基础物理联系起来，使我们能够利用天空中的可测结构检验引力、物质和早期宇宙理论。',
      figureCaption: '宇宙历史示意图；时间从左向右推进，比例并非真实尺度。',
    },
  },
  'large-scale-structure': {
    en: {
      eyebrow: 'Research interest 02', title: 'Large-scale Structure',
      summary: 'On very large scales, matter is arranged in a cosmic web of clusters, filaments, sheets, and vast underdense voids.',
      definition: 'The cosmic web grew from small density variations in the early Universe. Gravity amplified regions with slightly more matter, while expanding low-density regions became voids. Galaxies trace this underlying matter distribution, but not perfectly.',
      questions: ['How fast does cosmic structure grow?', 'How do galaxies trace the matter field?', 'How does gravity act across cosmic time?', 'Which statistics best describe the web?'],
      methods: [['Galaxy surveys', 'Three-dimensional maps are built from angular positions and redshifts.'], ['Statistics', 'Correlation functions and power spectra summarize clustering.'], ['Simulation', 'N-body calculations follow the gravitational growth of matter.']],
      importance: 'Large-scale structure records both the initial conditions of the Universe and its later expansion. It is therefore a sensitive probe of gravity, neutrinos, dark matter, and dark energy.',
      figureCaption: 'A schematic cosmic web: bright nodes represent dense halos, linked by filaments around low-density voids.',
    },
    zh: {
      eyebrow: '研究兴趣 02', title: '宇宙大尺度结构',
      summary: '在极大的空间尺度上，物质并非均匀分布，而是形成由星系团、纤维、薄片和巨大空洞组成的宇宙网。',
      definition: '宇宙网起源于早期宇宙中微小的密度涨落。引力让略微致密的区域持续增长，而低密度区域在膨胀中形成空洞。星系能够描绘物质分布，但这种描绘并不完全等同于总物质场。',
      questions: ['宇宙结构以多快的速度增长？', '星系如何示踪物质分布？', '引力如何随宇宙时间发挥作用？', '哪些统计量最能描述宇宙网？'],
      methods: [['星系巡天', '利用天空位置和红移构建三维宇宙地图。'], ['统计分析', '用相关函数和功率谱概括聚集特征。'], ['数值模拟', '用 N 体计算追踪物质在引力作用下的增长。']],
      importance: '大尺度结构同时保留了宇宙初始条件和后期膨胀的痕迹，因此可以用来检验引力、中微子、暗物质和暗能量。',
      figureCaption: '宇宙网示意图：亮点代表致密晕，纤维连接其间，周围是低密度空洞。',
    },
  },
  'dark-sector': {
    en: {
      eyebrow: 'Research interest 03', title: 'Dark Matter & Dark Energy',
      summary: 'Most of the cosmic energy budget is invisible: dark matter shapes structure through gravity, while dark energy is associated with accelerated expansion.',
      definition: 'Dark matter does not emit light, but its gravitational influence appears in galaxy rotation, gravitational lensing, galaxy clusters, and the cosmic web. Dark energy is the name given to whatever drives the observed acceleration of cosmic expansion; its physical nature remains unknown.',
      questions: ['What particle or phenomenon is dark matter?', 'Is dark energy a constant or dynamical?', 'Does gravity need modification on large scales?', 'How can observations separate competing models?'],
      methods: [['Gravitational lensing', 'Distorted background images reveal otherwise invisible mass.'], ['Expansion probes', 'Supernovae and distance measurements trace cosmic expansion.'], ['Structure growth', 'Clustering tests how matter responds to gravity over time.']],
      importance: 'Together, dark matter and dark energy dominate the standard cosmic inventory, yet neither has a confirmed microscopic explanation. Understanding them would reshape fundamental physics.',
      figureCaption: 'Approximate present-day cosmic energy budget; percentages are rounded values in the standard cosmological model.',
    },
    zh: {
      eyebrow: '研究兴趣 03', title: '暗物质与暗能量',
      summary: '宇宙的大部分能量组成不可直接发光：暗物质通过引力塑造结构，暗能量则与宇宙加速膨胀相关。',
      definition: '暗物质不发光，但它的引力影响出现在星系旋转、引力透镜、星系团和宇宙网中。暗能量是对宇宙加速膨胀驱动因素的统称，其真实物理本质仍然未知。',
      questions: ['暗物质究竟是哪种粒子或现象？', '暗能量是常数还是随时间变化？', '大尺度上是否需要修改引力理论？', '观测如何区分不同理论模型？'],
      methods: [['引力透镜', '背景天体图像的畸变可以揭示不可见质量。'], ['膨胀历史', '超新星和距离测量用于追踪宇宙膨胀。'], ['结构增长', '聚集特征检验物质如何随时间响应引力。']],
      importance: '暗物质和暗能量共同主导标准宇宙组成，但二者都没有得到确定的微观解释。理解它们可能会改写基础物理。',
      figureCaption: '当前宇宙能量组成的近似比例；数值为标准宇宙学模型中的取整结果。',
    },
  },
  'machine-learning': {
    en: {
      eyebrow: 'Research interest 04', title: 'Machine Learning',
      summary: 'Machine learning can accelerate expensive calculations, detect patterns in large surveys, and help connect complex models with cosmological data.',
      definition: 'In cosmology, machine learning is most useful when it complements rather than replaces physical reasoning. Models can emulate simulations, classify astronomical objects, compress high-dimensional data, or support parameter inference, but they must be validated within a clearly defined domain.',
      questions: ['Can a model remain accurate outside its training set?', 'How should physical constraints be included?', 'Which uncertainties come from data and which from the model?', 'Can predictions remain interpretable and reproducible?'],
      methods: [['Training data', 'Simulations and observations provide examples with known structure.'], ['Learning', 'Algorithms identify a useful mapping or compressed representation.'], ['Validation', 'Held-out tests and physical checks determine where predictions are reliable.']],
      importance: 'Modern surveys and simulations produce more data than can be handled by repeated brute-force calculation. Carefully validated machine learning can make analysis faster without losing scientific accountability.',
      figureCaption: 'A responsible scientific machine-learning workflow: data, learning, prediction, and independent validation.',
    },
    zh: {
      eyebrow: '研究兴趣 04', title: '机器学习',
      summary: '机器学习可以加速昂贵计算、识别大规模巡天中的模式，并帮助复杂模型与宇宙学数据建立联系。',
      definition: '在宇宙学中，机器学习最有价值的方式是补充而不是取代物理推理。它可以近似模拟、分类天体、压缩高维数据或辅助参数推断，但必须在明确的适用域内接受验证。',
      questions: ['模型能否在训练集之外保持准确？', '如何把物理约束加入学习过程？', '哪些不确定性来自数据，哪些来自模型？', '预测能否保持可解释和可复现？'],
      methods: [['训练数据', '模拟和观测提供具有已知结构的样本。'], ['学习过程', '算法寻找有用的映射或压缩表示。'], ['独立验证', '留出测试和物理检查决定预测在哪些范围可靠。']],
      importance: '现代巡天和模拟产生的数据量远超重复暴力计算的承受范围。经过严格验证的机器学习可以提高分析速度，同时保留科学责任边界。',
      figureCaption: '负责任的科学机器学习流程：数据、学习、预测与独立验证。',
    },
  },
};

function TopicDiagram({ topic, locale }: { topic: TopicKey; locale: string }) {
  const zh = locale === 'zh';
  if (topic === 'cosmology') {
    const labels = zh ? ['早期宇宙', '微波背景', '最初恒星', '星系形成', '今天'] : ['Early Universe', 'CMB', 'First stars', 'Galaxies', 'Today'];
    return (
      <svg viewBox="0 0 820 300" role="img" aria-label={zh ? '宇宙演化时间线' : 'Cosmic history timeline'}>
        <defs><linearGradient id="timeline" x1="0" x2="1"><stop stopColor="#7dd3fc"/><stop offset=".52" stopColor="#c084fc"/><stop offset="1" stopColor="#fbbf24"/></linearGradient></defs>
        <path d="M72 150 H748" stroke="url(#timeline)" strokeWidth="8" strokeLinecap="round"/>
        {[72,240,410,580,748].map((x, i) => <g key={x}><circle cx={x} cy="150" r={i === 0 ? 25 : 17} fill="#0f1c2f" stroke={i === 4 ? '#fbbf24' : '#7dd3fc'} strokeWidth="4"/><text x={x} y={210} textAnchor="middle" className="svg-label">{labels[i]}</text></g>)}
        <circle cx="72" cy="150" r="47" fill="none" stroke="#7dd3fc" opacity=".25"/><path d="M155 113 C250 55 330 75 410 130 S590 230 705 112" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 8" opacity=".55"/>
      </svg>
    );
  }
  if (topic === 'large-scale-structure') {
    const nodes = [[100,80],[220,165],[335,65],[455,175],[585,85],[700,185],[340,230],[610,235]];
    const links = [[0,1],[0,2],[1,2],[1,6],[2,3],[2,4],[3,4],[3,6],[3,7],[4,5],[4,7],[5,7],[6,7]];
    return <svg viewBox="0 0 820 300" role="img" aria-label={zh ? '宇宙网示意图' : 'Cosmic web diagram'}><rect width="820" height="300" rx="24" fill="#071222"/>{links.map(([a,b],i)=><line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#67e8f9" strokeWidth="3" opacity=".38"/>)}{nodes.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i%3===0?22:13} fill="#f8fafc" opacity=".12"/><circle cx={x} cy={y} r={i%3===0?8:5} fill={i%3===0?'#fbbf24':'#7dd3fc'}/></g>)}<text x="70" y="270" className="svg-label-light">{zh?'空洞 · 纤维 · 晕':'voids · filaments · halos'}</text></svg>;
  }
  if (topic === 'dark-sector') {
    return <svg viewBox="0 0 820 300" role="img" aria-label={zh ? '宇宙能量组成饼图' : 'Cosmic energy budget'}><g transform="translate(210 150) rotate(-90)"><circle r="92" fill="none" stroke="#25334a" strokeWidth="42"/><circle r="92" fill="none" stroke="#8b5cf6" strokeWidth="42" strokeDasharray="393 185"/><circle r="92" fill="none" stroke="#38bdf8" strokeWidth="42" strokeDasharray="156 422" strokeDashoffset="-393"/><circle r="92" fill="none" stroke="#fbbf24" strokeWidth="42" strokeDasharray="29 549" strokeDashoffset="-549"/></g><g className="svg-legend"><circle cx="430" cy="95" r="7" fill="#8b5cf6"/><text x="450" y="101">{zh?'暗能量 约 68%':'Dark energy ≈ 68%'}</text><circle cx="430" cy="150" r="7" fill="#38bdf8"/><text x="450" y="156">{zh?'暗物质 约 27%':'Dark matter ≈ 27%'}</text><circle cx="430" cy="205" r="7" fill="#fbbf24"/><text x="450" y="211">{zh?'普通物质 约 5%':'Ordinary matter ≈ 5%'}</text></g></svg>;
  }
  const labels = zh ? ['模拟与观测', '训练', '快速预测', '物理验证'] : ['Simulation & data', 'Training', 'Prediction', 'Physics checks'];
  return <svg viewBox="0 0 820 300" role="img" aria-label={zh ? '科学机器学习流程' : 'Scientific machine-learning workflow'}>{labels.map((label,i)=>{const x=55+i*195;return <g key={label}><rect x={x} y="110" width="145" height="80" rx="16" className="pipeline-box"/><text x={x+72.5} y="155" textAnchor="middle" className="svg-label">{label}</text>{i<3&&<path d={`M${x+150} 150 H${x+185}`} className="pipeline-arrow"/>}</g>})}<path d="M702 205 C702 255 130 255 130 205" className="pipeline-feedback"/><text x="410" y="275" textAnchor="middle" className="svg-caption">{zh?'验证结果返回数据与模型设计':'validation informs data and model design'}</text></svg>;
}

export default function TopicPage({ topic }: { topic: TopicKey }) {
  const locale = useLocaleStore((state) => state.locale);
  const text = topics[topic][locale === 'zh' ? 'zh' : 'en'];
  const labels = locale === 'zh' ? { home: '返回主页', definition: '基本概念', questions: '核心问题', methods: '常用方法', importance: '为什么重要' } : { home: 'Back to home', definition: 'The basic picture', questions: 'Core questions', methods: 'Common methods', importance: 'Why it matters' };

  return (
    <article className="academic-frame topic-page">
      <div className="px-6 py-10 md:px-10 lg:px-16 lg:py-14">
        <Link href="/" className="topic-back"><ArrowLeft className="h-4 w-4" />{labels.home}</Link>
        <header className="topic-header">
          <p>{text.eyebrow}</p><h1>{text.title}</h1><div>{text.summary}</div>
        </header>
        <figure className="topic-figure"><TopicDiagram topic={topic} locale={locale}/><figcaption>{text.figureCaption}</figcaption></figure>
        <div className="topic-grid">
          <section className="topic-prose"><h2><BookOpen className="h-5 w-5"/>{labels.definition}</h2><p>{text.definition}</p></section>
          <section className="topic-prose"><h2><CircleDot className="h-5 w-5"/>{labels.questions}</h2><ul>{text.questions.map((q)=><li key={q}>{q}</li>)}</ul></section>
        </div>
        <section className="mt-10"><h2 className="section-title">{labels.methods}</h2><div className="method-grid">{text.methods.map(([name,desc])=><div key={name}><Telescope className="h-5 w-5"/><h3>{name}</h3><p>{desc}</p></div>)}</div></section>
        <section className="importance-panel"><h2>{labels.importance}</h2><p>{text.importance}</p></section>
      </div>
    </article>
  );
}
