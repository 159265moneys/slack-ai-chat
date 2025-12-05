'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  BookOpen,
  Edit,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react'

interface Source {
  id: string
  title: string
  content: string
  created_at: string
  metadata: {
    poster?: string
    phase?: string
  } | null
}

interface SourceListProps {
  sources: Source[]
}

export function SourceList({ sources }: SourceListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === sources.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sources.map(s => s.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    
    if (!confirm(`${selectedIds.size}件のソースを削除しますか？`)) return

    setIsDeleting(true)
    try {
      // 並列で削除
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/sources/${id}`, { method: 'DELETE' })
        )
      )
      setSelectedIds(new Set())
      router.refresh()
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSingleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return

    try {
      await fetch(`/api/sources/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      alert('削除に失敗しました')
    }
  }

  if (sources.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            ソースがありません
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 一括操作バー */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {selectedIds.size === sources.length ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            {selectedIds.size === sources.length ? '全解除' : '全選択'}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {selectedIds.size}件選択中
            </span>
          )}
        </div>
        
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                削除中...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {selectedIds.size}件を削除
              </>
            )}
          </Button>
        )}
      </div>

      {/* ソース一覧 */}
      {sources.map((source) => (
        <Card 
          key={source.id} 
          className={`bg-white hover:shadow-md transition-all ${
            selectedIds.has(source.id) ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* チェックボックス */}
              <button
                onClick={() => toggleSelect(source.id)}
                className="mt-1 flex-shrink-0"
              >
                {selectedIds.has(source.id) ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>

              {/* コンテンツ */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {source.metadata?.phase && source.metadata.phase !== '無記載' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">
                      📋 {source.metadata.phase}
                    </span>
                  )}
                  {source.metadata?.poster && source.metadata.poster !== '無記載' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      👤 {source.metadata.poster}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(source.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {source.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {source.content}
                </p>
              </div>

              {/* アクションボタン */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link href={`/admin/sources/${source.id}`}>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => handleSingleDelete(source.id, source.title)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

