/**
 * 标记通知为已读 API
 * POST /api/notifications/[id]/read - 标记单个通知为已读
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markAsRead } from '@/lib/notification-service';
import { withErrorHandling, errorResponse } from '@/lib/api-error-handler';

export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    // 认证检查
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse('未授权', 401);
    }

    const { id } = await params;

    try {
      const notification = await markAsRead(id, session.user.id);
      return NextResponse.json({ notification });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return errorResponse('通知不存在', 404);
      }
      throw error;
    }
  }
);
