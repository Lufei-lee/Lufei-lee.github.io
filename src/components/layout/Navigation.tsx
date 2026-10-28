'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveSection } from '@/lib/useActiveSection';
import { Menu, X } from 'lucide-react';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { SiteConfig } from '@/lib/config';
import type { I18nRuntimeConfig } from '@/types/i18n';
import { useLocaleStore } from '@/lib/stores/localeStore';

interface NavigationProps {
  items: SiteConfig['navigation'];
  siteTitle: string;
  enableOnePageMode?: boolean;
  i18n: I18nRuntimeConfig;
  itemsByLocale?: Record<string, SiteConfig['navigation']>;
  siteTitleByLocale?: Record<string, string>;
}

export default function Navigation({ items, siteTitle, i18n, itemsByLocale, siteTitleByLocale }: NavigationProps) {
  const [open, setOpen] = useState(false);
  const locale = useLocaleStore((state) => state.locale);
  const zh = locale === 'zh';
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  const resolvedLocale = i18n.enabled ? locale : i18n.defaultLocale;
  const effectiveItems = useMemo(
    () => itemsByLocale?.[resolvedLocale] || itemsByLocale?.[i18n.defaultLocale] || items,
    [i18n.defaultLocale, items, itemsByLocale, resolvedLocale]
  );
  const fullTitle = siteTitleByLocale?.[resolvedLocale] || siteTitleByLocale?.[i18n.defaultLocale] || siteTitle;
  const shortTitle = fullTitle.split('·')[0].trim();
  const section = useActiveSection(effectiveItems.map(item => item.target), pathname === '/');
  const active = pathname === '/' ? section : ['/cosmology', '/dark-matter-dark-energy', '/machine-learning', '/finance', '/large-scale-structure'].includes(pathname.replace(/\/$/, '')) ? 'research' : '';

  return (
    <header id="home-content" className="site-frame site-frame-nav">
      <div className="flex h-20 items-center justify-between px-6 md:px-10 lg:px-12">
        <Link href="/#about" className="font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {shortTitle}
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" aria-label={zh ? '主导航' : 'Primary navigation'}>
          {effectiveItems.map((item) => (
            <Link
              key={item.target}
              href={`/#${item.target}`}
              className={`nav-link ${active === item.target ? 'nav-link-active' : ''}`}
              aria-current={active === item.target ? 'location' : undefined}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle i18n={i18n} />
          <ThemeToggle />
          <button ref={menuButton} type="button" className="nav-menu-button lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={zh ? (open ? '收起导航菜单' : '展开导航菜单') : (open ? 'Close navigation menu' : 'Open navigation menu')}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

        <nav id="mobile-navigation" hidden={!open} className="mobile-navigation border-t border-slate-200 px-6 py-3 dark:border-slate-700 lg:hidden" aria-label={zh ? '手机导航，选择栏目后自动收起' : 'Mobile navigation; closes after selecting a section'} onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); menuButton.current?.focus(); } }}>
          <p className="mb-2 px-3 text-xs text-slate-500 dark:text-slate-400">{zh ? '选择栏目跳转，当前阅读位置已标记。' : 'Choose a section. Your current reading position is highlighted.'}</p>
          {effectiveItems.map((item) => (
            <Link key={item.target} href={`/#${item.target}`} aria-current={active === item.target ? 'location' : undefined} className={`nav-link block ${active === item.target ? 'nav-link-active' : ''}`} onClick={() => { setOpen(false); menuButton.current?.focus(); }}>
              {item.title}
            </Link>
          ))}
        </nav>
    </header>
  );
}
