// ===========================================
// フィードバック API
// POST: フィードバック送信
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

// ===========================================
// バリデーションスキーマ
// ===========================================

const feedbackSchema = z.object({
  session_id: z.string().min(1),
  message_id: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(-1)]).optional(),
  comment: z.string().max(1000).optional(),
  question: z.string(),
  answer: z.string(),
  source_ids: z.array(z.string().uuid()).optional(),
})

// ===========================================
// POST: フィードバック送信
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { session_id, message_id, rating, comment, question, answer, source_ids } = parsed.data

    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    const { data, error } = await db
      .from('feedbacks')
      .insert({
        session_id,
        message_id,
        rating: rating || null,
        comment: comment || null,
        question,
        answer,
        source_ids: source_ids || [],
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('POST /api/feedback error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



