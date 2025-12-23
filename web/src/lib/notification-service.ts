/**
 * 通知服务
 * 提供通知的创建、查询、更新等功能
 */

import { prisma } from '@/lib/prisma';
import type { NotificationType, NotificationPriority } from '@/lib/prisma-types';
import {
  createNotificationTitle,
  createNotificationContent,
  createNotificationLink,
  shouldAggregateNotification,
  getAggregationKey,
  formatActorNames,
  getNotificationPriority,
} from './notification';

// ============================================
// 类型定义
// ============================================

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  actorId?: string;
  data: {
    novelId?: number;
    novelSlug?: string;
    novelTitle?: string;
    chapterId?: number;
    chapterNumber?: number;
    chapterTitle?: string;
    ratingId?: string;
    commentId?: string;
    replyContent?: string;
    commentContent?: string;
    score?: number;
    level?: number;
    customTitle?: string;
    customContent?: string;
    customLink?: string;
  };
}

interface CreateAggregatedNotificationData {
  userId: string;
  type: NotificationType;
  aggregationKey: string;
  data: {
    novelId?: number;
    novelSlug?: string;
    novelTitle?: string;
    chapterId?: number;
    chapterNumber?: number;
    ratingId?: string;
    commentId?: string;
  };
}

// ============================================
// 通知创建
// ============================================

/**
 * 创建单个通知（检查是否需要聚合）
 */
export async function createNotification(
  params: CreateNotificationData
): Promise<any> {
  const { userId, type, actorId, data } = params;

  // 检查用户的通知偏好
  const preferences = await getUserPreferences(userId);
  if (!shouldReceiveNotification(type, preferences)) {
    return null; // 用户关闭了这类通知
  }

  // 生成聚合键
  const aggregationKey = getAggregationKey(type, userId, data);

  // 如果支持聚合，检查是否需要聚合
  if (aggregationKey && preferences.aggregationEnabled) {
    // 检查最近时间窗口内的同类通知数量（10分钟内）
    const timeWindow = new Date(Date.now() - 10 * 60 * 1000);
    const existingCount = await prisma.notification.count({
      where: {
        aggregationKey,
        createdAt: { gte: timeWindow },
      },
    });

    // 如果超过阈值，创建或更新聚合通知
    if (shouldAggregateNotification(type, existingCount + 1)) {
      return createAggregatedNotification({
        userId,
        type,
        aggregationKey,
        data,
      });
    }
  }

  // 创建普通通知
  const actor = actorId
    ? await prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true, name: true, email: true, avatar: true },
      })
    : null;

  const priority = getNotificationPriority(type);

  const title = createNotificationTitle({
    type,
    actorName: actor?.name || '用户',
    novelTitle: data.novelTitle,
    level: data.level,
    customTitle: data.customTitle,
  });

  const content = createNotificationContent({
    type,
    replyContent: data.replyContent,
    commentContent: data.commentContent,
    chapterTitle: data.chapterTitle,
    score: data.score,
    customContent: data.customContent,
  });

  const linkUrl = createNotificationLink({
    type,
    novelId: data.novelId,
    novelSlug: data.novelSlug,
    chapterId: data.chapterId,
    chapterNumber: data.chapterNumber,
    ratingId: data.ratingId,
    commentId: data.commentId,
    actorId,
    customLink: data.customLink,
  });

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      priority,
      actorId,
      novelId: data.novelId,
      chapterId: data.chapterId,
      ratingId: data.ratingId,
      commentId: data.commentId,
      aggregationKey,
      title,
      content,
      linkUrl,
      imageUrl: actor?.avatar || null,
    },
  });

  // 如果启用了邮件通知，发送邮件（异步，不阻塞）
  if (preferences.emailNotifications) {
    const { sendNotificationEmail, shouldSendEmail } = await import(
      './email-service'
    );
    if (shouldSendEmail(type, preferences)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (user?.email) {
        sendNotificationEmail(user.email, notification).catch((err) =>
          console.error('Failed to send notification email:', err)
        );
      }
    }
  }

  return notification;
}

/**
 * 创建或更新聚合通知
 */
export async function createAggregatedNotification(
  params: CreateAggregatedNotificationData
): Promise<any> {
  const { userId, type, aggregationKey, data } = params;

  // 查找现有的聚合通知
  const timeWindow = new Date(Date.now() - 10 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: {
      aggregationKey,
      createdAt: { gte: timeWindow },
    },
  });

  // 获取所有触发者
  const allNotifications = await prisma.notification.findMany({
    where: {
      aggregationKey,
      createdAt: { gte: timeWindow },
    },
    select: { actorId: true },
  });

  const actorIds = [
    ...new Set(
      allNotifications.map((n: { actorId: string | null }) => n.actorId).filter((id: string | null): id is string => !!id)
    ),
  ];

  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, email: true },
    take: 3,
  });

  const actorCount = actorIds.length;
  const actorName = formatActorNames(actors, actorCount);

  const priority = getNotificationPriority(type);

  const title = createNotificationTitle({
    type,
    actorName,
    novelTitle: data.novelTitle,
    isAggregated: true,
  });

  const linkUrl = createNotificationLink({
    type,
    novelId: data.novelId,
    novelSlug: data.novelSlug,
    chapterId: data.chapterId,
    chapterNumber: data.chapterNumber,
    ratingId: data.ratingId,
    commentId: data.commentId,
  });

  if (existing) {
    // 更新现有聚合通知
    return prisma.notification.update({
      where: { id: existing.id },
      data: {
        actorIds,
        actorCount,
        title,
        isRead: false, // 重置为未读
        updatedAt: new Date(),
      },
    });
  } else {
    // 创建新的聚合通知
    return prisma.notification.create({
      data: {
        userId,
        type,
        priority,
        isAggregated: true,
        aggregationKey,
        actorIds,
        actorCount,
        novelId: data.novelId,
        chapterId: data.chapterId,
        ratingId: data.ratingId,
        commentId: data.commentId,
        title,
        linkUrl,
      },
    });
  }
}

// ============================================
// 通知查询
// ============================================

interface GetNotificationsParams {
  userId: string;
  isArchived: boolean;
  page?: number;
  limit?: number;
}

/**
 * 获取通知列表
 */
export async function getNotifications(params: GetNotificationsParams) {
  const { userId, isArchived, page = 1, limit = 20 } = params;

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      isArchived,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          isOfficial: true,
        },
      },
    },
  });

  return notifications;
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount(userId: string): Promise<number | string> {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
      isArchived: false,
    },
  });

  return count > 99 ? '99+' : count;
}

/**
 * 标记通知为已读
 */
export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.update({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * 标记通知为已归档（同时标记为已读）
 */
export async function markAsArchived(notificationId: string, userId: string) {
  return prisma.notification.update({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isArchived: true,
      isRead: true,
      archivedAt: new Date(),
    },
  });
}

/**
 * 归档所有通知
 */
export async function archiveAll(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isArchived: false,
    },
    data: {
      isArchived: true,
      isRead: true,
      archivedAt: new Date(),
    },
  });
}

/**
 * 删除特定的点赞通知
 * 用于取消点赞时删除对应的通知
 */
export async function deleteLikeNotification(params: {
  userId: string;
  actorId: string;
  type: 'RATING_LIKE' | 'COMMENT_LIKE';
  ratingId?: string;
  commentId?: string;
}) {
  const { userId, actorId, type, ratingId, commentId } = params;

  // 删除单个通知（非聚合）
  const deleteResult = await prisma.notification.deleteMany({
    where: {
      userId,
      type,
      actorId,
      isAggregated: false,
      ratingId: type === 'RATING_LIKE' ? ratingId : undefined,
      commentId: type === 'COMMENT_LIKE' ? commentId : undefined,
    },
  });

  // 如果删除了通知，还需要检查是否有聚合通知需要更新
  if (deleteResult.count > 0) {
    const aggregationKey =
      type === 'RATING_LIKE'
        ? `${type}:${ratingId}`
        : `${type}:${commentId}`;

    const aggregatedNotification = await prisma.notification.findFirst({
      where: {
        userId,
        aggregationKey,
        isAggregated: true,
      },
    });

    if (aggregatedNotification) {
      // 从聚合通知中移除这个 actor
      const actorIds = aggregatedNotification.actorIds.filter(
        (id: string) => id !== actorId
      );
      const actorCount = actorIds.length;

      if (actorCount === 0) {
        // 如果没有 actor 了，删除聚合通知
        await prisma.notification.delete({
          where: { id: aggregatedNotification.id },
        });
      } else {
        // 更新聚合通知
        await prisma.notification.update({
          where: { id: aggregatedNotification.id },
          data: {
            actorIds,
            actorCount,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  return deleteResult;
}

// ============================================
// 用户偏好设置
// ============================================

const DEFAULT_PREFERENCES = {
  emailNotifications: false,
  enableRatingNotifications: true,
  enableCommentNotifications: true,
  enableFollowNotifications: true,
  enableAuthorNotifications: true,
  emailRatingNotifications: false,
  emailCommentNotifications: false,
  emailFollowNotifications: false,
  emailAuthorNotifications: false,
  aggregationEnabled: true,
};

/**
 * 获取用户通知偏好
 */
export async function getUserPreferences(userId: string) {
  const preferences = await prisma.notificationPreferences.findUnique({
    where: { userId },
  });

  return preferences || DEFAULT_PREFERENCES;
}

/**
 * 更新用户通知偏好
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<typeof DEFAULT_PREFERENCES>
) {
  return prisma.notificationPreferences.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_PREFERENCES,
      ...updates,
    },
    update: updates,
  });
}

/**
 * 判断用户是否应该收到此类通知
 */
function shouldReceiveNotification(
  type: NotificationType,
  preferences: any
): boolean {
  // 评分相关
  if (
    ['RATING_REPLY', 'RATING_LIKE', 'NOVEL_RATING'].includes(type) &&
    !preferences.enableRatingNotifications
  ) {
    return false;
  }

  // 评论相关
  if (
    ['COMMENT_REPLY', 'COMMENT_LIKE', 'NOVEL_COMMENT'].includes(type) &&
    !preferences.enableCommentNotifications
  ) {
    return false;
  }

  // 关注相关
  if (type === 'NEW_FOLLOWER' && !preferences.enableFollowNotifications) {
    return false;
  }

  // 作者动态相关
  if (
    ['AUTHOR_NEW_NOVEL', 'AUTHOR_NEW_CHAPTER', 'NOVEL_UPDATE'].includes(type) &&
    !preferences.enableAuthorNotifications
  ) {
    return false;
  }

  return true;
}
