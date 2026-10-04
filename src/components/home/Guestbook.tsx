'use client';

import { MessageCircle } from 'lucide-react';
import { useLocaleStore } from '@/lib/stores/localeStore';

export default function Guestbook() {
  const locale = useLocaleStore((state) => state.locale);

  return (
    <section id="guestbook" className="scroll-mt-28 border-t border-slate-200 pt-10 dark:border-slate-700">
      <h2 className="section-title">{locale === 'zh' ? '留言' : 'Guestbook'}</h2>
      <div className="academic-note mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">
            {locale === 'zh' ? '欢迎留下问题、想法或合作线索。' : 'Questions, ideas, and collaboration notes are welcome.'}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {locale === 'zh' ? '留言由 GitHub Discussions 托管。' : 'The guestbook is hosted with GitHub Discussions.'}
          </p>
        </div>
        <a className="guestbook-button" href="https://github.com/Lufei-lee/Lufei-lee.github.io/discussions/1" target="_blank" rel="noreferrer">
          <MessageCircle className="h-4 w-4" />
          {locale === 'zh' ? '进入留言板' : 'Open guestbook'}
        </a>
      </div>
    </section>
  );
}
