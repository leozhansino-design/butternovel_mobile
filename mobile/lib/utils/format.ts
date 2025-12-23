/**
 * 格式化数字为简洁显示
 * 10 → "10"
 * 1500 → "1.5k"
 * 15000 → "15k"
 * 1500000 → "1.5m"
 */
export function formatNumber(num: number): string {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const rounded = Math.floor(absNum);

  if (rounded < 1000) {
    return (isNegative ? -rounded : rounded).toString();
  }

  if (rounded < 1000000) {
    const k = rounded / 1000;
    const formatted = k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
    return isNegative ? `-${formatted}` : formatted;
  }

  const m = rounded / 1000000;
  const formatted = m % 1 === 0 ? `${m}m` : `${m.toFixed(1)}m`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 相对时间
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * 截断文本
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * 估算阅读时间（分钟）
 */
export function estimateReadTime(wordCount: number): number {
  // 假设阅读速度为每分钟 200-250 字
  return Math.ceil(wordCount / 200);
}
