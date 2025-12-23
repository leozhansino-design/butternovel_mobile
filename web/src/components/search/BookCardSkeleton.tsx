// src/components/search/BookCardSkeleton.tsx
'use client'

/**
 * 书籍卡片骨架屏组件
 * 用于搜索结果加载时的占位动画
 */
export default function BookCardSkeleton() {
  return (
    <div className="h-full bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
      {/* 横向卡片：封面在左，所有信息在右 - 填满网格单元高度 */}
      <div className="flex h-full">
        {/* 左侧：封面骨架 - 宽度固定，高度跟随卡片 */}
        <div className="flex-shrink-0 w-24 sm:w-32 md:w-40 lg:w-44 bg-gray-200" />

        {/* 右侧：所有文字信息骨架 */}
        <div className="flex-1 p-2.5 sm:p-4 md:p-5 lg:p-6 flex flex-col min-w-0">
          {/* 上部分：标题、作者、统计信息、简介 */}
          <div className="flex flex-col">
            {/* 标题骨架 - 2行，更小的高度 */}
            <div className="h-6 sm:h-7 bg-gray-200 rounded w-full mb-1.5" />
            <div className="h-6 sm:h-7 bg-gray-200 rounded w-3/4 mb-1.5" />

            {/* 作者骨架 */}
            <div className="h-5 bg-gray-200 rounded w-32 mb-1.5" />

            {/* 统计信息骨架 - 横向一行 */}
            <div className="flex gap-4 mb-2">
              <div className="h-5 bg-gray-200 rounded w-20" />
              <div className="h-5 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-24" />
              <div className="h-5 bg-gray-200 rounded w-20" />
            </div>

            {/* 简介骨架 - 3行 */}
            <div className="h-5 bg-gray-200 rounded w-full mb-2" />
            <div className="h-5 bg-gray-200 rounded w-full mb-2" />
            <div className="h-5 bg-gray-200 rounded w-5/6" />
          </div>

          {/* 底部：标签骨架 - 智能显示2-3个 + more */}
          <div className="flex gap-2 items-center flex-wrap mt-2 md:mt-3 min-w-0">
            <div className="h-7 bg-gray-200 rounded-full w-20 shrink-0" />
            <div className="h-7 bg-gray-200 rounded-full w-24 shrink-0" />
            <div className="h-7 bg-gray-200 rounded-full w-16 shrink-0" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 多个骨架屏组件
 */
export function BookCardSkeletonList({ count = 10 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </>
  )
}
