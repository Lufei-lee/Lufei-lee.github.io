'use client';

import Image from 'next/image';
import { Github, Orbit } from 'lucide-react';
import type { SiteConfig } from '@/lib/config';
import { useLocaleStore } from '@/lib/stores/localeStore';

interface ProfileProps {
  author: SiteConfig['author'];
  social: SiteConfig['social'];
  features: SiteConfig['features'];
  researchInterests?: string[];
}

export default function Profile({ author, social, researchInterests }: ProfileProps) {
  const locale = useLocaleStore((state) => state.locale);

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="profile-image">
        <Image
          src={author.avatar}
          alt={locale === 'zh' ? '宇宙网与黑洞图像' : 'Cosmic web and black hole'}
          width={640}
          height={640}
          className="h-full w-full object-cover object-[62%_center]"
          priority
        />
        <div className="profile-image-label">COSMOLOGY</div>
      </div>

      <div className="mt-7 text-center">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{author.name}</h2>
        <p className="mt-3 text-lg font-medium text-amber-600 dark:text-amber-300">{author.title}</p>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{author.institution}</p>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        {social.github && (
          <a className="profile-icon" href={social.github as string} target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github className="h-5 w-5" />
          </a>
        )}
        <a className="profile-icon" href="#research" aria-label={locale === 'zh' ? '研究兴趣' : 'Research interests'}>
          <Orbit className="h-5 w-5" />
        </a>
      </div>

      {researchInterests && researchInterests.length > 0 && (
        <div className="interest-panel mt-7">
          <h3>{locale === 'zh' ? '研究兴趣' : 'Research Interests'}</h3>
          <ul>{researchInterests.map((interest) => <li key={interest}>{interest}</li>)}</ul>
        </div>
      )}
    </aside>
  );
}
