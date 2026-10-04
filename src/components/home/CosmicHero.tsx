'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLocaleStore } from '@/lib/stores/localeStore';

export default function CosmicHero() {
  const locale = useLocaleStore((state) => state.locale);
  const zh = locale === 'zh';

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#030812]">
      <Image
        src="/cosmic-web-hero.png"
        alt="暗物质宇宙网与黑洞引力透镜的艺术化科学可视化"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[64%_center] opacity-75"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#030812_0%,rgba(3,8,18,.92)_34%,rgba(3,8,18,.2)_72%,rgba(3,8,18,.55)_100%)]" />
      <div className="absolute inset-0 cosmic-grid opacity-40" />

      <div className="relative mx-auto grid min-h-[600px] max-w-7xl content-end px-5 pb-16 pt-32 sm:px-8 lg:min-h-[680px] lg:px-10 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="max-w-3xl"
        >
          <div className="mb-7 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.24em] text-cyan-200/80">
            <span className="h-px w-9 bg-cyan-300/70" />
            Cosmology · Simulation · Emulation
          </div>
          <h2 className="text-balance font-serif text-5xl font-semibold leading-[1.03] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
            {zh ? '在不可见的宇宙里，寻找可检验的结构。' : 'Finding testable structure in the invisible universe.'}
          </h2>
          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-300 sm:text-xl">
            {zh
              ? '从动态暗能量与谱等效映射，到快速宇宙学模拟器和独立 N-body 验证。'
              : 'From dynamical dark energy and spectral equivalence to fast cosmology emulators and independent N-body validation.'}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#research" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">
              {zh ? '查看研究' : 'Explore research'}
            </a>
            <a href="#guestbook" className="rounded-full border border-white/20 bg-black/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:border-cyan-200/50 hover:bg-white/10">
              {zh ? '留下信号' : 'Leave a signal'}
            </a>
          </div>
        </motion.div>

        <div className="mt-14 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md">
          {[
            ['01', zh ? '物理映射' : 'Physical mapping'],
            ['02', zh ? '快速模拟' : 'Fast emulation'],
            ['03', zh ? '独立验证' : 'Independent validation'],
          ].map(([number, label]) => (
            <div key={number} className="bg-[#07101d]/75 px-4 py-4 sm:px-5">
              <div className="font-mono text-xs text-amber-300">{number}</div>
              <div className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
