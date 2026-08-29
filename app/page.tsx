import { getPortfolioContent } from '@/db/content';
import { PortfolioClient } from '@/components/portfolio-client';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const content = await getPortfolioContent(false);
  return <PortfolioClient initialContent={content} />;
}
