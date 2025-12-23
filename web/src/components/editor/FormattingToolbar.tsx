'use client'

import { Bold, Italic } from 'lucide-react'

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
}

/**
 * 简单的格式化工具栏
 * 支持: 粗体 (**text**), 斜体 (*text*)
 * 不支持: 颜色、字体更改
 */
export default function FormattingToolbar({ textareaRef, value, onChange }: FormattingToolbarProps) {
  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    // 如果没有选中文本，插入占位符
    const textToWrap = selectedText || 'text'

    // 检查是否已经被包裹（取消格式化）
    const beforeStart = value.substring(Math.max(0, start - prefix.length), start)
    const afterEnd = value.substring(end, end + suffix.length)

    if (beforeStart === prefix && afterEnd === suffix) {
      // 已经被包裹，移除格式
      const newValue =
        value.substring(0, start - prefix.length) +
        selectedText +
        value.substring(end + suffix.length)
      onChange(newValue)

      // 恢复光标位置
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start - prefix.length, end - prefix.length)
      }, 0)
    } else {
      // 添加格式
      const newValue =
        value.substring(0, start) +
        prefix +
        textToWrap +
        suffix +
        value.substring(end)
      onChange(newValue)

      // 设置新的选区
      setTimeout(() => {
        textarea.focus()
        if (selectedText) {
          textarea.setSelectionRange(start + prefix.length, end + prefix.length)
        } else {
          // 选中占位符
          textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToWrap.length)
        }
      }, 0)
    }
  }

  const handleBold = () => wrapSelection('**', '**')
  const handleItalic = () => wrapSelection('*', '*')

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      handleBold()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      handleItalic()
    }
  }

  return (
    <div className="flex items-center gap-1 mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-t-lg border border-b-0 border-gray-300 dark:border-gray-600">
      <button
        type="button"
        onClick={handleBold}
        onKeyDown={handleKeyDown}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handleItalic}
        onKeyDown={handleKeyDown}
        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
        Use **text** for <strong>bold</strong>, *text* for <em>italic</em>
      </div>
    </div>
  )
}
