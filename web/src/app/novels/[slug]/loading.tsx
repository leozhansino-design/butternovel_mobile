// src/app/novels/[slug]/loading.tsx
// ⚡ 骨架屏 - 立即显示页面结构（< 100ms）
export default function NovelDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100/60 via-blue-50/30 via-white to-white">
      <main className="flex-1">
        {/* 详情页骨架 */}
        <section className="relative py-4 sm:py-8 md:py-12 lg:py-20">

          <div className="container mx-auto px-3 sm:px-4 relative">
            <div className="max-w-7xl mx-auto">
              <div className="glass-effect-strong rounded-xl sm:rounded-2xl lg:rounded-3xl card-shadow-xl overflow-hidden">

                {/* 移动端竖屏布局骨架 - 水平排列 */}
                <div className="flex gap-3 p-3 sm:hidden">
                  {/* 小封面骨架 */}
                  <div className="flex-shrink-0">
                    <div className="w-[100px] h-[140px] rounded-lg bg-gray-200 animate-pulse shadow-lg"></div>
                  </div>
                  {/* 右侧信息骨架 */}
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    {/* 标题 */}
                    <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    {/* 作者 */}
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                    </div>
                    {/* 统计 */}
                    <div className="flex items-center gap-3 mt-1">
                      <div className="h-4 w-10 bg-gray-100 rounded animate-pulse"></div>
                      <div className="h-4 w-10 bg-gray-100 rounded animate-pulse"></div>
                      <div className="h-4 w-12 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                    {/* 按钮 */}
                    <div className="flex items-center gap-2 mt-auto pt-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-8 flex-1 bg-gradient-to-r from-blue-200/50 to-blue-300/50 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* 平板和桌面端布局骨架 */}
                <div className="hidden sm:grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-8 p-4 sm:p-6 md:p-8 lg:p-12">

                  {/* Cover Skeleton */}
                  <div className="flex justify-center lg:justify-start">
                    <div className="w-[200px] h-[280px] sm:w-[240px] sm:h-[340px] lg:w-[280px] lg:h-[400px] rounded-xl lg:rounded-2xl bg-gray-200 animate-pulse shadow-xl border-4 border-white"></div>
                  </div>

                  {/* Info Skeleton */}
                  <div className="flex flex-col gap-4 sm:gap-5 lg:gap-7">
                    {/* Title and Author */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-5 sm:h-6 bg-gray-100 rounded w-28 sm:w-32 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 sm:gap-2.5">
                      <div className="h-7 sm:h-9 w-24 sm:w-28 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-7 sm:h-9 w-20 sm:w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2 sm:space-y-2.5">
                      <div className="h-4 w-14 sm:w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex gap-2">
                        <div className="h-6 sm:h-7 w-16 sm:w-20 bg-gray-100 rounded-full animate-pulse"></div>
                        <div className="h-6 sm:h-7 w-20 sm:w-24 bg-gray-100 rounded-full animate-pulse"></div>
                        <div className="h-6 sm:h-7 w-16 sm:w-20 bg-gray-100 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* Stats - Single Row */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 sm:h-5 w-10 sm:w-12 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>

                    {/* Blurb */}
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <div className="h-4 w-20 sm:w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="space-y-1.5 sm:space-y-2">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="h-3.5 sm:h-4 bg-gray-100 rounded animate-pulse"
                            style={{ width: i === 3 ? '85%' : '100%' }}
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                      <div className="h-11 sm:h-14 w-40 sm:w-48 bg-gradient-to-r from-blue-200/50 to-blue-300/50 rounded-lg sm:rounded-xl animate-pulse shadow-lg"></div>
                      <div className="h-11 sm:h-14 w-11 sm:w-14 bg-blue-100/50 rounded-lg sm:rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* First Chapter Skeleton - 移动端优化 */}
        <section className="pt-4 sm:pt-6 pb-8 sm:pb-12 md:pb-16">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
              {/* Chapter Header */}
              <div className="text-center border-b border-gray-200 pb-4 sm:pb-6 md:pb-8">
                <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-200 rounded mx-auto mb-2 sm:mb-4 animate-pulse"></div>
                <div className="h-6 sm:h-8 md:h-10 bg-gray-200 rounded w-3/4 sm:w-2/3 mx-auto animate-pulse"></div>
              </div>

              {/* Chapter Content - 移动端减少行数 */}
              <div className="space-y-2 sm:space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 sm:h-5 bg-gray-100 rounded animate-pulse"
                    style={{
                      width: i % 4 === 3 ? '85%' : '100%',
                      animationDelay: `${i * 50}ms`
                    }}
                  ></div>
                ))}
              </div>

              {/* Continue Button Skeleton */}
              <div className="border-t border-gray-200 pt-6 sm:pt-8 md:pt-10 text-center">
                <div className="h-10 sm:h-12 md:h-14 w-40 sm:w-48 md:w-56 bg-gradient-to-r from-blue-200/50 to-blue-300/50 rounded-lg mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Skeleton - 移动端简化 */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`space-y-1.5 sm:space-y-2 ${i >= 2 ? 'hidden sm:block' : ''}`}>
                  <div className="h-5 sm:h-6 w-20 sm:w-24 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 sm:h-4 w-full bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-3 sm:h-4 w-3/4 bg-gray-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}