'use client';

import { useLocaleStore } from '@/lib/stores/localeStore';

interface FooterProps {
  lastUpdated?: string;
  lastUpdatedByLocale?: Record<string, string | undefined>;
  defaultLocale?: string;
}

export default function Footer({ lastUpdated, lastUpdatedByLocale, defaultLocale = 'en' }: FooterProps) {
  const locale = useLocaleStore((state) => state.locale);
  const resolved = lastUpdatedByLocale?.[locale] || lastUpdatedByLocale?.[defaultLocale] || lastUpdated;

  return (
    <footer className="site-frame site-frame-footer">
      <div className="flex flex-col gap-2 px-6 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-10 lg:px-12">
        <span>© 2026 Lufei</span>
        <span>{locale === 'zh' ? `最近更新：${resolved || '2026年10月'}` : `Last updated: ${resolved || 'October 2026'}`}</span>
      </div>
    </footer>
  );
}
