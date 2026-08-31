import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PortfolioClient } from '@/components/portfolio-client';
import type { Language, PortfolioContent } from '@/lib/types';
import { apiUrl, normalizeContent } from '@/src/api';
import { defaultContent } from '@/src/default-content';
import '@/app/globals.css';
import '@/app/portfolio.css';

function currentLanguage(): Language {
  const match = document.cookie.match(/(?:^|; )yuuta-language=(en|vi)(?:;|$)/);
  return match?.[1] === 'vi' ? 'vi' : 'en';
}

function PublicApp() {
  const [content, setContent] = useState<PortfolioContent>(() =>
    normalizeContent(defaultContent),
  );
  const [language] = useState<Language>(currentLanguage);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl('/api/content'), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Content request failed');
        return response.json() as Promise<PortfolioContent>;
      })
      .then((next) => setContent(normalizeContent(next)))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError'))
          console.warn('Using the cached portfolio content.');
      });
    return () => controller.abort();
  }, []);

  return <PortfolioClient initialContent={content} initialLanguage={language} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PublicApp />
  </StrictMode>,
);
