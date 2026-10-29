import { pageMetadata } from '@/lib/pageMetadata';
import LongArticle from '@/components/topics/LongArticle';
export const metadata = pageMetadata('/finance/');
export default function FinancePage(){return <LongArticle topic="finance"/>;}
