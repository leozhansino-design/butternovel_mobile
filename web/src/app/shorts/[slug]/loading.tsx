// src/app/shorts/[slug]/loading.tsx
// Skeleton loading page for short novel reader

export default function ShortNovelReaderLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:gap-8">
          {/* Main Content */}
          <div className="lg:flex-1">
            <article className="rounded-2xl shadow-lg overflow-hidden bg-white border border-gray-200">
              {/* Header */}
              <header className="px-6 py-8 border-b border-gray-100">
                {/* Back Link */}
                <div className="h-5 bg-gray-200 rounded w-28 mb-4"></div>

                {/* Genre & Reading Time */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-7 bg-blue-100 rounded-full w-20"></div>
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </div>

                {/* Title */}
                <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>

                {/* Author & Stats */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 bg-gray-200 rounded-lg w-36"></div>
                  <div className="h-10 bg-gray-200 rounded-lg w-36"></div>
                </div>
              </header>

              {/* Content */}
              <div className="px-6 py-8">
                <div className="space-y-6">
                  {/* Paragraphs skeleton */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-full"></div>
                      <div className="h-5 bg-gray-200 rounded w-full"></div>
                      <div className="h-5 bg-gray-200 rounded w-11/12"></div>
                      {i % 2 === 0 && <div className="h-5 bg-gray-200 rounded w-4/5"></div>}
                    </div>
                  ))}
                </div>

                {/* End Mark */}
                <div className="mt-16 mb-8 flex flex-col items-center">
                  <div className="w-24 h-px bg-gray-300 mb-6"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-40"></div>
                  <div className="w-24 h-px bg-gray-300 mt-6"></div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-6 py-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 bg-gray-200 rounded-full w-36"></div>
                    <div className="h-11 bg-gray-200 rounded-full w-36"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar - You May Like */}
          <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0 mt-8 lg:mt-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <div className="h-6 bg-gray-200 rounded w-28 mb-5"></div>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
