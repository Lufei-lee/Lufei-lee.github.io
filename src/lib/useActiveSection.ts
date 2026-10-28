'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Track the last section heading above the reading line, including deep links. */
export function useActiveSection(ids: string[], enabled = true) {
  const pathname = usePathname();
  const key = ids.join('|');
  const [current, setCurrent] = useState({ pathname: '', id: '' });

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = key.split('|').map(id => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
      let active = '';
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 150) active = section.id;
      }
      const last = sections.at(-1);
      if (last && last.getBoundingClientRect().top < window.innerHeight &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) active = last.id;
      setCurrent(previous => previous.pathname === pathname && previous.id === active ? previous : { pathname, id: active });
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
      observer.disconnect();
    };
  }, [key, pathname, enabled]);

  return enabled && current.pathname === pathname ? current.id : '';
}
