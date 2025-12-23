/**
 * 标记通知为归档 API
 * POST /api/notifications/[id]/archive - 归档单个通知（点击通知后自动归档）
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markAsArchived } from '@/lib/notification-service';
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
      const notification = await markAsArchived(id, session.user.id);
      return NextResponse.json({ notification });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return errorResponse('通知不存在', 404);
      }
      throw error;
    }
  }
);
