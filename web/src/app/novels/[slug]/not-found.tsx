// 位置: src/app/novels/[slug]/not-found.tsx

import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export default function NovelNotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-16">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Novel Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the novel you're looking for. It may have been removed or the link might be incorrect.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-[#b39320] hover:bg-[#9a7d1a] text-white font-semibold rounded-lg transition-colors"
            >
              Go to Homepage
            </Link>
            <Link
              href="/novels"
              className="px-6 py-3 bg-white border-2 border-gray-300 hover:border-[#b39320] text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Browse All Novels
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}