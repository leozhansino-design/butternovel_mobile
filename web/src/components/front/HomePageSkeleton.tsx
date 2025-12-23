// src/components/front/HomePageSkeleton.tsx
export default function HomePageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Trending Section - 响应式 */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50/50 py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="px-4 md:px-8 lg:px-[150px]">
          <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-48 mb-4 sm:mb-6 md:mb-8"></div>
          <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-hidden">
            {/* 移动端显示1.5个卡片，平板2个，桌面3个 */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`flex-shrink-0 bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100 w-[280px] sm:w-[360px] md:w-[420px] lg:w-[480px] ${i > 0 ? 'hidden sm:block' : ''} ${i > 1 ? 'sm:hidden md:block' : ''}`}
              >
                <div className="flex gap-3 sm:gap-4 md:gap-5 p-3 sm:p-4 md:p-5 h-full">
                  <div className="flex-shrink-0">
                    <div className="bg-gray-200 rounded-lg shadow-lg w-[80px] h-[110px] sm:w-[120px] sm:h-[160px] md:w-[150px] md:h-[200px]"></div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5 sm:space-y-2">
                      {/* Title */}
                      <div className="h-4 sm:h-5 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 sm:h-5 bg-gray-200 rounded w-4/5"></div>
                      {/* Meta Info */}
                      <div className="flex gap-2 items-center">
                        <div className="h-4 sm:h-5 bg-gray-200 rounded-full w-16 sm:w-20"></div>
                        <div className="h-3 w-1 bg-gray-200 rounded-full"></div>
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 sm:w-16"></div>
                      </div>
                      {/* Blurb - 移动端3行，桌面5行 */}
                      <div className="space-y-1.5 sm:space-y-2 pt-1">
                        <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-4/5"></div>
                        <div className="h-3 bg-gray-200 rounded w-full hidden sm:block"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5 hidden md:block"></div>
                      </div>
                    </div>
                    {/* Read Now Button */}
                    <div className="mt-2 sm:mt-3">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section - 响应式 */}
      <section className="bg-gradient-to-b from-slate-50/80 to-white py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="px-4 md:px-8 lg:px-[150px]">
          <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-48 mb-4 sm:mb-6"></div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`space-y-2 sm:space-y-3 ${i >= 6 ? 'hidden lg:block' : ''} ${i >= 4 ? 'hidden md:block' : ''}`}>
                <div className="aspect-[2/3] bg-gray-200 rounded-md sm:rounded-lg"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories - 响应式 */}
      <div className="bg-white">
        <div className="py-6 sm:py-8 md:py-12 lg:py-16 space-y-8 sm:space-y-12 md:space-y-16 lg:space-y-20">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="px-4 md:px-8 lg:px-[150px]">
              <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
                <div className="h-5 sm:h-6 md:h-8 bg-gray-200 rounded-lg w-24 sm:w-32 md:w-48"></div>
                <div className="h-6 sm:h-8 md:h-10 bg-gray-200 rounded-lg w-16 sm:w-24 md:w-32"></div>
              </div>
              <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`flex-shrink-0 w-[100px] sm:w-[120px] md:w-[140px] lg:w-[160px] space-y-2 sm:space-y-3 ${i >= 5 ? 'hidden lg:block' : ''} ${i >= 4 ? 'hidden md:block' : ''} ${i >= 3 ? 'hidden sm:block' : ''}`}>
                    <div className="aspect-[2/3] bg-gray-200 rounded-md sm:rounded-lg"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-10 sm:w-16"></div>
                      <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-10 sm:w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}