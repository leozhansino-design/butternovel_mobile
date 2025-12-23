// src/app/shorts/loading.tsx
// Skeleton loading page for shorts listing

export default function ShortsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="h-10 bg-blue-500/50 rounded-lg w-48 mx-auto mb-3"></div>
          <div className="h-6 bg-blue-500/30 rounded-lg w-72 mx-auto"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8">
          {/* Genre Filter */}
          <div className="mb-4">
            <div className="h-5 bg-gray-200 rounded w-12 mb-3"></div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 rounded-full"
                  style={{ width: `${60 + Math.random() * 40}px` }}
                ></div>
              ))}
            </div>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <div className="h-5 bg-gray-200 rounded w-16"></div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 rounded-lg w-20"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-16"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
            </div>
          </div>
        </div>

        {/* Results Count Skeleton */}
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Novels Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShortNovelCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="h-10 bg-gray-200 rounded-lg w-20"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-10"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-10"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-10"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-16"></div>
        </div>
      </div>
    </div>
  )
}

// Short novel card skeleton component
function ShortNovelCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
      <div className="p-5 flex flex-col flex-1">
        {/* Genre & Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>

        {/* Title */}
        <div className="h-7 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-7 bg-gray-200 rounded w-3/4 mb-3"></div>

        {/* Preview */}
        <div className="space-y-2 mb-4 flex-1">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-3">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-5 bg-gray-200 rounded w-14"></div>
        </div>
      </div>
    </div>
  )
}
