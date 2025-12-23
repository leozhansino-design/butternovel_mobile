'use client'
// src/components/novel/ClientAddToLibraryButton.tsx
// Add to library button with client-side session fetching

import { useSession } from 'next-auth/react'
import AddToLibraryButton from './AddToLibraryButton'

interface ClientAddToLibraryButtonProps {
  novelId: number
  compact?: boolean  // 移动端紧凑模式
}

export default function ClientAddToLibraryButton({
  novelId,
  compact = false
}: ClientAddToLibraryButtonProps) {
  const { data: session } = useSession()

  return (
    <AddToLibraryButton
      novelId={novelId}
      userId={session?.user?.id}
      compact={compact}
    />
  )
}
