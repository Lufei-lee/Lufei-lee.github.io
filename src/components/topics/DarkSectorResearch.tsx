import Image from '@/components/ui/ResponsiveImage';
import katex from 'katex';
import ResearchProse from './ResearchProse';
import { researchCopy } from './research-copy';

export default function DarkSectorResearch({ zh }: { zh: boolean }) {
  const lang = zh ? 'zh' : 'en';
  return <>
    <section id="pandax">
      <p className="reading-kicker">09</p>
      <h2>{zh ? '在锦屏山下，等待暗物质的轻轻一碰' : 'PandaX: listening for a tiny collision beneath Jinping'}</h2>
      <ResearchProse>{researchCopy.pandax[lang]}</ResearchProse>
      <figure className="essay-secondary">
        <a href="/topics/pandax-20t.png" target="_blank" rel="noreferrer" className="figure-surface"><Image src="/topics/pandax-20t.png" width={1280} height={642} unoptimized alt={zh ? 'PandaX-20T 地下实验设施布局示意图，展示水屏蔽、时间投影室和低温纯化系统' : 'PandaX-20T facility layout showing water shielding, the time projection chamber and supporting systems'} /></a>
        <figcaption>{zh ? 'PandaX-20T 设施布局示意图。水屏蔽包围核心探测器，低温、纯化等系统共同维持安静而稳定的探测环境。' : 'PandaX-20T facility layout. Water shielding surrounds the central detector, supported by cryogenic and purification systems.'}<br/><a href="https://pandax.sjtu.edu.cn/node/499" target="_blank" rel="noreferrer">{zh ? '图片：PandaX 合作组，2026 年升级公告（原图）' : 'Image: PandaX Collaboration, 2026 upgrade announcement (unmodified)'}</a></figcaption>
      </figure>
      <p><a href="https://pandax.sjtu.edu.cn/" target="_blank" rel="noopener noreferrer">{zh ? 'PandaX 官方网站 ↗' : 'PandaX official website ↗'}</a></p>
    </section>
    <section id="my-dark-energy-research">
      <p className="reading-kicker">10</p>
      <h2>{zh ? '我的研究：让更多暗能量模型算得更快' : 'My research: faster predictions for a wider range of dark-energy models'}</h2>
      <ResearchProse>{researchCopy.de_intro[lang]}</ResearchProse>
      <figure className="equation-card"><div className="math-scroll" tabIndex={0} aria-label={zh ? '动态暗能量状态方程' : 'Dynamical dark-energy equation of state'} dangerouslySetInnerHTML={{ __html: katex.renderToString(String.raw`w(a)=w_0+(1-a)w_a.`, { displayMode: true, throwOnError: true, trust: false, output: 'htmlAndMathml' }) }} /></figure>
      <ResearchProse>{researchCopy.de_before[lang]}</ResearchProse>
      <figure className="essay-secondary">
        <a href="/topics/dark-energy-equivalent-models.png" target="_blank" rel="noreferrer" className="figure-surface paper">
          <Image src="/topics/dark-energy-equivalent-models.png" width={1132} height={934} unoptimized alt={zh ? '动态暗能量参数空间：灰色 CSST 插值器覆盖区域、蓝色 DESI DR2+CMB 约束、九个 DDE 目标模型和不同红移的等效参数位置' : 'Dark-energy parameter space: grey CSST emulator coverage, blue DESI DR2+CMB constraints, nine DDE target models and equivalent parameter positions at different redshifts'} />
        </a>
        <figcaption>{zh ? '研究配图：灰色区域为 CSST 插值器的直接覆盖范围，蓝色为图中采用的 DESI DR2+CMB 约束。下方彩色圆点和黑色星号标出 DDE 目标模型，上方随色条变化的标记表示不同红移 z 的等效参数位置。点击可查看原图。' : 'Research figure: grey denotes direct CSST emulator coverage; blue shows the DESI DR2+CMB constraints used in the figure. Coloured dots and the black star below mark DDE targets; the upper markers follow the colour bar to indicate equivalent parameters at different redshifts z. Click to view the original image.'}</figcaption>
      </figure>
      <ResearchProse>{researchCopy.de_after[lang]}</ResearchProse>
    </section>
  </>;
}
