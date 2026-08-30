import { getPortfolioContent } from '@/db/content';
import { PortfolioClient } from '@/components/portfolio-client';
import { cookies } from 'next/headers';
import type { Language } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [content, cookieStore] = await Promise.all([
    getPortfolioContent(false),
    cookies(),
  ]);
  const initialLanguage: Language =
    cookieStore.get('yuuta-language')?.value === 'vi' ? 'vi' : 'en';
  return (
    <PortfolioClient
      initialContent={content}
      initialLanguage={initialLanguage}
    />
  );
}
