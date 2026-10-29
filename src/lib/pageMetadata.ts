import type { Metadata } from 'next';
export const siteUrl='https://lufei-lee.github.io';
export const pageInfo:Record<string,{title:string;description:string}>={
 '/':{title:'Lufei · Cosmology',description:'Lufei 的个人主页：宇宙学、暗物质与暗能量、机器学习和科研笔记。Cosmology, dark matter and energy, machine learning, and research notes.'},
 '/cosmology/':{title:'宇宙学与大尺度结构 · Cosmology',description:'从热大爆炸、宇宙膨胀到引力塑造的宇宙网，结合图解、公式与经典文献理解宇宙演化。Explore cosmic expansion, structure formation and the cosmic web.'},
 '/dark-matter-dark-energy/':{title:'暗物质与暗能量 · Dark Matter & Dark Energy',description:'从星系旋转、引力透镜和宇宙加速膨胀认识暗物质与暗能量，并了解相关实验与研究方法。Evidence, experiments and cosmological models.'},
 '/machine-learning/':{title:'机器学习 · Machine Learning',description:'理解神经网络、梯度优化、泛化与科学验证，结合图解和公式学习机器学习的基本方法。Neural networks, optimization, generalization and scientific validation.'},
 '/finance/':{title:'金融市场与数字资产 · Financial Markets',description:'探索股票、组合风险、市场效率与加密网络，以图解和文献理解金融市场的基本概念。Portfolio risk, market efficiency and digital assets.'},
 '/cv/':{title:'个人简历 · CV',description:'Lufei 的教育背景、研究经历与学术兴趣。Education, research experience and academic interests.'},
};
export function pageMetadata(path:string, fallback?:{title:string;description?:string}):Metadata {
 const info=pageInfo[path]??{title:fallback?.title??'Lufei',description:fallback?.description??pageInfo['/'].description};
 const title=path==='/'?info.title:`${info.title} | Lufei`;
 const url=siteUrl+path;
 const images=[{url:siteUrl+'/optimized/share.jpg',width:1200,height:630,alt:'Lufei · Cosmology — Carina Nebula'}];
 return {title:{absolute:title},description:info.description,alternates:{canonical:url},openGraph:{type:path==='/'?'website':'article',title,description:info.description,url,siteName:'Lufei',images},twitter:{card:'summary_large_image',title,description:info.description,images:images.map(i=>i.url)}};
}
