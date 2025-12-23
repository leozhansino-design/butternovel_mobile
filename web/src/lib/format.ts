// src/lib/format.ts

/**
 * 格式化数字为简洁显示
 * 10 → "10"
 * 1500 → "1.5k"
 * 15000 → "15k"
 * 1500000 → "1.5m"
 */
export function formatNumber(num: number): string {
  // 处理负数
  const isNegative = num < 0
  const absNum = Math.abs(num)

  // 取整（避免小数问题）
  const rounded = Math.floor(absNum)

  if (rounded < 1000) {
    return (isNegative ? -rounded : rounded).toString()
  }

  if (rounded < 1000000) {
    const k = rounded / 1000
    const formatted = k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
    return isNegative ? `-${formatted}` : formatted
  }

  const m = rounded / 1000000
  const formatted = m % 1 === 0 ? `${m}m` : `${m.toFixed(1)}m`
  return isNegative ? `-${formatted}` : formatted
}