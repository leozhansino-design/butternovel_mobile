'use client'

import { useMemo } from 'react'

interface CharacterCountProgressProps {
  current: number
  max: number
  className?: string
}

export default function CharacterCountProgress({ current, max, className = '' }: CharacterCountProgressProps) {
  const percentage = Math.min((current / max) * 100, 100)

  // Determine color based on percentage thresholds
  const getProgressColor = () => {
    if (percentage === 100) {
      return 'bg-gradient-to-r from-red-500 to-red-600'
    } else if (percentage >= 90) {
      return 'bg-gradient-to-r from-orange-400 to-orange-500'
    } else if (percentage >= 70) {
      return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
    } else {
      return 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600'
    }
  }

  const getTextColor = () => {
    if (percentage === 100) {
      return 'text-red-600'
    } else if (percentage >= 90) {
      return 'text-orange-600'
    } else if (percentage >= 70) {
      return 'text-yellow-600'
    } else {
      return 'text-indigo-600'
    }
  }

  const shouldPulse = percentage === 100

  return (
    <div className={`${className}`}>
      {/* Character Count Display */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${getTextColor()}`}>
            {current.toLocaleString()}
          </span>
          <span className="text-lg text-gray-500">
            / {max.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 ml-1">characters</span>
        </div>
        <div className={`text-lg font-semibold ${getTextColor()}`}>
          {percentage.toFixed(1)}%
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        {/* Progress Fill */}
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out relative ${
            shouldPulse ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        >
          {/* Glossy Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10" />

          {/* Animated Shine Effect (only when not at 100%) */}
          {!shouldPulse && percentage > 0 && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine"
              style={{
                animation: 'shine 3s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>

      {/* Warning Messages */}
      {percentage >= 100 && (
        <p className="text-sm text-red-600 font-medium mt-2 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          Character limit reached! Please reduce your content.
        </p>
      )}
      {percentage >= 90 && percentage < 100 && (
        <p className="text-sm text-orange-600 font-medium mt-2 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-orange-600 rounded-full" />
          Approaching limit ({max - current} characters remaining)
        </p>
      )}
      {percentage >= 70 && percentage < 90 && (
        <p className="text-sm text-yellow-600 font-medium mt-2">
          {max - current} characters remaining
        </p>
      )}

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          50%, 100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  )
}
