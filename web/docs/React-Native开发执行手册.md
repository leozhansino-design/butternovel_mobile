# ButterNovel React Native 开发执行手册

> 短篇小说 App - 从零到上架的完整步骤指南

**版本**: 3.0
**更新日期**: 2025-12-23

---

## 目录

1. [环境准备](#第一步-环境准备)
2. [项目初始化](#第二步-项目初始化)
3. [核心开发](#第三步-核心开发)
4. [测试策略](#第四步-测试策略)
5. [构建发布](#第五步-构建发布)
6. [商店上架](#第六步-商店上架)

---

## 第一步: 环境准备

### 1.1 开发者账号注册

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

### 1.3 验证环境

```bash
node --version      # v20.x.x
npm --version       # 10.x.x
pod --version       # 1.x.x
eas --version       # 最新版
adb --version       # Android SDK
```

---

## 第二步: 项目初始化

### 2.1 创建 Expo 项目

```bash
# 在 butternovel 项目根目录
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

# UI
npx expo install react-native-reanimated react-native-gesture-handler
npm install nativewind tailwindcss
npx expo install lucide-react-native react-native-svg

# 图片
npx expo install expo-image expo-image-picker

# 推送
npx expo install expo-notifications expo-device expo-constants

# 其他
npx expo install expo-linking expo-status-bar expo-splash-screen
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
mkdir -p app/{auth,reader,story,author,create,settings}
mkdir -p app/\(tabs\)
mkdir -p components/{ui,story,reader,create}
mkdir -p lib/{api,utils}
mkdir -p hooks stores assets/{images,fonts}
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
        <Text className="text-white text-xs mt-1">{formatCount(count)}</Text>
      )}
    </Pressable>
  );
}

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
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
import { View, Text, FlatList, Pressable } from 'react-native';
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

## 第四步: 测试策略

### 4.1 开发测试

```bash
# 启动开发服务器
npx expo start

# 选择运行方式:
# i - iOS 模拟器
# a - Android 模拟器
# w - Web 浏览器
# 扫码 - 真机 Expo Go
```

### 4.2 真机测试

```bash
# 构建开发版本
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 4.3 测试检查清单

```markdown
## 功能测试
- [ ] 登录/注册 (Email, Google, Apple)
- [ ] For You 滑动浏览
- [ ] 点赞/收藏
- [ ] 进入阅读器
- [ ] 阅读设置
- [ ] 创作发布
- [ ] 关注作者
- [ ] 书架管理
- [ ] 个人资料

## 兼容性测试
- [ ] iOS 15+
- [ ] Android 10+
- [ ] 不同屏幕尺寸
- [ ] 深色模式

## 性能测试
- [ ] 首屏加载 < 3s
- [ ] 滑动流畅
- [ ] 内存正常
```

---

## 第五步: 构建发布

### 5.1 准备资源

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
      "supportsTablet": true
    },
    "android": {
      "package": "com.butternovel.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#f5f1e8"
      }
    }
  }
}
```

### 5.2 构建生产版本

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android

# 两个平台
eas build --profile production --platform all
```

---

## 第六步: 商店上架

### 6.1 iOS App Store

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

### 6.2 Google Play

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

### 6.3 审核技巧

1. **测试账号**: 提供给审核员的测试账号
2. **视频演示**: 复杂功能录制演示视频
3. **隐私政策**: 确保完整且可访问
4. **举报功能**: UGC 内容必须有举报机制

---

## 常用命令

```bash
# 开发
npx expo start                    # 启动开发
npx expo start --clear            # 清除缓存
npx expo start --tunnel           # 隧道模式

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

**📱 让短篇阅读触手可及**
