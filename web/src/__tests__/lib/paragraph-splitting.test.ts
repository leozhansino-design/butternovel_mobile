/**
 * 段落分割逻辑测试
 * 测试 ChapterReader 组件的段落分割功能
 * 包括对单换行符和双换行符内容的处理
 */

describe('ChapterReader paragraph splitting logic', () => {
  /**
   * 模拟 ChapterReader 中的段落分割逻辑
   * 改进版：支持单换行符或双换行符分隔
   */
  const splitIntoParagraphs = (content: string): string[] => {
    // 尝试按双换行符分割
    let splitParagraphs = content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0)

    // 如果只有一个段落且内容较长，尝试按单换行符分割
    // 这解决了 batch upload 内容只使用单换行符的问题
    if (splitParagraphs.length === 1 && splitParagraphs[0].length > 500) {
      const singleLineSplit = content
        .split(/\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0)

      // 如果按单换行符分割后有更多段落，使用这个结果
      if (singleLineSplit.length > 1) {
        splitParagraphs = singleLineSplit
      }
    }

    return splitParagraphs
  }

  describe('double newline splitting (standard format)', () => {
    it('should split content with double newlines', () => {
      const content = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3'
      const result = splitIntoParagraphs(content)
      expect(result).toEqual(['Paragraph 1', 'Paragraph 2', 'Paragraph 3'])
    })

    it('should handle multiple consecutive newlines', () => {
      const content = 'Paragraph 1\n\n\n\nParagraph 2\n\n\n\n\nParagraph 3'
      const result = splitIntoParagraphs(content)
      expect(result).toEqual(['Paragraph 1', 'Paragraph 2', 'Paragraph 3'])
    })

    it('should trim whitespace from each paragraph', () => {
      const content = '  Paragraph 1  \n\n  Paragraph 2  '
      const result = splitIntoParagraphs(content)
      expect(result).toEqual(['Paragraph 1', 'Paragraph 2'])
    })

    it('should filter out empty paragraphs', () => {
      const content = 'Paragraph 1\n\n\n\n\n\nParagraph 2'
      const result = splitIntoParagraphs(content)
      expect(result).toHaveLength(2)
    })
  })

  describe('single newline splitting (batch upload format)', () => {
    it('should split long content with single newlines', () => {
      // 创建超过 500 字符的内容，使用单换行符分隔
      const longParagraph1 = 'A'.repeat(300)
      const longParagraph2 = 'B'.repeat(300)
      const content = `${longParagraph1}\n${longParagraph2}`

      const result = splitIntoParagraphs(content)
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(longParagraph1)
      expect(result[1]).toBe(longParagraph2)
    })

    it('should keep using double newline splitting for short content', () => {
      // 短内容不应该回退到单换行符分割
      const content = 'Line 1\nLine 2 in same paragraph\n\nParagraph 2'
      const result = splitIntoParagraphs(content)
      expect(result).toHaveLength(2)
      expect(result[0]).toContain('Line 1')
      expect(result[0]).toContain('Line 2')
      expect(result[1]).toBe('Paragraph 2')
    })

    it('should handle batch upload style content with many single-line paragraphs', () => {
      // 模拟 batch upload 的内容格式
      const lines = Array.from({ length: 20 }, (_, i) =>
        `This is paragraph ${i + 1} with some content that makes it long enough.`
      )
      const content = lines.join('\n')

      const result = splitIntoParagraphs(content)
      expect(result.length).toBeGreaterThan(1)
      expect(result).toHaveLength(20)
    })
  })

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const result = splitIntoParagraphs('')
      expect(result).toEqual([])
    })

    it('should handle content with only whitespace', () => {
      const result = splitIntoParagraphs('   \n\n\n   ')
      expect(result).toEqual([])
    })

    it('should handle single paragraph', () => {
      const content = 'Just one paragraph'
      const result = splitIntoParagraphs(content)
      expect(result).toEqual(['Just one paragraph'])
    })

    it('should handle content with mixed newlines', () => {
      const content = 'Para 1\n\nPara 2\n\nPara 3'
      const result = splitIntoParagraphs(content)
      expect(result).toHaveLength(3)
    })
  })

  describe('real-world scenarios', () => {
    it('should correctly split typical novel chapter content', () => {
      const content = `Chapter 1: The Beginning

The sun was setting over the mountains, casting long shadows across the valley. Maria stood at the edge of the cliff, watching the world below.

"It's beautiful," she whispered to herself, the wind carrying her words away.

Down in the village, the lights were beginning to flicker on one by one. Soon, the entire valley would be dotted with warm glows, like stars fallen to earth.`

      const result = splitIntoParagraphs(content)
      expect(result.length).toBeGreaterThan(1)
      expect(result[0]).toContain('Beginning')
      expect(result[result.length - 1]).toContain('stars')
    })

    it('should handle Chinese novel content with correct paragraph separation', () => {
      const content = `第一章 开始

太阳正在山后落下，长长的影子投射在山谷中。玛丽亚站在悬崖边缘，看着下面的世界。

"真美。"她低声自语，风把她的话语带走了。

村子里，灯火开始一盏一盏地亮起来。很快，整个山谷就会布满温暖的光芒，就像落到地上的星星。`

      const result = splitIntoParagraphs(content)
      expect(result.length).toBeGreaterThan(1)
    })

    it('should handle batch upload content without double newlines', () => {
      // 模拟从 batch upload 来的内容，只有单换行符
      const paragraphs = [
        'The first paragraph of the story begins here with some interesting content that hooks the reader.',
        'Moving on to the second paragraph, we find our protagonist facing a new challenge.',
        'In the third paragraph, tension builds as the plot thickens and mysteries deepen.',
        'The fourth paragraph brings a twist that no one expected.',
        'Finally, the fifth paragraph sets up the climax of this chapter.'
      ]

      // 每个段落足够长，总内容超过 500 字符
      const longParagraphs = paragraphs.map(p => p.repeat(3))
      const content = longParagraphs.join('\n')

      const result = splitIntoParagraphs(content)
      expect(result).toHaveLength(5)
    })
  })

  describe('paragraph comment button integration', () => {
    it('should produce array suitable for comment button rendering', () => {
      const content = 'Para 1\n\nPara 2\n\nPara 3'
      const paragraphs = splitIntoParagraphs(content)

      // 验证每个段落都可以获得一个评论按钮
      paragraphs.forEach((para, index) => {
        expect(para.length).toBeGreaterThan(0)
        expect(typeof index).toBe('number')
        expect(index).toBeGreaterThanOrEqual(0)
      })
    })

    it('should ensure at least one paragraph for comment button', () => {
      const content = 'Single paragraph content'
      const result = splitIntoParagraphs(content)
      expect(result.length).toBeGreaterThanOrEqual(1)
    })
  })
})
