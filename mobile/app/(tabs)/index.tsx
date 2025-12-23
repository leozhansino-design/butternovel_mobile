import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Pressable,
  ActivityIndicator,
  ViewToken,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useQuery } from '@tanstack/react-query';
import { shortsApi, Story, StoriesResponse } from '@/lib/api/client';
import { formatNumber } from '@/lib/utils/format';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '@/lib/config';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44;
const ITEM_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

// Story 类型从 @/lib/api/client 导入

// 右侧操作按钮组件
function ActionButtons({ story, onLike, onComment, onBookmark, onShare }: {
  story: Story;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    onLike();
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark();
  };

  return (
    <View className="absolute right-4 bottom-32 items-center space-y-6">
      {/* 点赞 */}
      <Pressable onPress={handleLike} className="items-center">
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={28}
            color={liked ? "#ef4444" : "#fff"}
          />
        </View>
        <Text className="text-white text-xs mt-1 font-medium">
          {formatNumber(story.likeCount + (liked ? 1 : 0))}
        </Text>
      </Pressable>

      {/* 评论 */}
      <Pressable onPress={onComment} className="items-center">
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
          <Ionicons name="chatbubble-outline" size={26} color="#fff" />
        </View>
        <Text className="text-white text-xs mt-1 font-medium">
          {formatNumber(story.commentCount)}
        </Text>
      </Pressable>

      {/* 收藏 */}
      <Pressable onPress={handleBookmark} className="items-center">
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={26}
            color={bookmarked ? "#3b82f6" : "#fff"}
          />
        </View>
        <Text className="text-white text-xs mt-1 font-medium">
          {bookmarked ? "Saved" : "Save"}
        </Text>
      </Pressable>

      {/* 分享 */}
      <Pressable onPress={onShare} className="items-center">
        <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
          <Ionicons name="share-social-outline" size={26} color="#fff" />
        </View>
        <Text className="text-white text-xs mt-1 font-medium">Share</Text>
      </Pressable>
    </View>
  );
}

// 全屏故事卡片组件
function FullScreenStoryCard({ story, isActive }: { story: Story; isActive: boolean }) {
  const router = useRouter();
  const readTime = Math.ceil(story.wordCount / 1000);

  const handlePress = () => {
    router.push(`/reader/${story.id}`);
  };

  const handleLike = async () => {
    try {
      await shortsApi.like(story.id);
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleComment = () => {
    router.push(`/story/${story.id}/comments`);
  };

  const handleBookmark = async () => {
    // TODO: 实现收藏功能
  };

  const handleShare = () => {
    // TODO: 实现分享功能
  };

  return (
    <Pressable onPress={handlePress} style={{ height: ITEM_HEIGHT, width: SCREEN_WIDTH }}>
      {/* 背景渐变 */}
      <LinearGradient
        colors={['#1e3a8a', '#3b82f6', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* 内容区域 */}
        <View className="flex-1 justify-end pb-8 px-4">
          {/* 分类标签 */}
          <View className="flex-row mb-4">
            <BlurView intensity={40} tint="light" className="px-3 py-1 rounded-full overflow-hidden">
              <Text className="text-white text-xs font-medium">{story.category}</Text>
            </BlurView>
          </View>

          {/* 标题 */}
          <Text className="text-white text-2xl font-bold mb-3" numberOfLines={2}>
            {story.title}
          </Text>

          {/* 简介 */}
          <Text className="text-white/80 text-base leading-6 mb-6" numberOfLines={4}>
            {story.blurb}
          </Text>

          {/* 作者信息 */}
          <View className="flex-row items-center mb-6">
            <View className="w-10 h-10 bg-white/30 rounded-full items-center justify-center">
              <Text className="text-white font-semibold">
                {story.authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white font-medium">{story.authorName}</Text>
              <Text className="text-white/60 text-sm">
                {readTime} min read · {formatNumber(story.readCount)} reads
              </Text>
            </View>
          </View>

          {/* 开始阅读按钮 */}
          <BlurView intensity={60} tint="light" className="rounded-xl overflow-hidden">
            <Pressable
              onPress={handlePress}
              className="py-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">Start Reading</Text>
            </Pressable>
          </BlurView>
        </View>

        {/* 右侧操作按钮 */}
        <ActionButtons
          story={story}
          onLike={handleLike}
          onComment={handleComment}
          onBookmark={handleBookmark}
          onShare={handleShare}
        />
      </LinearGradient>
    </Pressable>
  );
}

// 临时模拟数据 - API 部署后可删除
const MOCK_STORIES: Story[] = [
  {
    id: '1',
    title: 'The Hidden Heir',
    blurb: 'Everyone thought he was just a poor delivery boy. But when his grandfather, the richest man in the country, suddenly passes away, his true identity is revealed...',
    authorId: '1',
    authorName: 'ButterNovel',
    likeCount: 125000,
    commentCount: 3420,
    readCount: 850000,
    wordCount: 18000,
    category: 'Urban',
    createdAt: '2024-01-15',
    averageRating: 4.8,
    slug: 'the-hidden-heir',
  },
  {
    id: '2',
    title: 'Rebirth of the CEO',
    blurb: 'After being betrayed by her husband and best friend, she wakes up 10 years in the past. This time, she will build her own empire and make them pay...',
    authorId: '1',
    authorName: 'ButterNovel',
    likeCount: 89000,
    commentCount: 5670,
    readCount: 620000,
    wordCount: 22000,
    category: 'Rebirth',
    createdAt: '2024-01-10',
    averageRating: 4.9,
    slug: 'rebirth-of-the-ceo',
  },
  {
    id: '3',
    title: 'Dragon King Returns',
    blurb: 'He was the most feared warrior in history, but disappeared for 3 years. Now he returns to find his wife being bullied. Heaven will tremble...',
    authorId: '1',
    authorName: 'ButterNovel',
    likeCount: 250000,
    commentCount: 12000,
    readCount: 1500000,
    wordCount: 25000,
    category: 'Fantasy',
    createdAt: '2024-01-05',
    averageRating: 4.7,
    slug: 'dragon-king-returns',
  },
];

export default function ForYouScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // 尝试从 API 获取，失败则使用模拟数据
  const { data, isLoading, refetch, isFetching } = useQuery<StoriesResponse>({
    queryKey: ['shorts', 'for-you'],
    queryFn: () => shortsApi.getList(1, 20),
    staleTime: APP_CONFIG.CACHE_STALE_TIME,
    retry: 1,
  });

  // API 成功则用真实数据，否则用模拟数据
  const stories = data?.stories?.length ? data.stories : MOCK_STORIES;

  // 监听当前可见项
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center bg-slate-900" style={{ height: ITEM_HEIGHT }}>
      <Ionicons name="book-outline" size={64} color="#64748b" />
      <Text className="text-slate-400 text-lg mt-4">No stories yet</Text>
      <Text className="text-slate-500 text-sm mt-2">Check back later for new content</Text>
      <Pressable
        onPress={() => refetch()}
        className="mt-6 px-6 py-3 bg-brand-500 rounded-full"
      >
        <Text className="text-white font-medium">Refresh</Text>
      </Pressable>
    </View>
  );

  // 渲染加载状态
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 mt-4">Loading stories...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 顶部搜索栏 - 使用毛玻璃效果 */}
      <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: STATUS_BAR_HEIGHT }}>
        <BlurView intensity={50} tint="dark" className="mx-4 my-3 rounded-full overflow-hidden">
          <Pressable
            onPress={() => router.push('/search')}
            className="flex-row items-center px-4 py-3"
          >
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
            <Text className="text-white/60 ml-2">Search stories...</Text>
          </Pressable>
        </BlurView>
      </View>

      {/* TikTok 风格全屏滚动列表 */}
      <FlatList
        ref={flatListRef}
        data={stories}
        renderItem={({ item, index }) => (
          <FullScreenStoryCard story={item} isActive={index === activeIndex} />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        ListEmptyComponent={renderEmptyState}
        onRefresh={refetch}
        refreshing={isFetching}
      />

      {/* 页面指示器 */}
      {stories.length > 1 && (
        <View className="absolute right-2 top-1/2 -translate-y-1/2 space-y-1">
          {stories.slice(0, 5).map((_, index) => (
            <View
              key={index}
              className={`w-1 h-4 rounded-full ${
                index === activeIndex ? 'bg-brand-500' : 'bg-white/30'
              }`}
            />
          ))}
          {stories.length > 5 && (
            <Text className="text-white/50 text-xs">+{stories.length - 5}</Text>
          )}
        </View>
      )}
    </View>
  );
}
