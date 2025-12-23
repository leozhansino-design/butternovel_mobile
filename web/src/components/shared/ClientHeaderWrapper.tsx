// src/components/shared/ClientHeaderWrapper.tsx
'use client'

import Header from './Header'

/**
 * Client-side header wrapper
 *
 * ✅ This does NOT force the page to be dynamic
 * ✅ Session is fetched client-side after initial render
 * ✅ Works with Next.js ISR and static generation
 *
 * Header now uses useSession() directly, no need to pass user prop
 */
export default function ClientHeaderWrapper() {
  return <Header />
}
