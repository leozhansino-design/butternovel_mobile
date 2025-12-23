'use client'

interface ParagraphCommentButtonProps {
  paragraphIndex: number
  onClick: () => void
  isActive: boolean
  commentCount?: number  // ✅ 接受预加载的评论数，而不是自己请求
}

export default function ParagraphCommentButton({
  paragraphIndex,
  onClick,
  isActive,
  commentCount = 0  // ✅ 默认值为0
}: ParagraphCommentButtonProps) {
  // ✅ FIX: 移除独立请求逻辑 - 改为接受预加载的 commentCount prop
  // 之前：每个按钮独立请求 → 40个按钮 = 40次请求 = 连接池爆炸
  // 现在：从父组件接收批量获取的数据 → 0次请求

  // 根据评论数量决定样式 - 简约设计只显示数字
  const getButtonStyle = () => {
    if (commentCount === 0) {
      // 无评论：半透明，诱导点击
      return 'opacity-30 hover:opacity-60 text-gray-400 hover:text-gray-600 bg-gray-100/50 hover:bg-gray-200/70'
    } else if (commentCount < 50) {
      // 1-49条评论：普通样式
      return 'opacity-70 hover:opacity-100 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
    } else if (commentCount < 100) {
      // 50-99条评论：红色数字
      return 'opacity-90 hover:opacity-100 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-semibold'
    } else {
      // 99+条评论：红色高亮
      return 'opacity-100 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-bold'
    }
  }

  const displayCount = commentCount >= 100 ? '99+' : commentCount

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded text-xs transition-all duration-200 ${getButtonStyle()} ${
        isActive ? 'ring-2 ring-amber-500 shadow-md' : ''
      }`}
      title={`${commentCount} comments`}
    >
      <span>{displayCount}</span>
    </button>
  )
}
