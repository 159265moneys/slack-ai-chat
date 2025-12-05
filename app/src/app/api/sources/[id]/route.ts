// ===========================================
// ソース個別 API (取得・更新・削除)
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/rag'

// GET: ソース詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    const { data, error } = await db
      .from('sources')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Not Found', message: 'ソースが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Source GET error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// PUT: ソース更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const body = await request.json()

    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'タイトルと内容は必須です' },
        { status: 400 }
      )
    }

    // 内容が変更されていたらベクトルを再生成
    const { data: existing } = await db
      .from('sources')
      .select('content')
      .eq('id', id)
      .single()

    let embedding = undefined
    if (existing && existing.content !== content) {
      embedding = await generateEmbedding(content)
    }

    const updateData: Record<string, unknown> = {
      title,
      content,
    }

    if (embedding) {
      updateData.embedding = JSON.stringify(embedding)
    }

    const { data, error } = await db
      .from('sources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Source update error:', error)
      return NextResponse.json(
        { error: 'Database Error', message: 'ソースの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      source: data,
    })
  } catch (error) {
    console.error('Source PUT error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// DELETE: ソース削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // 論理削除（is_active = false）
    const { error } = await db
      .from('sources')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Source delete error:', error)
      return NextResponse.json(
        { error: 'Database Error', message: 'ソースの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ソースを削除しました',
    })
  } catch (error) {
    console.error('Source DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
