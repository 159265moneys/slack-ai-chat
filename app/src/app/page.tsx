'use client'

import Link from 'next/link'
import { MessageSquare, FileEdit, Sparkles, ArrowRight, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg text-gray-900">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">ナレッジBot</span>
          </div>
          <Link
            href="/admin/login"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            管理者ログイン
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* ヒーローセクション */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-600">社内ナレッジベース限定AI</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="gradient-text">ナレッジベース</span>から
              <br />
              正確な回答を
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              登録されたソースのみを参照して回答。
              <br />
              推測や一般知識を使わない、信頼できるアシスタント。
            </p>
          </div>

          {/* モード選択カード */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* 質問モード */}
            <Link href="/chat/question" className="block">
              <div className="glass rounded-2xl p-8 card-hover cursor-pointer group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6">
                  <MessageSquare className="w-7 h-7" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3">質問する</h2>
                
                <p className="text-gray-600 mb-6">
                  ナレッジベースに基づいて
                  <br />
                  質問に回答します
                </p>
                
                <div className="flex items-center text-blue-400 font-medium group-hover:gap-3 gap-2 transition-all">
                  <span>質問を始める</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* 添削モード */}
            <Link href="/chat/review" className="block">
              <div className="glass rounded-2xl p-8 card-hover cursor-pointer group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-6">
                  <FileEdit className="w-7 h-7" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3">添削する</h2>
                
                <p className="text-gray-600 mb-6">
                  ソースの例文やルールを参考に
                  <br />
                  文章を添削・改善します
                </p>
                
                <div className="flex items-center text-purple-400 font-medium group-hover:gap-3 gap-2 transition-all">
                  <span>添削を始める</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* 特徴セクション */}
          <div className="mt-20 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold mb-2">ソース限定</h3>
              <p className="text-sm text-gray-500">
                登録されたソースのみを参照
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-semibold mb-2">参照表示</h3>
              <p className="text-sm text-gray-500">
                回答の根拠を明示
              </p>
            </div>
            
            <div>
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold mb-2">高精度</h3>
              <p className="text-sm text-gray-500">
                ベクトル検索で関連情報を取得
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          © 2024 ナレッジBot. ソース限定AIアシスタント.
        </div>
      </footer>
    </div>
  )
}
