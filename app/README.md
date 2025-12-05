# 📚 ナレッジベース限定チャットボット

事前登録されたソースのみを参照して回答するRAGチャットボットシステム。

## 🚀 技術スタック

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **UI**: shadcn/ui
- **Database**: Supabase (PostgreSQL + pgvector)
- **LLM**: OpenRouter (GPT-4o, Claude等)
- **認証**: Supabase Auth

## 📋 機能

### ユーザー向け
- **質問モード**: ナレッジベースに基づいて回答
- **添削モード**: ソースの例文・ルールに基づいて文章を添削

### 管理者向け
- ソース管理（登録・編集・削除）
- カテゴリ管理
- Slack連携（自動ソース取り込み）
- フィードバック確認

## 🛠️ セットアップ

### 1. 依存関係インストール

```bash
cd app
npm install
```

### 2. 環境変数設定

`.env.local` ファイルを作成:

```bash
# OpenRouter (LLM Gateway)
# https://openrouter.ai/keys で取得
OPENROUTER_API_KEY=sk-or-xxxxx
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini

# Supabase (DB + Auth + Vector)
# https://supabase.com/dashboard でプロジェクト作成後に取得
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Slack連携（後で設定）
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=

# Vercel Cron認証
CRON_SECRET=your-cron-secret-here

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase設定

1. [Supabase](https://supabase.com) でプロジェクト作成
2. SQL Editorで `supabase/schema.sql` を実行
3. 環境変数にURL、キーを設定

### 4. OpenRouter設定

1. [OpenRouter](https://openrouter.ai) でアカウント作成
2. クレジット購入（$10〜）
3. API Key取得して環境変数に設定

### 5. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## 📁 ディレクトリ構成

```
app/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (user)/         # ユーザー向けページ
│   │   ├── (admin)/        # 管理者向けページ
│   │   └── api/            # API Routes
│   ├── components/
│   │   └── ui/             # shadcn/ui コンポーネント
│   ├── lib/
│   │   ├── supabase/       # Supabase クライアント
│   │   └── openrouter.ts   # OpenRouter クライアント
│   └── types/              # 型定義
├── supabase/
│   └── schema.sql          # DBスキーマ
└── package.json
```

## 📖 ドキュメント

- [設計書](../docs/SPECIFICATION.md)
- [ロードマップ](../docs/ROADMAP.md)

## 🔑 環境変数一覧

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENROUTER_API_KEY` | OpenRouter API Key | ✅ |
| `OPENROUTER_DEFAULT_MODEL` | デフォルトLLMモデル | - |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | ✅ |
| `SLACK_CLIENT_ID` | Slack App Client ID | - |
| `SLACK_CLIENT_SECRET` | Slack App Client Secret | - |
| `SLACK_SIGNING_SECRET` | Slack Signing Secret | - |
| `SLACK_BOT_TOKEN` | Slack Bot Token | - |
| `CRON_SECRET` | Cron認証シークレット | - |
| `NEXT_PUBLIC_APP_URL` | アプリケーションURL | - |

## 📝 ライセンス

Private
