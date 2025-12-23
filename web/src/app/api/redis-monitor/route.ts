/**
 * Redis监控API端点
 * 访问: /api/redis-monitor?action=stats|logs|reset
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStats, getCallLogs, resetStats } from '@/lib/redis-monitor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'stats';
  const limit = searchParams.get('limit');

  try {
    switch (action) {
      case 'stats':
        // 获取统计数据
        return NextResponse.json({
          success: true,
          data: getStats(),
        });

      case 'logs':
        // 获取调用日志
        const logLimit = limit ? parseInt(limit) : 100;
        const logs = getCallLogs(logLimit);
        return NextResponse.json({
          success: true,
          count: logs.length,
          data: logs,
        });

      case 'reset':
        // 重置统计数据（仅开发环境）
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({
            success: false,
            error: 'Reset not allowed in production',
          }, { status: 403 });
        }
        resetStats();
        return NextResponse.json({
          success: true,
          message: 'Stats reset successfully',
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: stats, logs, or reset',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Redis Monitor API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
