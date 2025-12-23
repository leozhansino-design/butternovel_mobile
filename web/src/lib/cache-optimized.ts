/**
 * 首页数据获取
 *
 * 🔧 OPTIMIZATION: 完全移除Redis缓存
 * 原因: Next.js ISR已经缓存了完整的HTML页面(1小时)
 * - ISR期间，HTML直接返回，根本不会执行这个函数
 * - Redis缓存数据在ISR期间完全用不到
 * - 每小时只需查询DB一次，性能完全够用
 *
 * 架构: 完全依赖ISR + Supabase
 * - 第1次访问: 查DB → 渲染HTML → ISR缓存1小时
 * - 后续访问(1小时内): 直接返回缓存HTML (0 Redis, 0 DB!)
 * - 1小时后: 重复第1步
 */

import { prisma } from '@/lib/prisma';
import { withRetry, withConcurrency } from '@/lib/db-utils';

/**
 * 首页数据类型
 */
export interface HomePageData {
  featured: Array<{
    id: number;
    title: string;
    slug: string;
    coverImage: string;
    blurb: string;
    categoryName: string;
  }>;
  trending: Array<{
    id: number;
    title: string;
    slug: string;
    coverImage: string;
    blurb: string;
    categoryName: string;
    status: string;
    chaptersCount: number;
    rating: number | null;
  }>;
  // ⭐ 短篇小说 Trending
  shortsTrending: Array<{
    id: number;
    title: string;
    slug: string;
    blurb: string;
    readingPreview: string | null;
    shortNovelGenre: string | null;
    wordCount: number;
    viewCount: number;
    likeCount: number;
    averageRating: number | null;
  }>;
  // ⭐ Featured Shorts (随机抽取，与 trending 不重复)
  shortsFeatured: Array<{
    id: number;
    title: string;
    slug: string;
    blurb: string;
    readingPreview: string | null;
    shortNovelGenre: string | null;
    wordCount: number;
    viewCount: number;
    likeCount: number;
    averageRating: number | null;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    order: number;
  }>;
  categoryNovels: Record<string, Array<{
    id: number;
    title: string;
    slug: string;
    coverImage: string;
    blurb: string;
    categoryName: string;
    authorName: string;
    status: string;
    chaptersCount: number;
    likesCount: number;
    rating: number | null;
  }>>;
  timestamp: number; // 缓存生成时间
}

/**
 * 获取所有首页数据
 *
 * 🔧 OPTIMIZATION: 移除Redis缓存,完全依赖ISR
 * - 直接查询数据库
 * - ISR缓存HTML (1小时)
 * - 每小时只查询1次DB
 */
export async function getHomePageData(): Promise<HomePageData> {
  console.log('[Homepage] 🏠 getHomePageData called');
  const totalStartTime = Date.now();

  try {
    console.log('[Homepage] 📊 Fetching fresh data from database');

    // 1. 获取热门推荐小说（用于轮播）- 排除短篇小说
    const trending = await getTrendingNovels();

    // 1.5 获取短篇小说 Trending
    const shortsTrending = await getShortsTrendingNovels();

    // 1.6 获取 Featured Shorts (排除 trending 中的 IDs)
    const trendingIds = shortsTrending.map(s => s.id);
    const shortsFeatured = await getFeaturedShorts(trendingIds);

    // 2. 获取精选小说 - 排除短篇小说
    const featured = await withRetry(() =>
      prisma.$queryRaw<Array<{
        id: number;
        title: string;
        slug: string;
        coverImage: string;
        blurb: string;
        categoryName: string;
      }>>`
        SELECT
          n.id,
          n.title,
          n.slug,
          n."coverImage",
          n.blurb,
          c.name as "categoryName"
        FROM "Novel" n
        INNER JOIN "Category" c ON n."categoryId" = c.id
        WHERE n."isPublished" = true
          AND n."isBanned" = false
          AND n."isShortNovel" = false
        ORDER BY RANDOM()
        LIMIT 24
      `
    ) as any[];

    // 2. 获取所有分类
    const categories = await withRetry(() =>
      prisma.category.findMany({
        orderBy: { order: 'asc' }
      })
    ) as any[];

    // 3. 为每个分类获取小说（并发控制）
    // 🔧 OPTIMIZATION: 获取30本书（15热门+15最新，去重混合）
    const categoryNovelsArray = await withConcurrency(
      categories.map(category => async () => {
        // 定义小说类型
        type NovelData = {
          id: number;
          title: string;
          slug: string;
          coverImage: string;
          blurb: string;
          categoryName: string;
          authorName: string;
          status: string;
          chaptersCount: number;
          likesCount: number;
          rating: number | null;
        };

        // 获取15本热门（按点赞数+浏览量排序）- 排除短篇小说
        const hotNovels = await withRetry(() =>
          prisma.$queryRaw<NovelData[]>`
            SELECT
              n.id,
              n.title,
              n.slug,
              n."coverImage",
              n.blurb,
              n.status,
              n."authorName",
              c.name as "categoryName",
              (SELECT COUNT(*) FROM "Chapter" ch WHERE ch."novelId" = n.id AND ch."isPublished" = true) as "chaptersCount",
              (SELECT COUNT(*) FROM "NovelLike" nl WHERE nl."novelId" = n.id) as "likesCount",
              n."averageRating" as rating
            FROM "Novel" n
            INNER JOIN "Category" c ON n."categoryId" = c.id
            WHERE n."isPublished" = true
              AND n."isBanned" = false
              AND n."isShortNovel" = false
              AND c.slug = ${category.slug}
            ORDER BY (n."viewCount" + n."likeCount" * 10) DESC
            LIMIT 15
          `
        ) as NovelData[];

        // 获取15本最新 - 排除短篇小说
        const newNovels = await withRetry(() =>
          prisma.$queryRaw<NovelData[]>`
            SELECT
              n.id,
              n.title,
              n.slug,
              n."coverImage",
              n.blurb,
              n.status,
              n."authorName",
              c.name as "categoryName",
              (SELECT COUNT(*) FROM "Chapter" ch WHERE ch."novelId" = n.id AND ch."isPublished" = true) as "chaptersCount",
              (SELECT COUNT(*) FROM "NovelLike" nl WHERE nl."novelId" = n.id) as "likesCount",
              n."averageRating" as rating
            FROM "Novel" n
            INNER JOIN "Category" c ON n."categoryId" = c.id
            WHERE n."isPublished" = true
              AND n."isBanned" = false
              AND n."isShortNovel" = false
              AND c.slug = ${category.slug}
            ORDER BY n."createdAt" DESC
            LIMIT 15
          `
        ) as NovelData[];

        // 合并去重（使用Map去重，保留第一次出现的）
        const novelMap = new Map<number, NovelData>();
        [...hotNovels, ...newNovels].forEach((novel) => {
          if (!novelMap.has(novel.id)) {
            novelMap.set(novel.id, novel);
          }
        });

        // 转为数组并随机打乱
        const combined = Array.from(novelMap.values());
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        // 返回最多30本
        return combined.slice(0, 30);
      }),
      { concurrency: 3 }
    ) as any[];

    // 4. 构造 categoryNovels 映射
    const categoryNovels: Record<string, Array<any>> = {};
    categories.forEach((category, index) => {
      categoryNovels[category.slug] = categoryNovelsArray[index];
    });

    const data: HomePageData = {
      featured,
      trending,
      shortsTrending,
      shortsFeatured,
      categories,
      categoryNovels,
      timestamp: Date.now()
    };

    console.log(`[Homepage] ✅ Data prepared: ${trending.length} trending, ${shortsTrending.length} shorts trending, ${shortsFeatured.length} shorts featured, ${featured.length} featured, ${categories.length} categories`);

    const totalDuration = Date.now() - totalStartTime;
    console.log(`[Homepage] 🏁 getHomePageData complete (total: ${totalDuration}ms)`);

    return data;
  } catch (error) {
    console.error('[Homepage] 🚨 Database error:', error);

    // 返回空数据而不是抛出错误，避免整个页面崩溃
    return {
      featured: [],
      trending: [],
      shortsTrending: [],
      shortsFeatured: [],
      categories: [],
      categoryNovels: {},
      timestamp: Date.now()
    };
  }
}

/**
 * 清除首页缓存（当内容更新时）
 *
 * 🔧 OPTIMIZATION: 移除Redis缓存清理
 * 现在只需要清除Next.js的ISR缓存
 */
export async function invalidateHomePageCache(): Promise<void> {
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/', 'page');
  console.log('[Homepage] ✅ ISR cache invalidated for homepage');
}

/**
 * 获取热门推荐小说（排除短篇小说）
 *
 * 用于首页轮播展示
 * - 获取18本随机小说
 * - 随机排序（因为书籍数量少，固定排序会重复）
 * - 只选择有封面和简介的小说
 * - 排除短篇小说
 */
export async function getTrendingNovels(): Promise<Array<{
  id: number;
  title: string;
  slug: string;
  coverImage: string;
  blurb: string;
  categoryName: string;
  status: string;
  chaptersCount: number;
  rating: number | null;
}>> {
  try {
    console.log('[Trending] 🔥 Fetching trending novels');

    const trending = await withRetry(() =>
      prisma.$queryRaw<Array<{
        id: number;
        title: string;
        slug: string;
        coverImage: string;
        blurb: string;
        categoryName: string;
        status: string;
        chaptersCount: number;
        rating: number | null;
      }>>`
        SELECT
          n.id,
          n.title,
          n.slug,
          n."coverImage",
          n.blurb,
          n.status,
          c.name as "categoryName",
          (SELECT COUNT(*) FROM "Chapter" ch WHERE ch."novelId" = n.id AND ch."isPublished" = true) as "chaptersCount",
          n."averageRating" as rating
        FROM "Novel" n
        INNER JOIN "Category" c ON n."categoryId" = c.id
        WHERE n."isPublished" = true
          AND n."isBanned" = false
          AND n."isShortNovel" = false
          AND n."coverImage" IS NOT NULL
          AND n."coverImage" != ''
          AND n.blurb IS NOT NULL
          AND n.blurb != ''
        ORDER BY RANDOM()
        LIMIT 18
      `
    ) as any[];

    console.log(`[Trending] ✅ Fetched ${trending.length} trending novels`);
    return trending;
  } catch (error) {
    console.error('[Trending] 🚨 Error fetching trending novels:', error);
    return [];
  }
}

/**
 * 获取短篇小说 Trending
 *
 * 用于首页 Shorts Trending 区域
 * - 获取12本随机短篇小说
 * - 随机排序
 * - 只选择已发布的短篇小说
 */
export async function getShortsTrendingNovels(): Promise<Array<{
  id: number;
  title: string;
  slug: string;
  blurb: string;
  readingPreview: string | null;
  shortNovelGenre: string | null;
  wordCount: number;
  viewCount: number;
  likeCount: number;
  averageRating: number | null;
}>> {
  try {
    console.log('[ShortsTrending] 📚 Fetching shorts trending novels');

    const shorts = await withRetry(() =>
      prisma.$queryRaw<Array<{
        id: number;
        title: string;
        slug: string;
        blurb: string;
        readingPreview: string | null;
        shortNovelGenre: string | null;
        wordCount: number;
        viewCount: number;
        likeCount: number;
        averageRating: number | null;
      }>>`
        SELECT
          n.id,
          n.title,
          n.slug,
          n.blurb,
          n."readingPreview",
          n."shortNovelGenre",
          n."wordCount",
          n."viewCount",
          n."likeCount",
          n."averageRating"
        FROM "Novel" n
        WHERE n."isPublished" = true
          AND n."isBanned" = false
          AND n."isShortNovel" = true
          AND n.blurb IS NOT NULL
          AND n.blurb != ''
        ORDER BY RANDOM()
        LIMIT 12
      `
    ) as any[];

    console.log(`[ShortsTrending] ✅ Fetched ${shorts.length} shorts trending novels`);
    return shorts;
  } catch (error) {
    console.error('[ShortsTrending] 🚨 Error fetching shorts trending novels:', error);
    return [];
  }
}

/**
 * 获取 Featured Shorts (随机抽取，排除已在 trending 中的)
 */
export async function getFeaturedShorts(excludeIds: number[]): Promise<Array<{
  id: number;
  title: string;
  slug: string;
  blurb: string;
  readingPreview: string | null;
  shortNovelGenre: string | null;
  wordCount: number;
  viewCount: number;
  likeCount: number;
  averageRating: number | null;
}>> {
  try {
    console.log('[FeaturedShorts] 📚 Fetching featured shorts');

    // Build exclude clause
    const excludeClause = excludeIds.length > 0
      ? `AND n.id NOT IN (${excludeIds.join(',')})`
      : '';

    const shorts = await withRetry(() =>
      prisma.$queryRawUnsafe(`
        SELECT
          n.id,
          n.title,
          n.slug,
          n.blurb,
          n."readingPreview",
          n."shortNovelGenre",
          n."wordCount",
          n."viewCount",
          n."likeCount",
          n."averageRating"
        FROM "Novel" n
        WHERE n."isPublished" = true
          AND n."isBanned" = false
          AND n."isShortNovel" = true
          AND n.blurb IS NOT NULL
          AND n.blurb != ''
          ${excludeClause}
        ORDER BY RANDOM()
        LIMIT 30
      `)
    ) as Array<{
      id: number;
      title: string;
      slug: string;
      blurb: string;
      readingPreview: string | null;
      shortNovelGenre: string | null;
      wordCount: number;
      viewCount: number;
      likeCount: number;
      averageRating: number | null;
    }>;

    console.log(`[FeaturedShorts] ✅ Fetched ${shorts.length} featured shorts`);
    return shorts;
  } catch (error) {
    console.error('[FeaturedShorts] 🚨 Error fetching featured shorts:', error);
    return [];
  }
}
