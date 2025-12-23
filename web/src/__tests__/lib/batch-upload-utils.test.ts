/**
 * Batch Upload Utils 测试
 * 测试章节内容规范化功能
 */

import { normalizeChapterContent } from '@/lib/batch-upload-utils'

describe('batch-upload-utils', () => {
  describe('normalizeChapterContent', () => {
    describe('line ending normalization', () => {
      it('should convert Windows line endings (\\r\\n) to Unix (\\n)', () => {
        const input = 'Line 1\r\nLine 2\r\nLine 3'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Line 1\nLine 2\nLine 3')
        expect(result).not.toContain('\r')
      })

      it('should convert old Mac line endings (\\r) to Unix (\\n)', () => {
        const input = 'Line 1\rLine 2\rLine 3'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Line 1\nLine 2\nLine 3')
        expect(result).not.toContain('\r')
      })

      it('should handle mixed line endings', () => {
        const input = 'Line 1\r\nLine 2\rLine 3\nLine 4'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Line 1\nLine 2\nLine 3\nLine 4')
        expect(result).not.toContain('\r')
      })

      it('should preserve double newlines for paragraph separation', () => {
        const input = 'Paragraph 1\r\n\r\nParagraph 2'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Paragraph 1\n\nParagraph 2')
      })
    })

    describe('trailing whitespace removal', () => {
      it('should remove trailing spaces from lines', () => {
        const input = 'Line 1   \nLine 2  \nLine 3'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Line 1\nLine 2\nLine 3')
      })

      it('should remove trailing tabs from lines', () => {
        const input = 'Line 1\t\t\nLine 2\t\nLine 3'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Line 1\nLine 2\nLine 3')
      })

      it('should trim leading whitespace from entire content (but preserve internal indentation)', () => {
        const input = '  Line 1\n  Line 2'
        const result = normalizeChapterContent(input)
        // trim() removes leading spaces from the entire content
        // Internal indentation after newlines is preserved
        expect(result).toBe('Line 1\n  Line 2')
      })
    })

    describe('excessive newlines handling', () => {
      it('should collapse 3+ consecutive newlines to 2', () => {
        const input = 'Paragraph 1\n\n\n\nParagraph 2'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Paragraph 1\n\nParagraph 2')
      })

      it('should handle many consecutive newlines', () => {
        const input = 'Paragraph 1\n\n\n\n\n\n\n\nParagraph 2'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Paragraph 1\n\nParagraph 2')
      })

      it('should preserve exactly 2 consecutive newlines', () => {
        const input = 'Paragraph 1\n\nParagraph 2'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Paragraph 1\n\nParagraph 2')
      })

      it('should preserve single newlines within paragraphs', () => {
        const input = 'Line 1\nLine 2\n\nParagraph 2'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Line 1\nLine 2\n\nParagraph 2')
      })
    })

    describe('trimming', () => {
      it('should trim leading whitespace from content', () => {
        const input = '\n\n  Content starts here'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Content starts here')
      })

      it('should trim trailing whitespace from content', () => {
        const input = 'Content ends here  \n\n'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Content ends here')
      })

      it('should trim both leading and trailing whitespace', () => {
        const input = '\n\n\n  Content  \n\n\n'
        const result = normalizeChapterContent(input)
        expect(result).toBe('Content')
      })
    })

    describe('edge cases', () => {
      it('should return empty string for empty input', () => {
        expect(normalizeChapterContent('')).toBe('')
      })

      it('should return empty string for null-like input', () => {
        expect(normalizeChapterContent(null as any)).toBe('')
        expect(normalizeChapterContent(undefined as any)).toBe('')
      })

      it('should return empty string for whitespace-only input', () => {
        expect(normalizeChapterContent('   \n\n\t  ')).toBe('')
      })

      it('should handle single character content', () => {
        expect(normalizeChapterContent('A')).toBe('A')
      })

      it('should handle content with no newlines', () => {
        const input = 'Single line content without any breaks'
        expect(normalizeChapterContent(input)).toBe(input)
      })
    })

    describe('real-world scenarios', () => {
      it('should properly format typical novel chapter content', () => {
        const input = `  Chapter content starts here.  \r\n\r\nThis is the second paragraph with some text.\r\n\r\n\r\nThis is the third paragraph after extra blank lines.  `

        const result = normalizeChapterContent(input)

        expect(result).toBe(
          `Chapter content starts here.\n\nThis is the second paragraph with some text.\n\nThis is the third paragraph after extra blank lines.`
        )
      })

      it('should handle Chinese content with Windows line endings', () => {
        const input = '第一段中文内容。\r\n\r\n第二段中文内容。\r\n\r\n第三段中文内容。'
        const result = normalizeChapterContent(input)

        expect(result).toBe('第一段中文内容。\n\n第二段中文内容。\n\n第三段中文内容。')
        // Verify it can be split into paragraphs
        const paragraphs = result.split(/\n\n+/)
        expect(paragraphs).toHaveLength(3)
      })

      it('should produce content that ChapterReader can split correctly', () => {
        const input = 'Para 1\r\n\r\nPara 2\r\n\r\nPara 3'
        const result = normalizeChapterContent(input)

        // Simulate ChapterReader's paragraph splitting logic
        const splitParagraphs = result
          .split(/\n\n+/)
          .map(p => p.trim())
          .filter(p => p.length > 0)

        expect(splitParagraphs).toEqual(['Para 1', 'Para 2', 'Para 3'])
        expect(splitParagraphs).toHaveLength(3)
      })

      it('should handle dialogue formatting', () => {
        const input = '"Hello," said Alice.\r\n\r\n"Hi there!" Bob replied.\r\n\r\n"How are you?" asked Alice.'
        const result = normalizeChapterContent(input)

        const paragraphs = result.split(/\n\n+/)
        expect(paragraphs).toHaveLength(3)
      })

      it('should handle mixed content with indentation', () => {
        const input = '    First paragraph with indent.    \r\n\r\n    Second paragraph with indent.    '
        const result = normalizeChapterContent(input)

        // trim() removes leading spaces from the entire content, but preserves internal paragraph indentation
        expect(result).toBe('First paragraph with indent.\n\n    Second paragraph with indent.')
      })
    })

    describe('paragraph comment button compatibility', () => {
      it('should ensure each paragraph gets its own comment button', () => {
        // This test verifies that normalized content works with ChapterReader's
        // paragraph splitting logic for comment buttons
        const input = 'Paragraph one content.\r\n\r\nParagraph two content.\r\n\r\nParagraph three content.'
        const result = normalizeChapterContent(input)

        // ChapterReader splits by /\n\n+/
        const paragraphs = result.split(/\n\n+/).filter(p => p.trim())

        // Each paragraph should have its own comment button index
        expect(paragraphs).toHaveLength(3)
        paragraphs.forEach((p, index) => {
          expect(p.trim()).not.toBe('')
          // Index is used for ParagraphCommentButton
          expect(typeof index).toBe('number')
        })
      })
    })
  })
})
