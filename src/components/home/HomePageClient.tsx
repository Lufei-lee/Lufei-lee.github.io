'use client';

import Profile from '@/components/home/Profile';
import About from '@/components/home/About';
import SelectedPublications from '@/components/home/SelectedPublications';
import News, { NewsItem } from '@/components/home/News';
import CosmicHero from '@/components/home/CosmicHero';
import Guestbook from '@/components/home/Guestbook';
import PublicationsList from '@/components/publications/PublicationsList';
import TextPage from '@/components/pages/TextPage';
import CardPage from '@/components/pages/CardPage';
import type { SiteConfig } from '@/lib/config';
import { Publication } from '@/types/publication';
import { CardPageConfig, PublicationPageConfig, TextPageConfig } from '@/types/page';
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
  items?: NewsItem[];
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

export default function HomePageClient({ dataByLocale, defaultLocale }: HomePageClientProps) {
  const locale = useLocaleStore((state) => state.locale);
  const fallback = dataByLocale[defaultLocale] || Object.values(dataByLocale)[0];
  const data = dataByLocale[locale] || fallback;

  if (!data) return null;

  return (
    <>
      <CosmicHero />
      <div className="cosmic-shell">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16">
            <Profile
              author={data.author}
              social={data.social}
              features={data.features}
              researchInterests={data.researchInterests}
            />

            <div className="space-y-16">
              {data.pagesToShow.map((page) => (
                <section key={page.id} id={page.id} className="scroll-mt-28 space-y-10">
                  {page.type === 'about' && page.sections.map((section) => {
                    if (section.type === 'markdown') {
                      return <About key={section.id} content={section.content || ''} title={section.title} />;
                    }
                    if (section.type === 'publications') {
                      return (
                        <SelectedPublications
                          key={section.id}
                          publications={section.publications || []}
                          title={section.title}
                          enableOnePageMode={data.enableOnePageMode}
                        />
                      );
                    }
                    if (section.type === 'list') {
                      return <News key={section.id} items={section.items || []} title={section.title} />;
                    }
                    return null;
                  })}
                  {page.type === 'publication' && <PublicationsList config={page.config} publications={page.publications} embedded />}
                  {page.type === 'text' && <TextPage config={page.config} content={page.content} embedded />}
                  {page.type === 'card' && <CardPage config={page.config} embedded />}
                </section>
              ))}
              <Guestbook />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
