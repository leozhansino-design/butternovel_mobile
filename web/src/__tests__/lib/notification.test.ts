/**
 * 通知系统核心逻辑测试
 * 测试通知聚合、生成、格式化等功能
 */

import {
  createNotificationTitle,
  createNotificationContent,
  createNotificationLink,
  shouldAggregateNotification,
  getAggregationKey,
  formatActorNames,
  AGGREGATION_THRESHOLDS,
} from '@/lib/notification';

describe('Notification Core Logic', () => {
  describe('Aggregation Thresholds', () => {
    it('should have correct thresholds for each notification type', () => {
      expect(AGGREGATION_THRESHOLDS.RATING_LIKE).toBe(5);
      expect(AGGREGATION_THRESHOLDS.COMMENT_LIKE).toBe(5);
      expect(AGGREGATION_THRESHOLDS.RATING_REPLY).toBe(3);
      expect(AGGREGATION_THRESHOLDS.COMMENT_REPLY).toBe(3);
      expect(AGGREGATION_THRESHOLDS.NEW_FOLLOWER).toBe(5);
    });
  });

  describe('shouldAggregateNotification()', () => {
    it('should aggregate when count exceeds threshold for RATING_LIKE', () => {
      expect(shouldAggregateNotification('RATING_LIKE', 6)).toBe(true);
      expect(shouldAggregateNotification('RATING_LIKE', 5)).toBe(false);
      expect(shouldAggregateNotification('RATING_LIKE', 4)).toBe(false);
    });

    it('should aggregate when count exceeds threshold for RATING_REPLY', () => {
      expect(shouldAggregateNotification('RATING_REPLY', 4)).toBe(true);
      expect(shouldAggregateNotification('RATING_REPLY', 3)).toBe(false);
      expect(shouldAggregateNotification('RATING_REPLY', 2)).toBe(false);
    });

    it('should not aggregate for types without threshold', () => {
      expect(shouldAggregateNotification('AUTHOR_NEW_NOVEL', 100)).toBe(false);
      expect(shouldAggregateNotification('NOVEL_UPDATE', 50)).toBe(false);
    });
  });

  describe('getAggregationKey()', () => {
    it('should generate aggregation key for RATING_LIKE', () => {
      const key = getAggregationKey('RATING_LIKE', 'user123', {
        ratingId: 'rating456',
      });
      expect(key).toBe('RATING_LIKE:user123:rating456');
    });

    it('should generate aggregation key for COMMENT_REPLY', () => {
      const key = getAggregationKey('COMMENT_REPLY', 'user123', {
        commentId: 'comment789',
      });
      expect(key).toBe('COMMENT_REPLY:user123:comment789');
    });

    it('should generate aggregation key for NEW_FOLLOWER', () => {
      const key = getAggregationKey('NEW_FOLLOWER', 'user123', {});
      expect(key).toBe('NEW_FOLLOWER:user123');
    });

    it('should return null for non-aggregatable types', () => {
      const key = getAggregationKey('AUTHOR_NEW_NOVEL', 'user123', {
        novelId: 42,
      });
      expect(key).toBeNull();
    });
  });

  describe('formatActorNames()', () => {
    const actors = [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
      { id: '3', name: 'Charlie', email: 'charlie@example.com' },
      { id: '4', name: 'David', email: 'david@example.com' },
      { id: '5', name: 'Eve', email: 'eve@example.com' },
    ];

    it('should format 1 actor name', () => {
      const result = formatActorNames([actors[0]], 1);
      expect(result).toBe('Alice');
    });

    it('should format 2 actor names', () => {
      const result = formatActorNames(actors.slice(0, 2), 2);
      expect(result).toBe('Alice and Bob');
    });

    it('should format 3 actor names', () => {
      const result = formatActorNames(actors.slice(0, 3), 3);
      expect(result).toBe('Alice, Bob and Charlie');
    });

    it('should format when count exceeds actors array (aggregated)', () => {
      const result = formatActorNames(actors.slice(0, 3), 10);
      expect(result).toBe('Alice, Bob, Charlie and 7 others');
    });

    it('should format 100+ actors', () => {
      const result = formatActorNames(actors.slice(0, 3), 150);
      expect(result).toBe('Alice, Bob, Charlie and 147 others');
    });

    it('should handle actors without names (use email)', () => {
      const noNameActors = [
        { id: '1', name: null, email: 'alice@example.com' },
        { id: '2', name: null, email: 'bob@example.com' },
      ];
      const result = formatActorNames(noNameActors, 2);
      expect(result).toBe('alice@example.com and bob@example.com');
    });
  });

  describe('createNotificationTitle()', () => {
    describe('RATING_REPLY', () => {
      it('should create title for single reply', () => {
        const title = createNotificationTitle({
          type: 'RATING_REPLY',
          actorName: 'Alice',
          isAggregated: false,
        });
        expect(title).toBe('Alice replied to your rating');
      });

      it('should create title for aggregated replies', () => {
        const title = createNotificationTitle({
          type: 'RATING_REPLY',
          actorName: 'Alice, Bob and 3 others',
          isAggregated: true,
        });
        expect(title).toBe('Alice, Bob and 3 others replied to your rating');
      });
    });

    describe('RATING_LIKE', () => {
      it('should create title for single like', () => {
        const title = createNotificationTitle({
          type: 'RATING_LIKE',
          actorName: 'Bob',
          isAggregated: false,
        });
        expect(title).toBe('Bob liked your rating');
      });

      it('should create title for aggregated likes', () => {
        const title = createNotificationTitle({
          type: 'RATING_LIKE',
          actorName: 'Alice, Bob and 98 others',
          isAggregated: true,
        });
        expect(title).toBe('Alice, Bob and 98 others liked your rating');
      });
    });

    describe('COMMENT_REPLY', () => {
      it('should create title for comment reply', () => {
        const title = createNotificationTitle({
          type: 'COMMENT_REPLY',
          actorName: 'Charlie',
          isAggregated: false,
        });
        expect(title).toBe('Charlie replied to your comment');
      });
    });

    describe('COMMENT_LIKE', () => {
      it('should create title for comment like', () => {
        const title = createNotificationTitle({
          type: 'COMMENT_LIKE',
          actorName: 'David',
          isAggregated: false,
        });
        expect(title).toBe('David liked your comment');
      });
    });

    describe('AUTHOR_NEW_NOVEL', () => {
      it('should create title for new novel', () => {
        const title = createNotificationTitle({
          type: 'AUTHOR_NEW_NOVEL',
          actorName: 'Eve',
          novelTitle: 'The Truth Switch',
        });
        expect(title).toBe('Eve published a new novel');
      });
    });

    describe('AUTHOR_NEW_CHAPTER', () => {
      it('should create title for new chapter', () => {
        const title = createNotificationTitle({
          type: 'AUTHOR_NEW_CHAPTER',
          actorName: 'Eve',
          novelTitle: 'The Truth Switch',
        });
        expect(title).toBe('Eve updated "The Truth Switch"');
      });
    });

    describe('NOVEL_UPDATE', () => {
      it('should create title for novel update', () => {
        const title = createNotificationTitle({
          type: 'NOVEL_UPDATE',
          novelTitle: 'The Truth Switch',
        });
        expect(title).toBe('"The Truth Switch" has been updated');
      });
    });

    describe('NOVEL_RATING (author notification)', () => {
      it('should create title for novel rating', () => {
        const title = createNotificationTitle({
          type: 'NOVEL_RATING',
          actorName: 'Alice',
          novelTitle: 'My Novel',
        });
        expect(title).toBe('Alice rated your novel "My Novel"');
      });
    });

    describe('NOVEL_COMMENT (author notification)', () => {
      it('should create title for novel comment', () => {
        const title = createNotificationTitle({
          type: 'NOVEL_COMMENT',
          actorName: 'Bob',
          novelTitle: 'My Novel',
        });
        expect(title).toBe('Bob commented on your novel "My Novel"');
      });
    });

    describe('NEW_FOLLOWER', () => {
      it('should create title for single follower', () => {
        const title = createNotificationTitle({
          type: 'NEW_FOLLOWER',
          actorName: 'Charlie',
          isAggregated: false,
        });
        expect(title).toBe('Charlie followed you');
      });

      it('should create title for multiple followers', () => {
        const title = createNotificationTitle({
          type: 'NEW_FOLLOWER',
          actorName: 'Charlie, David and 8 others',
          isAggregated: true,
        });
        expect(title).toBe('Charlie, David and 8 others followed you');
      });
    });

    describe('LEVEL_UP', () => {
      it('should create title for level up', () => {
        const title = createNotificationTitle({
          type: 'LEVEL_UP',
          level: 5,
        });
        expect(title).toBe("Congratulations! You've reached Lv.5");
      });
    });

    describe('SYSTEM_ANNOUNCEMENT', () => {
      it('should use custom title for system announcement', () => {
        const title = createNotificationTitle({
          type: 'SYSTEM_ANNOUNCEMENT',
          customTitle: 'System Maintenance Notice',
        });
        expect(title).toBe('System Maintenance Notice');
      });

      it('should use default title when no custom title provided', () => {
        const title = createNotificationTitle({
          type: 'SYSTEM_ANNOUNCEMENT',
        });
        expect(title).toBe('System Notification');
      });
    });
  });

  describe('createNotificationContent()', () => {
    it('should create content for RATING_REPLY', () => {
      const content = createNotificationContent({
        type: 'RATING_REPLY',
        replyContent: 'I agree with you!',
      });
      expect(content).toBe('I agree with you!');
    });

    it('should create content for AUTHOR_NEW_CHAPTER', () => {
      const content = createNotificationContent({
        type: 'AUTHOR_NEW_CHAPTER',
        chapterTitle: 'Chapter 42: New Beginning',
      });
      expect(content).toBe('Chapter 42: New Beginning');
    });

    it('should create content for NOVEL_RATING', () => {
      const content = createNotificationContent({
        type: 'NOVEL_RATING',
        score: 10,
      });
      expect(content).toBe('⭐⭐⭐⭐⭐');
    });

    it('should return null for types without content', () => {
      const content = createNotificationContent({
        type: 'RATING_LIKE',
      });
      expect(content).toBeNull();
    });
  });

  describe('createNotificationLink()', () => {
    it('should create link for RATING_REPLY', () => {
      const link = createNotificationLink({
        type: 'RATING_REPLY',
        novelId: 42,
        novelSlug: 'the-truth-switch',
        ratingId: 'rating123',
      });
      expect(link).toBe('/novels/the-truth-switch?openRating=rating123');
    });

    it('should create link for COMMENT_REPLY', () => {
      const link = createNotificationLink({
        type: 'COMMENT_REPLY',
        novelId: 42,
        novelSlug: 'the-truth-switch',
        chapterId: 5,
        chapterNumber: 5,
        commentId: 'comment456',
      });
      expect(link).toBe('/novels/the-truth-switch/chapters/5?openComment=comment456');
    });

    it('should create link for AUTHOR_NEW_CHAPTER', () => {
      const link = createNotificationLink({
        type: 'AUTHOR_NEW_CHAPTER',
        novelId: 42,
        novelSlug: 'the-truth-switch',
        chapterId: 10,
        chapterNumber: 10,
      });
      expect(link).toBe('/novels/the-truth-switch/chapters/10');
    });

    it('should create link for AUTHOR_NEW_NOVEL', () => {
      const link = createNotificationLink({
        type: 'AUTHOR_NEW_NOVEL',
        novelId: 99,
        novelSlug: 'new-novel',
      });
      expect(link).toBe('/novels/new-novel?openRatings=true');
    });

    it('should create link for NEW_FOLLOWER', () => {
      const link = createNotificationLink({
        type: 'NEW_FOLLOWER',
        actorId: 'user123',
      });
      expect(link).toBe('/profile/user123');
    });

    it('should return null for SYSTEM_ANNOUNCEMENT without custom link', () => {
      const link = createNotificationLink({
        type: 'SYSTEM_ANNOUNCEMENT',
      });
      expect(link).toBeNull();
    });
  });
});
