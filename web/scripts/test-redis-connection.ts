#!/usr/bin/env tsx
/**
 * Redis 连接测试脚本
 * 用途：测试 Upstash Redis 连接并显示详细的调试信息
 *
 * 使用方法：
 * npx tsx scripts/test-redis-connection.ts
 */

import { getRedisClient, testRedisConnection, isRedisConnected } from '../src/lib/redis';

console.log('🔍 ========== Redis Connection Test ==========\n');

// 1. 检查环境变量
console.log('📋 Step 1: Checking environment variables...');
const restUrl = process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

console.log(`   UPSTASH_REDIS_REST_URL: ${restUrl ? '✓ Set' : '✗ Missing'}`);
console.log(`   UPSTASH_REDIS_REST_TOKEN: ${restToken ? '✓ Set' : '✗ Missing'}`);

if (!restUrl || !restToken) {
  console.error('\n❌ ERROR: Missing required environment variables!');
  console.log('\nPlease ensure .env.local contains:');
  console.log('   UPSTASH_REDIS_REST_URL=https://...');
  console.log('   UPSTASH_REDIS_REST_TOKEN=...');
  process.exit(1);
}

console.log('\n✅ Environment variables are set\n');

// 2. 获取 Redis 客户端
console.log('📋 Step 2: Initializing Redis client...');
const client = getRedisClient();

if (!client) {
  console.error('\n❌ ERROR: Failed to initialize Redis client!');
  process.exit(1);
}

console.log('✅ Redis client initialized\n');

// 3. 检查连接状态
console.log('📋 Step 3: Checking connection status...');
const connected = isRedisConnected();
console.log(`   Connection status: ${connected ? '✅ Connected' : '❌ Not connected'}\n`);

// 4. 测试基本操作
console.log('📋 Step 4: Testing basic operations...');

(async () => {
  try {
    // Test SET
    console.log('   Testing SET operation...');
    const testKey = 'test:connection:' + Date.now();
    const testValue = JSON.stringify({ message: 'Hello from Redis test!', timestamp: Date.now() });

    await client.set(testKey, testValue, { ex: 60 }); // 60 seconds TTL
    console.log(`   ✓ SET successful (key: ${testKey})`);

    // Test GET
    console.log('   Testing GET operation...');
    const retrievedValue = await client.get(testKey);
    console.log(`   ✓ GET successful (value: ${JSON.stringify(retrievedValue)})`);

    // Verify value matches
    if (JSON.stringify(retrievedValue) === testValue || retrievedValue === testValue) {
      console.log('   ✓ Value verification successful');
    } else {
      console.log(`   ⚠️ Value mismatch!`);
      console.log(`      Expected: ${testValue}`);
      console.log(`      Got: ${JSON.stringify(retrievedValue)}`);
    }

    // Test DEL
    console.log('   Testing DEL operation...');
    await client.del(testKey);
    console.log(`   ✓ DEL successful`);

    // Verify deletion
    const deletedValue = await client.get(testKey);
    if (deletedValue === null) {
      console.log('   ✓ Deletion verification successful');
    } else {
      console.log('   ⚠️ Key still exists after deletion!');
    }

    console.log('\n✅ All operations completed successfully!\n');

    // 5. 显示缓存统计
    console.log('📋 Step 5: Cache statistics...');
    try {
      const keys = await client.keys('*');
      console.log(`   Total keys in Redis: ${keys?.length || 0}`);

      if (keys && keys.length > 0) {
        console.log('   Sample keys:');
        keys.slice(0, 10).forEach(key => {
          console.log(`      - ${key}`);
        });
        if (keys.length > 10) {
          console.log(`      ... and ${keys.length - 10} more`);
        }
      }
    } catch (error) {
      console.log('   ⚠️ Could not fetch keys:', error);
    }

    console.log('\n🎉 ========== Test Complete ==========\n');
    console.log('✅ Redis is properly configured and working!\n');

  } catch (error) {
    console.error('\n❌ ERROR during operations:');
    console.error(error);
    process.exit(1);
  }
})();
