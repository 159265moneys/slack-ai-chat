'use client'

import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ChatHeader, ChatBubble, ChatInput } from '@/components/chat'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: {
    id: string
    title: string
    relevance_score?: number
  }[]
  feedbackGiven?: 1 | -1 | null
}

interface FilterOptions {
  phases: string[]
  companies: string[]
}

export default function QuestionPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'こんにちは！ナレッジベースに基づいてお答えします。\n何でもお聞きください。',
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => uuidv4())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // フィルター状態
  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ phases: [], companies: [] })
  
  // 会社名を正規化する関数（「株式会社」「様」などを除去）
  const normalizeCompanyName = (name: string): string => {
    return name
      .replace(/^株式会社\s*/g, '')  // 先頭の「株式会社」
      .replace(/\s*株式会社$/g, '')  // 末尾の「株式会社」
      .replace(/^有限会社\s*/g, '')  // 先頭の「有限会社」
      .replace(/\s*有限会社$/g, '')  // 末尾の「有限会社」
      .replace(/様$/g, '')           // 末尾の「様」
      .replace(/（.*?）/g, '')       // 括弧内を除去
      .replace(/\(.*?\)/g, '')       // 半角括弧内を除去
      .trim()
  }

  // フィルターオプションを取得
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data: sources } = await db
        .from('sources')
        .select('metadata')
        .eq('is_active', true)
      
      if (sources) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sourceList = sources as any[]
        const phases: string[] = [...new Set(
          sourceList
            .map(s => s.metadata?.phase as string | undefined)
            .filter((p): p is string => Boolean(p && p !== '無記載'))
        )].sort()
        
        // 会社名を正規化してユニーク化
        const rawCompanies: string[] = sourceList
          .map(s => s.metadata?.company as string | undefined)
          .filter((c): c is string => Boolean(c && c !== '無記載'))
        
        // 正規化した名前でユニーク化（元の名前も保持）
        const companyMap = new Map<string, string>()
        rawCompanies.forEach(company => {
          const normalized = normalizeCompanyName(company)
          if (normalized && !companyMap.has(normalized)) {
            companyMap.set(normalized, normalized)
          }
        })
        
        const companies: string[] = [...companyMap.values()].sort()
        
        setFilterOptions({ phases, companies })
      }
    }
    fetchFilterOptions()
  }, [])

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (message: string) => {
    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // 会話履歴を構築（最新5件まで）
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      // フィルター条件を構築
      const filters: { phase?: string; company?: string } = {}
      if (selectedPhase) filters.phase = selectedPhase
      if (selectedCompany) filters.company = selectedCompany

      // APIを呼び出し
      const response = await fetch('/api/chat/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message,
          history,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: Message = {
          id: data.message_id,
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          feedbackGiven: null,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: `エラーが発生しました: ${data.message || '不明なエラー'}`,
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '通信エラーが発生しました。もう一度お試しください。',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'こんにちは！ナレッジベースに基づいてお答えします。\n何でもお聞きください。',
      },
    ])
  }

  const handleFeedback = async (messageId: string, rating: 1 | -1) => {
    // UIを即座に更新
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedbackGiven: rating } : m))
    )

    // 該当メッセージを取得
    const message = messages.find((m) => m.id === messageId)
    const prevUserMessage = messages[messages.indexOf(message!) - 1]

    // フィードバックをAPIに送信
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message_id: messageId,
          rating,
          question: prevUserMessage?.content || '',
          answer: message?.content || '',
          source_ids: message?.sources?.map((s) => s.id) || [],
        }),
      })
    } catch (error) {
      console.error('Feedback error:', error)
    }
  }

  return (
    <div className="min-h-screen gradient-bg text-gray-900">
      <ChatHeader title="質問モード" onClear={handleClear} />

      {/* フィルタータグ */}
      <div className="fixed top-16 left-0 right-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">絞り込み:</span>
            
            {/* 業務フェーズ */}
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">📋 業務フェーズ</option>
              {filterOptions.phases.map((phase) => (
                <option key={phase} value={phase}>{phase}</option>
              ))}
            </select>
            
            {/* 会社 */}
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">🏢 会社名</option>
              {filterOptions.companies.map((company) => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
            
            {/* 選択中のタグ表示 & クリアボタン */}
            {(selectedPhase || selectedCompany) && (
              <button
                onClick={() => { setSelectedPhase(''); setSelectedCompany(''); }}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X className="w-3 h-3" />
                クリア
              </button>
            )}
          </div>
          
          {/* 選択中の表示 */}
          {(selectedPhase || selectedCompany) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedPhase && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  📋 {selectedPhase}
                </span>
              )}
              {selectedCompany && (
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                  🏢 {selectedCompany}
                </span>
              )}
              <span className="text-xs text-gray-500">のソースから回答</span>
            </div>
          )}
        </div>
      </div>

      {/* メッセージエリア */}
      <main className={`pb-32 px-4 ${selectedPhase || selectedCompany ? 'pt-36' : 'pt-20'}`}>
        <div className="max-w-4xl mx-auto custom-scrollbar">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              sources={message.sources}
              onFeedback={
                message.role === 'assistant' && message.id !== 'welcome'
                  ? (rating) => handleFeedback(message.id, rating)
                  : undefined
              }
              feedbackGiven={message.feedbackGiven}
            />
          ))}

          {isLoading && (
            <ChatBubble role="assistant" content="" isLoading={true} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 入力エリア */}
      <ChatInput
        onSend={handleSend}
        placeholder="質問を入力..."
        disabled={isLoading}
      />
    </div>
  )
}

