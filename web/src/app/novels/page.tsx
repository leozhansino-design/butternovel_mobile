// src/app/novels/page.tsx
// 🔄 Redirect to unified search page
import { redirect } from 'next/navigation'

interface NovelsPageProps {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function NovelsPage({ searchParams }: NovelsPageProps) {
  const params = await searchParams
  const categorySlug = params.category

  // Redirect to search page with genre parameter
  if (categorySlug) {
    redirect(`/search?genre=${categorySlug}`)
  } else {
    redirect('/search')
  }
}
