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
import { api } from '@/lib/api/client';
import { formatNumber } from '@/lib/utils/format';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 60;
const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44;
const ITEM_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

// 故事类型定义
interface Story {
  id: string;
  title: string;
  blurb: string;
  authorId: string;
  authorName: string;
  coverImage?: string;
  likeCount: number;
  commentCount: number;
  readCount: number;
  wordCount: number;
  category: string;
  createdAt: string;
}

interface StoriesResponse {
  stories: Story[];
  nextCursor?: string;
}

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
      await api.post(`/stories/${story.id}/like`, {});
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleComment = () => {
    router.push(`/story/${story.id}/comments`);
  };

  const handleBookmark = async () => {
    try {
      await api.post(`/bookshelf/add`, { storyId: story.id });
    } catch (error) {
      console.error('Bookmark failed:', error);
    }
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

// 临时模拟数据（API 连接后删除）
const MOCK_STORIES: Story[] = [
  {
    id: '1',
    title: '重生之都市修仙',
    blurb: '一代仙尊渡劫失败，重生到都市少年身上。且看他如何在这钢筋水泥的丛林中，重新踏上修仙之路...',
    authorId: '1',
    authorName: '作者',
    likeCount: 12500,
    commentCount: 342,
    readCount: 85000,
    wordCount: 180000,
    category: '都市',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: '星际争霸：人类崛起',
    blurb: '当人类第一次踏入星际时代，才发现宇宙中早已群雄割据。在这弱肉强食的星际时代，人类该何去何从...',
    authorId: '1',
    authorName: '作者',
    likeCount: 8900,
    commentCount: 567,
    readCount: 62000,
    wordCount: 220000,
    category: '科幻',
    createdAt: '2024-01-10',
  },
  {
    id: '3',
    title: '龙王殿',
    blurb: '他是华夏最强战神，却为了一个女人甘愿隐姓埋名。三年后，王者归来，天下震动...',
    authorId: '1',
    authorName: '作者',
    likeCount: 25000,
    commentCount: 1200,
    readCount: 150000,
    wordCount: 350000,
    category: '玄幻',
    createdAt: '2024-01-05',
  },
];

export default function ForYouScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // TODO: API 连接后替换为真实数据
  // const { data, isLoading, isError, refetch, isFetching } = useQuery<StoriesResponse>({
  //   queryKey: ['stories', 'for-you'],
  //   queryFn: () => api.get<StoriesResponse>('/stories/feed'),
  //   staleTime: 1000 * 60 * 5,
  // });
  // const stories = data?.stories || [];

  const stories = MOCK_STORIES;
  const isLoading = false;
  const isError = false;
  const isFetching = false;
  const refetch = () => {};

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

  // 渲染错误状态
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Ionicons name="cloud-offline-outline" size={64} color="#64748b" />
        <Text className="text-slate-400 text-lg mt-4">Failed to load stories</Text>
        <Pressable
          onPress={() => refetch()}
          className="mt-6 px-6 py-3 bg-brand-500 rounded-full"
        >
          <Text className="text-white font-medium">Try Again</Text>
        </Pressable>
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
