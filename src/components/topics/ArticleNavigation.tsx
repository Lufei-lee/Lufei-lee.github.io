'use client';

import { useRef, useState } from 'react';
import { useActiveSection } from '@/lib/useActiveSection';

export type ArticleSection = { id: string; title: string; number?: string };

export default function ArticleNavigation({ sections, zh }: { sections: ArticleSection[]; zh: boolean }) {
  const active = useActiveSection(sections.map(section => section.id));
  const current = sections.find(section => section.id === active);
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const toggle = useRef<HTMLButtonElement>(null);
  const links = (mobile = false) => sections.map(section => (
    <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined}
      onClick={mobile ? () => { setOpen(false); toggle.current?.focus(); } : undefined}>
      {section.number && <span>{section.number}</span>}{section.title}
    </a>
  ));

  return <>
    <nav className="essay-toc" aria-label={zh ? '文章目录' : 'Article contents'}>
      <button type="button" className="essay-toc-toggle" aria-expanded={desktopOpen} aria-controls="article-desktop-contents" onClick={() => setDesktopOpen(!desktopOpen)}>
        <strong>{zh ? '本文内容' : 'ON THIS PAGE'}</strong><span aria-hidden="true">{desktopOpen ? '−' : '+'}</span>
      </button>
      <small>{zh ? '当前：' : 'Reading: '}{current?.title || (zh ? '导读' : 'Introduction')}</small>
      <div id="article-desktop-contents" className="essay-toc-links" hidden={!desktopOpen}>{links()}</div>
      <a className="essay-back-top" href="#article-top">{zh ? '↑ 返回顶部' : '↑ Back to top'}</a>
    </nav>
    <div className="article-mobile-tools" onKeyDown={event => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    }}>
      <nav id="article-mobile-contents" className="article-mobile-contents" hidden={!open} aria-label={zh ? '章节目录' : 'Chapter contents'}>
        {links(true)}
      </nav>
      <div className="article-mobile-bar">
        <button ref={toggle} type="button" aria-expanded={open} aria-controls="article-mobile-contents" onClick={() => setOpen(!open)}>
          <span>{zh ? (open ? '收起目录' : '展开目录') : (open ? 'Close contents' : 'Contents')}</span>
          <small aria-label={zh ? '当前章节' : 'Current chapter'}>{current ? `${current.number ? current.number + ' · ' : ''}${current.title}` : (zh ? '导读' : 'Introduction')}</small>
        </button>
        <a href="#article-top" onClick={() => setOpen(false)}>{zh ? '↑ 返回顶部' : '↑ Top'}</a>
      </div>
    </div>
  </>;
}
