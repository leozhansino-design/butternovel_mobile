'use client'

import React from 'react'

interface FormattedTextProps {
  content: string
  className?: string
}

/**
 * 渲染带格式的文本
 * 支持: **粗体**, *斜体*
 * 不支持: 颜色、字体更改（安全设计）
 */
export default function FormattedText({ content, className = '' }: FormattedTextProps) {
  const parseFormattedText = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = []
    let remaining = text
    let keyIndex = 0

    // 正则匹配: **bold** 和 *italic* (不匹配 ** 或 单独的 *)
    // 顺序很重要：先匹配粗体（两个星号），再匹配斜体（一个星号）
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, component: (text: string, key: number) => <strong key={key}>{text}</strong> },
      { regex: /\*(.+?)\*/g, component: (text: string, key: number) => <em key={key}>{text}</em> },
    ]

    // 使用一个综合的正则来处理所有格式
    const combinedRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g
    let lastIndex = 0
    let match

    while ((match = combinedRegex.exec(text)) !== null) {
      // 添加匹配之前的普通文本
      if (match.index > lastIndex) {
        result.push(text.substring(lastIndex, match.index))
      }

      if (match[1]) {
        // 粗体匹配 **text**
        result.push(<strong key={keyIndex++}>{match[2]}</strong>)
      } else if (match[3]) {
        // 斜体匹配 *text*
        result.push(<em key={keyIndex++}>{match[4]}</em>)
      }

      lastIndex = match.index + match[0].length
    }

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex))
    }

    return result.length > 0 ? result : [text]
  }

  return <span className={className}>{parseFormattedText(content)}</span>
}

/**
 * 渲染带格式的段落（保留换行）
 */
export function FormattedParagraph({ content, className = '' }: FormattedTextProps) {
  // 按换行符分割，每行单独处理格式
  const lines = content.split('\n')

  return (
    <span className={className}>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          <FormattedText content={line} />
          {index < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </span>
  )
}
