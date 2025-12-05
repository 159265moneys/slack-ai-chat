'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Copy, Check, BookOpen, ArrowRight } from 'lucide-react'
import { ChatHeader } from '@/components/chat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

interface Correction {
  type: string
  original: string
  revised: string
  reason: string
}

interface ReviewResult {
  id: string
  originalText: string
  revisedText: string
  corrections: Correction[]
  sources: { id: string; title: string }[]
}

export default function ReviewPage() {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sessionId] = useState(() => uuidv4())

  const handleReview = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/chat/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          text: inputText,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          id: data.message_id,
          originalText: data.original_text,
          revisedText: data.revised_text,
          corrections: data.corrections || [],
          sources: data.sources || [],
        })
      } else {
        alert(`エラー: ${data.message || '不明なエラー'}`)
      }
    } catch (error) {
      alert('通信エラーが発生しました。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (result?.revisedText) {
      await navigator.clipboard.writeText(result.revisedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClear = () => {
    setInputText('')
    setResult(null)
  }

  const getCorrectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      structure: '構造',
      wording: '言い回し',
      addition: '追加',
      deletion: '削除',
      info: '情報',
    }
    return labels[type] || type
  }

  const getCorrectionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      structure: 'bg-blue-500/20 text-blue-400',
      wording: 'bg-purple-500/20 text-purple-400',
      addition: 'bg-green-500/20 text-green-400',
      deletion: 'bg-red-500/20 text-red-400',
      info: 'bg-gray-500/20 text-gray-400',
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div className="min-h-screen gradient-bg text-gray-900">
      <ChatHeader title="添削モード" onClear={handleClear} />

      <main className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 入力エリア */}
          <Card className="glass border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">添削したいテキスト</h2>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="添削したいテキストを入力してください..."
              className="min-h-[150px] bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 resize-none mb-4"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleReview}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    添削中...
                  </>
                ) : (
                  <>
                    添削を依頼
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* 結果エリア */}
          {result && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 修正案 */}
              <Card className="glass border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">修正案</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                        コピーしました
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        コピー
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-gray-800">
                  {result.revisedText}
                </div>
              </Card>

              {/* 修正ポイント */}
              {result.corrections.length > 0 && (
                <Card className="glass border-gray-200 p-6">
                  <h2 className="text-lg font-semibold mb-4">修正ポイント</h2>
                  <div className="space-y-4">
                    {result.corrections.map((correction, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getCorrectionTypeColor(
                              correction.type
                            )}`}
                          >
                            {getCorrectionTypeLabel(correction.type)}
                          </span>
                        </div>
                        {correction.original && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">変更前:</span>
                            <div className="text-red-500 line-through">
                              {correction.original}
                            </div>
                          </div>
                        )}
                        {correction.revised && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">変更後:</span>
                            <div className="text-green-600">
                              {correction.revised}
                            </div>
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          {correction.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 参照ソース */}
              {result.sources.length > 0 && (
                <Card className="glass border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold">参照ソース</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((source) => (
                      <span
                        key={source.id}
                        className="text-sm bg-blue-50 text-gray-700 rounded-lg px-3 py-1"
                      >
                        {source.title}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

