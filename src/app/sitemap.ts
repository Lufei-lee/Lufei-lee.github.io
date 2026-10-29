import type { MetadataRoute } from 'next';
import { pageInfo, siteUrl } from '@/lib/pageMetadata';
import { getConfig } from '@/lib/config';
export const dynamic='force-static';
export default function sitemap():MetadataRoute.Sitemap {
 const paths=new Set([...Object.keys(pageInfo),...getConfig().navigation.filter(n=>n.type==='page'&&n.target!=='about').map(n=>`/${n.target}/`)]);
 return [...paths].filter(p=>p!=='/large-scale-structure/').map(path=>({url:siteUrl+path}));
}
