// ===========================================
// OpenRouter クライアント
// OpenAI SDK互換でLLMを呼び出し
// ===========================================

import OpenAI from 'openai'

// ===========================================
// クライアント初期化
// ===========================================

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Knowledge ChatBot',
  },
})

// ===========================================
// 利用可能なモデル
// ===========================================

export const MODELS = {
  // 高速・低コスト
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  // 高精度
  'gpt-4o': 'openai/gpt-4o',
  'claude-sonnet': 'anthropic/claude-sonnet-4',
  'claude-haiku': 'anthropic/claude-3-5-haiku',
  // Embedding
  'embedding': 'openai/text-embedding-3-small',
} as const

export type ModelKey = keyof typeof MODELS

// ===========================================
// チャット完了
// ===========================================

interface ChatOptions {
  model?: ModelKey
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export async function chat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: ChatOptions = {}
) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.3,
    maxTokens = 2048,
  } = options

  const response = await openrouter.chat.completions.create({
    model: MODELS[model],
    messages,
    temperature,
    max_tokens: maxTokens,
  })

  return response.choices[0]?.message?.content || ''
}

// ===========================================
// ストリーミングチャット
// ===========================================

export async function chatStream(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: ChatOptions = {}
) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.3,
    maxTokens = 2048,
  } = options

  const stream = await openrouter.chat.completions.create({
    model: MODELS[model],
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  })

  return stream
}

// ===========================================
// Embedding生成
// ===========================================

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openrouter.embeddings.create({
    model: MODELS.embedding,
    input: text,
  })

  return response.data[0].embedding
}

// ===========================================
// バッチEmbedding生成
// ===========================================

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openrouter.embeddings.create({
    model: MODELS.embedding,
    input: texts,
  })

  return response.data.map((item) => item.embedding)
}

// ===========================================
// エクスポート
// ===========================================

export { openrouter }
export default openrouter



