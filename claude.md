# ButterNovel - Claude 开发参考文档

> **快速参考**: 每次开发前必读

**最后更新**: 2025-12-23
**当前阶段**: Phase 1 完成 → Phase 2 开始
**目标平台**: Google Play + App Store

---

## 🚀 当前进度

### ✅ 已完成 - Phase 1: 项目搭建

| 任务 | 状态 | 备注 |
|------|------|------|
| 创建 Expo SDK 54 项目 | ✅ | React Native 0.81.5, React 19.1.0 |
| 配置 NativeWind | ✅ | Tailwind CSS 样式 |
| 配置 Expo Router | ✅ | v6.0.0 |
| 搭建 5 Tab 导航 | ✅ | For You / Following / Create / Bookshelf / Profile |
| 封装 API 客户端 | ✅ | lib/api/client.ts |
| 复制工具函数 | ✅ | lib/utils/format.ts |
| 认证状态管理 | ✅ | stores/authStore.ts (基础版) |
| 创建基础页面 | ✅ | 全部使用 mock 数据 |
| Android targetSdkVersion | ✅ | 35 (符合 Google Play 2025 要求) |
| Expo Go 测试 | ✅ | 可以运行 |

### 📍 下一步 - Phase 2: 认证系统

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 完善 authStore | 高 | 添加真实 API 调用 |
| Token 持久化 | 高 | SecureStore 存储 |
| 邮箱登录/注册 | 高 | 连接后端 API |
| Google 登录 | 高 | expo-auth-session |
| Apple 登录 | 高 | iOS 上架必须 |
| 游客模式限制 | 中 | 未登录用户限制 |

### 🗂️ 项目结构

```
mobile/
├── app/
│   ├── _layout.tsx          # 根布局 (QueryClient)
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab 导航
│   │   ├── index.tsx        # For You 推荐
│   │   ├── following.tsx    # 关注动态
│   │   ├── create.tsx       # 创作中心
│   │   ├── bookshelf.tsx    # 书架
│   │   └── profile.tsx      # 个人中心
│   ├── auth/
│   │   └── login.tsx        # 登录页
│   └── reader/
│       └── [id].tsx         # 阅读器
├── lib/
│   ├── api/client.ts        # API 客户端
│   └── utils/format.ts      # 工具函数
├── stores/
│   └── authStore.ts         # 认证状态
├── package.json             # SDK 54 依赖
└── app.json                 # Expo 配置
```

### ⚠️ 待修复警告

运行时显示这些包版本不匹配，但不影响基本功能：

```
expo-image, expo-splash-screen, expo-status-bar
react-native-gesture-handler, react-native-reanimated
react-native-safe-area-context, react-native-screens
react-native-svg, react-native-web, react-native-worklets
```

可以用 `npx expo install --fix` 修复，或暂时忽略。

---

## 目录

1. [项目概述](#1-项目概述)
2. [移动端 App 规划](#2-移动端-app-规划)
3. [代码复用指南](#3-代码复用指南)
4. [现有 API 列表](#4-现有-api-列表)
5. [数据库模型](#5-数据库模型)
6. [开发阶段顺序](#6-开发阶段顺序)
7. [推送通知系统](#7-推送通知系统)
8. [测试指南](#8-测试指南)

---

## 1. 项目概述

### 1.1 产品定位

**ButterNovel 手机版** - 短篇小说阅读与创作 App

**核心特点**:
| 特点 | 说明 |
|------|------|
| 只做短篇 | 15,000-50,000 字符 |
| 不要封面 | 纯文字卡片展示 |
| 抖音式推荐 | For You 垂直滑动 |
| 人人可创作 | 一个账号 = 读者 + 作者 |
| 保留评论 | 段落评论 + 书籍评分 |

### 1.2 与 Web 端共享

```
✅ 共享的:
├── 数据库（同一个 PostgreSQL）
├── API 端点（同一个后端）
├── 用户账号（同一套认证）
├── 小说数据
├── 评论/评分数据
└── 关注关系

❌ 不共享的:
├── UI 组件（需要用 React Native 重写）
└── 样式（需要用 NativeWind 重写）
```

### 1.3 技术栈

```json
{
  "框架": "Expo SDK 52+",
  "核心": "React Native 0.76+",
  "路由": "Expo Router",
  "状态": "@tanstack/react-query + zustand",
  "表单": "react-hook-form + zod",
  "UI": "NativeWind (Tailwind CSS)",
  "存储": "expo-secure-store + async-storage",
  "认证": "expo-auth-session",
  "推送": "expo-notifications + FCM/APNs",
  "图片": "expo-image + expo-image-picker"
}
```

---

## 2. 移动端 App 规划

### 2.1 底部导航 (5 Tabs)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ For You │Following│   ➕    │Bookshelf│ Profile │
│  推荐   │  关注   │  创作   │   书架   │   我的  │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

### 2.2 登录方式

```
✅ 必须实现:
├── Google 登录
├── Apple 登录（iOS 上架必须）
└── 邮箱密码登录

❌ 游客限制:
├── 可以浏览 For You
├── 可以阅读
├── 不能评论/点赞/收藏/创作
└── 提示登录
```

### 2.3 短篇分类（16个）

```typescript
const SHORT_NOVEL_GENRES = [
  'sweet-romance',        // Sweet Romance
  'billionaire-romance',  // Billionaire Romance
  'face-slapping',        // Face-Slapping
  'revenge',              // Revenge
  'rebirth',              // Rebirth
  'regret',               // Regret
  'healing-redemption',   // Healing/Redemption
  'true-fake-identity',   // True/Fake Identity
  'substitute',           // Substitute
  'age-gap',              // Age Gap
  'entertainment-circle', // Entertainment Circle
  'group-pet',            // Group Pet
  'lgbtq',                // LGBTQ+
  'quick-transmigration', // Quick Transmigration
  'survival-apocalypse',  // Survival/Apocalypse
  'system',               // System
]
```

---

## 3. 代码复用指南

### 3.1 可直接复用 (从 web/src/lib 复制)

| 文件 | 说明 | 复用方式 |
|------|------|----------|
| `format.ts` | 数字格式化 (1.5k, 2.3m) | 直接复制 |
| `validators.ts` | Zod 验证逻辑 | 复制，移除 validateImage |
| `constants.ts` | 分类、状态常量 | 直接复制 |
| `utils.ts` 部分 | `generateSlug`, `formatDate`, `truncate` | 直接复制 |

### 3.2 必须重写

| 功能 | 原因 |
|------|------|
| 所有 UI 组件 | React Native 使用 View/Text |
| 样式系统 | Tailwind → NativeWind |
| 导航系统 | Next.js Router → Expo Router |
| 存储逻辑 | localStorage → AsyncStorage/SecureStore |
| 认证流程 | NextAuth → expo-auth-session |
| 图片处理 | next/image → expo-image |
| 推送通知 | 无 → expo-notifications (新功能) |

### 3.3 类型定义 (可复用)

```typescript
// mobile/lib/types.ts

interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  bio: string | null
}

interface ShortNovel {
  id: number
  title: string
  blurb: string
  shortNovelGenre: string | null
  wordCount: number
  viewCount: number
  likeCount: number
  averageRating: number | null
  authorId: string
  authorName: string
}

interface Rating {
  id: string
  score: number // 2, 4, 6, 8, 10
  review: string | null
  likeCount: number
  userId: string
}

interface ParagraphComment {
  id: string
  content: string
  paragraphIndex: number
  likeCount: number
  replyCount: number
}
```

---

## 4. 现有 API 列表

### 4.1 认证 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 认证 |
| `/api/auth/register` | POST | 邮箱注册 |

### 4.2 短篇小说 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/shorts` | GET | 短篇列表 |
| `/api/shorts/[id]` | GET | 短篇详情 |
| `/api/shorts/[id]/recommend` | POST | 点赞/取消 |

### 4.3 段落评论 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/paragraph-comments` | GET | 获取评论 |
| `/api/paragraph-comments` | POST | 发表评论 |
| `/api/paragraph-comments/[id]/replies` | GET/POST | 评论回复 |
| `/api/paragraph-comments/[id]/like` | POST/DELETE | 点赞 |
| `/api/paragraph-comments/batch-count` | GET | 批量评论数 |

### 4.4 评分 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/novels/[id]/rate` | POST | 提交评分 |
| `/api/novels/[id]/ratings` | GET | 评分列表 |
| `/api/novels/[id]/user-rating` | GET | 用户评分 |

### 4.5 其他 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/library` | GET/POST/DELETE | 书架操作 |
| `/api/user/follow` | POST/DELETE | 关注操作 |
| `/api/search` | GET | 搜索 |
| `/api/notifications` | GET | 通知列表 |
| `/api/profile` | GET/PUT | 个人资料 |

### 4.6 移动端专用 API (需新增)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/mobile/for-you` | GET | 推荐列表 |
| `/api/mobile/following-updates` | GET | 关注动态 |
| `/api/mobile/stories` | POST | 创建故事 |
| `/api/mobile/my-stories` | GET | 我的作品 |
| `/api/mobile/push-token` | POST | 注册推送 |

---

## 5. 数据库模型

### 5.1 核心模型

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?
  name      String?
  avatar    String?
  googleId  String?  @unique
  // appleId String?  // 需新增
}

model Novel {
  id              Int      @id @default(autoincrement())
  title           String
  blurb           String   @db.Text
  isShortNovel    Boolean  @default(false)
  shortNovelGenre String?
  wordCount       Int      @default(0)
  viewCount       Int      @default(0)
  likeCount       Int      @default(0)
  averageRating   Float?
  authorId        String
  authorName      String
}

model Rating {
  id        String   @id @default(cuid())
  score     Int      // 2, 4, 6, 8, 10
  review    String?  @db.Text
  userId    String
  novelId   Int
  @@unique([userId, novelId])
}

model ParagraphComment {
  id             String  @id @default(cuid())
  novelId        Int
  chapterId      Int
  paragraphIndex Int
  content        String  @db.Text
  likeCount      Int     @default(0)
  userId         String
  parentId       String?
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  @@unique([followerId, followingId])
}
```

---

## 6. 开发阶段顺序

### Phase 1: 项目搭建

```
1. 创建 Expo 项目
2. 配置依赖 (Expo Router, NativeWind, zustand, react-query)
3. 搭建导航架构 (5 Tab)
4. 封装 API 客户端
5. 复制可复用代码 (format.ts, validators.ts, constants.ts)
```

**需要测试**: API 请求、导航跳转、样式生效

### Phase 2: 认证系统

```
1. 认证状态管理 (authStore.ts)
2. Token 存储 (expo-secure-store)
3. 邮箱登录/注册
4. Google 登录
5. Apple 登录 (iOS 必须)
6. 登出功能
7. 游客模式
```

**需要测试**: 所有登录方式、Token 持久化、登出

### Phase 3: For You 推荐

```
1. 故事卡片组件 (StoryCard.tsx)
2. 垂直滑动浏览 (FlatList + pagingEnabled)
3. 点赞功能
4. 收藏功能
5. 分享功能
6. 搜索入口
```

**需要测试**: 列表加载、滑动流畅、点赞收藏

### Phase 4: 阅读器

```
1. 阅读器页面 (reader/[id].tsx)
2. 阅读设置状态 (readerStore.ts)
3. 内容显示
4. 阅读设置 (字体/背景/行距)
5. 段落评论
6. 评分功能
7. 进度保存
```

**需要测试**: 设置持久化、段落评论、评分

### Phase 5: 创作功能

```
1. 我的作品页面
2. 作品列表
3. 新建故事页面
4. 分类选择
5. 内容编辑器
6. 封面上传
7. 发布/草稿
8. 编辑作品
```

**需要测试**: 创建流程、字数统计、草稿保存

### Phase 6: 关注系统

```
1. Following 页面
2. 关注动态列表
3. 作者主页
4. 关注/取关
5. 未读标记
```

**需要测试**: 关注动态、关注操作

### Phase 7: 书架与个人中心

```
1. 书架页面
2. 收藏列表
3. 阅读历史
4. 个人资料编辑
5. 统计数据
6. 设置页面
```

**需要测试**: 收藏列表、资料编辑

### Phase 8: 推送通知

```
1. 配置推送权限
2. 获取推送 Token
3. 上传 Token 到服务器
4. 前台通知处理
5. 后台通知处理
6. 通知中心页面
7. 通知设置
```

**需要测试**: 权限请求、通知接收、跳转 (需真机)

### Phase 9: 优化与上架

```
1. 性能优化
2. 错误处理
3. 上架资源准备
4. 构建测试版本
5. 修复反馈
6. 构建生产版本
7. 提交审核
```

---

## 7. 推送通知系统

### 7.1 推送类型

| 类型 | 触发条件 |
|------|----------|
| NEW_STORY | 关注作者发布新作品 |
| NEW_COMMENT | 收到评论回复 |
| NEW_LIKE | 作品收到点赞 |
| NEW_FOLLOWER | 有新粉丝 |
| SYSTEM | 系统公告 |

### 7.2 需要新增的 API

```typescript
// POST /api/mobile/push-token
Body: {
  token: string,
  platform: 'ios' | 'android',
  deviceId: string
}

// PUT /api/notifications/preferences
Body: {
  newStory: boolean,
  newComment: boolean,
  newLike: boolean,
  newFollower: boolean,
  system: boolean
}
```

### 7.3 通知服务示例

```typescript
// services/notification.ts
import * as Notifications from 'expo-notifications'

class NotificationService {
  async init() {
    // 请求权限
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return

    // 获取并上传 Token
    const token = await Notifications.getExpoPushTokenAsync()
    await api.post('/mobile/push-token', { token: token.data, ... })

    // 配置通知处理
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    })
  }
}
```

---

## 8. 测试指南

### 8.1 测试类型

| 类型 | 工具 | 说明 |
|------|------|------|
| 单元测试 | Jest | 工具函数、Hooks |
| 组件测试 | React Native Testing Library | UI 组件 |
| 手动测试 | Expo Go / 真机 | 真实设备 |

### 8.2 必须在真机测试的功能

- Google/Apple 登录
- 推送通知
- 相机/相册权限
- 手势流畅度
- 性能表现

### 8.3 测试命令

```bash
npm test                    # 运行所有测试
npm test -- --watch         # 监听模式
npm test -- --coverage      # 覆盖率报告
npx expo start              # 开发测试
```

### 8.4 开发测试流程

```bash
# 1. 启动开发服务器
npx expo start

# 2. 选择测试方式
# i - iOS 模拟器
# a - Android 模拟器
# w - Web 浏览器
# 扫码 - Expo Go 真机

# 3. 构建开发版本 (真机测试)
eas build --profile development --platform ios
eas build --profile development --platform android
```

---

## 重要提醒

1. **Apple 登录必须**: iOS 上架强制要求
2. **隐私政策必须**: 两个商店都需要
3. **测试充分**: 提交前真机测试
4. **推送需真机**: 模拟器不支持推送通知
5. **详细文档**: 查看 `docs/` 目录下的完整开发手册

---

**让短篇阅读触手可及**
