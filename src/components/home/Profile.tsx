'use client';

import { motion } from 'framer-motion';
import { Github, Orbit, Telescope } from 'lucide-react';
import type { SiteConfig } from '@/lib/config';
import { useMessages } from '@/lib/i18n/useMessages';

interface ProfileProps {
  author: SiteConfig['author'];
  social: SiteConfig['social'];
  features: SiteConfig['features'];
  researchInterests?: string[];
}

export default function Profile({ author, social, researchInterests }: ProfileProps) {
  const messages = useMessages();

  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="lg:sticky lg:top-28"
    >
      <div className="cosmic-panel overflow-hidden">
        <div className="relative h-36 border-b border-white/10 bg-[url('/cosmic-web-hero.png')] bg-cover bg-[75%_center]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#07101d] via-[#07101d]/20 to-transparent" />
          <div className="absolute bottom-4 left-5 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/30 bg-[#07101d]/85 font-serif text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur">
            LF
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.24em] text-cyan-300/80">
            Research profile
          </p>
          <h1 className="font-serif text-3xl font-semibold text-white">{author.name}</h1>
          <p className="mt-2 text-base text-cyan-100">{author.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{author.institution}</p>

          {researchInterests && researchInterests.length > 0 && (
            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                <Orbit className="h-4 w-4 text-amber-300" />
                {messages.profile.researchInterests}
              </div>
              <div className="flex flex-wrap gap-2">
                {researchInterests.map((interest) => (
                  <span key={interest} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
            {social.github && (
              <a
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            )}
            <a
              href="#guestbook"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-400 transition hover:text-white"
            >
              <Telescope className="h-4 w-4" />
              Guestbook
            </a>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
