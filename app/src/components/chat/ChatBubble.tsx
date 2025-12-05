'use client'

import { useState } from 'react'
import { Bot, User, ThumbsUp, ThumbsDown, BookOpen, X, ExternalLink, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Source {
  id: string
  title: string
  content?: string
  relevance_score?: number
  slack_permalink?: string
  metadata?: {
    poster?: string
    phase?: string
    theme?: string
    company?: string
    jobType?: string
    links?: string[]
  }
}

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  isLoading?: boolean
  onFeedback?: (rating: 1 | -1) => void
  feedbackGiven?: 1 | -1 | null
}

export function ChatBubble({
  role,
  content,
  sources,
  isLoading,
  onFeedback,
  feedbackGiven,
}: ChatBubbleProps) {
  const isUser = role === 'user'
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)

  return (
    <>
      <div className={cn('flex gap-3 mb-4', isUser && 'flex-row-reverse')}>
        {/* アバター */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : 'bg-gradient-to-br from-purple-500 to-pink-600'
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* メッセージ */}
        <div className={cn('max-w-[80%]', isUser && 'text-right')}>
          <div
            className={cn(
              'rounded-2xl px-4 py-3 inline-block text-left',
              isUser ? 'chat-bubble-user text-white' : 'chat-bubble-bot text-gray-800'
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
                <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
                <div className="w-2 h-2 rounded-full bg-gray-400 typing-dot" />
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{content}</div>
            )}
          </div>

          {/* ソース参照 */}
          {!isUser && sources && sources.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <BookOpen className="w-3 h-3" />
                <span>参照ソース:</span>
              </div>
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source)}
                  className="inline-flex items-center gap-2 text-xs bg-blue-50 hover:bg-blue-100 rounded-lg px-2 py-1 mr-1 transition-colors cursor-pointer text-left"
                >
                  <span className="text-gray-700">{source.title}</span>
                  {source.relevance_score && (
                    <span className="text-gray-500">
                      {(source.relevance_score * 100).toFixed(0)}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* フィードバックボタン */}
          {!isUser && !isLoading && onFeedback && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-2">役立ちましたか？</span>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'w-7 h-7',
                  feedbackGiven === 1
                    ? 'text-green-400 bg-green-400/20'
                    : 'text-gray-500 hover:text-green-400'
                )}
                onClick={() => onFeedback(1)}
                disabled={feedbackGiven !== null}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'w-7 h-7',
                  feedbackGiven === -1
                    ? 'text-red-400 bg-red-400/20'
                    : 'text-gray-500 hover:text-red-400'
                )}
                onClick={() => onFeedback(-1)}
                disabled={feedbackGiven !== null}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ソース詳細モーダル */}
      {selectedSource && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedSource(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">ソース詳細</h3>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* タイトル */}
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                {selectedSource.title}
              </h4>

              {/* メタデータ */}
              {selectedSource.metadata && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSource.metadata.poster && selectedSource.metadata.poster !== '無記載' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        👤 {selectedSource.metadata.poster}
                      </span>
                    )}
                    {selectedSource.metadata.phase && selectedSource.metadata.phase !== '無記載' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">
                        📋 {selectedSource.metadata.phase}
                      </span>
                    )}
                    {selectedSource.metadata.company && selectedSource.metadata.company !== '無記載' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                        🏢 {selectedSource.metadata.company}
                      </span>
                    )}
                    {selectedSource.metadata.jobType && selectedSource.metadata.jobType !== '無記載' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                        💼 {selectedSource.metadata.jobType}
                      </span>
                    )}
                  </div>
                  {/* 資料・リンク */}
                  {selectedSource.metadata.links && selectedSource.metadata.links.length > 0 && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-1 text-xs text-indigo-700 font-medium mb-2">
                        <Link2 className="w-3 h-3" />
                        <span>資料・リンク</span>
                      </div>
                      <div className="space-y-1">
                        {selectedSource.metadata.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:text-blue-700 hover:underline truncate"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 関連度 */}
              {selectedSource.relevance_score && (
                <div className="mb-4">
                  <span className="text-xs text-gray-500">
                    関連度: {(selectedSource.relevance_score * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {/* 本文 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedSource.content || '内容がありません'}
                </p>
              </div>

              {/* Slackリンク */}
              {selectedSource.slack_permalink && (
                <div className="mt-4">
                  <a
                    href={selectedSource.slack_permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Slackで元メッセージを見る
                  </a>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => setSelectedSource(null)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
