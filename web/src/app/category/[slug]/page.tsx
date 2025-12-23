// src/app/category/[slug]/page.tsx
// 🔄 Redirect to unified search page
import { redirect } from 'next/navigation'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  // Redirect to search page with genre parameter
  redirect(`/search?genre=${slug}`)
}
