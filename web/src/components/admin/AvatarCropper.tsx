// src/components/admin/AvatarCropper.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronUp, ChevronDown } from 'lucide-react'

type Props = {
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
}

export default function AvatarCropper({ imageSrc, onCropComplete, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const CIRCLE_SIZE = 300 // 圆形直径

  // ⭐ 处理拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // 限制移动范围
    const img = new window.Image()
    img.onload = () => {
      const maxX = (img.width * scale - CIRCLE_SIZE) / 2
      const minX = -(img.width * scale - CIRCLE_SIZE) / 2
      const maxY = (img.height * scale - CIRCLE_SIZE) / 2
      const minY = -(img.height * scale - CIRCLE_SIZE) / 2

      setPosition({
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY)),
      })
    }
    img.src = imageSrc
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // ⭐ 处理缩放
  const handleZoom = (direction: 'in' | 'out') => {
    const newScale = direction === 'in' ? scale + 0.1 : Math.max(1, scale - 0.1)
    setScale(newScale)
  }

  // ⭐ 生成裁剪后的图片
  const handleCrop = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      // 清空画布
      ctx.clearRect(0, 0, CIRCLE_SIZE, CIRCLE_SIZE)

      // 绘制圆形
      ctx.beginPath()
      ctx.arc(CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()

      // 绘制图片
      const imageX = CIRCLE_SIZE / 2 + position.x
      const imageY = CIRCLE_SIZE / 2 + position.y
      ctx.drawImage(
        img,
        imageX - (img.width * scale) / 2,
        imageY - (img.height * scale) / 2,
        img.width * scale,
        img.height * scale
      )

      // 获取裁剪后的图片
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader()
          reader.onload = () => {
            onCropComplete(reader.result as string)
          }
          reader.readAsDataURL(blob)
        }
      })
    }
    img.src = imageSrc
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Crop Avatar</h2>

        {/* 预览区域 */}
        <div
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden mb-6 cursor-move"
          style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 圆形蒙版 */}
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full pointer-events-none" />

          {/* 图片 */}
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s',
            }}
          >
            <img
              src={imageSrc}
              alt="Avatar preview"
              style={{
                width: '300px',
                height: '400px',
                objectFit: 'cover',
              }}
              className="pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        {/* 缩放控制 */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => handleZoom('out')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronDown size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 h-1 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(scale - 1) * 100 + 50}%` }}
            />
          </div>
          <button
            onClick={() => handleZoom('in')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronUp size={20} className="text-gray-600" />
          </button>
        </div>

        {/* 提示文字 */}
        <p className="text-xs text-gray-500 text-center mb-4">
          Drag the image to adjust, use zoom controls to resize
        </p>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Crop & Save
          </button>
        </div>

        {/* 隐藏 Canvas */}
        <canvas
          ref={canvasRef}
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}