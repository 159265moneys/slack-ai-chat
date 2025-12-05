// ===========================================
// RAG (Retrieval-Augmented Generation) コアロジック
// ===========================================

import { createEmbedding, chat, chatStream } from './openrouter'
import { createServiceClient } from './supabase/server'
import type { SourceSearchResult, Source } from '@/types'

// ===========================================
// Embedding生成（外部公開用）
// ===========================================

export async function generateEmbedding(text: string): Promise<number[]> {
  return await createEmbedding(text)
}

// ===========================================
// 定数
// ===========================================

const DEFAULT_MATCH_THRESHOLD = 0.3
const DEFAULT_MATCH_COUNT = 5

// ===========================================
// システムプロンプト
// ===========================================

export const SYSTEM_PROMPTS = {
  question: `あなたは社内ナレッジベースの専門アシスタントです。

【絶対厳守ルール】
1. 回答は必ず「参照コンテキスト」に記載された情報のみを使用すること
2. コンテキストにない情報は「まだその内容はナレッジシェアされていません。Slackからどんどんシェアしてね！」と回答すること
3. 推測や一般知識での補完は絶対に行わないこと
4. 不確かな情報を断定的に述べないこと

【回答スタイル】
- 丁寧で分かりやすい日本語で回答
- 必要に応じて箇条書きや番号付きリストを使用
- 専門用語は必要に応じて補足説明を加える`,

  review: `あなたは文章添削の専門アシスタントです。

【絶対厳守ルール】
1. 添削は必ず「参照コンテキスト」に記載されたルール・例文のみを根拠とすること
2. 参照コンテキストにないルールや一般的な文法知識での添削は行わないこと
3. 修正を行う場合は、必ず参照したソースを明記すること

【添削方針】
- 元の意図を損なわない範囲で修正
- 修正理由を具体的に説明
- 複数の修正案がある場合は最も適切なものを提示

【出力形式】
以下のJSON形式で出力してください:
{
  "revised_text": "修正後のテキスト",
  "corrections": [
    {
      "type": "修正タイプ（structure/wording/addition/deletion）",
      "original": "元のテキスト部分",
      "revised": "修正後のテキスト部分",
      "reason": "修正理由（参照ソースを明記）"
    }
  ]
}`,
}

// ===========================================
// ベクトル検索
// ===========================================

export async function searchSources(
  query: string,
  options: {
    matchThreshold?: number
    matchCount?: number
    filters?: {
      phase?: string
      company?: string
    }
  } = {}
): Promise<SourceSearchResult[]> {
  const {
    matchThreshold = DEFAULT_MATCH_THRESHOLD,
    matchCount = DEFAULT_MATCH_COUNT,
    filters = {},
  } = options

  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  try {
    // クエリをベクトル化
    const embedding = await createEmbedding(query)
    
    // 直接SQLでベクトル検索を実行
    let dbQuery = db
      .from('sources')
      .select('id, title, content, embedding, metadata')
      .eq('is_active', true)
      .not('embedding', 'is', null)
    
    // フィルター適用
    if (filters.phase) {
      dbQuery = dbQuery.filter('metadata->>phase', 'eq', filters.phase)
    }
    if (filters.company) {
      // 会社名は部分一致（正規化された名前で検索）
      dbQuery = dbQuery.filter('metadata->>company', 'ilike', `%${filters.company}%`)
    }
    
    const { data, error } = await dbQuery

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // コサイン類似度を計算してソート
    const results = data
      .map(source => {
        // embeddingが文字列の場合はパース
        let sourceEmbedding: number[]
        if (typeof source.embedding === 'string') {
          try {
            sourceEmbedding = JSON.parse(source.embedding)
          } catch {
            return { ...source, similarity: 0 }
          }
        } else {
          sourceEmbedding = source.embedding as number[]
        }
        
        if (!sourceEmbedding || sourceEmbedding.length !== embedding.length) {
          return { ...source, similarity: 0 }
        }
        
        // コサイン類似度計算
        let dotProduct = 0
        let normA = 0
        let normB = 0
        
        for (let i = 0; i < embedding.length; i++) {
          dotProduct += embedding[i] * sourceEmbedding[i]
          normA += embedding[i] * embedding[i]
          normB += sourceEmbedding[i] * sourceEmbedding[i]
        }
        
        const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
        
        return {
          id: source.id,
          title: source.title,
          content: source.content,
          similarity,
        }
      })
      .filter(s => s.similarity >= matchThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, matchCount)

    return results
  } catch (error) {
    console.error('Vector search error:', error)
    
    // フォールバック: キーワード検索
    const keywords = query.split(/\s+/).filter(k => k.length > 1)
    
    let fallbackQuery = db
      .from('sources')
      .select('id, title, content')
      .eq('is_active', true)
      .limit(matchCount)

    if (keywords.length > 0) {
      // ORでキーワード検索
      const orConditions = keywords.map(k => `content.ilike.%${k}%`).join(',')
      fallbackQuery = fallbackQuery.or(orConditions)
    }
    
    const { data: fallbackData } = await fallbackQuery
    
    return (fallbackData || []).map(s => ({
      ...s,
      similarity: 0.7,
    }))
  }
}

// ===========================================
// コンテキスト構築
// ===========================================

export function buildContext(sources: SourceSearchResult[]): string {
  if (sources.length === 0) {
    return '（該当するソースが見つかりませんでした）'
  }

  return sources
    .map((source, index) => {
      return `【ソース${index + 1}】(類似度: ${(source.similarity * 100).toFixed(1)}%)
タイトル: ${source.title}
内容:
${source.content}
---`
    })
    .join('\n\n')
}

// ===========================================
// 質問応答
// ===========================================

// ソースがない場合の固定メッセージ
const NO_SOURCE_MESSAGE = 'まだその内容はナレッジシェアされていません。Slackからどんどんシェアしてね！'

export async function answerQuestion(
  question: string,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
  filters?: { phase?: string; company?: string }
): Promise<{
  answer: string
  sources: SourceSearchResult[]
  hasAnswer: boolean
}> {
  // 関連ソースを検索（フィルター適用）
  const sources = await searchSources(question, { filters })
  
  // ソースがない場合は固定メッセージを返す
  if (sources.length === 0) {
    return {
      answer: NO_SOURCE_MESSAGE,
      sources: [],
      hasAnswer: false,
    }
  }
  
  // コンテキストを構築
  const context = buildContext(sources)
  
  // プロンプトを構築
  const systemPrompt = SYSTEM_PROMPTS.question
  const userPrompt = `【参照コンテキスト】
${context}

【ユーザーの質問】
${question}`

  // メッセージを構築
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userPrompt },
  ]

  // LLMで回答生成
  const answer = await chat(messages)

  return {
    answer,
    sources,
    hasAnswer: true,
  }
}

// ===========================================
// 添削
// ===========================================

export async function reviewText(
  text: string
): Promise<{
  originalText: string
  revisedText: string
  corrections: {
    type: string
    original: string
    revised: string
    reason: string
  }[]
  sources: SourceSearchResult[]
}> {
  // 関連ソース（ルール・例文）を検索
  const sources = await searchSources(text, {
    matchThreshold: 0.5, // 添削は少し緩めに検索
    matchCount: 8,
  })
  
  // コンテキストを構築
  const context = buildContext(sources)
  
  // プロンプトを構築
  const systemPrompt = SYSTEM_PROMPTS.review
  const userPrompt = `【参照コンテキスト】
${context}

【添削対象のテキスト】
${text}`

  // メッセージを構築
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  // LLMで添削生成
  const response = await chat(messages, { temperature: 0.2 })
  
  // JSONをパース
  let result: { revised_text: string; corrections: any[] }
  try {
    // JSONブロックを抽出
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0])
    } else {
      // JSONが見つからない場合
      result = {
        revised_text: text,
        corrections: [],
      }
    }
  } catch {
    // パース失敗時
    result = {
      revised_text: text,
      corrections: [{
        type: 'info',
        original: '',
        revised: '',
        reason: response,
      }],
    }
  }

  return {
    originalText: text,
    revisedText: result.revised_text || text,
    corrections: result.corrections || [],
    sources,
  }
}

// ===========================================
// ソース登録（Embedding生成含む）
// ===========================================

export async function registerSource(
  title: string,
  content: string
): Promise<Source> {
  // Embeddingを生成
  const embedding = await createEmbedding(content)
  
  // Supabaseに保存
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  
  const { data, error } = await db
    .from('sources')
    .insert({
      title,
      content,
      embedding,
      source_type: 'manual',
    })
    .select()
    .single()

  if (error) {
    console.error('Source registration error:', error)
    throw new Error(`ソース登録に失敗しました: ${error.message}`)
  }

  return data
}

// ===========================================
// ソース更新（Embedding再生成含む）
// ===========================================

export async function updateSource(
  id: string,
  updates: {
    title?: string
    content?: string
    isActive?: boolean
  }
): Promise<Source> {
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  
  // contentが更新される場合はEmbeddingも再生成
  let embedding: number[] | undefined
  if (updates.content) {
    embedding = await createEmbedding(updates.content)
  }
  
  const { data, error } = await db
    .from('sources')
    .update({
      ...(updates.title && { title: updates.title }),
      ...(updates.content && { content: updates.content }),
      ...(updates.isActive !== undefined && { is_active: updates.isActive }),
      ...(embedding && { embedding }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Source update error:', error)
    throw new Error(`ソース更新に失敗しました: ${error.message}`)
  }

  return data
}

