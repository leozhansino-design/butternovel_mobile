/**
 * 清除 Redis 缓存脚本
 * 用于清除损坏或过期的缓存数据
 *
 * 使用方法：
 * npx tsx scripts/clear-redis-cache.ts
 */

import { Redis } from '@upstash/redis';

async function clearAllCache() {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    console.error('❌ 错误：未找到 UPSTASH_REDIS_REST_URL 或 UPSTASH_REDIS_REST_TOKEN 环境变量');
    console.log('请在 Vercel Dashboard → Settings → Environment Variables 中配置');
    process.exit(1);
  }

  try {
    console.log('🔌 连接到 Upstash Redis...');
    const redis = new Redis({
      url: restUrl,
      token: restToken,
    });

    // 测试连接
    await redis.set('test:connection', 'ok');
    const testResult = await redis.get('test:connection');
    await redis.del('test:connection');

    if (testResult !== 'ok') {
      throw new Error('Redis 连接测试失败');
    }

    console.log('✓ Redis 连接成功');

    // 获取所有缓存键
    console.log('\n📊 查找所有缓存键...');
    const allKeys = await redis.keys('*');

    if (!allKeys || allKeys.length === 0) {
      console.log('✓ 没有找到缓存数据');
      return;
    }

    console.log(`✓ 找到 ${allKeys.length} 个缓存键\n`);

    // 显示所有键
    console.log('缓存键列表：');
    allKeys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${key}`);
    });

    // 删除所有键
    console.log(`\n🗑️  清除所有缓存...`);
    await redis.del(...allKeys);

    console.log('✅ 缓存清除完成！');
    console.log(`✓ 已删除 ${allKeys.length} 个缓存键\n`);

  } catch (error) {
    console.error('❌ 错误：', error);
    process.exit(1);
  }
}

// 运行脚本
clearAllCache()
  .then(() => {
    console.log('✓ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败：', error);
    process.exit(1);
  });
