import { pageMetadata } from '@/lib/pageMetadata';
import TopicPage from '@/components/topics/LongArticle';
export const metadata = pageMetadata('/machine-learning/');

export default function MachineLearningPage() { return <TopicPage topic="machine-learning" />; }
