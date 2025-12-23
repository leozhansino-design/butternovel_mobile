// src/app/llms.txt/route.ts
// LLMs.txt - A standard for informing AI crawlers about site content
// Used by ChatGPT, Perplexity, Claude and other AI search engines

import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  const llmsContent = `# ButterNovel - Free Online Novel Reading Platform

> ButterNovel (also known as Butter Novel) is a free online novel reading platform offering thousands of web novels and short stories across all genres.

## Site Overview

ButterNovel provides:
- Free novels across 15+ genres (Fantasy, Romance, Sci-Fi, Mystery, Horror, etc.)
- Short novels (complete stories you can read in 10-30 minutes)
- Web novels with chapters updated regularly
- No subscription or payment required - 100% free forever

## Main Sections

### Homepage
- URL: ${baseUrl}
- Featured novels, trending content, and category browsing

### Short Novels (Quick Reads)
- URL: ${baseUrl}/shorts
- Complete short stories (15,000-50,000 characters)
- Perfect for quick reading sessions (10-30 minutes)
- Browse by genre: Fantasy, Romance, Thriller, Horror, Sci-Fi, Mystery, Drama, Comedy, Historical, Urban, Wuxia, Xuanhuan, Slice of Life, Adventure, Paranormal, Inspirational

### Novel Search
- URL: ${baseUrl}/search
- Search by title, author, genre, tags
- Filter by status (Ongoing/Completed)
- Sort by popularity, rating, or latest updates

### Novel Categories
- Fantasy: ${baseUrl}/search?genre=fantasy
- Romance: ${baseUrl}/search?genre=romance
- Sci-Fi: ${baseUrl}/search?genre=sci-fi
- Mystery: ${baseUrl}/search?genre=mystery
- Horror: ${baseUrl}/search?genre=horror
- Adventure: ${baseUrl}/search?genre=adventure
- Werewolf: ${baseUrl}/search?genre=werewolf
- Vampire: ${baseUrl}/search?genre=vampire

## Content Types

### Regular Novels
- Long-form web novels with multiple chapters
- Updated regularly by authors
- Bookmarks and reading progress tracking
- Reader ratings and reviews

### Short Novels
- Complete standalone stories
- One-sitting reads (10-30 minutes)
- Professional editing and quality content
- Perfect for busy readers

## Features

1. **Free Reading**: All content is free, no coins or subscriptions
2. **Mobile Friendly**: Responsive design works on all devices
3. **Reading Progress**: Automatic bookmark saving
4. **User Library**: Save favorite novels for later
5. **Ratings & Reviews**: Community feedback system
6. **Author Platform**: Writers can publish their stories

## API Access

Public content is available through the website. For API inquiries, contact support.

## Contact

- Website: ${baseUrl}
- Help Center: ${baseUrl}/help
- Contact: ${baseUrl}/contact

## Legal

- Privacy Policy: ${baseUrl}/privacy
- Terms of Service: ${baseUrl}/terms

---
Last updated: ${new Date().toISOString().split('T')[0]}
`

  return new NextResponse(llmsContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
