// src/app/not-found.tsx
// SEO-friendly 404 page with helpful navigation
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found | ButterNovel',
  description: 'The page you are looking for could not be found. Browse our collection of free novels or search for your favorite stories on ButterNovel.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Illustration */}
          <div className="text-9xl font-bold text-blue-100 mb-4">404</div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Don&apos;t worry, there are plenty of amazing novels waiting for you!
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Search Novels
            </Link>
          </div>

          {/* Popular Categories */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Explore Popular Categories
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { name: 'Fantasy', slug: 'fantasy' },
                { name: 'Romance', slug: 'romance' },
                { name: 'Sci-Fi', slug: 'sci-fi' },
                { name: 'Mystery', slug: 'mystery' },
                { name: 'Horror', slug: 'horror' },
                { name: 'Adventure', slug: 'adventure' },
                { name: 'Werewolf', slug: 'werewolf' },
                { name: 'Vampire', slug: 'vampire' },
              ].map((category) => (
                <Link
                  key={category.slug}
                  href={`/search?category=${category.slug}`}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* SEO: Hidden text for search engines */}
          <p className="sr-only">
            ButterNovel - Butter Novel - Free Novels Online.
            If you were looking for a specific novel, try using our search feature.
            We offer thousands of free web novels in fantasy, romance, sci-fi, and more genres.
          </p>
        </div>
      </main>
    </div>
  )
}
