import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 instrumentation hook
  experimental: {
    instrumentationHook: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

// Sentry 配置选项
const sentryWebpackPluginOptions = {
  // 静默所有日志
  silent: true,

  // 组织和项目（从环境变量读取）
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 只在生产环境上传 source maps
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,

  // 自动创建发布版本
  automaticVercelMonitors: true,
}

// 使用 Sentry 包装配置
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)