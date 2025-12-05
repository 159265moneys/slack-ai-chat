// ===========================================
// API リクエスト/レスポンス型定義
// ===========================================

// ===========================================
// チャット API
// ===========================================

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface QuestionRequest {
  session_id: string
  message: string
  history?: ChatMessage[]
  filters?: {
    phase?: string
    company?: string
  }
}

export interface QuestionResponse {
  message_id: string
  answer: string
  sources: SourceReference[]
  has_answer: boolean
}

export interface ReviewRequest {
  session_id: string
  text: string
}

export interface Correction {
  type: 'structure' | 'wording' | 'addition' | 'deletion'
  original: string
  revised: string
  reason: string
}

export interface ReviewResponse {
  message_id: string
  original_text: string
  revised_text: string
  corrections: Correction[]
  sources: SourceReference[]
}

export interface SourceReference {
  id: string
  title: string
  relevance_score?: number
}

// ===========================================
// フィードバック API
// ===========================================

export interface FeedbackRequest {
  session_id: string
  message_id: string
  rating?: 1 | -1
  comment?: string
  question: string
  answer: string
  source_ids?: string[]
}

// ===========================================
// ソース管理 API
// ===========================================

export interface SourceCreateRequest {
  title: string
  content: string
}

export interface SourceUpdateRequest {
  title?: string
  content?: string
  is_active?: boolean
}

export interface SourceListQuery {
  page?: number
  limit?: number
  search?: string
  is_active?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ===========================================
// Slack 連携 API
// ===========================================

export interface SlackChannelAddRequest {
  slack_channel_id: string
  channel_name: string
}

export interface SlackSyncRequest {
  channel_id?: string // 指定しない場合は全チャンネル
}

export interface SlackSyncResponse {
  success: boolean
  channels_synced: number
  total_messages: number
  new_sources: number
  errors?: string[]
}

// ===========================================
// 共通
// ===========================================

export interface ApiError {
  error: string
  message: string
  details?: unknown
}

export interface ApiSuccess<T = void> {
  success: true
  data?: T
}
