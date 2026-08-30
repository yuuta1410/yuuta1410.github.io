import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import './globals.css';
import './portfolio.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim();
  const requestHost =
    forwardedHost ?? requestHeaders.get('host') ?? 'localhost:3000';
  const safeHost = /^[a-z0-9.-]+(?::\d+)?$/i.test(requestHost)
    ? requestHost
    : 'localhost:3000';
  const forwardedProtocol = requestHeaders
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim();
  const protocol =
    forwardedProtocol === 'https' || forwardedProtocol === 'http'
      ? forwardedProtocol
      : safeHost.startsWith('localhost')
        ? 'http'
        : 'https';

  return {
    metadataBase: new URL(`${protocol}://${safeHost}`),
    title: 'Yuuta — Motion Designer',
    description:
      'Portfolio of Võ Gia Huy (Yuuta), a motion designer based in Vietnam.',
    openGraph: {
      title: 'Yuuta — Motion Designer',
      description:
        'Motion graphics, MV edits and AI-powered visual stories by Võ Gia Huy (Yuuta).',
      type: 'website',
      images: [
        {
          url: '/og.png',
          width: 1200,
          height: 630,
          alt: 'Yuuta — Motion Designer',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Yuuta — Motion Designer',
      description:
        'Motion graphics, MV edits and AI-powered visual stories by Võ Gia Huy (Yuuta).',
      images: ['/og.png'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const language =
    cookieStore.get('yuuta-language')?.value === 'vi' ? 'vi' : 'en';
  return (
    <html lang={language}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
