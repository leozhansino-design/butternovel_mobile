import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

const MOCK_UPDATES = [
  {
    id: 1,
    authorName: 'Romance Writer',
    storyTitle: 'New Chapter: The CEO\'s Secret',
    timeAgo: '2h ago',
    genre: 'Romance',
    wordCount: 3500,
  },
  {
    id: 2,
    authorName: 'Destiny Author',
    storyTitle: 'Reborn: Chapter 45 Released',
    timeAgo: '5h ago',
    genre: 'Rebirth',
    wordCount: 4200,
  },
];

export default function FollowingScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-4">👥</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Follow Authors</Text>
        <Text className="text-gray-500 text-center mb-6">
          Sign in to follow your favorite authors and see their latest stories
        </Text>
        <Pressable
          onPress={() => router.push('/auth/login')}
          className="bg-brand-500 px-8 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold">Following</Text>
      </View>

      <FlatList
        data={MOCK_UPDATES}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/reader/${item.id}`)}
            className="px-4 py-4 border-b border-gray-50"
          >
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center">
                <Text className="text-gray-500 font-semibold">
                  {item.authorName.charAt(0)}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900">{item.authorName}</Text>
                <Text className="text-gray-400 text-sm">{item.timeAgo}</Text>
              </View>
            </View>
            <Text className="text-gray-900 font-medium mb-1">{item.storyTitle}</Text>
            <View className="flex-row items-center">
              <View className="bg-brand-100 px-2 py-0.5 rounded">
                <Text className="text-brand-700 text-xs">{item.genre}</Text>
              </View>
              <Text className="text-gray-400 text-sm ml-2">
                {Math.ceil(item.wordCount / 1000)} min read
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400">No updates from followed authors</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
