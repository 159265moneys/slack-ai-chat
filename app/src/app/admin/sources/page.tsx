import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  BookOpen,
} from 'lucide-react'
import { SourceList } from '@/components/admin/SourceList'

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; phase?: string; company?: string; poster?: string }>
}) {
  const supabase = await createClient()
  
  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const searchQuery = params.q || ''
  const phaseFilter = params.phase || ''
  const companyFilter = params.company || ''
  const posterFilter = params.poster || ''

  // ソース取得
  let query = supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
  }

  // 業務フェーズフィルター
  if (phaseFilter) {
    query = query.filter('metadata->>phase', 'eq', phaseFilter)
  }

  // 会社フィルター（部分一致）
  if (companyFilter) {
    query = query.filter('metadata->>company', 'ilike', `%${companyFilter}%`)
  }

  // 投稿者フィルター
  if (posterFilter) {
    query = query.filter('metadata->>poster', 'eq', posterFilter)
  }

  const { data: sources } = await query.limit(200)
  
  // 会社名を正規化する関数
  const normalizeCompanyName = (name: string): string => {
    return name
      .replace(/^株式会社\s*/g, '')
      .replace(/\s*株式会社$/g, '')
      .replace(/^有限会社\s*/g, '')
      .replace(/\s*有限会社$/g, '')
      .replace(/様$/g, '')
      .replace(/（.*?）/g, '')
      .replace(/\(.*?\)/g, '')
      .trim()
  }
  
  // メタデータからユニークな値を取得
  type SourceMetadata = { phase?: string; company?: string; poster?: string }
  
  const phases = [...new Set(
    sources
      ?.map(s => (s.metadata as SourceMetadata)?.phase)
      .filter(p => p && p !== '無記載') || []
  )].sort()
  
  // 会社名は正規化してユニーク化
  const rawCompanies = sources
    ?.map(s => (s.metadata as SourceMetadata)?.company)
    .filter(c => c && c !== '無記載') || []
  
  const companyMap = new Map<string, string>()
  rawCompanies.forEach(company => {
    if (company) {
      const normalized = normalizeCompanyName(company)
      if (normalized && !companyMap.has(normalized)) {
        companyMap.set(normalized, normalized)
      }
    }
  })
  const companies = [...companyMap.values()].sort()
  
  const posters = [...new Set(
    sources
      ?.map(s => (s.metadata as SourceMetadata)?.poster)
      .filter(p => p && p !== '無記載') || []
  )].sort()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">ソース管理</h1>
              {sources && sources.length > 0 && (
                <span className="text-sm text-gray-500">({sources.length}件)</span>
              )}
            </div>
            <Link href="/admin/sources/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                新規追加
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルター */}
        <Card className="mb-6 bg-white">
          <CardContent className="p-4">
            <form className="flex flex-col gap-4">
              {/* 検索ボックス */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  name="q"
                  placeholder="タイトルや内容で検索..."
                  defaultValue={searchQuery}
                  className="pl-10 bg-white border-gray-200 text-gray-900"
                />
              </div>
              {/* フィルター */}
              <div className="flex flex-wrap gap-3">
                <select
                  name="phase"
                  defaultValue={phaseFilter}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                >
                  <option value="">📋 業務フェーズ</option>
                  {phases.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
                <select
                  name="company"
                  defaultValue={companyFilter}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                >
                  <option value="">🏢 会社名</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
                <select
                  name="poster"
                  defaultValue={posterFilter}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm"
                >
                  <option value="">👤 投稿者</option>
                  {posters.map((poster) => (
                    <option key={poster} value={poster}>
                      {poster}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="outline" className="border-gray-200">
                  検索
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ソース一覧 */}
        <SourceList sources={sources || []} />
      </main>
    </div>
  )
}
