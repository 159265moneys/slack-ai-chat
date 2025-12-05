// ===========================================
// 添削 API
// POST: テキストを送信して添削結果を取得
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { reviewText } from '@/lib/rag'
import { createServiceClient } from '@/lib/supabase/server'

// ===========================================
// バリデーションスキーマ
// ===========================================

const reviewSchema = z.object({
  session_id: z.string().min(1),
  text: z.string().min(1, '添削するテキストを入力してください').max(5000),
})

// ===========================================
// POST: 添削
// ===========================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    
    // バリデーション
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { session_id, text } = parsed.data
    const messageId = uuidv4()

    // RAGで添削生成
    const result = await reviewText(text)

    const responseTimeMs = Date.now() - startTime

    // チャットログを保存
    const supabase = createServiceClient()
    await supabase.from('chat_logs').insert({
      session_id,
      mode: 'review',
      question: text,
      answer: result.revisedText,
      source_ids: result.sources.map(s => s.id),
      response_time_ms: responseTimeMs,
    })

    // レスポンス
    return NextResponse.json({
      message_id: messageId,
      original_text: result.originalText,
      revised_text: result.revisedText,
      corrections: result.corrections,
      sources: result.sources.map(s => ({
        id: s.id,
        title: s.title,
        category: null,
      })),
    })
  } catch (error) {
    console.error('POST /api/chat/review error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



