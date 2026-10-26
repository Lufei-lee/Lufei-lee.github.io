import ResearchProse from './ResearchProse';
import { researchCopy } from './research-copy';

export default function BaoResearch({ zh }: { zh: boolean }) {
  return <aside className="academic-note mt-6" aria-labelledby="bao-research-title">
    <h3 id="bao-research-title" className="text-xl font-semibold">{zh ? '我的研究经历：能找到单个 BAO 外壳吗？' : 'My research: can we identify an individual BAO shell?'}</h3>
    <ResearchProse>{researchCopy.bao[zh ? 'zh' : 'en']}</ResearchProse>
  </aside>;
}
