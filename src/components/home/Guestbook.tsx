'use client';

import { useEffect, useRef } from 'react';
import { useLocaleStore } from '@/lib/stores/localeStore';

export default function Guestbook() {
  const containerRef = useRef<HTMLDivElement>(null);
  const locale = useLocaleStore((state) => state.locale);
  const giscusEnabled = process.env.NEXT_PUBLIC_GISCUS_ENABLED === 'true';

  useEffect(() => {
    if (!giscusEnabled) return;

    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', 'luffy-cosmology/luffy-cosmology.github.io');
    script.setAttribute('data-repo-id', 'R_kgDOU7LLLw');
    script.setAttribute('data-category', 'Announcements');
    script.setAttribute('data-category-id', 'DIC_kwDOU7LLL84DHAbn');
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', 'cosmology-guestbook');
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'dark_dimmed');
    script.setAttribute('data-lang', locale === 'zh' ? 'zh-CN' : 'en');
    script.setAttribute('data-loading', 'lazy');
    container.appendChild(script);
  }, [giscusEnabled, locale]);

  return (
    <section id="guestbook" className="scroll-mt-28 border-t border-white/10 pt-12">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300/75">Signals / Guestbook</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold text-white">
        {locale === 'zh' ? '向这片宇宙留下一个信号' : 'Leave a signal in this universe'}
      </h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-400">
        {locale === 'zh'
          ? '欢迎讨论宇宙学、数值模拟与科学计算。评论由 GitHub Discussions 托管并由我管理。'
          : 'Questions and conversations about cosmology, simulation, and scientific computing are welcome. Comments are hosted and moderated through GitHub Discussions.'}
      </p>
      {giscusEnabled ? (
        <div ref={containerRef} className="mt-8 min-h-48 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-6" />
      ) : (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-medium text-slate-100">
              {locale === 'zh' ? '访客留言板已开放' : 'The guestbook is open'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {locale === 'zh'
                ? '使用 GitHub 账号进入 Discussions，即可提问、留言或回应其他访客。'
                : 'Use a GitHub account to leave a message, ask a question, or reply to other visitors in Discussions.'}
            </p>
          </div>
          <a
            href="https://github.com/luffy-cosmology/luffy-cosmology.github.io/discussions/1"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex shrink-0 items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/15 sm:mt-0"
          >
            {locale === 'zh' ? '进入留言板 ↗' : 'Open guestbook ↗'}
          </a>
        </div>
      )}
    </section>
  );
}
