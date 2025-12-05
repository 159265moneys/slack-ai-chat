// ===========================================
// ソース管理 API
// POST: ソース登録
// GET: ソース一覧取得
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { registerSource } from '@/lib/rag'
import { createServiceClient } from '@/lib/supabase/server'

// ===========================================
// バリデーションスキーマ
// ===========================================

const createSourceSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255),
  content: z.string().min(1, '内容は必須です'),
})

// ===========================================
// POST: ソース登録
// ===========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // バリデーション
    const parsed = createSourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, content } = parsed.data

    // ソース登録（Embedding生成含む）
    const source = await registerSource(title, content)

    return NextResponse.json({
      success: true,
      data: source,
    })
  } catch (error) {
    console.error('POST /api/sources error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ===========================================
// GET: ソース一覧取得
// ===========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const isActive = searchParams.get('is_active')

    const offset = (page - 1) * limit

    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // クエリ構築
    let query = db
      .from('sources')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // フィルタ
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('GET /api/sources error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
