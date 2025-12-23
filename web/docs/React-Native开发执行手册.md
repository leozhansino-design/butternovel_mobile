# ButterNovel React Native 开发执行手册

> 短篇小说 App - 从零到上架的完整步骤指南

**版本**: 4.0
**更新日期**: 2025-12-23

---

## 目录

1. [环境准备](#第一步-环境准备)
2. [项目初始化](#第二步-项目初始化)
3. [核心开发](#第三步-核心开发)
4. [代码复用指南](#第四步-代码复用指南)
5. [推送通知实现](#第五步-推送通知实现)
6. [测试完整指南](#第六步-测试完整指南)
7. [构建发布](#第七步-构建发布)
8. [商店上架](#第八步-商店上架)
9. [常见问题](#常见问题)

---

## 第一步: 环境准备

### 1.1 开发者账号注册 (优先完成)

```bash
# ⚠️ 优先完成，审核需要时间！

# Apple Developer Program
# 费用: $99/年
# 网址: https://developer.apple.com/programs/
# 审核时间: 24-48小时

# Google Play Console
# 费用: $25 一次性
# 网址: https://play.google.com/console
# 审核时间: 即时
```

### 1.2 开发环境安装 (macOS)

```bash
# 1. 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装 Node.js (LTS版本)
brew install node@20

# 3. 安装 Watchman
brew install watchman

# 4. 安装 CocoaPods (iOS)
sudo gem install cocoapods

# 5. 安装 Xcode (从 App Store)
# 打开 Xcode > Settings > Locations > Command Line Tools

# 6. 安装 Android Studio
# 下载: https://developer.android.com/studio
# 安装 SDK: Android 14 (API 34)
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc

# 7. 安装 EAS CLI
npm install -g eas-cli

# 8. 登录 Expo
npx expo login
```

### 1.3 开发环境安装 (Windows)

> Windows 只能开发 Android，iOS 需要 Mac

```powershell
# 1. 安装 Node.js
# 下载 https://nodejs.org/ LTS 版本

# 2. 安装 Android Studio
# 下载 https://developer.android.com/studio

# 3. 配置环境变量
# 系统设置 > 环境变量
# 新建 ANDROID_HOME = C:\Users\你的用户名\AppData\Local\Android\Sdk
# Path 添加 %ANDROID_HOME%\platform-tools

# 4. 安装 EAS CLI
npm install -g eas-cli
```

### 1.4 验证环境

```bash
node --version      # v20.x.x
npm --version       # 10.x.x
pod --version       # 1.x.x (仅 macOS)
eas --version       # 最新版
adb --version       # Android SDK
```

---

## 第二步: 项目初始化

### 2.1 创建 Expo 项目

```bash
# 在项目根目录
cd /path/to/butternovel

# 创建 mobile 目录
npx create-expo-app@latest mobile --template blank-typescript

cd mobile
```

### 2.2 安装依赖

```bash
# 导航
npx expo install expo-router react-native-screens react-native-safe-area-context

# 状态管理
npm install @tanstack/react-query zustand

# 表单验证
npm install react-hook-form @hookform/resolvers zod

# 存储
npx expo install @react-native-async-storage/async-storage expo-secure-store

# 认证
npx expo install expo-auth-session expo-web-browser expo-crypto
npx expo install expo-apple-authentication  # Apple 登录

# UI
npx expo install react-native-reanimated react-native-gesture-handler
npm install nativewind tailwindcss
npx expo install lucide-react-native react-native-svg

# 图片
npx expo install expo-image expo-image-picker expo-image-manipulator

# 推送通知
npx expo install expo-notifications expo-device expo-constants

# 其他
npx expo install expo-linking expo-status-bar expo-splash-screen expo-sharing

# 测试
npm install --save-dev jest @testing-library/react-native @types/jest
```

### 2.3 配置 NativeWind

```bash
npx tailwindcss init
```

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        butter: {
          50: '#fefce8',
          500: '#eab308',
          700: '#a16207',
        }
      }
    },
  },
  plugins: [],
}
```

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### 2.4 项目结构

```bash
mkdir -p app/{auth,reader,story,author,create,settings,notifications}
mkdir -p app/\(tabs\)
mkdir -p components/{ui,story,reader,create}
mkdir -p lib/{api,utils,validators}
mkdir -p hooks stores services assets/{images,fonts}
mkdir -p __tests__/{lib,components,hooks}
```

### 2.5 配置 EAS

```bash
eas build:configure
```

```json
// eas.json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  },
  "submit": { "production": {} }
}
```

---

## 第三步: 核心开发

### 3.1 API 客户端

```typescript
// lib/api/client.ts
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://butternovel.com/api';

class ApiClient {
  private token: string | null = null;

  async init() {
    this.token = await SecureStore.getItemAsync('auth-token');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token 过期，清除并跳转登录
        await this.clearToken();
        throw new Error('AUTH_EXPIRED');
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async setToken(token: string) {
    this.token = token;
    await SecureStore.setItemAsync('auth-token', token);
  }

  async clearToken() {
    this.token = null;
    await SecureStore.deleteItemAsync('auth-token');
  }
}

export const api = new ApiClient();
```

### 3.2 认证状态管理

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  loginWithApple: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await api.post<{ token: string; user: User }>(
      '/auth/login',
      { email, password }
    );
    await api.setToken(response.token);
    set({ user: response.user, isAuthenticated: true });
  },

  loginWithGoogle: async (idToken) => {
    const response = await api.post<{ token: string; user: User }>(
      '/auth/google',
      { idToken }
    );
    await api.setToken(response.token);
    set({ user: response.user, isAuthenticated: true });
  },

  loginWithApple: async (identityToken) => {
    const response = await api.post<{ token: string; user: User }>(
      '/auth/apple',
      { identityToken }
    );
    await api.setToken(response.token);
    set({ user: response.user, isAuthenticated: true });
  },

  logout: async () => {
    await api.clearToken();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      await api.init();
      const response = await api.get<{ user: User }>('/profile');
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
```

### 3.3 For You 页面 (核心)

```typescript
// app/(tabs)/index.tsx
import { useState, useRef } from 'react';
import { View, FlatList, Dimensions, ViewToken } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StoryCard } from '@/components/story/StoryCard';
import { api } from '@/lib/api/client';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ForYouScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading, fetchNextPage } = useQuery({
    queryKey: ['for-you'],
    queryFn: () => api.get('/mobile/for-you'),
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  if (isLoading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-black">
      <FlatList
        data={data?.stories}
        renderItem={({ item }) => (
          <View style={{ height: SCREEN_HEIGHT }}>
            <StoryCard story={item} />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onEndReached={() => fetchNextPage()}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}
```

### 3.4 故事卡片组件

```typescript
// components/story/StoryCard.tsx
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react-native';
import { formatNumber } from '@/lib/utils/format';

interface Story {
  id: number;
  title: string;
  blurb: string;
  coverImage: string;
  authorName: string;
  authorAvatar?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export function StoryCard({ story }: { story: Story }) {
  const router = useRouter();

  return (
    <Pressable
      testID="story-card"
      onPress={() => router.push(`/reader/${story.id}`)}
      className="flex-1 relative"
    >
      {/* 背景封面 */}
      <Image
        source={{ uri: story.coverImage }}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      {/* 渐变遮罩 */}
      <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* 底部信息 */}
      <View className="absolute bottom-20 left-4 right-20">
        <View className="flex-row items-center mb-2">
          <Image
            source={{ uri: story.authorAvatar || 'default-avatar.png' }}
            className="w-10 h-10 rounded-full mr-3"
          />
          <Text className="text-white font-semibold">{story.authorName}</Text>
        </View>
        <Text className="text-white text-xl font-bold mb-2">{story.title}</Text>
        <Text className="text-white/80 text-sm" numberOfLines={3}>
          {story.blurb}
        </Text>
      </View>

      {/* 右侧操作栏 */}
      <View className="absolute right-4 bottom-32 items-center space-y-6">
        <ActionButton
          icon={<Heart size={28} color={story.isLiked ? "#ef4444" : "#fff"} />}
          count={story.likeCount}
        />
        <ActionButton
          icon={<MessageCircle size={28} color="#fff" />}
          count={story.commentCount}
        />
        <ActionButton
          icon={<Bookmark size={28} color={story.isBookmarked ? "#fbbf24" : "#fff"} />}
        />
        <ActionButton
          icon={<Share2 size={28} color="#fff" />}
        />
      </View>
    </Pressable>
  );
}

function ActionButton({ icon, count }: { icon: React.ReactNode; count?: number }) {
  return (
    <Pressable className="items-center">
      {icon}
      {count !== undefined && (
        <Text className="text-white text-xs mt-1">{formatNumber(count)}</Text>
      )}
    </Pressable>
  );
}
```

### 3.5 阅读器

```typescript
// app/reader/[id].tsx
import { useState, useEffect } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { api } from '@/lib/api/client';
import { useReaderStore } from '@/stores/readerStore';
import { ReaderSettings } from '@/components/reader/ReaderSettings';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { fontSize, bgColor, lineHeight } = useReaderStore();

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', id],
    queryFn: () => api.get(`/mobile/stories/${id}`),
  });

  // 自动隐藏控制栏
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  if (isLoading) return <LoadingScreen />;

  const bgStyles = {
    white: 'bg-white',
    cream: 'bg-amber-50',
    gray: 'bg-gray-100',
    black: 'bg-gray-900',
  };

  const textColors = {
    white: 'text-gray-900',
    cream: 'text-gray-900',
    gray: 'text-gray-900',
    black: 'text-gray-100',
  };

  return (
    <View className={`flex-1 ${bgStyles[bgColor]}`}>
      {/* 顶部栏 */}
      {showControls && (
        <View className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-4 pt-12 pb-4 bg-black/50">
          <Pressable onPress={() => router.back()}>
            <ChevronLeft size={28} color="#fff" />
          </Pressable>
          <Text className="text-white font-semibold text-lg" numberOfLines={1}>
            {story?.title}
          </Text>
          <Pressable onPress={() => setShowSettings(true)}>
            <Settings size={24} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* 阅读内容 */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 100 }}
        onTouchEnd={() => setShowControls(!showControls)}
      >
        <Text
          className={`${textColors[bgColor]}`}
          style={{
            fontSize: fontSize,
            lineHeight: fontSize * lineHeight,
          }}
        >
          {story?.content}
        </Text>
      </ScrollView>

      {/* 设置面板 */}
      <ReaderSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}
```

### 3.6 阅读器设置

```typescript
// stores/readerStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReaderState {
  fontSize: number;
  bgColor: 'white' | 'cream' | 'gray' | 'black';
  lineHeight: number;

  setFontSize: (size: number) => void;
  setBgColor: (color: 'white' | 'cream' | 'gray' | 'black') => void;
  setLineHeight: (height: number) => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      fontSize: 18,
      bgColor: 'cream',
      lineHeight: 1.8,

      setFontSize: (size) => set({ fontSize: size }),
      setBgColor: (color) => set({ bgColor: color }),
      setLineHeight: (height) => set({ lineHeight: height }),
    }),
    {
      name: 'reader-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 3.7 创作页面

```typescript
// app/(tabs)/create.tsx
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit3, Eye, Heart } from 'lucide-react-native';
import { api } from '@/lib/api/client';

export default function CreateScreen() {
  const router = useRouter();

  const { data: myStories, isLoading } = useQuery({
    queryKey: ['my-stories'],
    queryFn: () => api.get('/mobile/my-stories'),
  });

  return (
    <View className="flex-1 bg-white">
      {/* 顶部 */}
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold">My Works</Text>
      </View>

      {/* 创建按钮 */}
      <Pressable
        onPress={() => router.push('/create/new')}
        className="mx-4 mb-4 flex-row items-center justify-center p-4 bg-butter-500 rounded-xl"
      >
        <Plus size={24} color="#fff" />
        <Text className="ml-2 text-white font-semibold text-lg">
          Create New Story
        </Text>
      </Pressable>

      {/* 作品列表 */}
      <FlatList
        data={myStories?.stories}
        renderItem={({ item }) => (
          <StoryItem
            story={item}
            onPress={() => router.push(`/create/${item.id}/edit`)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Edit3 size={48} color="#9ca3af" />
            <Text className="mt-4 text-gray-500">
              You haven't created any stories yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

function StoryItem({ story, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 mb-3 bg-gray-50 rounded-xl"
    >
      <Image
        source={{ uri: story.coverImage }}
        className="w-16 h-20 rounded-lg"
      />
      <View className="flex-1 ml-4">
        <View className="flex-row items-center">
          <Text className="flex-1 font-semibold text-lg">{story.title}</Text>
          <View className={`px-2 py-1 rounded ${story.isDraft ? 'bg-gray-200' : 'bg-green-100'}`}>
            <Text className={story.isDraft ? 'text-gray-600' : 'text-green-600'}>
              {story.isDraft ? 'Draft' : 'Published'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center mt-2">
          <Eye size={14} color="#6b7280" />
          <Text className="ml-1 mr-4 text-gray-500">{story.viewCount}</Text>
          <Heart size={14} color="#6b7280" />
          <Text className="ml-1 text-gray-500">{story.likeCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}
```

---

## 第四步: 代码复用指南

### 4.1 可直接复用的文件

从 `web/src/lib` 复制以下文件到 `mobile/lib/utils`:

#### format.ts (直接复制)

```typescript
// mobile/lib/utils/format.ts
// 从 web/src/lib/format.ts 直接复制

export function formatNumber(num: number): string {
  const isNegative = num < 0
  const absNum = Math.abs(num)
  const rounded = Math.floor(absNum)

  if (rounded < 1000) {
    return (isNegative ? -rounded : rounded).toString()
  }

  if (rounded < 1000000) {
    const k = rounded / 1000
    const formatted = k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
    return isNegative ? `-${formatted}` : formatted
  }

  const m = rounded / 1000000
  const formatted = m % 1 === 0 ? `${m}m` : `${m.toFixed(1)}m`
  return isNegative ? `-${formatted}` : formatted
}
```

#### constants.ts (直接复制)

```typescript
// mobile/lib/constants.ts
// 从 web/src/lib/constants.ts 复制需要的部分

export const CATEGORIES = [
  { name: 'Fantasy', slug: 'fantasy', order: 1 },
  { name: 'Urban', slug: 'urban', order: 2 },
  { name: 'Romance', slug: 'romance', order: 3 },
  // ... 其他分类
] as const

export const NOVEL_STATUS = {
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const
```

#### utils.ts (部分复制)

```typescript
// mobile/lib/utils/index.ts
// 从 web/src/lib/utils.ts 复制以下函数

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function smartTruncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || ''

  let truncated = text.substring(0, maxLength)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  if (lastSpaceIndex > maxLength * 0.7) {
    truncated = truncated.substring(0, lastSpaceIndex)
  }

  return truncated.trim() + '...'
}
```

### 4.2 需要修改的文件

#### validators.ts (移除浏览器相关代码)

```typescript
// mobile/lib/validators.ts
// 从 web/src/lib/validators.ts 复制，但移除 validateImage 函数

import { z } from 'zod'

// ✅ 可以直接复用的 Schemas
export const ratingSchema = z.object({
  score: z.coerce.number()
    .int('Rating must be an integer')
    .refine(
      (val) => [2, 4, 6, 8, 10].includes(val),
      { message: 'Rating must be one of: 2, 4, 6, 8, 10' }
    ),
  review: z.string().max(1000, 'Review must be 1000 characters or less').optional(),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must be 50 characters or less'),
  name: z.string().min(1).max(50).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password cannot be empty'),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
})

export const storyCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(80, 'Title must be 80 characters or less'),
  content: z.string()
    .min(5000, 'Content must be at least 5,000 characters')
    .max(50000, 'Content must be 50,000 characters or less'),
  categoryId: z.number().int().positive(),
  isDraft: z.boolean().default(false),
})

export const paragraphCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be 500 characters or less'),
  paragraphIndex: z.number().int().min(0),
})

// ❌ 移除 validateImage 函数 (使用浏览器 API)

// ✅ 辅助函数可以直接复用
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const firstError = result.error.issues[0]
  return {
    success: false,
    error: firstError?.message || 'Validation failed',
  }
}

// 字数统计
export function countWords(text: string): number {
  return text.trim().length
}
```

### 4.3 必须重写的部分

| 功能 | Web 实现 | Mobile 实现 |
|------|----------|-------------|
| UI 组件 | React (div, span) | React Native (View, Text) |
| 样式 | Tailwind CSS | NativeWind |
| 导航 | Next.js Router | Expo Router |
| 本地存储 | localStorage | AsyncStorage |
| 安全存储 | Cookie | SecureStore |
| 图片组件 | next/image | expo-image |
| 图片验证 | window.Image | expo-image-manipulator |
| 认证 | NextAuth | expo-auth-session |

---

## 第五步: 推送通知实现

### 5.1 安装依赖

```bash
npx expo install expo-notifications expo-device expo-constants
```

### 5.2 创建通知服务

```typescript
// services/notification.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { api } from '@/lib/api/client'

class NotificationService {
  private expoPushToken: string | null = null

  async init() {
    // 配置通知处理
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    })

    // 请求权限并获取 Token
    await this.registerForPushNotifications()
  }

  async registerForPushNotifications() {
    // 只在真机上工作
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices')
      return
    }

    // 请求权限
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications')
      return
    }

    // 获取 Expo Push Token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      const token = await Notifications.getExpoPushTokenAsync({ projectId })
      this.expoPushToken = token.data

      // 上传到服务器
      await this.uploadToken()
    } catch (error) {
      console.error('Error getting push token:', error)
    }

    // Android 需要设置通知渠道
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }
  }

  async uploadToken() {
    if (!this.expoPushToken) return

    try {
      await api.post('/mobile/push-token', {
        token: this.expoPushToken,
        platform: Platform.OS,
        deviceId: Device.modelId || 'unknown',
      })
    } catch (error) {
      console.error('Error uploading push token:', error)
    }
  }

  // 添加通知接收监听器
  addNotificationReceivedListener(
    handler: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(handler)
  }

  // 添加通知点击监听器
  addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler)
  }

  // 获取角标数
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync()
  }

  // 设置角标数
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count)
  }

  // 清除所有通知
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync()
  }
}

export const notificationService = new NotificationService()
```

### 5.3 在 App 入口配置

```typescript
// app/_layout.tsx
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { notificationService } from '@/services/notification'

export default function RootLayout() {
  const router = useRouter()

  useEffect(() => {
    // 初始化通知服务
    notificationService.init()

    // 监听通知点击
    const subscription = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data

        // 根据通知类型跳转
        switch (data.type) {
          case 'NEW_STORY':
            router.push(`/reader/${data.storyId}`)
            break
          case 'NEW_COMMENT':
            router.push(`/reader/${data.storyId}`)
            break
          case 'NEW_FOLLOWER':
            router.push(`/author/${data.userId}`)
            break
          default:
            router.push('/notifications')
        }
      }
    )

    return () => subscription.remove()
  }, [])

  // ...
}
```

### 5.4 通知中心页面

```typescript
// app/notifications.tsx
import { View, Text, FlatList, Pressable } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { formatDate } from '@/lib/utils'

export default function NotificationsScreen() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
  })

  const markAsRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={data?.notifications}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => markAsRead.mutate(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-gray-500">No notifications</Text>
          </View>
        }
      />
    </View>
  )
}

function NotificationItem({ notification, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`p-4 border-b border-gray-100 ${
        notification.isRead ? 'bg-white' : 'bg-blue-50'
      }`}
    >
      <Text className="font-semibold">{notification.title}</Text>
      <Text className="text-gray-600 mt-1">{notification.content}</Text>
      <Text className="text-gray-400 text-sm mt-2">
        {formatDate(notification.createdAt)}
      </Text>
    </Pressable>
  )
}
```

---

## 第六步: 测试完整指南

### 6.1 测试环境搭建

```bash
# 安装测试依赖
npm install --save-dev jest @testing-library/react-native @types/jest ts-jest

# 配置 jest.config.js
```

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/react-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

### 6.2 单元测试示例

```typescript
// __tests__/lib/format.test.ts
import { formatNumber } from '@/lib/utils/format'

describe('formatNumber', () => {
  it('formats numbers under 1000', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(100)).toBe('100')
    expect(formatNumber(999)).toBe('999')
  })

  it('formats thousands', () => {
    expect(formatNumber(1000)).toBe('1k')
    expect(formatNumber(1500)).toBe('1.5k')
    expect(formatNumber(15000)).toBe('15k')
    expect(formatNumber(999999)).toBe('1000k')
  })

  it('formats millions', () => {
    expect(formatNumber(1000000)).toBe('1m')
    expect(formatNumber(1500000)).toBe('1.5m')
  })

  it('handles negative numbers', () => {
    expect(formatNumber(-1500)).toBe('-1.5k')
  })
})
```

```typescript
// __tests__/lib/validators.test.ts
import { validateWithSchema, ratingSchema, loginSchema } from '@/lib/validators'

describe('ratingSchema', () => {
  it('accepts valid scores', () => {
    const result = validateWithSchema(ratingSchema, { score: 8 })
    expect(result.success).toBe(true)
  })

  it('rejects invalid scores', () => {
    const result = validateWithSchema(ratingSchema, { score: 5 })
    expect(result.success).toBe(false)
  })

  it('allows optional review', () => {
    const result = validateWithSchema(ratingSchema, {
      score: 10,
      review: 'Great story!'
    })
    expect(result.success).toBe(true)
  })
})

describe('loginSchema', () => {
  it('validates email format', () => {
    const result = validateWithSchema(loginSchema, {
      email: 'invalid-email',
      password: '123456'
    })
    expect(result.success).toBe(false)
  })

  it('requires password', () => {
    const result = validateWithSchema(loginSchema, {
      email: 'test@example.com',
      password: ''
    })
    expect(result.success).toBe(false)
  })
})
```

### 6.3 组件测试示例

```typescript
// __tests__/components/StoryCard.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { StoryCard } from '@/components/story/StoryCard'

// Mock router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('StoryCard', () => {
  const mockStory = {
    id: 1,
    title: 'Test Story Title',
    blurb: 'This is a test blurb for the story...',
    coverImage: 'https://example.com/cover.jpg',
    authorName: 'Test Author',
    authorAvatar: 'https://example.com/avatar.jpg',
    likeCount: 1500,
    commentCount: 50,
    isLiked: false,
    isBookmarked: false,
  }

  it('renders story title', () => {
    const { getByText } = render(<StoryCard story={mockStory} />)
    expect(getByText('Test Story Title')).toBeTruthy()
  })

  it('renders author name', () => {
    const { getByText } = render(<StoryCard story={mockStory} />)
    expect(getByText('Test Author')).toBeTruthy()
  })

  it('formats like count correctly', () => {
    const { getByText } = render(<StoryCard story={mockStory} />)
    expect(getByText('1.5k')).toBeTruthy() // 1500 -> 1.5k
  })

  it('navigates to reader on press', () => {
    const mockPush = jest.fn()
    jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue({
      push: mockPush,
    })

    const { getByTestId } = render(<StoryCard story={mockStory} />)
    fireEvent.press(getByTestId('story-card'))

    expect(mockPush).toHaveBeenCalledWith('/reader/1')
  })
})
```

### 6.4 Hook 测试示例

```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-native'
import { useAuthStore } from '@/stores/authStore'

// Mock API
jest.mock('@/lib/api/client', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
    init: jest.fn(),
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store
    useAuthStore.setState({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    })
  })

  it('starts with unauthenticated state', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('updates state after successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test' }

    require('@/lib/api/client').api.post.mockResolvedValue({
      token: 'test-token',
      user: mockUser,
    })

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
  })

  it('clears state on logout', async () => {
    const { result } = renderHook(() => useAuthStore())

    // Set authenticated state
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com', name: 'Test' },
      isAuthenticated: true,
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
```

### 6.5 开发过程测试流程

#### 本地开发测试

```bash
# 启动开发服务器
npx expo start

# 选择测试方式:
# i - iOS 模拟器 (需要 Mac + Xcode)
# a - Android 模拟器 (需要 Android Studio)
# w - Web 浏览器 (快速预览)
# 扫码 - 用 Expo Go 在真机测试
```

#### 真机测试 (必须测试的功能)

```bash
# 构建开发版本
eas build --profile development --platform ios
eas build --profile development --platform android
```

**必须在真机测试**:
- Google/Apple 登录
- 推送通知
- 相机/相册权限
- 手势流畅度
- 性能表现

### 6.6 测试清单

#### 认证模块 🧪

```
□ 注册页面能正常打开
□ 输入无效邮箱显示错误提示
□ 密码少于6位显示错误提示
□ 注册成功后跳转正确
□ 登录成功后 Token 正确保存
□ 关闭 App 重新打开仍保持登录
□ 登出后返回登录页
□ Google 登录流程完整 (真机)
□ Apple 登录流程完整 (iOS 真机)
```

#### For You 页面 🧪

```
□ 页面加载显示故事列表
□ 可以上下滑动切换故事
□ 滑动流畅无卡顿
□ 无限滚动加载正常
□ 下拉刷新正常
□ 点赞交互 (登录/未登录)
□ 收藏交互 (登录/未登录)
□ 分享功能
□ 点击进入阅读器
```

#### 阅读器 🧪

```
□ 内容正确加载
□ 滚动阅读流畅
□ 字体大小调节生效
□ 背景颜色切换生效
□ 设置持久化
□ 段落评论加载
□ 发表段落评论
□ 评分提交
□ 重复评分提示
□ 阅读进度保存/恢复
```

#### 创作功能 🧪

```
□ 我的作品列表加载
□ 新建故事流程完整
□ 标题验证
□ 分类选择
□ 内容编辑器功能
□ 字数统计准确
□ 草稿自动保存
□ 封面上传
□ 发布成功
□ 编辑已有作品
```

#### 推送通知 🧪

```
□ 推送权限请求 (真机)
□ Token 获取成功 (真机)
□ 前台收到通知
□ 后台收到通知
□ 点击通知跳转正确
□ 通知中心列表
□ 标记已读
□ 角标显示正确
```

### 6.7 运行测试命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- format.test.ts

# 运行特定目录的测试
npm test -- __tests__/lib

# 监听模式 (开发时推荐)
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage
```

---

## 第七步: 构建发布

### 7.1 准备资源

```json
// app.json
{
  "expo": {
    "name": "ButterNovel",
    "slug": "butternovel",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#f5f1e8"
    },
    "ios": {
      "bundleIdentifier": "com.butternovel.app",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Used to upload cover images",
        "NSPhotoLibraryUsageDescription": "Used to select cover images"
      }
    },
    "android": {
      "package": "com.butternovel.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#f5f1e8"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#eab308"
        }
      ]
    ]
  }
}
```

### 7.2 构建生产版本

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android

# 两个平台
eas build --profile production --platform all
```

---

## 第八步: 商店上架

### 8.1 iOS App Store

```bash
# 提交
eas submit --platform ios

# 或登录 App Store Connect 手动上传
```

**必需材料**:
- 应用名称
- 描述
- 截图 (6.7", 6.5", 5.5")
- 隐私政策 URL
- App Privacy 声明

### 8.2 Google Play

```bash
# 提交
eas submit --platform android

# 或登录 Google Play Console 手动上传
```

**必需材料**:
- 应用名称
- 描述
- 截图 (至少2张)
- 功能图片 (1024x500)
- 隐私政策 URL
- 内容分级

### 8.3 审核技巧

1. **测试账号**: 提供给审核员的测试账号
2. **视频演示**: 复杂功能录制演示视频
3. **隐私政策**: 确保完整且可访问
4. **举报功能**: UGC 内容必须有举报机制

---

## 常见问题

### 问题1：启动报错 "Unable to resolve module"

```bash
# 清除缓存重新启动
npx expo start --clear
```

### 问题2：iOS 模拟器无法启动

```bash
# 检查 Xcode 命令行工具
xcode-select --print-path
# 如果没有输出，运行：
sudo xcode-select --switch /Applications/Xcode.app
```

### 问题3：Android 模拟器无法启动

```bash
# 确保 ANDROID_HOME 正确设置
echo $ANDROID_HOME
# 应该显示类似 /Users/xxx/Library/Android/sdk
```

### 问题4：网络请求失败

```
1. 确保 API 服务器正在运行
2. 检查 API_BASE_URL 配置是否正确
3. iOS 需要在 Info.plist 添加 NSAppTransportSecurity
```

### 问题5：推送通知不工作

```
1. 确保在真机上测试（模拟器不支持推送）
2. 检查 Expo 项目 ID 配置正确
3. 确保用户已授权通知权限
4. 检查服务器是否正确保存了 push token
```

### 问题6：构建失败

```bash
# 重新安装依赖
rm -rf node_modules
npm install

# 清除 Metro 缓存
npx expo start --clear
```

---

## 常用命令

```bash
# 开发
npx expo start                    # 启动开发
npx expo start --clear            # 清除缓存
npx expo start --tunnel           # 隧道模式

# 测试
npm test                          # 运行测试
npm test -- --watch               # 监听模式
npm test -- --coverage            # 覆盖率报告

# 构建
eas build --profile development   # 开发版
eas build --profile preview       # 预览版
eas build --profile production    # 生产版
eas build:list                    # 查看构建

# 提交
eas submit --platform ios
eas submit --platform android

# 更新
eas update --branch production    # OTA 更新

# 其他
eas device:create                 # 注册设备
eas credentials                   # 管理证书
```

---

**让短篇阅读触手可及**
