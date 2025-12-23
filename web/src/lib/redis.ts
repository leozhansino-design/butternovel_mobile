/**
 * Redis 连接管理 (Upstash REST API)
 *
 * 功能：
 * - 使用 Upstash Redis REST API（HTTP 连接，无需 TCP）
 * - 优雅降级（Redis 不可用时自动使用数据库）
 * - 无需端口或主机配置
 */

import { Redis } from '@upstash/redis';
import { logRedisCall, getCallStack } from './redis-monitor';

let redis: Redis | null = null;
let isRedisAvailable = false;

/**
 * 获取 Redis 客户端实例
 * 使用 Upstash REST API（不需要 TCP 连接）
 */
export function getRedisClient(): Redis | null {
  const startTime = Date.now();

  // 如果已经初始化，直接返回
  if (redis) {
    return redis;
  }

  // 🔧 修复: 在构建时跳过 Redis 初始化，避免静态生成失败
  // Next.js 在构建时会尝试预渲染页面，此时不应该初始化 Redis
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

  if (isBuildTime) {
    isRedisAvailable = false;
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'INIT',
      result: 'FAIL',
      duration: Date.now() - startTime,
      error: 'Build time - skipped',
    });
    return null;
  }

  // 检查环境变量
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    const error = '[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN';
    console.error(error);
    isRedisAvailable = false;
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'INIT',
      result: 'FAIL',
      duration: Date.now() - startTime,
      error,
    });
    return null;
  }

  try {
    redis = new Redis({
      url: restUrl,
      token: restToken,
    });

    isRedisAvailable = true;
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'INIT',
      result: 'SUCCESS',
      duration: Date.now() - startTime,
    });
    console.log('[Redis] ✅ Initialized successfully');
    return redis;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Redis] Initialization failed:', error);
    isRedisAvailable = false;
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'INIT',
      result: 'FAIL',
      duration: Date.now() - startTime,
      error: errorMsg,
    });
    return null;
  }
}

/**
 * 检查 Redis 是否可用
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redis !== null;
}

/**
 * 安全的 Redis GET 操作
 * 如果 Redis 不可用，返回 null（自动降级）
 *
 * 🔧 修复：Upstash Redis 会自动反序列化 JSON，导致返回对象而不是字符串
 * 解决方案：如果返回的不是字符串，手动转回 JSON 字符串
 */
export async function safeRedisGet(key: string): Promise<string | null> {
  const startTime = Date.now();
  const client = getRedisClient();

  if (!client) {
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'GET',
      key,
      result: 'FAIL',
      duration: Date.now() - startTime,
      error: 'Client not available',
      stackTrace: getCallStack(),
    });
    return null;
  }

  try {
    const value = await client.get(key);
    const duration = Date.now() - startTime;

    if (value === null || value === undefined) {
      logRedisCall({
        timestamp: new Date().toISOString(),
        operation: 'GET',
        key,
        result: 'MISS',
        duration,
        stackTrace: getCallStack(),
      });
      console.log(`[Redis] ❌ MISS: ${key} (${duration}ms)`);
      return null;
    }

    // 如果 Upstash 返回的是对象而不是字符串，重新序列化
    let resultValue: string;
    if (typeof value === 'string') {
      resultValue = value;
    } else {
      resultValue = JSON.stringify(value);
    }

    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'GET',
      key,
      result: 'HIT',
      duration,
      stackTrace: getCallStack(),
    });
    console.log(`[Redis] ✅ HIT: ${key} (${duration}ms, ${resultValue.length} bytes)`);
    return resultValue;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Redis GET] Failed (${key}):`, error);
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'GET',
      key,
      result: 'FAIL',
      duration,
      error: errorMsg,
      stackTrace: getCallStack(),
    });
    return null;
  }
}

/**
 * 安全的 Redis SET 操作
 * 如果 Redis 不可用，返回 false（自动降级）
 *
 * 🔧 修复：使用 Upstash Redis 正确的 API 格式
 * Upstash 使用 set(key, value, { ex: ttl }) 而不是 setex(key, ttl, value)
 */
export async function safeRedisSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  const startTime = Date.now();
  const client = getRedisClient();

  if (!client) {
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'SET',
      key,
      result: 'FAIL',
      duration: Date.now() - startTime,
      error: 'Client not available',
      stackTrace: getCallStack(),
    });
    return false;
  }

  try {
    // 验证 value 是字符串
    if (typeof value !== 'string') {
      console.error(`[Redis SET] Value is not string! Type: ${typeof value}, Key: ${key}`);
      value = String(value);
    }

    if (ttlSeconds) {
      await client.set(key, value, { ex: ttlSeconds });
    } else {
      await client.set(key, value);
    }

    const duration = Date.now() - startTime;
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'SET',
      key,
      result: 'SUCCESS',
      duration,
      stackTrace: getCallStack(),
    });
    console.log(`[Redis] 💾 SET: ${key} (${duration}ms, ${value.length} bytes, TTL: ${ttlSeconds || 'none'})`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Redis SET] Failed (${key}):`, error);
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'SET',
      key,
      result: 'FAIL',
      duration,
      error: errorMsg,
      stackTrace: getCallStack(),
    });
    return false;
  }
}

/**
 * 安全的 Redis DEL 操作
 * 支持删除单个或多个键
 */
export async function safeRedisDel(key: string | string[]): Promise<boolean> {
  const startTime = Date.now();
  const client = getRedisClient();
  const keys = Array.isArray(key) ? key : [key];
  const keyStr = keys.join(', ');

  if (!client) {
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'DEL',
      key: keyStr,
      result: 'FAIL',
      duration: Date.now() - startTime,
      error: 'Client not available',
      stackTrace: getCallStack(),
    });
    return false;
  }

  try {
    if (keys.length > 0) {
      await client.del(...keys);
    }

    const duration = Date.now() - startTime;
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'DEL',
      key: keyStr,
      result: 'SUCCESS',
      duration,
      stackTrace: getCallStack(),
    });
    console.log(`[Redis] 🗑️ DEL: ${keyStr} (${duration}ms, ${keys.length} key(s))`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Redis DEL] Failed:', error);
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'DEL',
      key: keyStr,
      result: 'FAIL',
      duration,
      error: errorMsg,
      stackTrace: getCallStack(),
    });
    return false;
  }
}

/**
 * 删除匹配模式的所有键
 * 注意：Upstash 不直接支持 KEYS 命令，这里使用简化版本
 */
export async function safeRedisDelPattern(pattern: string): Promise<number> {
  const startTime = Date.now();
  const client = getRedisClient();

  if (!client) {
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'KEYS',
      pattern,
      result: 'FAIL',
      duration: Date.now() - startTime,
      error: 'Client not available',
      stackTrace: getCallStack(),
    });
    return 0;
  }

  try {
    // Upstash REST API 支持 keys 命令
    const keys = await client.keys(pattern);
    const keysDuration = Date.now() - startTime;

    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'KEYS',
      pattern,
      result: 'SUCCESS',
      duration: keysDuration,
      stackTrace: getCallStack(),
    });

    if (!keys || keys.length === 0) {
      console.log(`[Redis] 🔍 KEYS: ${pattern} (${keysDuration}ms, 0 found)`);
      return 0;
    }

    console.log(`[Redis] 🔍 KEYS: ${pattern} (${keysDuration}ms, ${keys.length} found: ${keys.join(', ')})`);

    // 删除所有匹配的键
    const delStartTime = Date.now();
    await client.del(...keys);
    const delDuration = Date.now() - delStartTime;

    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'DEL',
      key: keys.join(', '),
      result: 'SUCCESS',
      duration: delDuration,
      stackTrace: getCallStack(),
    });
    console.log(`[Redis] 🗑️ DEL (pattern): ${keys.length} key(s) deleted (${delDuration}ms)`);

    return keys.length;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Redis DEL PATTERN] Failed (${pattern}):`, error);
    logRedisCall({
      timestamp: new Date().toISOString(),
      operation: 'KEYS',
      pattern,
      result: 'FAIL',
      duration,
      error: errorMsg,
      stackTrace: getCallStack(),
    });
    return 0;
  }
}

/**
 * 测试 Redis 连接
 */
export async function testRedisConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.set('test:connection', 'ok');
    const result = await client.get('test:connection');
    await client.del('test:connection');
    return result === 'ok';
  } catch (error) {
    console.error('Redis 连接测试失败:', error);
    return false;
  }
}

// 导出 Redis 客户端（可选，供高级用法）
export { redis };
