'use client';

import Image from '@/components/ui/ResponsiveImage';
import { usePathname } from 'next/navigation';

export default function CosmicCover() {
  const pathname = usePathname();
  if (pathname !== '/') return null;

  return (
    <section className="cosmic-cover" aria-labelledby="cosmic-cover-title">
      <Image
        className="cosmic-cover-image"
        src="/carina-nebula.png"
        alt="船底座星云：金色的星际云气与蓝色星空"
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
      />
      <div className="cosmic-cover-shade" aria-hidden="true" />
      <div className="cosmic-cover-copy">
        <h2 id="cosmic-cover-title" lang="en" aria-label="Our journey is the sea of stars"><span aria-hidden="true">𝒪𝓊𝓇 𝒿ℴ𝓊𝓇𝓃ℯ𝓎 𝒾𝓈</span>{' '}<span aria-hidden="true">𝓉𝒽ℯ 𝓈ℯ𝒶 ℴ𝒻 𝓈𝓉𝒶𝓇𝓈</span></h2>
      </div>
      <a className="cosmic-cover-enter" href="#home-content" aria-label="上滑或点击进入主页 · Scroll to enter">
        <svg width="44" height="28" viewBox="0 0 44 28" fill="none" aria-hidden="true">
          <path d="M5 5L22 22L39 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}
