'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Save, BookOpen, Trash2, User, Briefcase, Tag, Building2, ExternalLink, Link2 } from 'lucide-react'

interface SourceMetadata {
  poster?: string
  phase?: string
  theme?: string
  company?: string
  jobType?: string
  links?: string[]
  rawContent?: string
}

interface Source {
  id: string
  title: string
  content: string
  created_at: string
  source_type?: string
  slack_permalink?: string
  metadata?: SourceMetadata
}

export default function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [source, setSource] = useState<Source | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // ソース取得
      const { data: src } = await supabase
        .from('sources')
        .select('id, title, content, created_at, source_type, slack_permalink, metadata')
        .eq('id', id)
        .single()
      
      if (src) {
        setSource(src)
        setTitle(src.title)
        setContent(src.content)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'ソースの更新に失敗しました')
      }

      router.push('/admin/sources')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このソースを削除しますか？')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('削除に失敗しました')
      }

      router.push('/admin/sources')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!source) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/admin/sources" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">ソース編集</h1>
            </div>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </>
              )}
            </Button>
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
            <p className="text-sm text-gray-500">
              作成日: {new Date(source.created_at).toLocaleString('ja-JP')}
            </p>
          </CardHeader>
          <CardContent>
            {/* Slackソースの場合、構造化フィールドを表示 */}
            {source.source_type === 'slack' && source.metadata && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Slackワークフロー情報
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">投稿者:</span>
                    <span className="font-medium text-gray-900">{source.metadata.poster || '無記載'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">業務フェーズ:</span>
                    <span className="font-medium text-gray-900">{source.metadata.phase || '無記載'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">テーマ:</span>
                    <span className="font-medium text-gray-900">{source.metadata.theme || '無記載'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-600">会社名:</span>
                    <span className="font-medium text-gray-900">{source.metadata.company || '無記載'}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Briefcase className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-600">職種・領域:</span>
                    <span className="font-medium text-gray-900">{source.metadata.jobType || '無記載'}</span>
                  </div>
                  {/* 資料・リンク */}
                  {source.metadata.links && source.metadata.links.length > 0 && (
                    <div className="col-span-2 mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="w-4 h-4 text-indigo-600" />
                        <span className="text-gray-600">資料・リンク:</span>
                      </div>
                      <div className="ml-6 space-y-1">
                        {source.metadata.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-600 hover:text-blue-700 hover:underline truncate"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {source.slack_permalink && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <a
                      href={source.slack_permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Slackで元メッセージを見る
                    </a>
                  </div>
                )}
              </div>
            )}

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
                  ※ 内容を更新するとベクトルが再生成されます
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

