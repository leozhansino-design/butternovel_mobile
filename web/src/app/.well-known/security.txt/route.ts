// src/app/.well-known/security.txt/route.ts
// Security.txt - standard for security contact information
// Improves trust signals for search engines and security researchers

import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://butternovel.com'

  // Calculate expiration date (1 year from now)
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)

  const securityContent = `# ButterNovel Security Contact Information
# https://securitytxt.org/

Contact: mailto:security@butternovel.com
Contact: ${baseUrl}/contact

Expires: ${expires.toISOString()}

Preferred-Languages: en

Canonical: ${baseUrl}/.well-known/security.txt

# Policy
Policy: ${baseUrl}/terms
`

  return new NextResponse(securityContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
