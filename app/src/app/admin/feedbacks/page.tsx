'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Clock,
  Eye,
  Loader2
} from 'lucide-react'

interface Feedback {
  id: string
  session_id: string
  message_id: string
  rating: number | null
  comment: string | null
  question: string
  answer: string
  source_ids: string[] | null
  status: 'pending' | 'reviewed' | 'resolved'
  created_at: string
}

export default function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    fetchFeedbacks()
  }, [filter])

  const fetchFeedbacks = async () => {
    setIsLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query.limit(100)
    if (data) {
      setFeedbacks(data)
    }
    setIsLoading(false)
  }

  const updateStatus = async (id: string, status: 'pending' | 'reviewed' | 'resolved') => {
    const supabase = createClient()
    await supabase
      .from('feedbacks')
      .update({ status } as Record<string, unknown>)
      .eq('id', id)
    fetchFeedbacks()
    if (selectedFeedback?.id === id) {
      setSelectedFeedback({ ...selectedFeedback, status })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            未対応
          </span>
        )
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
            <Eye className="w-3 h-3" />
            確認済
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            対応済
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <MessageSquare className="w-6 h-6 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">フィードバック管理</h1>
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'pending', 'reviewed', 'resolved'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'bg-gray-900 text-white' : 'border-gray-200'}
                >
                  {f === 'all' ? 'すべて' : f === 'pending' ? '未対応' : f === 'reviewed' ? '確認済' : '対応済'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* フィードバック一覧 */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <Card
                  key={fb.id}
                  className={`bg-white cursor-pointer transition-all hover:shadow-md ${
                    selectedFeedback?.id === fb.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedFeedback(fb)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {fb.rating === 1 ? (
                          <ThumbsUp className="w-5 h-5 text-green-500" />
                        ) : fb.rating === -1 ? (
                          <ThumbsDown className="w-5 h-5 text-red-500" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-gray-400" />
                        )}
                        {getStatusBadge(fb.status)}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(fb.created_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2 font-medium">
                      {fb.question}
                    </p>
                    {fb.comment && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        💬 {fb.comment}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">フィードバックがありません</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 詳細パネル */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            {selectedFeedback ? (
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      フィードバック詳細
                    </CardTitle>
                    {getStatusBadge(selectedFeedback.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedFeedback.created_at).toLocaleString('ja-JP')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 評価 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">評価</p>
                    <div className="flex items-center gap-2">
                      {selectedFeedback.rating === 1 ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="w-5 h-5" />
                          役に立った
                        </span>
                      ) : selectedFeedback.rating === -1 ? (
                        <span className="flex items-center gap-1 text-red-600">
                          <ThumbsDown className="w-5 h-5" />
                          役に立たなかった
                        </span>
                      ) : (
                        <span className="text-gray-400">評価なし</span>
                      )}
                    </div>
                  </div>

                  {/* 質問 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">質問内容</p>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-900">
                      {selectedFeedback.question}
                    </div>
                  </div>

                  {/* 回答 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Botの回答</p>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-900 max-h-48 overflow-y-auto">
                      {selectedFeedback.answer}
                    </div>
                  </div>

                  {/* コメント */}
                  {selectedFeedback.comment && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ユーザーコメント</p>
                      <div className="bg-yellow-50 rounded-lg p-3 text-sm text-gray-900 border border-yellow-200">
                        {selectedFeedback.comment}
                      </div>
                    </div>
                  )}

                  {/* ステータス変更 */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">ステータス変更</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={selectedFeedback.status === 'pending' ? 'default' : 'outline'}
                        onClick={() => updateStatus(selectedFeedback.id, 'pending')}
                        className={selectedFeedback.status === 'pending' ? 'bg-yellow-500' : ''}
                      >
                        未対応
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedFeedback.status === 'reviewed' ? 'default' : 'outline'}
                        onClick={() => updateStatus(selectedFeedback.id, 'reviewed')}
                        className={selectedFeedback.status === 'reviewed' ? 'bg-blue-500' : ''}
                      >
                        確認済
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedFeedback.status === 'resolved' ? 'default' : 'outline'}
                        onClick={() => updateStatus(selectedFeedback.id, 'resolved')}
                        className={selectedFeedback.status === 'resolved' ? 'bg-green-500' : ''}
                      >
                        対応済
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    左のリストからフィードバックを選択してください
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}



