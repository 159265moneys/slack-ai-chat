// ===========================================
// Supabase Database 型定義
// ===========================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ===========================================
// テーブル型定義
// ===========================================

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: Source
        Insert: SourceInsert
        Update: SourceUpdate
      }
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      feedbacks: {
        Row: Feedback
        Insert: FeedbackInsert
        Update: FeedbackUpdate
      }
      chat_logs: {
        Row: ChatLog
        Insert: ChatLogInsert
        Update: ChatLogUpdate
      }
      slack_channels: {
        Row: SlackChannel
        Insert: SlackChannelInsert
        Update: SlackChannelUpdate
      }
      slack_sync_logs: {
        Row: SlackSyncLog
        Insert: SlackSyncLogInsert
        Update: SlackSyncLogUpdate
      }
      slack_settings: {
        Row: SlackSettings
        Insert: SlackSettingsInsert
        Update: SlackSettingsUpdate
      }
    }
    Functions: {
      search_sources: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
        }
        Returns: SourceSearchResult[]
      }
    }
  }
}

// ===========================================
// Sources（ソース）
// ===========================================

export interface Source {
  id: string
  title: string
  content: string
  source_type: 'manual' | 'slack'
  slack_message_id: string | null
  slack_channel_id: string | null
  slack_user_id: string | null
  slack_permalink: string | null
  metadata: Json | null
  embedding: number[] | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface SourceInsert {
  id?: string
  title: string
  content: string
  source_type?: 'manual' | 'slack'
  slack_message_id?: string | null
  slack_channel_id?: string | null
  slack_user_id?: string | null
  slack_permalink?: string | null
  metadata?: Json | null
  embedding?: number[] | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
  created_by?: string | null
}

export interface SourceUpdate {
  id?: string
  title?: string
  content?: string
  source_type?: 'manual' | 'slack'
  slack_message_id?: string | null
  slack_channel_id?: string | null
  slack_user_id?: string | null
  slack_permalink?: string | null
  metadata?: Json | null
  embedding?: number[] | null
  is_active?: boolean
  updated_at?: string
}

export interface SourceSearchResult {
  id: string
  title: string
  content: string
  similarity: number
}

// ===========================================
// Users（ユーザー）
// ===========================================

export interface User {
  id: string
  email: string
  role: 'admin' | 'viewer'
  created_at: string
  updated_at: string
}

export interface UserInsert {
  id?: string
  email: string
  role?: 'admin' | 'viewer'
  created_at?: string
  updated_at?: string
}

export interface UserUpdate {
  email?: string
  role?: 'admin' | 'viewer'
  updated_at?: string
}

// ===========================================
// Feedbacks（フィードバック）
// ===========================================

export interface Feedback {
  id: string
  session_id: string
  message_id: string
  rating: number | null
  comment: string | null
  question: string
  answer: string
  source_ids: string[] | null
  status: 'pending' | 'reviewed' | 'resolved'
  created_at: string
}

export interface FeedbackInsert {
  id?: string
  session_id: string
  message_id: string
  rating?: number | null
  comment?: string | null
  question: string
  answer: string
  source_ids?: string[] | null
  status?: 'pending' | 'reviewed' | 'resolved'
  created_at?: string
}

export interface FeedbackUpdate {
  rating?: number | null
  comment?: string | null
  status?: 'pending' | 'reviewed' | 'resolved'
}

// ===========================================
// ChatLogs（チャットログ）
// ===========================================

export interface ChatLog {
  id: string
  session_id: string
  mode: 'question' | 'review'
  question: string
  answer: string
  source_ids: string[] | null
  response_time_ms: number | null
  created_at: string
}

export interface ChatLogInsert {
  id?: string
  session_id: string
  mode: 'question' | 'review'
  question: string
  answer: string
  source_ids?: string[] | null
  response_time_ms?: number | null
  created_at?: string
}

export interface ChatLogUpdate {
  answer?: string
  source_ids?: string[] | null
  response_time_ms?: number | null
}

// ===========================================
// Slack連携
// ===========================================

export interface SlackChannel {
  id: string
  slack_channel_id: string
  channel_name: string
  is_active: boolean
  last_synced_at: string | null
  last_synced_ts: string | null
  created_at: string
  updated_at: string
}

export interface SlackChannelInsert {
  id?: string
  slack_channel_id: string
  channel_name: string
  is_active?: boolean
  last_synced_at?: string | null
  last_synced_ts?: string | null
  created_at?: string
  updated_at?: string
}

export interface SlackChannelUpdate {
  channel_name?: string
  is_active?: boolean
  last_synced_at?: string | null
  last_synced_ts?: string | null
  updated_at?: string
}

export interface SlackSyncLog {
  id: string
  channel_id: string
  sync_type: 'cron' | 'realtime' | 'manual'
  messages_fetched: number
  sources_created: number
  sources_updated: number
  status: 'success' | 'failed' | 'partial'
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export interface SlackSyncLogInsert {
  id?: string
  channel_id: string
  sync_type: 'cron' | 'realtime' | 'manual'
  messages_fetched?: number
  sources_created?: number
  sources_updated?: number
  status?: 'success' | 'failed' | 'partial'
  error_message?: string | null
  started_at?: string
  completed_at?: string | null
}

export interface SlackSyncLogUpdate {
  messages_fetched?: number
  sources_created?: number
  sources_updated?: number
  status?: 'success' | 'failed' | 'partial'
  error_message?: string | null
  completed_at?: string | null
}

export interface SlackSettings {
  id: string
  workspace_id: string | null
  workspace_name: string | null
  bot_token: string | null
  approval_reactions: string[]
  sync_interval_minutes: number
  realtime_enabled: boolean
  created_at: string
  updated_at: string
}

export interface SlackSettingsInsert {
  id?: string
  workspace_id?: string | null
  workspace_name?: string | null
  bot_token?: string | null
  approval_reactions?: string[]
  sync_interval_minutes?: number
  realtime_enabled?: boolean
  created_at?: string
  updated_at?: string
}

export interface SlackSettingsUpdate {
  workspace_id?: string | null
  workspace_name?: string | null
  bot_token?: string | null
  approval_reactions?: string[]
  sync_interval_minutes?: number
  realtime_enabled?: boolean
  updated_at?: string
}
