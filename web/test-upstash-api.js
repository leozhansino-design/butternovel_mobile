/**
 * 测试 Upstash Redis API 行为
 * 用于诊断序列化问题
 */

const { Redis } = require('@upstash/redis');

async function testUpstashAPI() {
  console.log('🔍 测试 Upstash Redis API...\n');

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const testKey = 'test:api:check';
  const testData = { name: 'John', age: 30, count: 100 };
  const jsonString = JSON.stringify(testData);

  console.log('1️⃣ 测试数据:');
  console.log('   对象:', testData);
  console.log('   JSON 字符串:', jsonString);
  console.log('   类型:', typeof jsonString);
  console.log('');

  // 测试 1: 使用 set() 不带 TTL
  console.log('2️⃣ 测试: client.set(key, value)');
  try {
    await redis.set(testKey + ':1', jsonString);
    const result1 = await redis.get(testKey + ':1');
    console.log('   写入:', jsonString);
    console.log('   读取:', result1);
    console.log('   类型:', typeof result1);
    console.log('   结果:', result1 === jsonString ? '✅ 成功' : '❌ 失败');
    console.log('');
  } catch (error) {
    console.error('   ❌ 错误:', error.message);
    console.log('');
  }

  // 测试 2: 使用 set() 带 TTL (ex 选项)
  console.log('3️⃣ 测试: client.set(key, value, { ex: 60 })');
  try {
    await redis.set(testKey + ':2', jsonString, { ex: 60 });
    const result2 = await redis.get(testKey + ':2');
    console.log('   写入:', jsonString);
    console.log('   读取:', result2);
    console.log('   类型:', typeof result2);
    console.log('   结果:', result2 === jsonString ? '✅ 成功' : '❌ 失败');
    console.log('');
  } catch (error) {
    console.error('   ❌ 错误:', error.message);
    console.log('');
  }

  // 测试 3: 使用 setex()
  console.log('4️⃣ 测试: client.setex(key, 60, value)');
  try {
    await redis.setex(testKey + ':3', 60, jsonString);
    const result3 = await redis.get(testKey + ':3');
    console.log('   写入:', jsonString);
    console.log('   读取:', result3);
    console.log('   类型:', typeof result3);
    console.log('   结果:', result3 === jsonString ? '✅ 成功' : '❌ 失败');
    console.log('');
  } catch (error) {
    console.error('   ❌ 错误:', error.message);
    console.log('');
  }

  // 测试 4: JSON.parse() 解析
  console.log('5️⃣ 测试: JSON.parse() 结果');
  try {
    const result2 = await redis.get(testKey + ':2');
    if (result2) {
      console.log('   原始数据:', result2);
      console.log('   原始类型:', typeof result2);
      const parsed = JSON.parse(result2);
      console.log('   解析后:', parsed);
      console.log('   结果: ✅ JSON.parse() 成功');
    } else {
      console.log('   ❌ 没有数据');
    }
    console.log('');
  } catch (error) {
    console.error('   ❌ JSON.parse() 失败:', error.message);
    console.log('');
  }

  // 测试 5: 使用 BigInt
  console.log('6️⃣ 测试: BigInt 序列化');
  try {
    const bigIntData = { id: 123, count: BigInt(9007199254740991) };
    console.log('   原始对象:', bigIntData);

    const safeStringify = (data) => {
      return JSON.stringify(data, (key, value) => {
        if (typeof value === 'bigint') {
          return Number(value);
        }
        return value;
      });
    };

    const serialized = safeStringify(bigIntData);
    console.log('   序列化后:', serialized);

    await redis.set(testKey + ':4', serialized, { ex: 60 });
    const result4 = await redis.get(testKey + ':4');
    console.log('   读取:', result4);

    const parsed = JSON.parse(result4);
    console.log('   解析后:', parsed);
    console.log('   结果: ✅ BigInt 处理成功');
    console.log('');
  } catch (error) {
    console.error('   ❌ 错误:', error.message);
    console.log('');
  }

  // 清理
  console.log('🗑️  清理测试数据...');
  await redis.del(testKey + ':1', testKey + ':2', testKey + ':3', testKey + ':4');
  console.log('✅ 测试完成！\n');
}

testUpstashAPI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
