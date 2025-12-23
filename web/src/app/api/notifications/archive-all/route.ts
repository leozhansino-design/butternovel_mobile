/**
 * 归档所有通知 API
 * POST /api/notifications/archive-all - 归档所有inbox中的通知
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { archiveAll } from '@/lib/notification-service';
import { withErrorHandling, errorResponse } from '@/lib/api-error-handler';

export const POST = withErrorHandling(async (req: NextRequest) => {
  // 认证检查
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse('未授权', 401);
  }

  const result = await archiveAll(session.user.id);

  return NextResponse.json({
    message: `已归档 ${result.count} 条通知`,
    count: result.count,
  });
});
