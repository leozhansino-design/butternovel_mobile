import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Edit3, Eye, Heart } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { formatNumber } from '@/lib/utils/format';

const MOCK_MY_STORIES = [
  {
    id: 1,
    title: 'My First Story',
    isDraft: true,
    viewCount: 0,
    likeCount: 0,
    wordCount: 5000,
    updatedAt: '2024-01-15',
  },
  {
    id: 2,
    title: 'Published Work',
    isDraft: false,
    viewCount: 1250,
    likeCount: 89,
    wordCount: 18000,
    updatedAt: '2024-01-10',
  },
];

export default function CreateScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-4">✍️</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Start Creating</Text>
        <Text className="text-gray-500 text-center mb-6">
          Sign in to write and publish your own stories
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 顶部标题 */}
      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold">My Works</Text>
      </View>

      {/* 创建按钮 */}
      <Pressable
        onPress={() => router.push('/create/new')}
        className="mx-4 mt-4 flex-row items-center justify-center p-4 bg-butter-500 rounded-xl"
      >
        <Plus size={24} color="#fff" />
        <Text className="ml-2 text-white font-semibold text-lg">
          Create New Story
        </Text>
      </Pressable>

      {/* 作品列表 */}
      <FlatList
        data={MOCK_MY_STORIES}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/create/${item.id}/edit`)}
            className="flex-row items-center p-4 mb-3 bg-gray-50 rounded-xl"
          >
            {/* 封面占位 */}
            <View className="w-16 h-20 bg-gray-200 rounded-lg items-center justify-center">
              <Edit3 size={24} color="#9ca3af" />
            </View>

            <View className="flex-1 ml-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-lg flex-1" numberOfLines={1}>
                  {item.title}
                </Text>
                <View
                  className={`px-2 py-1 rounded ${
                    item.isDraft ? 'bg-gray-200' : 'bg-green-100'
                  }`}
                >
                  <Text
                    className={item.isDraft ? 'text-gray-600 text-xs' : 'text-green-600 text-xs'}
                  >
                    {item.isDraft ? 'Draft' : 'Published'}
                  </Text>
                </View>
              </View>

              <Text className="text-gray-400 text-sm mt-1">
                {Math.ceil(item.wordCount / 1000)}k words
              </Text>

              <View className="flex-row items-center mt-2">
                <Eye size={14} color="#9ca3af" />
                <Text className="ml-1 mr-4 text-gray-500 text-sm">
                  {formatNumber(item.viewCount)}
                </Text>
                <Heart size={14} color="#9ca3af" />
                <Text className="ml-1 text-gray-500 text-sm">
                  {formatNumber(item.likeCount)}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Edit3 size={48} color="#9ca3af" />
            <Text className="mt-4 text-gray-500">
              You haven't created any stories yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
