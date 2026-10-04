'use client';

import Profile from '@/components/home/Profile';
import Guestbook from '@/components/home/Guestbook';
import type { SiteConfig } from '@/lib/config';
import type { Publication } from '@/types/publication';
import type { CardPageConfig, PublicationPageConfig, TextPageConfig } from '@/types/page';
import { useLocaleStore } from '@/lib/stores/localeStore';

interface SectionConfig {
  id: string;
  type: 'markdown' | 'publications' | 'list';
  title?: string;
  source?: string;
  filter?: string;
  limit?: number;
  content?: string;
  publications?: Publication[];
  items?: Array<{ date: string; content: string }>;
}

type PageData =
  | { type: 'about'; id: string; sections: SectionConfig[] }
  | { type: 'publication'; id: string; config: PublicationPageConfig; publications: Publication[] }
  | { type: 'text'; id: string; config: TextPageConfig; content: string }
  | { type: 'card'; id: string; config: CardPageConfig };

export interface HomePageLocaleData {
  author: SiteConfig['author'];
  social: SiteConfig['social'];
  features: SiteConfig['features'];
  enableOnePageMode?: boolean;
  researchInterests?: string[];
  pagesToShow: PageData[];
}

interface HomePageClientProps {
  dataByLocale: Record<string, HomePageLocaleData>;
  defaultLocale: string;
}

const copy = {
  zh: {
    about: '关于',
    intro: [
      '你好，我是 Lufei。我的兴趣集中在宇宙学、引力与宇宙大尺度结构，并关注理论预测如何与数值计算和观测数据相互连接。',
      '这个主页用于整理我的研究兴趣、学术经历与公开笔记。随着内容完善，我会在这里补充论文、报告和其他可以公开的材料。',
    ],
    interests: '研究兴趣',
    interestLead: '这些方向构成了我理解宇宙演化的主要视角。',
    areas: [
      { title: '宇宙学', description: '从整体上研究宇宙的起源、组成、演化与未来。', href: '/cosmology/' },
      { title: '宇宙大尺度结构', description: '研究物质在宇宙尺度上的分布、增长与统计特征。', href: '/large-scale-structure/' },
      { title: '暗物质与暗能量', description: '理解不可见质量、结构形成与宇宙加速膨胀。', href: '/dark-matter-dark-energy/' },
      { title: '机器学习', description: '用可验证的学习方法连接复杂计算与宇宙学数据。', href: '/machine-learning/' },
    ],
    profile: '学术概况',
    profileText: '研究方向以宇宙学为核心，涉及理论建模、数值计算与数据分析。教育背景、单位和正式成果将在确认公开信息后补充。',
  },
  en: {
    about: 'About',
    intro: [
      'Hello, I am Lufei. My interests center on cosmology, gravity, and the large-scale structure of the Universe, with particular attention to the links between theory, numerical calculation, and observation.',
      'This website collects my research interests, academic background, and public notes. Papers, talks, and other materials will be added as they are ready to share.',
    ],
    interests: 'Research Interests',
    interestLead: 'These themes shape how I approach the evolution of the Universe.',
    areas: [
      { title: 'Cosmology', description: 'The origin, composition, evolution, and possible future of the Universe.', href: '/cosmology/' },
      { title: 'Large-scale Structure', description: 'The distribution, growth, and statistical description of matter on cosmic scales.', href: '/large-scale-structure/' },
      { title: 'Dark Matter & Dark Energy', description: 'Invisible mass, structure formation, and the accelerated expansion of the Universe.', href: '/dark-matter-dark-energy/' },
      { title: 'Machine Learning', description: 'Validated learning methods that connect complex calculations with cosmological data.', href: '/machine-learning/' },
    ],
    profile: 'Academic Profile',
    profileText: 'My work is centered on cosmology and spans theoretical modelling, numerical computation, and data analysis. Education, affiliation, and formal outputs will be added once the public details are confirmed.',
  },
};

export default function HomePageClient({ dataByLocale, defaultLocale }: HomePageClientProps) {
  const locale = useLocaleStore((state) => state.locale);
  const fallback = dataByLocale[defaultLocale] || Object.values(dataByLocale)[0];
  const data = dataByLocale[locale] || fallback;
  const text = locale === 'zh' ? copy.zh : copy.en;

  if (!data) return null;

  return (
    <div className="academic-frame">
      <div className="grid gap-12 px-6 py-10 md:px-10 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-16 lg:px-12 lg:py-14">
        <Profile author={data.author} social={data.social} features={data.features} researchInterests={data.researchInterests} />

        <div className="min-w-0 space-y-12">
          <section id="about" className="scroll-mt-28">
            <h1 className="section-title">{text.about}</h1>
            <div className="mt-6 space-y-5 text-[1.05rem] leading-8 text-slate-600 dark:text-slate-300">
              {text.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>

          <section id="research" className="scroll-mt-28">
            <div className="mb-6">
              <h2 className="section-title">{text.interests}</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">{text.interestLead}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {text.areas.map((area, index) => (
                <a key={area.title} href={area.href} className="research-card group">
                  <span className="orbit-index">0{index + 1}</span>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <span className="research-card-link">{locale === 'zh' ? '阅读科普介绍' : 'Read the introduction'}</span>
                </a>
              ))}
            </div>
          </section>

          <section id="cv" className="scroll-mt-28">
            <h2 className="section-title">{text.profile}</h2>
            <div className="academic-note mt-6"><p>{text.profileText}</p></div>
          </section>

          <Guestbook />
        </div>
      </div>
    </div>
  );
}
