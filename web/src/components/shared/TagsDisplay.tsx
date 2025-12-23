'use client'

import Link from 'next/link'

interface Tag {
  id?: string
  name: string
  slug: string
}

interface TagsDisplayProps {
  tags: Tag[]
  clickable?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'outlined'
}

export default function TagsDisplay({
  tags,
  clickable = true,
  className = '',
  variant = 'default'
}: TagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  // Variant styles
  const variantStyles = {
    default: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    compact: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outlined: 'border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
  }

  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors'

  const TagElement = ({ tag }: { tag: Tag }) => {
    const content = (
      <span className={`${baseStyles} ${variantStyles[variant]}`}>
        {tag.name}
      </span>
    )

    if (clickable) {
      return (
        <Link
          href={`/tags/${tag.slug}`}
          className="inline-block"
          title={`View novels with tag: ${tag.name}`}
        >
          {content}
        </Link>
      )
    }

    return content
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <TagElement key={tag.slug || tag.name} tag={tag} />
      ))}
    </div>
  )
}
