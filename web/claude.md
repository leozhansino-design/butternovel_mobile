# ButterNovel - Claude 开发参考文档

> **快速参考**: 每次开发前必读

**最后更新**: 2025-12-23
**当前阶段**: 📱 手机版 App 开发
**目标平台**: Google Play + App Store

---

## 目录

1. [项目概述](#1-项目概述)
2. [移动端 App 规划](#2-移动端-app-规划)
3. [现有 API 详细列表](#3-现有-api-详细列表)
4. [数据库模型](#4-数据库模型)
5. [开发流程](#5-开发流程)
6. [新手测试指南](#6-新手测试指南)

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

### 1.3 仓库结构建议

用户想新建仓库，iOS 和 Android 放一起：

```
butternovel-mobile/          # 新仓库
├── app/                     # Expo Router 页面
├── components/              # RN 组件
├── lib/                     # 工具库
├── hooks/                   # 自定义 Hooks
├── stores/                  # Zustand 状态
├── assets/                  # 图片/字体
├── app.json                 # Expo 配置
├── eas.json                 # EAS 构建配置
├── package.json
└── README.md

butternovel/                 # 现有仓库（作为参考）
├── src/                     # Web 端代码
├── prisma/                  # 数据库 Schema
└── ...
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

### 2.2 功能详细设计

#### Tab 1: For You（推荐）

**交互**: 抖音式垂直滑动

```
┌─────────────────────────────────┐
│ 🔍 Search                       │  ← 顶部搜索入口
├─────────────────────────────────┤
│                                 │
│   [无封面，纯文字卡片]           │
│                                 │
│   「Story Title」               │
│   By Author Name                │
│                                 │
│   Preview of the story content  │
│   showing first few lines...    │
│                                 │
│   ⭐ 4.5  ·  15 min read        │
│                                 │
│ ────────────────────────────────│
│ ❤️ 89    💬 12    ↗️ Share      │  ← 底部操作栏
└─────────────────────────────────┘
     ↑ 上滑下一个 / 下滑上一个
```

**功能**:
- 不显示封面，用文字卡片
- 显示标题、作者、预览内容
- 显示评分和阅读时间
- 点击进入阅读器
- 点赞/评论/分享

#### Tab 2: Following（关注）

```
┌─────────────────────────────────┐
│ 👤 Author A          2h ago    │
│    「New Story Title」          │
│    15,000 chars · Romance      │
│    ❤️ 89  💬 12                 │
├─────────────────────────────────┤
│ 👤 Author B         Yesterday  │
│    「Another Story」            │
│    32,000 chars · Revenge      │
└─────────────────────────────────┘
```

#### Tab 3: Create（创作）➕

**创作流程**:
```
1. 填写标题（最多80字符）
2. 选择分类（16个短篇分类）
3. 编写内容（15,000-50,000字符）
4. 预览
5. 发布/存草稿
```

**不需要封面**！

#### Tab 4: Bookshelf（书架）

- 收藏的故事
- 阅读历史
- 阅读进度

#### Tab 5: Profile（我的）

- 个人资料
- 阅读/创作统计
- 设置
- 通知中心

### 2.3 阅读器

```
┌─────────────────────────────────┐
│ ← Back          Story Title    │
├─────────────────────────────────┤
│                                 │
│   [沉浸式阅读内容]              │
│                                 │
│   每个段落末尾有评论按钮 💬     │  ← 段落评论
│                                 │
├─────────────────────────────────┤
│ Aa   🌙   📖   💬   ⭐         │
│ 字体  夜间  进度  评论  评分    │  ← 底部菜单
└─────────────────────────────────┘
```

**评分入口**:
1. 阅读器底部菜单的 ⭐ 按钮
2. 读完故事后的评分弹窗

### 2.4 登录方式

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

### 2.5 短篇分类（16个）

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

## 3. 现有 API 详细列表

### 3.1 认证 API

| 路由 | 方法 | 说明 | 请求体 |
|------|------|------|--------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 认证 | - |
| `/api/auth/register` | POST | 邮箱注册 | `{ email, password, name }` |

**Google OAuth 配置** (src/lib/auth.ts):
```typescript
Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
})
```

### 3.2 短篇小说 API

| 路由 | 方法 | 说明 | 参数 |
|------|------|------|------|
| `/api/shorts` | GET | 短篇列表 | `?page=1&limit=20&genre=&sort=popular` |
| `/api/shorts/[id]` | GET | 短篇详情 | - |
| `/api/shorts/[id]/recommend` | POST | 点赞/取消点赞 | - |
| `/api/shorts/[id]/recommend-status` | GET | 检查点赞状态 | - |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Story Title",
    "blurb": "Preview text...",
    "shortNovelGenre": "sweet-romance",
    "wordCount": 25000,
    "viewCount": 1500,
    "likeCount": 89,
    "averageRating": 4.5,
    "authorName": "Author",
    "chapters": [{
      "id": 456,
      "content": "Full story content..."
    }]
  }
}
```

### 3.3 段落评论 API ⭐ 重要

| 路由 | 方法 | 说明 | 参数/请求体 |
|------|------|------|-------------|
| `/api/paragraph-comments` | GET | 获取段落评论 | `?chapterId=123&paragraphIndex=5` |
| `/api/paragraph-comments` | POST | 发表评论 | `{ novelId, chapterId, paragraphIndex, content, image? }` |
| `/api/paragraph-comments/[id]/replies` | GET | 获取回复 | - |
| `/api/paragraph-comments/[id]/replies` | POST | 回复评论 | `{ novelId, chapterId, paragraphIndex, content }` |
| `/api/paragraph-comments/[id]/like` | POST | 点赞 | - |
| `/api/paragraph-comments/[id]/like` | DELETE | 取消点赞 | - |
| `/api/paragraph-comments/batch-count` | GET | 批量获取评论数 | `?chapterId=123` |

**响应示例** (GET 评论):
```json
{
  "success": true,
  "data": [{
    "id": "comment-id",
    "content": "This is amazing!",
    "paragraphIndex": 5,
    "likeCount": 12,
    "replyCount": 3,
    "createdAt": "2025-01-01T00:00:00Z",
    "user": {
      "id": "user-id",
      "name": "Username",
      "avatar": "https://...",
      "level": 5
    }
  }]
}
```

### 3.4 评分 API ⭐ 重要

| 路由 | 方法 | 说明 | 请求体 |
|------|------|------|--------|
| `/api/novels/[id]/rate` | POST | 提交评分 | `{ score: 2-10, review?: string }` |
| `/api/novels/[id]/ratings` | GET | 获取评分列表 | `?page=1&limit=10` |
| `/api/novels/[id]/user-rating` | GET | 获取当前用户评分 | - |
| `/api/ratings/[id]/like` | POST | 点赞评分 | - |
| `/api/ratings/[id]/replies` | GET/POST | 评分回复 | - |

**评分规则**:
- 分数: 2, 4, 6, 8, 10（对应 1-5 星）
- 每个用户每本书只能评一次
- 评分后自动更新小说平均分

### 3.5 关注 API

| 路由 | 方法 | 说明 | 请求体 |
|------|------|------|--------|
| `/api/user/follow` | POST | 关注用户 | `{ userId: "user-id" }` |
| `/api/user/follow` | DELETE | 取消关注 | `{ userId: "user-id" }` |
| `/api/user/follow-status` | GET | 检查关注状态 | `?userId=xxx` |
| `/api/user/[id]/followers` | GET | 获取粉丝列表 | - |
| `/api/user/[id]/following` | GET | 获取关注列表 | - |

### 3.6 书架 API

| 路由 | 方法 | 说明 | 请求体 |
|------|------|------|--------|
| `/api/library` | GET | 获取书架 | - |
| `/api/library` | POST | 添加到书架 | `{ novelId: 123 }` |
| `/api/library` | DELETE | 从书架移除 | `{ novelId: 123 }` |
| `/api/library/check` | GET | 检查是否在书架 | `?novelId=123` |

### 3.7 用户 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/profile` | GET | 获取当前用户资料 |
| `/api/profile` | PUT | 更新资料 |
| `/api/profile/avatar` | POST | 上传头像 |
| `/api/user/[id]` | GET | 获取用户公开资料 |

### 3.8 通知 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/notifications` | GET | 获取通知列表 |
| `/api/notifications/unread-count` | GET | 获取未读数 |
| `/api/notifications/[id]/read` | POST | 标记已读 |
| `/api/notifications/read-all` | POST | 全部标记已读 |

### 3.9 搜索 API

| 路由 | 方法 | 说明 | 参数 |
|------|------|------|------|
| `/api/search` | GET | 搜索小说 | `?q=keyword&page=1` |
| `/api/search/suggestions` | GET | 搜索建议 | `?q=keyword` |

---

## 4. 数据库模型

### 4.1 User（用户）

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  password        String?
  name            String?
  avatar          String?
  bio             String?

  // OAuth
  googleId        String?  @unique
  // appleId      String?  @unique  // 需要新增

  // 关注系统
  following       Follow[] @relation("UserFollowing")
  followers       Follow[] @relation("UserFollowers")

  // 评分/评论
  ratings         Rating[]
  paragraphComments ParagraphComment[]

  // 创作
  // 暂时没有 createdNovels 字段，需要新增
}
```

### 4.2 Novel（小说）

```prisma
model Novel {
  id              Int      @id @default(autoincrement())
  title           String
  slug            String   @unique
  blurb           String   @db.Text

  // 短篇标识
  isShortNovel    Boolean  @default(false)
  shortNovelGenre String?

  // 统计
  wordCount       Int      @default(0)
  viewCount       Int      @default(0)
  likeCount       Int      @default(0)
  averageRating   Float?
  totalRatings    Int      @default(0)

  // 作者
  authorId        String
  authorName      String
}
```

### 4.3 Rating（评分）

```prisma
model Rating {
  id        String   @id @default(cuid())
  score     Int      // 2, 4, 6, 8, 10
  review    String?  @db.Text
  likeCount Int      @default(0)

  userId    String
  novelId   Int

  @@unique([userId, novelId])  // 每用户每书一个评分
}
```

### 4.4 ParagraphComment（段落评论）

```prisma
model ParagraphComment {
  id             String  @id @default(cuid())
  novelId        Int
  chapterId      Int
  paragraphIndex Int
  content        String  @db.Text
  likeCount      Int     @default(0)
  replyCount     Int     @default(0)

  userId         String
  parentId       String?  // 回复父评论

  @@index([novelId, chapterId, paragraphIndex])
}
```

### 4.5 Follow（关注）

```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String   // 关注者
  followingId String   // 被关注者
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}
```

---

## 5. 开发流程

### 5.1 开发阶段顺序

```
Phase 1: 项目搭建
├── 创建新仓库 butternovel-mobile
├── Expo 项目初始化
├── 导航架构搭建
├── 基础 UI 组件
└── API 客户端封装

Phase 2: 认证系统
├── Google 登录
├── Apple 登录
├── 邮箱密码登录
├── Token 存储
└── 用户状态管理

Phase 3: For You 推荐
├── 推荐列表 API 调用
├── 垂直滑动浏览组件
├── 故事卡片组件（无封面）
├── 点赞/收藏交互
└── 搜索入口

Phase 4: 阅读器
├── 阅读器页面
├── 段落评论功能
├── 评分功能（底部 + 结尾弹窗）
├── 阅读设置（字体/背景）
└── 进度保存

Phase 5: 创作功能
├── 创建短篇 UI
├── 富文本编辑器
├── 分类选择
├── 草稿保存
└── 发布流程

Phase 6: 关注系统
├── 关注/取关
├── Following 页面
├── 作者主页
└── 更新时间线

Phase 7: 书架 & 个人中心
├── 书架页面
├── 收藏列表
├── 阅读历史
├── 个人资料编辑
└── 设置页面

Phase 8: 通知系统
├── 通知列表
├── 未读角标
├── 推送通知（FCM）
└── 通知偏好设置

Phase 9: 优化 & 上架
├── 性能优化
├── Bug 修复
├── 商店素材准备
├── 审核提交
└── 上架发布
```

### 5.2 创建新仓库步骤

```bash
# 1. 在 GitHub 创建新仓库 butternovel-mobile

# 2. 克隆并初始化
git clone https://github.com/你的用户名/butternovel-mobile.git
cd butternovel-mobile

# 3. 创建 Expo 项目
npx create-expo-app@latest . --template blank-typescript

# 4. 安装依赖（见下方）

# 5. 复制现有仓库代码作为参考
# 可以把 butternovel 仓库下载下来放在旁边参考
```

### 5.3 安装依赖

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
npx expo install expo-image

# 推送
npx expo install expo-notifications expo-device expo-constants
```

---

## 6. 新手测试指南

### 6.1 开发环境准备

#### macOS（推荐，可同时开发 iOS + Android）

```bash
# 1. 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. 安装 Node.js
brew install node@20

# 3. 安装 Watchman
brew install watchman

# 4. 安装 CocoaPods（iOS 需要）
sudo gem install cocoapods

# 5. 安装 Xcode
# 从 App Store 下载安装
# 打开后：Xcode > Settings > Locations > Command Line Tools 选择版本

# 6. 安装 Android Studio
# 下载：https://developer.android.com/studio
# 安装时勾选：Android SDK, Android SDK Platform, Android Virtual Device
# 安装完成后：
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc

# 7. 验证安装
node --version   # 应该显示 v20.x.x
npm --version    # 应该显示 10.x.x
pod --version    # 应该显示 1.x.x
```

#### Windows（只能开发 Android）

```powershell
# 1. 安装 Node.js
# 下载 https://nodejs.org/ LTS 版本

# 2. 安装 Android Studio
# 下载 https://developer.android.com/studio

# 3. 配置环境变量
# 系统设置 > 环境变量
# 新建 ANDROID_HOME = C:\Users\你的用户名\AppData\Local\Android\Sdk
# Path 添加 %ANDROID_HOME%\platform-tools
```

### 6.2 启动开发

```bash
# 1. 进入项目目录
cd butternovel-mobile

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npx expo start

# 会出现二维码和选项：
# › Press s │ switch to development build
# › Press a │ open Android
# › Press i │ open iOS simulator
# › Press w │ open web
```

### 6.3 在手机上测试

#### 方法1：Expo Go App（最简单）

```
1. 手机下载 Expo Go App
   - iOS: App Store 搜索 "Expo Go"
   - Android: Play Store 搜索 "Expo Go"

2. 电脑运行 npx expo start

3. 手机扫描终端显示的二维码
   - iOS: 用相机 App 扫描
   - Android: 用 Expo Go App 扫描

4. App 会自动在手机上打开
```

#### 方法2：模拟器（开发时推荐）

```bash
# iOS 模拟器（需要 Mac）
# 在 Expo 终端按 i

# Android 模拟器
# 1. 打开 Android Studio
# 2. 点击 Device Manager
# 3. 创建一个虚拟设备（选择 Pixel 4，API 34）
# 4. 启动虚拟设备
# 5. 在 Expo 终端按 a
```

### 6.4 测试检查清单

#### 认证测试
```
□ 可以用 Google 登录
□ 可以用 Apple 登录（iOS）
□ 可以用邮箱注册
□ 可以用邮箱登录
□ 登出后需要重新登录
□ Token 持久化（关闭 App 后重开仍然登录）
```

#### For You 测试
```
□ 页面加载显示故事列表
□ 可以上下滑动切换故事
□ 显示标题、作者、预览内容
□ 显示评分和阅读时间
□ 点击可以进入阅读器
□ 下拉可以刷新
□ 可以点赞（需要登录）
```

#### 阅读器测试
```
□ 可以正常显示故事内容
□ 可以滚动阅读
□ 可以调整字体大小
□ 可以切换背景颜色
□ 可以切换夜间模式
□ 可以点击段落查看评论
□ 可以发表段落评论（需要登录）
□ 可以在结尾评分
□ 返回按钮正常工作
```

#### 段落评论测试
```
□ 点击段落末尾的评论按钮显示评论列表
□ 可以发表评论
□ 可以回复评论
□ 可以点赞评论
□ 可以查看更多回复
```

#### 评分测试
```
□ 可以选择 1-5 星
□ 可以写评分内容（可选）
□ 提交后显示成功
□ 重复评分会提示已评过
□ 评分列表正常显示
```

#### 创作测试
```
□ 可以填写标题
□ 可以选择分类
□ 可以编写内容
□ 字数统计正确
□ 可以保存草稿
□ 可以发布
□ 发布后可以在 For You 看到
```

### 6.5 常见问题

#### 问题1：启动报错 "Unable to resolve module"
```bash
# 清除缓存重新启动
npx expo start --clear
```

#### 问题2：iOS 模拟器无法启动
```bash
# 检查 Xcode 命令行工具
xcode-select --print-path
# 如果没有输出，运行：
sudo xcode-select --switch /Applications/Xcode.app
```

#### 问题3：Android 模拟器无法启动
```bash
# 确保 ANDROID_HOME 正确设置
echo $ANDROID_HOME
# 应该显示类似 /Users/xxx/Library/Android/sdk
```

#### 问题4：网络请求失败
```
1. 确保 API 服务器正在运行
2. 检查 API_BASE_URL 配置是否正确
3. iOS 需要在 Info.plist 添加 NSAppTransportSecurity
```

#### 问题5：构建失败
```bash
# 重新安装依赖
rm -rf node_modules
npm install

# 清除 Metro 缓存
npx expo start --clear
```

### 6.6 提交到应用商店

#### Google Play
```
1. 注册开发者账号 ($25)
   https://play.google.com/console

2. 构建 AAB 文件
   eas build --profile production --platform android

3. 在 Play Console 创建应用

4. 填写商店信息
   - 应用名称
   - 描述
   - 截图（至少2张）
   - 隐私政策 URL

5. 上传 AAB 文件

6. 提交审核（通常1-3天）
```

#### App Store
```
1. 注册开发者账号 ($99/年)
   https://developer.apple.com/programs/

2. 构建 IPA 文件
   eas build --profile production --platform ios

3. 在 App Store Connect 创建应用

4. 填写商店信息
   - 应用名称
   - 描述
   - 截图（多尺寸）
   - 隐私政策 URL

5. 使用 eas submit 上传
   eas submit --platform ios

6. 提交审核（通常1-7天）
```

---

## 重要提醒

1. **Apple 登录必须**：iOS 上架强制要求有 Apple 登录选项
2. **隐私政策必须**：两个商店都需要提供隐私政策页面
3. **截图必须**：需要准备多个尺寸的应用截图
4. **测试充分**：提交前在真机上充分测试
5. **文档规范**：除非明确要求，推送时不创建 md 文件

---

**📱 让短篇阅读触手可及**
