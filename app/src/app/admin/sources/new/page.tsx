'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Save, BookOpen } from 'lucide-react'

export default function NewSourcePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'ソースの登録に失敗しました')
      }

      router.push('/admin/sources')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link href="/admin/sources" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">新規ソース追加</h1>
          </div>
        </div>
      </header>

      {/* フォーム */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              ソース情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700">
                  タイトル <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 返品ポリシー"
                  required
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-gray-700">
                  内容 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="ナレッジの内容を入力..."
                  required
                  rows={12}
                  className="bg-white border-gray-200 text-gray-900 resize-none"
                />
                <p className="text-xs text-gray-500">
                  ※ 内容は自動的にベクトル化され、検索に使用されます
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <Link href="/admin/sources">
                  <Button type="button" variant="outline" className="border-gray-200">
                    キャンセル
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
