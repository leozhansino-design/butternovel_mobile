// src/app/layout.tsx
import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'  // ⚠️ 暂时禁用 Google Fonts（网络限制）
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import ClientHeaderWrapper from '@/components/shared/ClientHeaderWrapper'
import ConditionalHeader from '@/components/shared/ConditionalHeader'
import LazyAnalytics from '@/components/LazyAnalytics'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'),

  title: {
    default: 'ButterNovel - Free Novels Online | Read Web Novels Free',
    template: '%s | ButterNovel',
  },

  // SEO optimized description with brand variations
  description: 'ButterNovel (Butter Novel) - Read millions of free novels online. Discover fantasy, romance, sci-fi, adventure and more web novels. Join our community of readers and writers at butternovel.com.',

  keywords: [
    // Brand variations (CRITICAL for Google recognition)
    'butternovel',
    'butter novel',
    'butter-novel',
    'butternovel.com',
    'butter novel website',
    'butter novel app',
    // Core keywords
    'free novels',
    'free novels online',
    'read novels online',
    'read novels free',
    'read free novels',
    'web novels',
    'online novels',
    'free web novels',
    'light novels',
    // Genre keywords
    'fantasy novels',
    'romance novels',
    'sci-fi novels',
    'adventure novels',
    'mystery novels',
    'action novels',
    // Long-tail keywords
    'free novel reading website',
    'best free novel site',
    'read light novels free',
    'free story reading',
    'novel reading platform',
    'free online book reading',
  ],

  authors: [{ name: 'ButterNovel' }],

  creator: 'ButterNovel',
  publisher: 'ButterNovel',

  // Additional metadata for better SEO
  applicationName: 'ButterNovel',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  category: 'literature',

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ButterNovel',
    title: 'ButterNovel - Free Novels Online | Butter Novel',
    description: 'ButterNovel (Butter Novel) - Read millions of free novels online. Fantasy, romance, sci-fi, adventure and more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ButterNovel - Free Novels Online',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@butternovel',
    creator: '@butternovel',
    title: 'ButterNovel - Free Novels Online',
    description: 'Read millions of free novels online. Fantasy, romance, sci-fi, and more.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  manifest: '/site.webmanifest',

  // Canonical URL
  alternates: {
    canonical: 'https://butternovel.com',
  },

  verification: {
    google: 'your-google-verification-code',
  },
}

/**
 * Root Layout
 *
 * ⚡ CRITICAL FIX: Removed server-side `await auth()` call
 *
 * Previously: Used HeaderWrapper which called `await auth()`
 * - This forced ALL pages to be dynamically rendered
 * - Cache-Control: no-cache, no-store
 * - ISR completely disabled
 *
 * Now: Uses ClientHeaderWrapper with useSession() hook
 * - Session fetched client-side
 * - Pages can be statically generated
 * - ISR works properly with revalidate settings
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to critical third-party origins for performance */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {/* Preconnect to Cloudflare for Turnstile */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
      </head>
      <body className="font-sans">{/* 使用系统字体 */}
        {/* ⚡ Performance: Disable auto-refetch to reduce API calls */}
        <SessionProvider refetchOnWindowFocus={false}>
          {/* ✅ Client-side header - doesn't force dynamic rendering */}
          <ConditionalHeader>
            <ClientHeaderWrapper />
          </ConditionalHeader>

          {children}

          {/* ⚡ Deferred analytics - loads after page is interactive */}
          <LazyAnalytics />
        </SessionProvider>
      </body>
    </html>
  )
}