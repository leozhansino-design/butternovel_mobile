import { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';

type TabType = 'favorites' | 'history';

const MOCK_FAVORITES = [
  {
    id: 1,
    title: 'The CEO\'s Secret Love',
    authorName: 'Romance Writer',
    progress: 45,
    lastRead: '2 days ago',
  },
  {
    id: 2,
    title: 'Reborn: The Revenge Begins',
    authorName: 'Destiny Author',
    progress: 80,
    lastRead: '1 week ago',
  },
];

const MOCK_HISTORY = [
  {
    id: 3,
    title: 'The Hidden Billionaire',
    authorName: 'Mystery Pen',
    progress: 100,
    lastRead: '3 days ago',
  },
];

export default function BookshelfScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('favorites');

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-4">📚</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Your Bookshelf</Text>
        <Text className="text-gray-500 text-center mb-6">
          Sign in to save your favorite stories and track reading progress
        </Text>
        <Pressable
          onPress={() => router.push('/auth/login')}
          className="bg-butter-500 px-8 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const data = activeTab === 'favorites' ? MOCK_FAVORITES : MOCK_HISTORY;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 顶部标题 */}
      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold">Bookshelf</Text>
      </View>

      {/* Tab 切换 */}
      <View className="flex-row px-4 py-3 border-b border-gray-100">
        <Pressable
          onPress={() => setActiveTab('favorites')}
          className={`flex-row items-center mr-6 pb-2 ${
            activeTab === 'favorites' ? 'border-b-2 border-butter-500' : ''
          }`}
        >
          <Ionicons
            name="bookmark"
            size={18}
            color={activeTab === 'favorites' ? '#eab308' : '#9ca3af'}
          />
          <Text
            className={`ml-1 font-medium ${
              activeTab === 'favorites' ? 'text-butter-600' : 'text-gray-400'
            }`}
          >
            Favorites
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('history')}
          className={`flex-row items-center pb-2 ${
            activeTab === 'history' ? 'border-b-2 border-butter-500' : ''
          }`}
        >
          <Ionicons
            name="time"
            size={18}
            color={activeTab === 'history' ? '#eab308' : '#9ca3af'}
          />
          <Text
            className={`ml-1 font-medium ${
              activeTab === 'history' ? 'text-butter-600' : 'text-gray-400'
            }`}
          >
            History
          </Text>
        </Pressable>
      </View>

      {/* 列表 */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/reader/${item.id}`)}
            className="flex-row items-center p-4 mb-3 bg-gray-50 rounded-xl"
          >
            <View className="w-14 h-18 bg-gray-200 rounded-lg items-center justify-center">
              <Ionicons name="book" size={24} color="#9ca3af" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="font-semibold text-gray-900" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-gray-400 text-sm mt-0.5">{item.authorName}</Text>
              <View className="flex-row items-center mt-2">
                {/* 进度条 */}
                <View className="flex-1 h-1.5 bg-gray-200 rounded-full mr-3">
                  <View
                    className="h-full bg-butter-500 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </View>
                <Text className="text-gray-400 text-xs">{item.progress}%</Text>
              </View>
              <Text className="text-gray-400 text-xs mt-1">{item.lastRead}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Ionicons name="book" size={48} color="#9ca3af" />
            <Text className="mt-4 text-gray-500">
              {activeTab === 'favorites'
                ? 'No favorites yet'
                : 'No reading history'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
