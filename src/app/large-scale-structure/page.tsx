import { pageMetadata } from '@/lib/pageMetadata';
export const metadata = pageMetadata('/cosmology/');
import TopicPage from '@/components/topics/LongArticle';

export default function LargeScaleStructurePage() { return <TopicPage topic="cosmology" />; }
