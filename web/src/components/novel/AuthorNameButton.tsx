'use client'

import { useState } from 'react'
import LibraryModal from '@/components/shared/LibraryModal'
import { useSession } from 'next-auth/react'

interface AuthorNameButtonProps {
  authorId: string
  authorName: string
}

export default function AuthorNameButton({ authorId, authorName }: AuthorNameButtonProps) {
  const { data: session } = useSession()
  const [showModal, setShowModal] = useState(false)

  const handleClick = () => {
    setShowModal(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="font-semibold text-gray-900 hover:text-amber-600 transition-colors cursor-pointer"
      >
        {authorName}
      </button>

      {showModal && (
        <LibraryModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          user={{
            name: session?.user?.name,
            email: session?.user?.email,
            image: session?.user?.image
          }}
          viewUserId={authorId}
        />
      )}
    </>
  )
}
