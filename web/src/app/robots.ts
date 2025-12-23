// src/app/robots.ts
// Generate robots.txt dynamically
// Optimized for both traditional search engines and AI search (ChatGPT, Perplexity, Claude)
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/_next/',
          '/admin-login',
        ],
      },
      // Google - primary search engine
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin-login',
        ],
      },
      // GPTBot - OpenAI's ChatGPT crawler
      // Allow to index public content for AI recommendations
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/novels/',
          '/shorts/',
          '/search',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin-login',
        ],
      },
      // Claude-Web - Anthropic's Claude crawler
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/novels/',
          '/shorts/',
          '/search',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin-login',
        ],
      },
      // anthropic-ai - Anthropic's general AI crawler
      {
        userAgent: 'anthropic-ai',
        allow: [
          '/',
          '/novels/',
          '/shorts/',
          '/search',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin-login',
        ],
      },
      // PerplexityBot - Perplexity AI search
      {
        userAgent: 'PerplexityBot',
        allow: [
          '/',
          '/novels/',
          '/shorts/',
          '/search',
        ],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin-login',
        ],
      },
      // Bingbot - Microsoft Bing (also powers Copilot)
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/auth/',
          '/admin-login',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
