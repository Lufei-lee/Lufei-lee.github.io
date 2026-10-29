import { pageMetadata } from '@/lib/pageMetadata';
import TopicPage from '@/components/topics/LongArticle';
export const metadata = pageMetadata('/dark-matter-dark-energy/');

export default function DarkSectorPage() { return <TopicPage topic="dark-sector" />; }
