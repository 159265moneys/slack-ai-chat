import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BookOpen, 
  MessageSquare, 
  Hash,
  TrendingUp,
  Clock,
  Slack
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  
  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  // 統計情報を取得
  const [
    { count: sourcesCount },
    { count: feedbacksCount },
    { data: recentFeedbacks }
  ] = await Promise.all([
    supabase.from('sources').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('feedbacks').select('*').order('created_at', { ascending: false }).limit(5)
  ])

  const stats = [
    {
      title: 'ソース数',
      value: sourcesCount ?? 0,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/admin/sources'
    },
    {
      title: '未対応FB',
      value: feedbacksCount ?? 0,
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/admin/feedbacks'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Hash className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">ナレッジBot 管理画面</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin/sources"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ソース管理
              </Link>
              <Link
                href="/admin/feedbacks"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                フィードバック
              </Link>
              <Link
                href="/admin/slack"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Slack連携
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  ログアウト
                </button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 最近のフィードバック */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                最近のフィードバック
              </CardTitle>
              <CardDescription className="text-gray-500">
                ユーザーからの直近のフィードバック
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentFeedbacks && recentFeedbacks.length > 0 ? (
                <div className="space-y-3">
                  {recentFeedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-lg ${
                            fb.rating === 1 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {fb.rating === 1 ? '👍' : '👎'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(fb.created_at).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {fb.question}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  フィードバックはまだありません
                </p>
              )}
              <Link
                href="/admin/feedbacks"
                className="block mt-4 text-sm text-blue-600 hover:text-blue-700 text-center"
              >
                すべて見る →
              </Link>
            </CardContent>
          </Card>

          {/* クイックリンク */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                クイックアクション
              </CardTitle>
              <CardDescription className="text-gray-500">
                よく使う機能へのショートカット
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/admin/sources/new"
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <BookOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">新規ソース追加</p>
                  <p className="text-xs text-gray-500">ナレッジベースに新しい情報を追加</p>
                </div>
              </Link>
              <Link
                href="/admin/slack"
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Slack className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Slack連携</p>
                  <p className="text-xs text-gray-500">Slackからナレッジを自動取得</p>
                </div>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">ユーザー画面を確認</p>
                  <p className="text-xs text-gray-500">チャットボットの動作を確認</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
