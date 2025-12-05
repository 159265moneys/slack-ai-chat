# 📍 開発ロードマップ

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| プロジェクト名 | ナレッジベース限定チャットボット |
| 開始予定 | 2024年11月 |
| 想定期間 | 約4〜5週間 |
| 技術スタック | Next.js + Supabase + OpenRouter |

---

## 🎯 マイルストーン概要

```
Week 1          Week 2          Week 3          Week 4          Week 5
──────────────────────────────────────────────────────────────────────────
[Phase 1: 環境構築] [Phase 2: RAG実装]  [Phase 3: UI実装]  [Phase 4: 管理機能] [Phase 5: 仕上げ]
  ↓                  ↓                  ↓                  ↓                 ↓
 基盤完成           質問機能           全UI完成           Slack連携         デプロイ
```

---

## 📋 Phase 1: 環境構築・基盤（3〜4日）

### 目標
- 開発環境のセットアップ完了
- 外部サービスの連携確認
- DBスキーマ作成

### タスク一覧

| # | タスク | 詳細 | 所要時間 |
|---|--------|------|----------|
| 1-1 | **プロジェクト初期化** | Next.js 14 + TypeScript + Tailwind CSS | 30分 |
| 1-2 | **依存関係インストール** | shadcn/ui, Zustand, React Query, Zod など | 30分 |
| 1-3 | **Supabase プロジェクト作成** | ダッシュボードで新規プロジェクト作成 | 15分 |
| 1-4 | **pgvector 有効化** | Supabase で拡張を有効化 | 5分 |
| 1-5 | **DBスキーマ作成** | sources, categories, users, feedbacks など | 1時間 |
| 1-6 | **OpenRouter アカウント作成** | API Key 取得、クレジット購入 | 15分 |
| 1-7 | **環境変数設定** | .env.local 作成、Vercel環境変数登録 | 15分 |
| 1-8 | **Supabase Auth 設定** | 管理者認証用のメール認証設定 | 30分 |
| 1-9 | **基本ディレクトリ構成作成** | app/, components/, lib/, types/ など | 30分 |
| 1-10 | **接続テスト** | Supabase, OpenRouter への疎通確認 | 30分 |

### 成果物
- [ ] 動作するNext.jsプロジェクト
- [ ] Supabaseに接続できる状態
- [ ] OpenRouterでLLM呼び出しできる状態
- [ ] DBテーブル作成済み

### 確認コマンド
```bash
npm run dev  # ローカル起動確認
```

---

## 📋 Phase 2: RAGエンジン実装（4〜5日）

### 目標
- ソース登録 → Embedding生成 → 保存の流れ完成
- 質問 → 検索 → 回答生成の流れ完成

### タスク一覧

| # | タスク | 詳細 | 所要時間 |
|---|--------|------|----------|
| 2-1 | **OpenRouter クライアント作成** | lib/openrouter.ts | 1時間 |
| 2-2 | **Embedding生成関数** | text-embedding-3-small 使用 | 1時間 |
| 2-3 | **ベクトル検索関数** | Supabase RPC (search_sources) | 1.5時間 |
| 2-4 | **ソース登録API** | POST /api/sources | 2時間 |
| 2-5 | **チャットAPI (質問モード)** | POST /api/chat/question | 3時間 |
| 2-6 | **チャットAPI (添削モード)** | POST /api/chat/review | 2時間 |
| 2-7 | **システムプロンプト調整** | ソース限定回答の精度向上 | 2時間 |
| 2-8 | **ストリーミング対応** | SSE でリアルタイム回答表示 | 2時間 |
| 2-9 | **エラーハンドリング** | API エラー、タイムアウト対策 | 1時間 |
| 2-10 | **単体テスト** | RAG関数のテスト | 1時間 |

### 成果物
- [ ] `/api/sources` - ソースCRUD API
- [ ] `/api/chat/question` - 質問API
- [ ] `/api/chat/review` - 添削API
- [ ] `lib/rag.ts` - RAGエンジンコア

### テスト方法
```bash
# curlでAPI確認
curl -X POST http://localhost:3000/api/chat/question \
  -H "Content-Type: application/json" \
  -d '{"message": "テスト質問"}'
```

---

## 📋 Phase 3: フロントエンド実装（5〜6日）

### 目標
- ユーザー向け画面（質問・添削モード）完成
- レスポンシブ対応
- 美しいUI/UX

### タスク一覧

| # | タスク | 詳細 | 所要時間 |
|---|--------|------|----------|
| 3-1 | **共通レイアウト** | Header, Footer, Navigation | 2時間 |
| 3-2 | **トップページ** | モード選択画面 | 2時間 |
| 3-3 | **質問モード画面** | チャットUI、メッセージ表示 | 4時間 |
| 3-4 | **添削モード画面** | テキスト入力、差分表示 | 4時間 |
| 3-5 | **ソース参照表示** | 回答の根拠ソース表示 | 2時間 |
| 3-6 | **フィードバックUI** | 👍👎ボタン、コメント入力 | 2時間 |
| 3-7 | **ローディング状態** | スケルトン、スピナー | 1時間 |
| 3-8 | **エラー表示** | トースト、エラーメッセージ | 1時間 |
| 3-9 | **レスポンシブ対応** | モバイル最適化 | 2時間 |
| 3-10 | **アニメーション** | 画面遷移、タイピングエフェクト | 2時間 |

### 成果物
- [ ] `/` - トップページ
- [ ] `/chat/question` - 質問モード
- [ ] `/chat/review` - 添削モード
- [ ] 共通コンポーネント一式

---

## 📋 Phase 4: 管理機能・Slack連携（5〜6日）

### 目標
- 管理画面でソース管理可能
- Slackからの自動取り込み動作

### タスク一覧

| # | タスク | 詳細 | 所要時間 |
|---|--------|------|----------|
| 4-1 | **管理者ログイン画面** | Supabase Auth UI | 2時間 |
| 4-2 | **管理ダッシュボード** | 統計サマリー表示 | 2時間 |
| 4-3 | **ソース一覧画面** | 検索、フィルタ、ページネーション | 3時間 |
| 4-4 | **ソース登録/編集画面** | フォーム、カテゴリ選択 | 3時間 |
| 4-5 | **カテゴリ管理** | CRUD画面 | 2時間 |
| 4-6 | **FB一覧画面** | フィードバック確認 | 2時間 |
| 4-7 | **Slack App 作成** | OAuth設定、権限設定 | 1時間 |
| 4-8 | **Slack OAuth連携** | /api/slack/connect, callback | 2時間 |
| 4-9 | **Slack同期処理** | メッセージ取得、ソース登録 | 3時間 |
| 4-10 | **Vercel Cron設定** | 定期同期ジョブ | 1時間 |
| 4-11 | **Slack連携画面** | チャンネル設定、同期履歴 | 3時間 |

### 成果物
- [ ] `/admin` - 管理ダッシュボード
- [ ] `/admin/sources` - ソース管理
- [ ] `/admin/slack` - Slack連携設定
- [ ] `/admin/feedback` - FB管理
- [ ] `/api/slack/*` - Slack連携API
- [ ] `/api/cron/slack-sync` - 定期同期

---

## 📋 Phase 5: テスト・デプロイ・仕上げ（3〜4日）

### 目標
- 本番環境へのデプロイ完了
- バグ修正、パフォーマンス調整

### タスク一覧

| # | タスク | 詳細 | 所要時間 |
|---|--------|------|----------|
| 5-1 | **E2Eテスト** | 主要フローの動作確認 | 3時間 |
| 5-2 | **パフォーマンス最適化** | 画像最適化、バンドルサイズ | 2時間 |
| 5-3 | **SEO対策** | メタタグ、OGP設定 | 1時間 |
| 5-4 | **Vercel本番デプロイ** | 環境変数設定、ドメイン設定 | 1時間 |
| 5-5 | **Supabase本番設定** | RLS設定、バックアップ | 1時間 |
| 5-6 | **動作確認** | 本番環境での全機能テスト | 2時間 |
| 5-7 | **ドキュメント整備** | README、運用手順書 | 2時間 |
| 5-8 | **初期データ投入** | サンプルソース登録 | 1時間 |
| 5-9 | **バグ修正** | 発見した問題の修正 | 適宜 |

### 成果物
- [ ] 本番URL稼働
- [ ] 運用ドキュメント
- [ ] 初期ソースデータ

---

## 🚀 今すぐやること（Phase 1 開始）

### Step 1: 外部サービスのアカウント作成

```
□ 1. Supabase アカウント作成
     https://supabase.com
     → 新規プロジェクト作成
     → プロジェクト名: knowledge-chatbot
     → リージョン: Northeast Asia (Tokyo)
     → DB Password をメモ

□ 2. OpenRouter アカウント作成
     https://openrouter.ai
     → Sign up (GitHub/Google)
     → Credits購入 ($10〜で十分)
     → API Key 作成してメモ

□ 3. Vercel アカウント作成（あれば不要）
     https://vercel.com
     → GitHubと連携
```

### Step 2: プロジェクト初期化

```bash
# プロジェクト作成
npx create-next-app@latest knowledge-chatbot --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd knowledge-chatbot

# 依存関係インストール
npm install @supabase/supabase-js @supabase/ssr openai zod zustand @tanstack/react-query
npm install @slack/web-api

# shadcn/ui セットアップ
npx shadcn@latest init

# 必要なコンポーネント追加
npx shadcn@latest add button input textarea card dialog toast
```

### Step 3: 環境変数設定

```bash
# .env.local を作成
touch .env.local
```

```env
# .env.local の内容
OPENROUTER_API_KEY=sk-or-xxxxx
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📊 進捗トラッキング

| Phase | ステータス | 開始日 | 完了日 | メモ |
|-------|-----------|--------|--------|------|
| Phase 1 | ⬜ 未着手 | - | - | |
| Phase 2 | ⬜ 未着手 | - | - | |
| Phase 3 | ⬜ 未着手 | - | - | |
| Phase 4 | ⬜ 未着手 | - | - | |
| Phase 5 | ⬜ 未着手 | - | - | |

---

## ❓ 開始前の確認事項

以下が準備できたら開発開始できます：

- [ ] Supabase アカウント・プロジェクト作成済み
- [ ] OpenRouter アカウント・API Key 取得済み
- [ ] Slack ワークスペースの管理者権限（Slack連携用）
- [ ] GitHub リポジトリ作成済み
- [ ] Vercel アカウント作成済み

---

## 📞 次のアクション

**「Phase 1 開始」と言っていただければ、プロジェクトの初期化からコード作成を始めます！**

または、先に確認したいことがあれば聞いてください。

