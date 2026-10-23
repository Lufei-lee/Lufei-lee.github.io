'use client';

import Profile from '@/components/home/Profile';
import Guestbook from '@/components/home/Guestbook';
import Image from 'next/image';
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
      '你好，我是 Lufei。我的兴趣涵盖宇宙学与大尺度结构、暗物质与暗能量、机器学习，以及金融市场与数字资产。我喜欢用模型、数据和可检验的证据理解复杂系统。',
      '这个主页用于整理我的研究兴趣、学术经历与公开笔记。随着内容完善，我会在这里补充论文、报告和其他可以公开的材料。',
    ],
    interests: '研究与探索',
    interestLead: '从宇宙的演化到模型的学习，再到市场的信息与风险。四条阅读路线，连接直觉、公式与经典文献。',
    areas: [
      { title: '宇宙学与大尺度结构', description: '从热大爆炸、宇宙膨胀到引力塑造的宇宙网。', href: '/cosmology/', image: '/topics/expansion.svg' },
      { title: '暗物质与暗能量', description: '理解不可见质量、结构形成与宇宙加速膨胀。', href: '/dark-matter-dark-energy/', image: '/topics/dark-matter-dark-energy.webp' },
      { title: '机器学习', description: '理解神经网络、梯度优化、泛化与科学验证。', href: '/machine-learning/', image: '/topics/learning.svg' },
      { title: '金融市场与数字资产', description: '探索股票、组合风险、市场效率与加密网络。', href: '/finance/', image: '/topics/markets.svg' },
    ],
    profile: '学术概况',
    profileText: '研究方向以宇宙学为核心，涉及理论建模、数值计算与数据分析。教育背景、单位和正式成果将在确认公开信息后补充。',
  },
  en: {
    about: 'About',
    intro: [
      'Hello, I am Lufei. My interests span cosmology and large-scale structure, dark matter and dark energy, machine learning, and financial markets and digital assets. I enjoy understanding complex systems through models, data, and testable evidence.',
      'This website collects my research interests, academic background, and public notes. Papers, talks, and other materials will be added as they are ready to share.',
    ],
    interests: 'Research & Exploration',
    interestLead: 'From cosmic evolution to learning systems and market dynamics. Four reading routes connecting intuition, equations, and classic papers.',
    areas: [
      { title: 'Cosmology & Large-scale Structure', description: 'From the hot Big Bang and expansion to the gravitational cosmic web.', href: '/cosmology/', image: '/topics/expansion.svg' },
      { title: 'Dark Matter & Dark Energy', description: 'Invisible mass, structure formation, and the accelerated expansion of the Universe.', href: '/dark-matter-dark-energy/', image: '/topics/dark-matter-dark-energy.webp' },
      { title: 'Machine Learning', description: 'Neural networks, gradient optimization, generalization, and scientific validation.', href: '/machine-learning/', image: '/topics/learning.svg' },
      { title: 'Financial Markets & Digital Assets', description: 'Stocks, portfolio risk, market efficiency, and crypto networks.', href: '/finance/', image: '/topics/markets.svg' },
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
                  <div className="research-card-media"><Image src={area.image} alt="" width={800} height={450} sizes="(max-width: 640px) 100vw, 430px" /></div>
                  <span className="orbit-index">0{index + 1}</span>
                  <div className="research-card-body">
                    <h3>{area.title}</h3>
                    <p>{area.description}</p>
                    <span className="research-card-link">{locale === 'zh' ? '阅读长文 · 图解 / 公式 / 经典文献 →' : 'Read the essay · diagrams / equations / classics →'}</span>
                  </div>
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
