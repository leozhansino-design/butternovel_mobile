/**
 * 未读通知数量 API
 * GET /api/notifications/unread-count - 获取未读通知数量
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUnreadCount } from '@/lib/notification-service';
import { withErrorHandling, errorResponse } from '@/lib/api-error-handler';

export const GET = withErrorHandling(async (req: NextRequest) => {
  // 认证检查
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse('未授权', 401);
  }

  const count = await getUnreadCount(session.user.id);

  return NextResponse.json({ count });
});
