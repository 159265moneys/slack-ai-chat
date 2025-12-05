'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteSourceButtonProps {
  sourceId: string
  sourceTitle: string
}

export function DeleteSourceButton({ sourceId, sourceTitle }: DeleteSourceButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`「${sourceTitle}」を削除しますか？`)) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('削除に失敗しました')
      }

      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-gray-500 hover:text-red-600"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </Button>
  )
}



