// src/app/page.tsx
// ⚡ 优化：使用单个缓存键，减少 Redis commands 从 17 降到 1（节省94%）
import { Suspense } from 'react'
import Footer from '@/components/shared/Footer'
import TrendingCarousel from '@/components/front/TrendingCarousel'
import ShortsTrending from '@/components/front/ShortsTrending'
import FeaturedShorts from '@/components/front/FeaturedShorts'
import FeaturedCarousel from '@/components/front/FeaturedCarousel'
import CategoryCarousel from '@/components/front/CategoryCarousel'
import CategoryFeaturedGrid from '@/components/front/CategoryFeaturedGrid'
import CategoryRankedList from '@/components/front/CategoryRankedList'
import CategoryCompactGrid from '@/components/front/CategoryCompactGrid'
import HomePageSkeleton from '@/components/front/HomePageSkeleton'
import { getHomePageData } from '@/lib/cache-optimized'
import ScrollToTop from '@/components/ScrollToTop'
import HomePageJsonLd from '@/components/seo/HomePageJsonLd'

async function HomeContent() {
  // ✅ 优化：使用单个缓存键获取所有首页数据
  // 优化前：17 Redis reads (1 featured + 1 categories + 15 category novels)
  // 优化后：1 Redis read (home:all-data)
  // 节省：94% Redis commands
  const homeData = await getHomePageData()

  const { featured, trending, shortsTrending, shortsFeatured, categories, categoryNovels } = homeData

  // 构造类别数据映射，按书数量从多到少排序
  const categoryData = categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    novels: categoryNovels[category.slug] || []
  })).filter(cat => cat.novels.length > 0) // 只保留有小说的类别
    .sort((a, b) => b.novels.length - a.novels.length) // 按书数量排序

  const featuredBooks = featured.map(novel => ({
    id: novel.id,
    title: novel.title,
    slug: novel.slug,
    coverImage: novel.coverImage,
    description: novel.blurb.length > 100
      ? novel.blurb.substring(0, 100) + '...'
      : novel.blurb,
    category: {
      name: novel.categoryName
    }
  }))

  return (
    <main className="flex-1">
      {/* Shorts Trending - 短篇小说热门区（在 Trending 上方） */}
      {shortsTrending.length > 0 && (
        <ShortsTrending novels={shortsTrending} />
      )}

      {/* Featured Shorts - 随机推荐短篇（与 trending 不重复） */}
      {shortsFeatured.length > 0 && (
        <FeaturedShorts novels={shortsFeatured} />
      )}

      {/* Trending Carousel - 热门推荐轮播区 */}
      {trending.length > 0 && (
        <TrendingCarousel novels={trending} />
      )}

      {featuredBooks.length > 0 ? (
        <section className="bg-gradient-to-b from-slate-50/80 to-white py-6 sm:py-8 md:py-12 lg:py-16">
          <FeaturedCarousel books={featuredBooks} />
        </section>
      ) : (
        <section className="bg-gradient-to-b from-slate-50/80 to-white py-6 sm:py-8 md:py-12 lg:py-16">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-500">No featured novels yet</p>
          </div>
        </section>
      )}

      <div className="bg-white">
        {/* 移除container限制，让轮播可以延伸到屏幕边缘 */}
        <div className="py-8 sm:py-12 md:py-16">
          {categoryData.map((cat, index) => {
            const books = cat.novels.map(novel => ({
              id: novel.id,
              title: novel.title,
              slug: novel.slug,
              coverImage: novel.coverImage,
              rating: novel.rating,
              blurb: novel.blurb,
            }))

            // Alternate between different layout styles for visual variety
            // But only use grid layouts if we have enough books to fill them
            const bookCount = books.length

            // Add spacing wrapper for each section
            const sectionWrapper = (content: React.ReactNode) => (
              <div key={cat.slug} className="mb-12 sm:mb-16 md:mb-20 last:mb-0">
                {content}
              </div>
            )

            // Smart layout selection based on book count and position
            // FeaturedGrid needs 4+ books, CompactGrid needs 4+ books
            // RankedList works with 3+ books, Carousel works with any count
            const layoutIndex = index % 4

            // If not enough books, fallback to carousel
            if (bookCount < 4) {
              return sectionWrapper(
                <CategoryCarousel
                  title={cat.name}
                  books={books}
                  categorySlug={cat.slug}
                />
              )
            }

            switch (layoutIndex) {
              case 0:
                // Featured Grid - needs 4+ books (1 featured + 3 grid minimum)
                return sectionWrapper(
                  <CategoryFeaturedGrid
                    title={cat.name}
                    books={books}
                    categorySlug={cat.slug}
                  />
                )
              case 1:
                // Ranked List - Dark background with numbered ranking
                return sectionWrapper(
                  <CategoryRankedList
                    title={cat.name}
                    books={books}
                    categorySlug={cat.slug}
                  />
                )
              case 2:
                // Standard Carousel - Horizontal scroll (always works)
                return sectionWrapper(
                  <CategoryCarousel
                    title={cat.name}
                    books={books}
                    categorySlug={cat.slug}
                  />
                )
              case 3:
                // Compact Grid - needs 4+ books for clean look
                return sectionWrapper(
                  <CategoryCompactGrid
                    title={cat.name}
                    books={books}
                    categorySlug={cat.slug}
                    variant="warm"
                  />
                )
              default:
                return sectionWrapper(
                  <CategoryCarousel
                    title={cat.name}
                    books={books}
                    categorySlug={cat.slug}
                  />
                )
            }
          })}

          {featuredBooks.length === 0 && categoryData.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No novels yet</h2>
              <p className="text-gray-600">Check back soon for new stories!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

// ✅ ISR: 1小时重新验证
// Next.js 会在第一次请求时渲染页面，然后缓存HTML 1小时
// 这样可以避免每次请求都访问 Redis，将 Redis 使用量从 2500+/天 减少到 ~50/天（98% reduction）
//
// 工作原理：
// - 第一次请求：渲染 → Redis GET（可能miss）→ DB查询 → Redis SET → Next.js缓存HTML
// - 后续请求（1小时内）：直接返回缓存的HTML（0 Redis调用，0 DB查询）
// - 1小时后或revalidatePath触发：重新渲染一次，重复上述循环
//
// ⚠️ 移除了 force-dynamic：
// - 之前错误地认为需要 force-dynamic 让 Redis 工作
// - 实际上 ISR 在运行时渲染（非构建时），Redis 可以正常工作
// - force-dynamic 导致每次请求都渲染 = 每次都调用 Redis = 2500+ commands/天
export const revalidate = 3600

// 🔧 CRITICAL FIX: Override Upstash's default no-store fetch behavior
// Upstash Redis SDK uses fetch with cache: 'no-store' by default
// This conflicts with Next.js ISR and causes "dynamic server usage" errors
// By setting fetchCache = 'force-cache', we allow ISR to work properly
export const fetchCache = 'force-cache'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* SEO: Structured data for Google */}
      <HomePageJsonLd />
      <ScrollToTop />

      {/* SEO: Hidden H1 for search engines */}
      <h1 className="sr-only">ButterNovel - Butter Novel - Free Novels Online</h1>

      {/* ✅ 性能优化：使用Suspense流式渲染，立刻显示骨架屏 */}
      <Suspense fallback={<HomePageSkeleton />}>
        <HomeContent />
      </Suspense>

      {/* SEO Section - Visible text for search engines */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Butter Novel
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            <strong>ButterNovel</strong> (also known as <strong>Butter Novel</strong>) is your destination for free online novels.
            Whether you&apos;re searching for &quot;butternovel&quot;, &quot;butter novel&quot;, or &quot;butter-novel&quot;,
            you&apos;ve found the right place. Read millions of free stories across all genres including
            fantasy, romance, sci-fi, mystery, horror, werewolf, and vampire novels.
          </p>
          <p className="text-gray-500 text-sm">
            Butter Novel - Read Free Books Online | ButterNovel.com
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
