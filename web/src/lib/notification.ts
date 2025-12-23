/**
 * 通知系统核心逻辑
 * 处理通知的聚合、格式化、生成等功能
 */

import type { NotificationType, NotificationPriority } from '@/lib/prisma-types';

// ============================================
// 聚合阈值配置（工业界标准实践）
// ============================================

export const AGGREGATION_THRESHOLDS: Record<string, number> = {
  RATING_LIKE: 5, // 评分点赞：5条以上聚合
  COMMENT_LIKE: 5, // 评论点赞：5条以上聚合
  RATING_REPLY: 3, // 评分回复：3条以上聚合
  COMMENT_REPLY: 3, // 评论回复：3条以上聚合
  NEW_FOLLOWER: 5, // 新增关注：5条以上聚合
};

// ============================================
// 聚合相关函数
// ============================================

/**
 * 判断是否应该聚合通知
 * @param type 通知类型
 * @param count 当前数量
 * @returns 是否应该聚合
 */
export function shouldAggregateNotification(
  type: string,
  count: number
): boolean {
  const threshold = AGGREGATION_THRESHOLDS[type];
  if (!threshold) return false;
  return count > threshold;
}

/**
 * 生成聚合键
 * @param type 通知类型
 * @param userId 用户ID
 * @param data 相关数据
 * @returns 聚合键或null
 */
export function getAggregationKey(
  type: string,
  userId: string,
  data: Record<string, any>
): string | null {
  // 只有支持聚合的类型才生成聚合键
  if (!AGGREGATION_THRESHOLDS[type]) return null;

  const parts = [type, userId];

  // 根据类型添加不同的标识符
  if (type === 'RATING_LIKE' || type === 'RATING_REPLY') {
    parts.push(data.ratingId);
  } else if (type === 'COMMENT_LIKE' || type === 'COMMENT_REPLY') {
    parts.push(data.commentId);
  }
  // NEW_FOLLOWER 不需要额外标识符

  return parts.join(':');
}

/**
 * 格式化触发者名称列表
 * @param actors 触发者列表
 * @param totalCount 总数（可能大于actors.length，用于聚合显示）
 * @returns 格式化后的名称字符串
 */
export function formatActorNames(
  actors: Array<{ id: string; name: string | null; email: string }>,
  totalCount: number
): string {
  const names = actors
    .slice(0, 3)
    .map((actor) => actor.name || actor.email);

  if (totalCount === 1) {
    return names[0];
  } else if (totalCount === 2) {
    return names.join(' and ');
  } else if (totalCount === 3) {
    return `${names.slice(0, 2).join(', ')} and ${names[2]}`;
  } else {
    return `${names.join(', ')} and ${totalCount - names.length} others`;
  }
}

// ============================================
// 通知内容生成函数
// ============================================

interface NotificationTitleData {
  type: string;
  actorName?: string;
  novelTitle?: string;
  isAggregated?: boolean;
  level?: number;
  customTitle?: string;
}

/**
 * 创建通知标题
 */
export function createNotificationTitle(data: NotificationTitleData): string {
  const { type, actorName, novelTitle, isAggregated, level, customTitle } =
    data;

  switch (type) {
    case 'RATING_REPLY':
      return `${actorName} replied to your rating`;

    case 'RATING_LIKE':
      return `${actorName} liked your rating`;

    case 'COMMENT_REPLY':
      return `${actorName} replied to your comment`;

    case 'COMMENT_LIKE':
      return `${actorName} liked your comment`;

    case 'AUTHOR_NEW_NOVEL':
      return `${actorName} published a new novel`;

    case 'AUTHOR_NEW_CHAPTER':
      return `${actorName} updated "${novelTitle}"`;

    case 'NOVEL_UPDATE':
      return `"${novelTitle}" has been updated`;

    case 'NOVEL_RATING':
      return `${actorName} rated your novel "${novelTitle}"`;

    case 'NOVEL_COMMENT':
      return `${actorName} commented on your novel "${novelTitle}"`;

    case 'NEW_FOLLOWER':
      return `${actorName} followed you`;

    case 'LEVEL_UP':
      return `Congratulations! You've reached Lv.${level}`;

    case 'SYSTEM_ANNOUNCEMENT':
      return customTitle || 'System Notification';

    default:
      return 'New Notification';
  }
}

interface NotificationContentData {
  type: string;
  replyContent?: string;
  commentContent?: string;
  chapterTitle?: string;
  score?: number;
  customContent?: string;
}

/**
 * 创建通知详细内容
 */
export function createNotificationContent(
  data: NotificationContentData
): string | null {
  const { type, replyContent, commentContent, chapterTitle, score, customContent } =
    data;

  switch (type) {
    case 'RATING_REPLY':
    case 'COMMENT_REPLY':
      return replyContent || null;

    case 'AUTHOR_NEW_CHAPTER':
    case 'NOVEL_UPDATE':
      return chapterTitle || null;

    case 'NOVEL_RATING':
      if (score) {
        const stars = '⭐'.repeat(score / 2);
        return stars;
      }
      return null;

    case 'NOVEL_COMMENT':
      return commentContent || null;

    case 'SYSTEM_ANNOUNCEMENT':
      return customContent || null;

    default:
      return null;
  }
}

interface NotificationLinkData {
  type: string;
  novelId?: number;
  novelSlug?: string;
  chapterId?: number;
  chapterNumber?: number;
  ratingId?: string;
  commentId?: string;
  actorId?: string;
  customLink?: string;
}

/**
 * 创建通知跳转链接
 */
export function createNotificationLink(
  data: NotificationLinkData
): string | null {
  const {
    type,
    novelId,
    novelSlug,
    chapterId,
    chapterNumber,
    ratingId,
    commentId,
    actorId,
    customLink,
  } = data;

  switch (type) {
    case 'RATING_REPLY':
    case 'RATING_LIKE':
      if (novelSlug && ratingId) {
        // Use query param to open rating modal and highlight specific rating
        return `/novels/${novelSlug}?openRating=${ratingId}`;
      }
      return null;

    case 'COMMENT_REPLY':
    case 'COMMENT_LIKE':
      if (novelSlug && chapterNumber && commentId) {
        // Use query param to open comment panel and highlight specific comment
        return `/novels/${novelSlug}/chapters/${chapterNumber}?openComment=${commentId}`;
      }
      return null;

    case 'AUTHOR_NEW_CHAPTER':
    case 'NOVEL_UPDATE':
      if (novelSlug && chapterNumber) {
        return `/novels/${novelSlug}/chapters/${chapterNumber}`;
      }
      return null;

    case 'AUTHOR_NEW_NOVEL':
    case 'NOVEL_RATING':
      if (novelSlug) {
        // Open rating modal when arriving from notification
        return `/novels/${novelSlug}?openRatings=true`;
      }
      return null;

    case 'NOVEL_COMMENT':
      // 段落评论应该跳转到章节页面的评论位置
      if (novelSlug && chapterNumber && commentId) {
        return `/novels/${novelSlug}/chapters/${chapterNumber}?openComment=${commentId}`;
      }
      // 如果没有章节信息，回退到小说详情页
      if (novelSlug) {
        return `/novels/${novelSlug}`;
      }
      return null;

    case 'NEW_FOLLOWER':
      if (actorId) {
        return `/profile/${actorId}`;
      }
      return null;

    case 'SYSTEM_ANNOUNCEMENT':
      return customLink || null;

    default:
      return null;
  }
}

/**
 * 获取通知优先级
 */
export function getNotificationPriority(
  type: NotificationType
): NotificationPriority {
  // 高优先级：回复、点赞
  const highPriority: NotificationType[] = [
    'RATING_REPLY',
    'RATING_LIKE',
    'COMMENT_REPLY',
    'COMMENT_LIKE',
  ];

  // 低优先级：系统公告
  const lowPriority: NotificationType[] = ['SYSTEM_ANNOUNCEMENT'];

  if (highPriority.includes(type)) {
    return 'HIGH';
  } else if (lowPriority.includes(type)) {
    return 'LOW';
  } else {
    return 'NORMAL';
  }
}

/**
 * 判断通知类型是否为作者通知
 */
export function isAuthorNotification(type: NotificationType): boolean {
  const authorTypes: NotificationType[] = [
    'NOVEL_RATING',
    'NOVEL_COMMENT',
  ];
  return authorTypes.includes(type);
}
