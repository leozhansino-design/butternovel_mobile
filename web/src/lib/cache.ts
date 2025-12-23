/**
 * 缓存功能模块
 *
 * 功能：
 * - 封装 Redis 缓存操作
 * - 自动降级到数据库（Redis 不可用时）
 * - 统一缓存键命名规范
 * - 提供针对不同数据类型的缓存方法
 * - 配合页面级 fetchCache = 'force-cache'，兼容 Next.js ISR
 */

import { safeRedisGet, safeRedisSet, safeRedisDel, safeRedisDelPattern, isRedisConnected } from './redis';

// ========================
// 缓存键命名规范
// ========================

export const CacheKeys = {
  // 首页相关
  HOME_FEATURED: 'home:featured', // 首页 Featured 小说
  HOME_CATEGORY: (categorySlug: string) => `home:category:${categorySlug}`, // 首页分类小说
  HOME_ALL_CATEGORIES: 'home:all-categories', // 所有分类列表

  // 小说详情
  NOVEL: (slug: string) => `novel:${slug}`, // 小说详情
  NOVEL_STATS: (novelId: string) => `novel:${novelId}:stats`, // 小说统计（点赞、章节数）

  // 分类相关
  CATEGORY: (slug: string) => `category:${slug}`, // 分类信息
  CATEGORY_NOVELS: (slug: string) => `category:${slug}:novels`, // 分类下的小说
  CATEGORY_PAGE: (slug: string) => `category:${slug}:page`, // 分类页面完整数据（包含分类信息+小说列表）

  // 用户书架（需要包含用户 ID）
  USER_LIBRARY: (userId: string) => `user:${userId}:library`, // 用户书架
  USER_LIBRARY_CHECK: (userId: string, novelSlug: string) => `user:${userId}:library:check:${novelSlug}`, // 检查是否在书架

  // 模式匹配键（用于批量删除）
  PATTERN_HOME: 'home:*', // 所有首页相关缓存
  PATTERN_NOVEL: (slug: string) => `novel:${slug}*`, // 某个小说的所有缓存
  PATTERN_CATEGORY: (slug: string) => `category:${slug}*`, // 某个分类的所有缓存
  PATTERN_USER_LIBRARY: (userId: string) => `user:${userId}:library*`, // 用户书架所有缓存
} as const;

// ========================
// 缓存 TTL（生存时间，秒）
// ========================

export const CacheTTL = {
  HOME_FEATURED: 60 * 60, // 1 小时
  HOME_CATEGORY: 60 * 30, // 30 分钟
  CATEGORY_NOVELS: 60 * 30, // 30 分钟
  CATEGORY_PAGE: 60 * 30, // 30 分钟
  NOVEL_DETAIL: 60 * 10, // 10 分钟
  NOVEL_STATS: 60 * 5, // 5 分钟
  USER_LIBRARY: 60 * 60, // 🔧 FIXED: 1小时过期，避免内存泄漏（之前是0=永不过期）
  USER_LIBRARY_CHECK: 60 * 5, // 5 分钟
} as const;

// ========================
// 缓存操作封装
// ========================

/**
 * 安全的 JSON 序列化（处理 BigInt）
 * Prisma 返回的数据可能包含 BigInt 类型（如 _count 字段）
 */
function safeStringify(data: any): string {
  return JSON.stringify(data, (key, value) => {
    // 将 BigInt 转换为 Number
    if (typeof value === 'bigint') {
      return Number(value);
    }
    return value;
  });
}

/**
 * 通用缓存获取方法
 * 如果缓存命中，返回缓存数据；否则执行 fetchFunction 并缓存结果
 *
 * @param key 缓存键
 * @param fetchFunction 数据获取函数（从数据库）
 * @param ttl 缓存过期时间（秒）
 * @returns 数据
 */
export async function getOrSet<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl?: number
): Promise<T> {
  console.log(`[Cache] 🔄 getOrSet called for key: ${key}, TTL: ${ttl || 'none'}`);
  const startTime = Date.now();

  try {
    // 1. 尝试从缓存获取
    const cached = await safeRedisGet(key);

    if (cached) {
      // 缓存命中
      try {
        const data = JSON.parse(cached);
        const duration = Date.now() - startTime;
        console.log(`[Cache] ✅ Cache HIT for ${key} (total: ${duration}ms)`);
        return data as T;
      } catch (parseError) {
        console.error(`[Cache] Parse failed (${key}):`, parseError);
        // 解析失败，删除损坏的缓存
        await safeRedisDel(key);
      }
    }

    // 2. 缓存未命中或 Redis 不可用，从数据库获取
    console.log(`[Cache] ❌ Cache MISS for ${key}, fetching from database...`);
    const dbStartTime = Date.now();
    const data = await fetchFunction();
    const dbDuration = Date.now() - dbStartTime;
    console.log(`[Cache] 💾 Database fetch complete for ${key} (${dbDuration}ms)`);

    // 3. 将数据写入缓存（如果 Redis 可用）
    if (isRedisConnected()) {
      try {
        const serialized = safeStringify(data);
        await safeRedisSet(key, serialized, ttl);
      } catch (serializeError) {
        console.error(`[Cache] Serialization failed (${key}):`, serializeError);
      }
    } else {
      console.log(`[Cache] ⚠️ Redis not available, skipping cache write for ${key}`);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Cache] ✅ Complete for ${key} (total: ${totalDuration}ms, db: ${dbDuration}ms)`);
    return data;
  } catch (error) {
    // 如果任何步骤失败，回退到直接查询数据库
    console.error(`[Cache] Operation failed, falling back to DB (${key}):`, error);
    return fetchFunction();
  }
}

/**
 * 删除单个缓存键
 */
export async function invalidate(key: string): Promise<void> {
  try {
    await safeRedisDel(key);
  } catch (error) {
    console.error(`✗ 缓存清除失败 (${key}):`, error);
  }
}

/**
 * 删除多个缓存键
 */
export async function invalidateMultiple(keys: string[]): Promise<void> {
  try {
    await safeRedisDel(keys);
  } catch (error) {
    console.error(`✗ 批量缓存清除失败:`, error);
  }
}

/**
 * 删除匹配模式的所有缓存键
 * 例如：invalidatePattern('novel:my-novel*') 会删除该小说的所有相关缓存
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    await safeRedisDelPattern(pattern);
  } catch (error) {
    console.error(`✗ 模式缓存清除失败 (${pattern}):`, error);
  }
}

// ========================
// 特定业务缓存方法
// ========================

/**
 * 清除首页所有缓存 (Redis + Next.js ISR)
 * 场景：创建新小说、更新小说分类
 *
 * ⚡ 优化：只清除单个缓存键 home:all-data
 * - 移除了 KEYS pattern 扫描（O(N) 操作，在大型Redis数据库中很慢）
 * - 只删除单个键（O(1) 操作）
 * - 减少 Redis commands：从 3+ 降到 1（67% reduction）
 */
export async function invalidateHomeCache(): Promise<void> {
  console.log('[Cache] 🗑️ invalidateHomeCache called');
  const startTime = Date.now();

  // ✅ 优化：只删除单个缓存键（O(1)操作）
  await invalidate('home:all-data');

  // ⚡ Clear Next.js ISR cache - 触发首页重新渲染
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/', 'page');
    console.log('[Cache] ✅ Homepage revalidated');
  } catch (error) {
    console.error('[Cache] Failed to revalidate homepage:', error);
  }

  const duration = Date.now() - startTime;
  console.log(`[Cache] ✅ invalidateHomeCache complete (${duration}ms)`);
}

/**
 * 清除某个小说的所有缓存 (Redis + Next.js ISR)
 * 场景：更新小说信息、发布新章节、删除章节
 */
export async function invalidateNovelCache(slug: string): Promise<void> {
  const pattern = CacheKeys.PATTERN_NOVEL(slug);
  await invalidatePattern(pattern);

  // ⚡ Clear Next.js ISR cache for novel detail page
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/novels/${slug}`, 'page');
  } catch (error) {
    console.error(`[Cache] Failed to revalidate novel ${slug}:`, error);
  }
}

/**
 * 清除某个分类的所有缓存 (Redis + Next.js ISR)
 * 场景：该分类下有小说变动
 */
export async function invalidateCategoryCache(categorySlug: string): Promise<void> {
  await Promise.all([
    invalidate(CacheKeys.HOME_CATEGORY(categorySlug)),
    invalidatePattern(CacheKeys.PATTERN_CATEGORY(categorySlug)),
  ]);

  // ⚡ Clear Next.js ISR cache for category page
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/category/${categorySlug}`, 'page');
  } catch (error) {
    console.error(`✗ Failed to clear Next.js ISR cache for category ${categorySlug}:`, error);
  }
}

/**
 * 清除用户书架缓存
 * 场景：用户添加/删除书架项
 */
export async function invalidateUserLibraryCache(userId: string): Promise<void> {
  const pattern = CacheKeys.PATTERN_USER_LIBRARY(userId);
  await invalidatePattern(pattern);
}

/**
 * 清除小说相关的所有缓存（包括首页和分类）
 * 场景：创建/更新/删除小说时的完整缓存清除
 *
 * @param novelSlug 小说 slug
 * @param categorySlug 小说所属分类 slug（可选）
 */
export async function invalidateNovelRelatedCache(
  novelSlug: string,
  categorySlug?: string
): Promise<void> {
  const tasks = [
    invalidateHomeCache(), // 清除首页
    invalidateNovelCache(novelSlug), // 清除小说详情
  ];

  // 如果提供了分类，也清除分类缓存
  if (categorySlug) {
    tasks.push(invalidateCategoryCache(categorySlug));
  }

  await Promise.all(tasks);
}

// ========================
// 缓存状态检查
// ========================

/**
 * 检查 Redis 连接状态
 */
export function isCacheAvailable(): boolean {
  return isRedisConnected();
}

/**
 * 获取缓存统计信息（调试用）
 */
export async function getCacheStats(): Promise<{
  available: boolean;
  message: string;
}> {
  const available = isRedisConnected();

  return {
    available,
    message: available
      ? 'Redis 缓存正常运行'
      : 'Redis 缓存不可用，已降级到数据库查询',
  };
}
