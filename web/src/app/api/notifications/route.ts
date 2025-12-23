/**
 * 通知列表 API
 * GET /api/notifications - 获取通知列表（支持分页和筛选）
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNotifications } from '@/lib/notification-service';
import { withErrorHandling, errorResponse } from '@/lib/api-error-handler';

export const GET = withErrorHandling(async (req: NextRequest) => {
  // 认证检查
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse('未授权', 401);
  }

  const searchParams = req.nextUrl.searchParams;
  const isArchived = searchParams.get('archived') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // 验证分页参数
  if (page < 1 || limit < 1 || limit > 100) {
    return errorResponse('无效的分页参数', 400);
  }

  const notifications = await getNotifications({
    userId: session.user.id,
    isArchived,
    page,
    limit,
  });

  return NextResponse.json({
    notifications,
    pagination: {
      page,
      limit,
      hasMore: notifications.length === limit,
    },
  });
});
