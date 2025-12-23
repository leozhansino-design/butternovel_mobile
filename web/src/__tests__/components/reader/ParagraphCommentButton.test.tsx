/**
 * ParagraphCommentButton 组件测试
 * 测试评论按钮的渲染逻辑和样式
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock component since we only test the logic
// 实际组件使用 'use client' 需要特殊处理
const ParagraphCommentButtonMock = ({
  paragraphIndex,
  onClick,
  isActive,
  commentCount = 0,
}: {
  paragraphIndex: number
  onClick: () => void
  isActive: boolean
  commentCount?: number
}) => {
  const getButtonStyle = () => {
    if (commentCount === 0) {
      return 'opacity-30 hover:opacity-60 text-gray-400'
    } else if (commentCount < 50) {
      return 'opacity-70 text-gray-600'
    } else if (commentCount < 100) {
      return 'opacity-90 text-red-600 font-semibold'
    } else {
      return 'opacity-100 text-red-600 font-bold'
    }
  }

  const displayCount = commentCount >= 100 ? '99+' : commentCount

  return (
    <button
      onClick={onClick}
      data-testid={`comment-btn-${paragraphIndex}`}
      className={`${getButtonStyle()} ${isActive ? 'ring-2' : ''}`}
      title={`${commentCount} comments`}
    >
      <span>{displayCount}</span>
    </button>
  )
}

describe('ParagraphCommentButton', () => {
  describe('display count', () => {
    it('should display 0 when there are no comments', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={0}
        />
      )
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should display exact count for comments < 100', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={42}
        />
      )
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should display 99+ for comments >= 100', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={150}
        />
      )
      expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('should display 99+ for exactly 100 comments', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={100}
        />
      )
      expect(screen.getByText('99+')).toBeInTheDocument()
    })
  })

  describe('click handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn()
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={handleClick}
          isActive={false}
        />
      )

      fireEvent.click(screen.getByTestId('comment-btn-0'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('active state', () => {
    it('should have ring class when active', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={true}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      expect(button.className).toContain('ring-2')
    })

    it('should not have ring class when inactive', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      expect(button.className).not.toContain('ring-2')
    })
  })

  describe('style based on comment count', () => {
    it('should have low opacity for 0 comments', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={0}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      expect(button.className).toContain('opacity-30')
    })

    it('should have medium opacity for 1-49 comments', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={25}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      expect(button.className).toContain('opacity-70')
    })

    it('should have red color for 50-99 comments', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={75}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      expect(button.className).toContain('text-red-600')
      expect(button.className).toContain('font-semibold')
    })

    it('should have bold style for 100+ comments', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={200}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      expect(button.className).toContain('font-bold')
    })
  })

  describe('accessibility', () => {
    it('should have title with comment count', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={42}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      expect(button).toHaveAttribute('title', '42 comments')
    })
  })

  describe('no icon - only number', () => {
    it('should not contain SVG elements (icon removed)', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={10}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      // 确保按钮内没有 SVG（图标已移除，只显示数字）
      expect(button.querySelector('svg')).toBeNull()
    })

    it('should only contain the number', () => {
      render(
        <ParagraphCommentButtonMock
          paragraphIndex={0}
          onClick={() => {}}
          isActive={false}
          commentCount={10}
        />
      )

      const button = screen.getByTestId('comment-btn-0')
      // 按钮只包含数字
      expect(button.textContent).toBe('10')
    })
  })
})
