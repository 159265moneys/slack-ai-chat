-- ===========================================
-- ナレッジベースチャットボット DBスキーマ
-- Supabase SQL Editor で実行
-- ===========================================

-- ===========================================
-- 1. 拡張機能の有効化
-- ===========================================

-- pgvector 拡張（ベクトル検索用）
CREATE EXTENSION IF NOT EXISTS vector;

-- UUID 拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 2. カテゴリテーブル
-- ===========================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- #RRGGBB形式
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- デフォルトカテゴリを挿入
INSERT INTO categories (name, description, color, sort_order) VALUES
  ('ルール', '社内規定・ポリシー', '#3B82F6', 1),
  ('例文', 'メール・文書テンプレート', '#10B981', 2),
  ('マニュアル', '業務手順書', '#F59E0B', 3),
  ('FAQ', 'よくある質問', '#8B5CF6', 4),
  ('未分類', '分類されていないソース', '#6B7280', 99)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 3. ユーザーテーブル
-- ===========================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ===========================================
-- 4. ソーステーブル（メイン）
-- ===========================================

CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  source_type VARCHAR(20) DEFAULT 'manual' CHECK (source_type IN ('manual', 'slack')),
  
  -- Slack連携用
  slack_message_id VARCHAR(50) UNIQUE,
  slack_channel_id VARCHAR(20),
  slack_user_id VARCHAR(20),
  slack_permalink TEXT,
  
  -- メタデータ・ベクトル
  metadata JSONB,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  
  -- ステータス
  is_active BOOLEAN DEFAULT true,
  
  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ベクトル検索用インデックス（IVFFlat）
CREATE INDEX IF NOT EXISTS sources_embedding_idx 
ON sources USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 検索用インデックス
CREATE INDEX IF NOT EXISTS sources_category_idx ON sources(category_id);
CREATE INDEX IF NOT EXISTS sources_source_type_idx ON sources(source_type);
CREATE INDEX IF NOT EXISTS sources_is_active_idx ON sources(is_active);
CREATE INDEX IF NOT EXISTS sources_created_at_idx ON sources(created_at DESC);

-- ===========================================
-- 5. フィードバックテーブル
-- ===========================================

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  rating SMALLINT CHECK (rating IN (-1, 1)),
  comment TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_ids UUID[],
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS feedbacks_status_idx ON feedbacks(status);
CREATE INDEX IF NOT EXISTS feedbacks_created_at_idx ON feedbacks(created_at DESC);

-- ===========================================
-- 6. チャットログテーブル
-- ===========================================

CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('question', 'review')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_ids UUID[],
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_logs_session_idx ON chat_logs(session_id);
CREATE INDEX IF NOT EXISTS chat_logs_mode_idx ON chat_logs(mode);
CREATE INDEX IF NOT EXISTS chat_logs_created_at_idx ON chat_logs(created_at DESC);

-- ===========================================
-- 7. Slack連携テーブル
-- ===========================================

-- 監視チャンネル
CREATE TABLE IF NOT EXISTS slack_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slack_channel_id VARCHAR(20) NOT NULL UNIQUE,
  channel_name VARCHAR(100) NOT NULL,
  default_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_synced_ts VARCHAR(20), -- Slack message timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 同期ログ
CREATE TABLE IF NOT EXISTS slack_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES slack_channels(id) ON DELETE CASCADE,
  sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('cron', 'realtime', 'manual')),
  messages_fetched INTEGER DEFAULT 0,
  sources_created INTEGER DEFAULT 0,
  sources_updated INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS slack_sync_logs_channel_idx ON slack_sync_logs(channel_id);
CREATE INDEX IF NOT EXISTS slack_sync_logs_started_at_idx ON slack_sync_logs(started_at DESC);

-- グローバル設定
CREATE TABLE IF NOT EXISTS slack_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id VARCHAR(20),
  workspace_name VARCHAR(100),
  bot_token TEXT, -- 暗号化推奨
  approval_reactions VARCHAR(100)[] DEFAULT ARRAY['white_check_mark'],
  sync_interval_minutes INTEGER DEFAULT 60,
  realtime_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 設定は1レコードのみ
INSERT INTO slack_settings (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- ===========================================
-- 8. ベクトル検索関数
-- ===========================================

CREATE OR REPLACE FUNCTION search_sources(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.content,
    s.category_id,
    (1 - (s.embedding <=> query_embedding))::FLOAT AS similarity
  FROM sources s
  WHERE s.is_active = true
    AND s.embedding IS NOT NULL
    AND (1 - (s.embedding <=> query_embedding)) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ===========================================
-- 9. 更新トリガー
-- ===========================================

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガー設定
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_slack_channels_updated_at
  BEFORE UPDATE ON slack_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_slack_settings_updated_at
  BEFORE UPDATE ON slack_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- 10. Row Level Security (RLS)
-- ===========================================

-- RLS有効化
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ポリシー: sources（誰でも読める、認証ユーザーは作成・更新可能）
CREATE POLICY "sources_select" ON sources FOR SELECT USING (true);
CREATE POLICY "sources_insert" ON sources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sources_update" ON sources FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "sources_delete" ON sources FOR DELETE USING (auth.role() = 'authenticated');

-- ポリシー: categories（誰でも読める、認証ユーザーは作成・更新可能）
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- ポリシー: feedbacks（誰でも作成可能、認証ユーザーは読める）
CREATE POLICY "feedbacks_insert" ON feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "feedbacks_select" ON feedbacks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "feedbacks_update" ON feedbacks FOR UPDATE USING (auth.role() = 'authenticated');

-- ポリシー: chat_logs（誰でも作成可能、認証ユーザーは読める）
CREATE POLICY "chat_logs_insert" ON chat_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "chat_logs_select" ON chat_logs FOR SELECT USING (auth.role() = 'authenticated');

-- ポリシー: Slack関連（認証ユーザーのみ）
CREATE POLICY "slack_channels_all" ON slack_channels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "slack_sync_logs_all" ON slack_sync_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "slack_settings_all" ON slack_settings FOR ALL USING (auth.role() = 'authenticated');

-- ポリシー: users（認証ユーザーのみ自分のレコードを見れる）
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- ===========================================
-- 完了メッセージ
-- ===========================================

DO $$
BEGIN
  RAISE NOTICE 'Schema creation completed successfully!';
END $$;

