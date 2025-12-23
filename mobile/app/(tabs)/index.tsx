import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatNumber } from '@/lib/utils/format';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT - 140; // 减去 Tab 栏和状态栏高度

// 模拟数据（后续替换为 API）
const MOCK_STORIES = [
  {
    id: 1,
    title: 'The CEO\'s Secret Love',
    blurb: 'She thought she was just a temp, but when the mysterious CEO starts paying attention to her, everything changes...',
    authorName: 'Romance Writer',
    likeCount: 12500,
    commentCount: 342,
    averageRating: 4.5,
    wordCount: 18000,
  },
  {
    id: 2,
    title: 'Reborn: The Revenge Begins',
    blurb: 'After being betrayed by her best friend and fiancé, she wakes up five years in the past. This time, she won\'t make the same mistakes...',
    authorName: 'Destiny Author',
    likeCount: 8900,
    commentCount: 567,
    averageRating: 4.8,
    wordCount: 22000,
  },
  {
    id: 3,
    title: 'The Hidden Billionaire',
    blurb: 'Everyone laughed at him for being poor. Little did they know, he was the heir to the largest fortune in the country...',
    authorName: 'Mystery Pen',
    likeCount: 25000,
    commentCount: 1200,
    averageRating: 4.6,
    wordCount: 15000,
  },
];

interface Story {
  id: number;
  title: string;
  blurb: string;
  authorName: string;
  likeCount: number;
  commentCount: number;
  averageRating: number;
  wordCount: number;
}

function StoryCard({ story }: { story: Story }) {
  const router = useRouter();
  const readTime = Math.ceil(story.wordCount / 1000); // 粗略估算阅读时间

  return (
    <Pressable
      onPress={() => router.push(`/reader/${story.id}`)}
      style={{ height: CARD_HEIGHT }}
      className="bg-white mx-4 my-2 rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* 内容区域 */}
      <View className="flex-1 p-6 justify-between">
        {/* 顶部：分类标签 */}
        <View className="flex-row">
          <View className="bg-butter-100 px-3 py-1 rounded-full">
            <Text className="text-butter-700 text-xs font-medium">Romance</Text>
          </View>
        </View>

        {/* 中间：标题和简介 */}
        <View className="flex-1 justify-center py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            {story.title}
          </Text>
          <Text className="text-gray-600 text-base leading-6" numberOfLines={4}>
            {story.blurb}
          </Text>
        </View>

        {/* 底部：作者和统计 */}
        <View>
          {/* 作者 */}
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center">
              <Text className="text-gray-500 font-semibold">
                {story.authorName.charAt(0)}
              </Text>
            </View>
            <View className="ml-3">
              <Text className="text-gray-900 font-medium">{story.authorName}</Text>
              <Text className="text-gray-400 text-sm">{readTime} min read</Text>
            </View>
          </View>

          {/* 统计和操作 */}
          <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
            <View className="flex-row items-center">
              <Text className="text-yellow-500 font-semibold mr-1">★ {story.averageRating}</Text>
            </View>
            <View className="flex-row items-center space-x-6">
              <Pressable className="flex-row items-center">
                <Ionicons name="heart" size={20} color="#9ca3af" />
                <Text className="text-gray-500 ml-1">{formatNumber(story.likeCount)}</Text>
              </Pressable>
              <Pressable className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={20} color="#9ca3af" />
                <Text className="text-gray-500 ml-1">{formatNumber(story.commentCount)}</Text>
              </Pressable>
              <Pressable>
                <Ionicons name="bookmark" size={20} color="#9ca3af" />
              </Pressable>
              <Pressable>
                <Ionicons name="share-social" size={20} color="#9ca3af" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ForYouScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // 暂时使用模拟数据
  const stories = MOCK_STORIES;
  const isLoading = false;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // 模拟刷新
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* 顶部搜索栏 */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={() => router.push('/search')}
          className="flex-row items-center bg-gray-100 rounded-full px-4 py-3"
        >
          <Ionicons name="search" size={20} color="#9ca3af" />
          <Text className="text-gray-400 ml-2">Search stories...</Text>
        </Pressable>
      </View>

      {/* 故事列表 */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#eab308" />
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={({ item }) => <StoryCard story={item} />}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled
          snapToInterval={CARD_HEIGHT + 16}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#eab308"
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </SafeAreaView>
  );
}
