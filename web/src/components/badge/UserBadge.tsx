'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getUserLevel, UserLevel } from '@/lib/badge-system'

interface UserBadgeProps {
  avatar?: string | null
  name?: string | null
  level: number
  contributionPoints: number
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  showLevelName?: boolean
  className?: string
  isOfficial?: boolean  // Official account flag
}

const sizeConfig = {
  small: {
    container: 48,
    avatar: 40,
    borderWidth: 2,
    fontSize: 'text-xs',
  },
  medium: {
    container: 80,
    avatar: 68,
    borderWidth: 3,
    fontSize: 'text-sm',
  },
  large: {
    container: 120,
    avatar: 104,
    borderWidth: 4,
    fontSize: 'text-base',
  },
  xlarge: {
    container: 160,
    avatar: 140,
    borderWidth: 5,
    fontSize: 'text-lg',
  },
}

/**
 * 用户勋章头像组件
 * 根据用户等级显示不同的边框和特效
 */
export default function UserBadge({
  avatar,
  name,
  level,
  contributionPoints,
  size = 'medium',
  showLevelName = false,
  className = '',
  isOfficial = false,
}: UserBadgeProps) {
  const [mounted, setMounted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const levelData = getUserLevel(contributionPoints)
  const config = sizeConfig[size]

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset image error when avatar changes
  useEffect(() => {
    setImageError(false)
  }, [avatar])

  // 生成边框样式
  const getBorderStyle = (): React.CSSProperties => {
    // Official account gets special blue/gold gradient border
    if (isOfficial) {
      return {
        background: `linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6, #d946ef)`,
        padding: `${config.borderWidth}px`,
      }
    }

    const { badgeStyle } = levelData

    if (badgeStyle.gradient && badgeStyle.gradient.length > 1) {
      const gradientColors = badgeStyle.gradient.join(', ')
      return {
        background: `linear-gradient(135deg, ${gradientColors})`,
        padding: `${config.borderWidth}px`,
      }
    }

    return {
      borderColor: badgeStyle.borderColor,
      borderWidth: `${config.borderWidth}px`,
      borderStyle: 'solid',
    }
  }

  // 生成发光效果
  const getGlowStyle = (): React.CSSProperties => {
    // Official account gets special blue glow
    if (isOfficial) {
      return {
        boxShadow: `
          0 0 20px #3b82f640,
          0 0 40px #6366f130,
          0 0 60px #8b5cf620
        `,
      }
    }

    const { badgeStyle } = levelData

    if (!badgeStyle.glowColor || !badgeStyle.glowIntensity) {
      return {}
    }

    const intensity = badgeStyle.glowIntensity
    const color = badgeStyle.glowColor

    return {
      boxShadow: `
        0 0 ${10 * intensity}px ${color}40,
        0 0 ${20 * intensity}px ${color}30,
        0 0 ${30 * intensity}px ${color}20
      `,
    }
  }

  // 动画类名
  const getAnimationClass = (): string => {
    if (!mounted) return ''

    const { badgeStyle } = levelData

    switch (badgeStyle.animation) {
      case 'pulse':
        return 'animate-pulse-slow'
      case 'rotate':
        return 'animate-rotate-slow'
      case 'sparkle':
        return 'animate-sparkle'
      default:
        return ''
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* 头像容器 */}
      <div
        className={`relative rounded-full ${getAnimationClass()}`}
        style={{
          width: `${config.container}px`,
          height: `${config.container}px`,
          ...getBorderStyle(),
          ...getGlowStyle(),
        }}
      >
        {/* 内部圆形头像 */}
        <div
          className="relative rounded-full overflow-hidden bg-white"
          style={{
            width: `${config.avatar}px`,
            height: `${config.avatar}px`,
            margin: 'auto',
            marginTop: levelData.badgeStyle.gradient ? '0' : `${config.borderWidth}px`,
          }}
        >
          {avatar && !imageError ? (
            <Image
              src={avatar}
              alt={name || 'User avatar'}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized={avatar.includes('googleusercontent.com')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white text-gray-900 font-semibold border border-gray-300" style={{ fontSize: `${config.avatar * 0.4}px` }}>
              {name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* 等级数字角标 or 认证标记 */}
        <div
          className="absolute bottom-0 right-0 rounded-full bg-white shadow-lg flex items-center justify-center font-bold"
          style={{
            width: `${config.container * 0.3}px`,
            height: `${config.container * 0.3}px`,
            fontSize: `${config.container * 0.15}px`,
            color: isOfficial ? '#3b82f6' : levelData.badgeStyle.borderColor,
          }}
        >
          {isOfficial ? (
            <svg className="w-full h-full p-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            level
          )}
        </div>
      </div>

      {/* 等级名称 */}
      {showLevelName && (
        <div className={`mt-2 text-center ${config.fontSize}`}>
          <div className="font-bold" style={{ color: levelData.badgeStyle.borderColor }}>
            {levelData.name}
          </div>
          <div className="text-gray-500 text-xs mt-0.5">
            {levelData.nameEn}
          </div>
        </div>
      )}
    </div>
  )
}
