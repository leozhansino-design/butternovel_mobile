#!/bin/bash

# Redis 缓存验证脚本
# 使用方法: bash test-redis-cache.sh https://your-domain.vercel.app

SITE_URL="${1:-http://localhost:3000}"

echo "======================================"
echo "Redis 缓存功能测试"
echo "======================================"
echo "测试网站: $SITE_URL"
echo ""

# 测试 1: 首页响应时间对比
echo "📊 测试 1: 首页缓存性能"
echo "--------------------------------------"

echo "第 1 次访问（缓存未命中）..."
TIME1=$(curl -o /dev/null -s -w '%{time_total}\n' "$SITE_URL/")
echo "响应时间: ${TIME1}s"

sleep 2

echo "第 2 次访问（应该缓存命中）..."
TIME2=$(curl -o /dev/null -s -w '%{time_total}\n' "$SITE_URL/")
echo "响应时间: ${TIME2}s"

# 计算性能提升
IMPROVEMENT=$(awk "BEGIN {printf \"%.1f\", ($TIME1 - $TIME2) / $TIME2 * 100}")

echo ""
if (( $(echo "$TIME2 < $TIME1" | bc -l) )); then
    echo "✓ 缓存工作正常！第 2 次快了 ${IMPROVEMENT}%"
else
    echo "⚠ 第 2 次没有变快，Redis 可能未启用"
fi

echo ""
echo "======================================"
echo "测试 2: 小说详情页缓存"
echo "--------------------------------------"

# 假设有一个小说页面
NOVEL_URL="$SITE_URL/novels/test-novel"

echo "访问小说详情页 2 次..."
TIME3=$(curl -o /dev/null -s -w '%{time_total}\n' "$NOVEL_URL" 2>/dev/null || echo "0")
sleep 1
TIME4=$(curl -o /dev/null -s -w '%{time_total}\n' "$NOVEL_URL" 2>/dev/null || echo "0")

if [ "$TIME3" != "0" ] && [ "$TIME4" != "0" ]; then
    echo "第 1 次: ${TIME3}s"
    echo "第 2 次: ${TIME4}s"

    if (( $(echo "$TIME4 < $TIME3" | bc -l) )); then
        echo "✓ 小说详情页缓存工作正常"
    fi
else
    echo "⚠ 无法访问小说详情页（可能还没有小说）"
fi

echo ""
echo "======================================"
echo "验证结果总结"
echo "======================================"
echo ""
echo "如何确认 Redis 是否启用："
echo "1. 第 2 次访问应该比第 1 次快 3-10 倍"
echo "2. 查看 Vercel 日志应该显示 '✓ 缓存命中'"
echo "3. 如果都没有变快，检查环境变量配置"
echo ""
echo "详细验证方法请查看: HOW_TO_VERIFY_REDIS.md"
