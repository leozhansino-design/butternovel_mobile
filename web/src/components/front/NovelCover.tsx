import Image from 'next/image'

interface NovelCoverProps {
  src: string
  alt: string
  priority?: boolean
}

/**
 * Elegant novel cover component
 * - Fixed 2:3 aspect ratio (standard book ratio)
 * - Refined borders and shadows
 * - Hover zoom effect
 */
export default function NovelCover({ src, alt, priority = false }: NovelCoverProps) {
  return (
    <div className="relative w-full">
      {/* Main cover container */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-lg hover:shadow-2xl transition-shadow duration-300 group">
        {/* 封面图片 */}
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        
        {/* Refined inner border */}
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 pointer-events-none" />
        
        {/* Subtle gradient mask for depth enhancement */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 pointer-events-none" />
      </div>
      
      {/* Bottom shadow effect */}
      <div className="absolute -bottom-2 left-[10%] right-[10%] h-4 bg-black/10 blur-md rounded-full opacity-40 group-hover:opacity-60 transition-opacity" />
    </div>
  )
}