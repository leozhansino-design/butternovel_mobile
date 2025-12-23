/**
 * Redis 调用监控系统
 * 记录所有Redis操作用于诊断和优化
 */

export interface RedisCallLog {
  timestamp: string;
  operation: 'GET' | 'SET' | 'DEL' | 'KEYS' | 'INIT';
  key?: string;
  pattern?: string;
  result: 'SUCCESS' | 'FAIL' | 'MISS' | 'HIT';
  duration: number; // ms
  error?: string;
  stackTrace?: string;
}

// 内存中保存最近1000条记录
const callLogs: RedisCallLog[] = [];
const MAX_LOGS = 1000;

// 统计数据
let stats = {
  totalCalls: 0,
  gets: 0,
  sets: 0,
  dels: 0,
  keys: 0,
  hits: 0,
  misses: 0,
  errors: 0,
  startTime: new Date().toISOString(),
};

/**
 * 记录Redis调用
 */
export function logRedisCall(log: RedisCallLog): void {
  // 添加到日志数组
  callLogs.push(log);

  // 保持数组大小在限制内
  if (callLogs.length > MAX_LOGS) {
    callLogs.shift();
  }

  // 更新统计
  stats.totalCalls++;

  switch (log.operation) {
    case 'GET':
      stats.gets++;
      if (log.result === 'HIT') stats.hits++;
      if (log.result === 'MISS') stats.misses++;
      break;
    case 'SET':
      stats.sets++;
      break;
    case 'DEL':
      stats.dels++;
      break;
    case 'KEYS':
      stats.keys++;
      break;
  }

  if (log.result === 'FAIL') {
    stats.errors++;
  }

  // 在开发环境打印详细日志
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Redis Monitor] ${log.operation} ${log.key || log.pattern || ''} - ${log.result} (${log.duration}ms)`);
  }
}

/**
 * 获取调用日志
 */
export function getCallLogs(limit?: number): RedisCallLog[] {
  if (limit) {
    return callLogs.slice(-limit);
  }
  return [...callLogs];
}

/**
 * 获取统计数据
 */
export function getStats() {
  const now = new Date();
  const startDate = new Date(stats.startTime);
  const uptimeSeconds = Math.floor((now.getTime() - startDate.getTime()) / 1000);

  return {
    ...stats,
    uptime: uptimeSeconds,
    hitRate: stats.gets > 0 ? ((stats.hits / stats.gets) * 100).toFixed(2) + '%' : '0%',
    currentTime: now.toISOString(),
  };
}

/**
 * 重置统计数据
 */
export function resetStats(): void {
  stats = {
    totalCalls: 0,
    gets: 0,
    sets: 0,
    dels: 0,
    keys: 0,
    hits: 0,
    misses: 0,
    errors: 0,
    startTime: new Date().toISOString(),
  };
  callLogs.length = 0;
}

/**
 * 获取调用堆栈（用于追踪调用来源）
 */
export function getCallStack(): string {
  const stack = new Error().stack || '';
  // 提取有用的堆栈信息，跳过前3行（Error, getCallStack, 调用者）
  const lines = stack.split('\n').slice(3, 8);
  return lines.join('\n');
}
