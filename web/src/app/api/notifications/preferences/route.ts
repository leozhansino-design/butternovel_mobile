/**
 * 通知偏好设置 API
 * GET /api/notifications/preferences - 获取用户通知偏好
 * PUT /api/notifications/preferences - 更新用户通知偏好
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserPreferences,
  updateUserPreferences,
} from '@/lib/notification-service';
import { withErrorHandling, errorResponse } from '@/lib/api-error-handler';

export const GET = withErrorHandling(async (req: NextRequest) => {
  // 认证检查
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse('未授权', 401);
  }

  const preferences = await getUserPreferences(session.user.id);

  return NextResponse.json({ preferences });
});

export const PUT = withErrorHandling(async (req: NextRequest) => {
  // 认证检查
  const session = await auth();
  if (!session?.user?.id) {
    return errorResponse('未授权', 401);
  }

  const body = await req.json();

  // 验证更新字段
  const allowedFields = [
    'emailNotifications',
    'enableRatingNotifications',
    'enableCommentNotifications',
    'enableFollowNotifications',
    'enableAuthorNotifications',
    'emailRatingNotifications',
    'emailCommentNotifications',
    'emailFollowNotifications',
    'emailAuthorNotifications',
    'aggregationEnabled',
  ];

  const updates: any = {};
  for (const field of allowedFields) {
    if (field in body && typeof body[field] === 'boolean') {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('没有有效的更新字段', 400);
  }

  const preferences = await updateUserPreferences(session.user.id, updates);

  return NextResponse.json({ preferences });
});
