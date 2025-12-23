import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-4">👤</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Your Profile</Text>
        <Text className="text-gray-500 text-center mb-6">
          Sign in to access your profile and settings
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

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        {/* 用户信息 */}
        <View className="bg-white px-4 py-6 mb-2">
          <View className="flex-row items-center">
            <View className="w-20 h-20 bg-brand-100 rounded-full items-center justify-center">
              <Text className="text-brand-600 text-3xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {user?.name || 'User'}
              </Text>
              <Text className="text-gray-400">{user?.email}</Text>
              <Pressable className="mt-2">
                <Text className="text-brand-600 font-medium">Edit Profile</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 统计数据 */}
        <View className="bg-white px-4 py-4 mb-2">
          <View className="flex-row justify-around">
            <View className="items-center">
              <View className="flex-row items-center">
                <Ionicons name="book" size={18} color="#3b82f6" />
                <Text className="text-xl font-bold text-gray-900 ml-1">12</Text>
              </View>
              <Text className="text-gray-400 text-sm">Read</Text>
            </View>
            <View className="items-center">
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={18} color="#3b82f6" />
                <Text className="text-xl font-bold text-gray-900 ml-1">3</Text>
              </View>
              <Text className="text-gray-400 text-sm">Written</Text>
            </View>
            <View className="items-center">
              <View className="flex-row items-center">
                <Ionicons name="heart" size={18} color="#3b82f6" />
                <Text className="text-xl font-bold text-gray-900 ml-1">156</Text>
              </View>
              <Text className="text-gray-400 text-sm">Likes</Text>
            </View>
            <View className="items-center">
              <View className="flex-row items-center">
                <Ionicons name="people" size={18} color="#3b82f6" />
                <Text className="text-xl font-bold text-gray-900 ml-1">24</Text>
              </View>
              <Text className="text-gray-400 text-sm">Followers</Text>
            </View>
          </View>
        </View>

        {/* 菜单项 */}
        <View className="bg-white mb-2">
          <MenuItem
            icon={<Ionicons name="notifications" size={22} color="#6b7280" />}
            label="Notifications"
            onPress={() => router.push('/notifications')}
          />
          <MenuItem
            icon={<Ionicons name="settings" size={22} color="#6b7280" />}
            label="Settings"
            onPress={() => router.push('/settings')}
          />
          <MenuItem
            icon={<Ionicons name="help-circle" size={22} color="#6b7280" />}
            label="Help & Support"
            onPress={() => {}}
          />
        </View>

        {/* 登出 */}
        <View className="bg-white">
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center px-4 py-4"
          >
            <Ionicons name="log-out" size={22} color="#ef4444" />
            <Text className="ml-3 text-red-500 font-medium">Sign Out</Text>
          </Pressable>
        </View>

        {/* 版本信息 */}
        <View className="py-6 items-center">
          <Text className="text-gray-400 text-sm">ButterNovel v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50"
    >
      <View className="flex-row items-center">
        {icon}
        <Text className="ml-3 text-gray-700">{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </Pressable>
  );
}
