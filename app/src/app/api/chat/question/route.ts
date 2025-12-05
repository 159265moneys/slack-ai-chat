// ===========================================
// 質問応答 API
// POST: 質問を送信して回答を取得
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { answerQuestion } from '@/lib/rag'
import { createServiceClient } from '@/lib/supabase/server'

// ===========================================
// バリデーションスキーマ
// ===========================================

const questionSchema = z.object({
  session_id: z.string().min(1),
  message: z.string().min(1, '質問を入力してください').max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  filters: z.object({
    phase: z.string().optional(),
    company: z.string().optional(),
  }).optional(),
})

// ===========================================
// POST: 質問応答
// ===========================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    
    // バリデーション
    const parsed = questionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { session_id, message, history = [], filters } = parsed.data
    const messageId = uuidv4()

    // RAGで回答生成（フィルター適用）
    const result = await answerQuestion(message, history, filters)

    const responseTimeMs = Date.now() - startTime

    // チャットログを保存
    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    await db.from('chat_logs').insert({
      session_id,
      mode: 'question',
      question: message,
      answer: result.answer,
      source_ids: result.sources.map(s => s.id),
      response_time_ms: responseTimeMs,
    })

    // ソースの詳細情報を取得
    const sourceIds = result.sources.map(s => s.id)
    const { data: sourceDetails } = await db
      .from('sources')
      .select('id, title, content, metadata, slack_permalink')
      .in('id', sourceIds)

    // ソース情報をマージ
    const sourcesWithDetails = result.sources.map(s => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = sourceDetails?.find((d: any) => d.id === s.id)
      return {
        id: s.id,
        title: s.title,
        content: detail?.content || s.content,
        metadata: detail?.metadata || null,
        slack_permalink: detail?.slack_permalink || null,
        relevance_score: s.similarity,
      }
    })

    // レスポンス
    return NextResponse.json({
      message_id: messageId,
      answer: result.answer,
      sources: sourcesWithDetails,
      has_answer: result.hasAnswer,
    })
  } catch (error) {
    console.error('POST /api/chat/question error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

