import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.back();
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* 关闭按钮 */}
        <View className="flex-row justify-end px-4 py-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="close" size={24} color="#6b7280" />
          </Pressable>
        </View>

        <View className="flex-1 px-6 justify-center">
          {/* Logo/标题 */}
          <View className="items-center mb-10">
            <Text className="text-4xl font-bold text-butter-600 mb-2">
              ButterNovel
            </Text>
            <Text className="text-gray-500">Welcome back!</Text>
          </View>

          {/* 错误提示 */}
          {error ? (
            <View className="bg-red-50 px-4 py-3 rounded-lg mb-4">
              <Text className="text-red-600 text-center">{error}</Text>
            </View>
          ) : null}

          {/* 邮箱输入 */}
          <View className="mb-4">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
              <Ionicons name="mail" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-3 text-gray-900"
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* 密码输入 */}
          <View className="mb-6">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
              <Ionicons name="lock-closed" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-3 text-gray-900"
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <Ionicons name="eye-off" size={20} color="#9ca3af" />
                ) : (
                  <Ionicons name="eye" size={20} color="#9ca3af" />
                )}
              </Pressable>
            </View>
          </View>

          {/* 登录按钮 */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className={`py-4 rounded-xl items-center ${
              isLoading ? 'bg-butter-300' : 'bg-butter-500'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-lg">Sign In</Text>
            )}
          </Pressable>

          {/* 注册链接 */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500">Don't have an account? </Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text className="text-butter-600 font-medium">Sign Up</Text>
            </Pressable>
          </View>

          {/* 分隔线 */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-400">or continue with</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* 社交登录 */}
          <View className="flex-row justify-center space-x-4">
            <Pressable className="flex-1 flex-row items-center justify-center py-3 border border-gray-200 rounded-xl">
              <Text className="text-gray-700 font-medium">Google</Text>
            </Pressable>
            <Pressable className="flex-1 flex-row items-center justify-center py-3 border border-gray-200 rounded-xl ml-3">
              <Text className="text-gray-700 font-medium">Apple</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
