'use client';

import { useMemo, useState } from 'react';
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
  const resolvedLocale = i18n.enabled ? locale : i18n.defaultLocale;
  const effectiveItems = useMemo(
    () => itemsByLocale?.[resolvedLocale] || itemsByLocale?.[i18n.defaultLocale] || items,
    [i18n.defaultLocale, items, itemsByLocale, resolvedLocale]
  );
  const fullTitle = siteTitleByLocale?.[resolvedLocale] || siteTitleByLocale?.[i18n.defaultLocale] || siteTitle;
  const shortTitle = fullTitle.split('·')[0].trim();

  return (
    <header className="site-frame site-frame-nav">
      <div className="flex h-20 items-center justify-between px-6 md:px-10 lg:px-12">
        <a href="/#about" className="font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {shortTitle}
        </a>

        <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary navigation">
          {effectiveItems.map((item, index) => (
            <a
              key={item.target}
              href={`/#${item.target}`}
              className={`nav-link ${index === 0 ? 'nav-link-active' : ''}`}
            >
              {item.title}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle i18n={i18n} />
          <ThemeToggle />
          <button className="nav-menu-button lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-200 px-6 py-3 dark:border-slate-700 lg:hidden" aria-label="Mobile navigation">
          {effectiveItems.map((item) => (
            <a key={item.target} href={`/#${item.target}`} className="block rounded-lg px-3 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              {item.title}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
