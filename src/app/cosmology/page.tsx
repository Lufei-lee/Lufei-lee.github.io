import { pageMetadata } from '@/lib/pageMetadata';
import TopicPage from '@/components/topics/LongArticle';
export const metadata = pageMetadata('/cosmology/');

export default function CosmologyPage() { return <TopicPage topic="cosmology" />; }
