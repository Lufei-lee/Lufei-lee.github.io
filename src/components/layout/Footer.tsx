'use client';

import { useEffect, useState } from 'react';
import { useLocaleStore } from '@/lib/stores/localeStore';

// First success status of the earliest GitHub Pages deployment (6839699238).
// https://api.github.com/repos/Lufei-lee/Lufei-lee.github.io/deployments/6839699238/statuses
// 2026-10-04 10:16:37 UTC = 2026-10-04 18:16:37 Beijing time.
const LAUNCHED_AT = '2026-10-04T10:16:37Z';

interface FooterProps {
  lastUpdated?: string;
  lastUpdatedByLocale?: Record<string, string | undefined>;
  defaultLocale?: string;
}

export default function Footer({ lastUpdated, lastUpdatedByLocale, defaultLocale = 'en' }: FooterProps) {
  const locale = useLocaleStore((state) => state.locale);
  const zh = locale === 'zh';
  const resolved = lastUpdatedByLocale?.[locale] || lastUpdatedByLocale?.[defaultLocale] || lastUpdated || '2026-10-26';
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - Date.parse(LAUNCHED_AT)) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = seconds === null ? '—' : zh
    ? `${Math.floor(seconds / 86400)} 天 ${String(Math.floor(seconds / 3600) % 24).padStart(2, '0')} 时 ${String(Math.floor(seconds / 60) % 60).padStart(2, '0')} 分 ${String(seconds % 60).padStart(2, '0')} 秒`
    : `${Math.floor(seconds / 86400)}d ${String(Math.floor(seconds / 3600) % 24).padStart(2, '0')}h ${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}m ${String(seconds % 60).padStart(2, '0')}s`;

  return (
    <footer className="site-frame site-frame-footer">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5 text-sm text-slate-500 dark:text-slate-400 md:px-10 lg:px-12">
        <span>© 2026 Lufei</span>
        <span>{zh ? '最近更新：' : 'Last updated: '}<time dateTime={resolved}>{resolved}</time></span>
        <span aria-live="off" className="tabular-nums" title={zh ? '自北京时间 2026-10-04 18:16:37 首次成功上线起计时，表示上线后经过的时间' : 'Elapsed time since the first successful launch: 2026-10-04 18:16:37 Beijing time (UTC+8)'}>{zh ? '网站已运行：' : 'Online for: '}{elapsed} <a href="https://github.com/Lufei-lee/Lufei-lee.github.io/actions/runs/37194806889" target="_blank" rel="noopener noreferrer" className="ml-2 underline underline-offset-4">{zh?'上线记录 ↗':'Launch record ↗'}</a></span>
      </div>
    </footer>
  );
}
