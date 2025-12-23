/**
 * 通知服务测试
 * 测试通知创建、聚合、查询、归档等功能
 */

import {
  createNotification,
  createAggregatedNotification,
  getNotifications,
  markAsRead,
  markAsArchived,
  archiveAll,
  getUnreadCount,
  getUserPreferences,
  updateUserPreferences,
} from '@/lib/notification-service';

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    notificationPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification()', () => {
    it('should create a non-aggregated notification', async () => {
      const mockNotification = {
        id: 'notif123',
        type: 'RATING_REPLY',
        userId: 'user456',
        actorId: 'actor789',
        ratingId: 'rating123',
        title: 'Alice 回复了你的评分',
        content: '很有意思的观点！',
        linkUrl: '/novel/42/the-truth-switch#rating-rating123',
        isRead: false,
        isArchived: false,
        priority: 'HIGH',
        createdAt: new Date(),
      };

      // Mock user preferences
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue({
        emailNotifications: false,
        enableRatingNotifications: true,
        aggregationEnabled: true,
      });

      // Mock actor user
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'actor789',
        name: 'Alice',
        email: 'alice@example.com',
        avatar: null,
      });

      // Mock notification count (less than threshold)
      (prisma.notification.count as jest.Mock).mockResolvedValue(2);

      (prisma.notification.create as jest.Mock).mockResolvedValue(
        mockNotification
      );

      const result = await createNotification({
        userId: 'user456',
        type: 'RATING_REPLY',
        actorId: 'actor789',
        data: {
          ratingId: 'rating123',
          novelId: 42,
          novelSlug: 'the-truth-switch',
          replyContent: '很有意思的观点！',
        },
      });

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user456',
          type: 'RATING_REPLY',
          actorId: 'actor789',
          ratingId: 'rating123',
          priority: 'HIGH',
        }),
      });
    });

    it('should create an aggregated notification when threshold exceeded', async () => {
      // Mock no existing aggregated notification
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock all notifications with this aggregation key
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        { actorId: '1' },
        { actorId: '2' },
        { actorId: '3' },
      ]);

      // Mock actors
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
        { id: '3', name: 'Charlie', email: 'charlie@example.com' },
      ]);

      const mockAggregatedNotification = {
        id: 'notif999',
        type: 'RATING_LIKE',
        userId: 'user456',
        isAggregated: true,
        actorIds: ['1', '2', '3'],
        actorCount: 3,
        title: 'Alice、Bob、Charlie 等3人 赞了你的评分',
        isRead: false,
      };

      (prisma.notification.create as jest.Mock).mockResolvedValue(
        mockAggregatedNotification
      );

      const result = await createAggregatedNotification({
        userId: 'user456',
        type: 'RATING_LIKE',
        aggregationKey: 'RATING_LIKE:user456:rating123',
        data: {
          ratingId: 'rating123',
          novelId: 42,
        },
      });

      expect(result.isAggregated).toBe(true);
      expect(result.actorCount).toBe(3);
    });
  });

  describe('getNotifications()', () => {
    it('should get inbox notifications (not archived)', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          type: 'RATING_REPLY',
          title: 'Alice 回复了你的评分',
          isRead: false,
          isArchived: false,
          createdAt: new Date(),
        },
        {
          id: 'notif2',
          type: 'RATING_LIKE',
          title: 'Bob 赞了你的评分',
          isRead: false,
          isArchived: false,
          createdAt: new Date(),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(
        mockNotifications
      );

      const result = await getNotifications({
        userId: 'user123',
        isArchived: false,
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockNotifications);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isArchived: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        skip: 0,
        include: expect.any(Object),
      });
    });

    it('should get archived notifications', async () => {
      const mockArchivedNotifications = [
        {
          id: 'notif3',
          type: 'COMMENT_REPLY',
          title: 'Charlie 回复了你的评论',
          isRead: true,
          isArchived: true,
          createdAt: new Date(),
        },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(
        mockArchivedNotifications
      );

      const result = await getNotifications({
        userId: 'user123',
        isArchived: true,
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(mockArchivedNotifications);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isArchived: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
        skip: 0,
        include: expect.any(Object),
      });
    });

    it('should support pagination', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);

      await getNotifications({
        userId: 'user123',
        isArchived: false,
        page: 3,
        limit: 10,
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20, // (3 - 1) * 10
        })
      );
    });
  });

  describe('markAsRead()', () => {
    it('should mark notification as read', async () => {
      const mockUpdatedNotification = {
        id: 'notif123',
        isRead: true,
        readAt: new Date(),
      };

      (prisma.notification.update as jest.Mock).mockResolvedValue(
        mockUpdatedNotification
      );

      const result = await markAsRead('notif123', 'user456');

      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: {
          id: 'notif123',
          userId: 'user456',
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('markAsArchived()', () => {
    it('should mark notification as archived (and read)', async () => {
      const mockArchivedNotification = {
        id: 'notif123',
        isRead: true,
        isArchived: true,
        archivedAt: new Date(),
      };

      (prisma.notification.update as jest.Mock).mockResolvedValue(
        mockArchivedNotification
      );

      const result = await markAsArchived('notif123', 'user456');

      expect(result.isArchived).toBe(true);
      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: {
          id: 'notif123',
          userId: 'user456',
        },
        data: {
          isArchived: true,
          isRead: true,
          archivedAt: expect.any(Date),
        },
      });
    });
  });

  describe('archiveAll()', () => {
    it('should archive all inbox notifications for user', async () => {
      const mockResult = { count: 15 };

      (prisma.notification.updateMany as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await archiveAll('user123');

      expect(result.count).toBe(15);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isArchived: false,
        },
        data: {
          isArchived: true,
          isRead: true,
          archivedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getUnreadCount()', () => {
    it('should get unread notification count', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(5);

      const count = await getUnreadCount('user123');

      expect(count).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          isRead: false,
          isArchived: false,
        },
      });
    });

    it('should return 99+ for counts over 99', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(150);

      const count = await getUnreadCount('user123');

      expect(count).toBe('99+');
    });
  });

  describe('getUserPreferences()', () => {
    it('should get user notification preferences', async () => {
      const mockPreferences = {
        id: 'pref123',
        userId: 'user123',
        emailNotifications: false,
        enableRatingNotifications: true,
        enableCommentNotifications: true,
        enableFollowNotifications: true,
        enableAuthorNotifications: true,
        aggregationEnabled: true,
      };

      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockPreferences
      );

      const result = await getUserPreferences('user123');

      expect(result).toEqual(mockPreferences);
    });

    it('should return default preferences if not found', async () => {
      (prisma.notificationPreferences.findUnique as jest.Mock).mockResolvedValue(
        null
      );

      const result = await getUserPreferences('user123');

      expect(result).toEqual({
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
      });
    });
  });

  describe('updateUserPreferences()', () => {
    it('should update user notification preferences', async () => {
      const mockUpdatedPreferences = {
        id: 'pref123',
        userId: 'user123',
        emailNotifications: true,
        enableRatingNotifications: false,
        aggregationEnabled: true,
      };

      (prisma.notificationPreferences.upsert as jest.Mock).mockResolvedValue(
        mockUpdatedPreferences
      );

      const result = await updateUserPreferences('user123', {
        emailNotifications: true,
        enableRatingNotifications: false,
      });

      expect(result).toEqual(mockUpdatedPreferences);
      expect(prisma.notificationPreferences.upsert).toHaveBeenCalledWith({
        where: { userId: 'user123' },
        create: expect.objectContaining({
          userId: 'user123',
          emailNotifications: true,
          enableRatingNotifications: false,
        }),
        update: {
          emailNotifications: true,
          enableRatingNotifications: false,
        },
      });
    });
  });
});
