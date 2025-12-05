'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft, 
  Hash,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface SlackChannel {
  id: string
  slack_channel_id: string
  channel_name: string
  is_active: boolean
  last_synced_at: string | null
}

interface SlackSettings {
  id: string
  workspace_name: string | null
  sync_interval_minutes: number
  realtime_enabled: boolean
  approval_reactions: string[]
}

export default function AdminSlackPage() {
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [settings, setSettings] = useState<SlackSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [isAddingChannel, setIsAddingChannel] = useState(false)
  const [newChannel, setNewChannel] = useState({ channelId: '', channelName: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const [channelsRes, settingsRes] = await Promise.all([
      supabase.from('slack_channels').select('*').order('channel_name'),
      supabase.from('slack_settings').select('*').single(),
    ])

    if (channelsRes.data) setChannels(channelsRes.data)
    if (settingsRes.data) setSettings(settingsRes.data)

    setIsLoading(false)
  }

  const handleAddChannel = async () => {
    if (!newChannel.channelId || !newChannel.channelName) return

    const supabase = createClient()
    await supabase.from('slack_channels').insert({
      slack_channel_id: newChannel.channelId,
      channel_name: newChannel.channelName,
      is_active: true,
    })

    setNewChannel({ channelId: '', channelName: '' })
    setIsAddingChannel(false)
    fetchData()
  }

  const handleToggleChannel = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase
      .from('slack_channels')
      .update({ is_active: !isActive })
      .eq('id', id)
    fetchData()
  }

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('このチャンネルを削除しますか？')) return

    const supabase = createClient()
    await supabase.from('slack_channels').delete().eq('id', id)
    fetchData()
  }

  const handleSync = async (channelId: string, fullSync: boolean = false) => {
    setIsSyncing(channelId)
    try {
      const res = await fetch('/api/slack/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, full_sync: fullSync }),
      })
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      alert(`同期完了！\n取得: ${data.messages_fetched}件\n登録: ${data.sources_created}件`)
      fetchData()
    } catch (error) {
      console.error('Sync error:', error)
      alert('同期に失敗しました')
    } finally {
      setIsSyncing(null)
    }
  }

  const handleUpdateSettings = async (updates: Partial<SlackSettings>) => {
    if (!settings) return

    const supabase = createClient()
    await supabase
      .from('slack_settings')
      .update(updates)
      .eq('id', settings.id)
    
    setSettings({ ...settings, ...updates })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Hash className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">Slack連携設定</h1>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* グローバル設定 */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              グローバル設定
            </CardTitle>
            <CardDescription className="text-gray-500">
              Slack連携の全体設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">ワークスペース名</Label>
                <Input
                  value={settings?.workspace_name || ''}
                  onChange={(e) => handleUpdateSettings({ workspace_name: e.target.value })}
                  placeholder="例: MyCompany"
                  className="bg-white border-gray-200 text-gray-900 mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-700">同期間隔（分）</Label>
                <Input
                  type="number"
                  value={settings?.sync_interval_minutes || 60}
                  onChange={(e) => handleUpdateSettings({ sync_interval_minutes: parseInt(e.target.value) })}
                  className="bg-white border-gray-200 text-gray-900 mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="realtime"
                checked={settings?.realtime_enabled || false}
                onChange={(e) => handleUpdateSettings({ realtime_enabled: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="realtime" className="text-gray-700">
                リアルタイム同期を有効にする（Webhookが必要）
              </Label>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>ワークフロー投稿を自動取得</strong><br />
                「ナレッジシェア」ワークフローから投稿されたメッセージを自動的にナレッジベースに登録します。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 監視チャンネル */}
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-gray-500" />
                  監視チャンネル
                </CardTitle>
                <CardDescription className="text-gray-500">
                  ソースを取得するSlackチャンネル
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddingChannel(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isAddingChannel}
              >
                <Plus className="w-4 h-4 mr-2" />
                チャンネル追加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 新規追加フォーム */}
            {isAddingChannel && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
                <h4 className="font-medium text-gray-900">新規チャンネル追加</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700">チャンネルID</Label>
                    <Input
                      value={newChannel.channelId}
                      onChange={(e) => setNewChannel({ ...newChannel, channelId: e.target.value })}
                      placeholder="C0123456789"
                      className="bg-white border-gray-200 text-gray-900 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700">チャンネル名</Label>
                    <Input
                      value={newChannel.channelName}
                      onChange={(e) => setNewChannel({ ...newChannel, channelName: e.target.value })}
                      placeholder="#general"
                      className="bg-white border-gray-200 text-gray-900 mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingChannel(false)}
                    className="border-gray-200"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddChannel}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={!newChannel.channelId || !newChannel.channelName}
                  >
                    追加
                  </Button>
                </div>
              </div>
            )}

            {/* チャンネル一覧 */}
            {channels.length > 0 ? (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`p-4 rounded-lg border ${
                      channel.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Hash className={`w-5 h-5 ${channel.is_active ? 'text-purple-600' : 'text-gray-400'}`} />
                        <div>
                          <h4 className={`font-medium ${channel.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                            {channel.channel_name}
                          </h4>
                          <p className="text-xs text-gray-400">
                            ID: {channel.slack_channel_id}
                            {channel.last_synced_at && (
                              <>
                                {' • '}最終同期: {new Date(channel.last_synced_at).toLocaleString('ja-JP')}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(channel.id, false)}
                          disabled={isSyncing === channel.id || !channel.is_active}
                          className="border-gray-200"
                          title="差分同期"
                        >
                          {isSyncing === channel.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('全件再同期しますか？\n（時間がかかる場合があります）')) {
                              handleSync(channel.id, true)
                            }
                          }}
                          disabled={isSyncing === channel.id || !channel.is_active}
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                          title="全件再同期"
                        >
                          全件
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleChannel(channel.id, channel.is_active)}
                          className={channel.is_active ? 'text-green-600 border-green-200' : 'text-gray-400 border-gray-200'}
                        >
                          {channel.is_active ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteChannel(channel.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Hash className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>監視チャンネルがありません</p>
                <p className="text-sm">「チャンネル追加」からSlackチャンネルを登録してください</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* セットアップガイド */}
        <Card className="bg-white border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📚 セットアップガイド
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p><strong>1. Slack App設定</strong></p>
            <p className="ml-4">Bot Token Scopes: <code className="bg-gray-100 px-1 rounded">channels:history</code>, <code className="bg-gray-100 px-1 rounded">channels:read</code></p>
            <p><strong>2. 環境変数</strong></p>
            <p className="ml-4"><code className="bg-gray-100 px-1 rounded">SLACK_BOT_TOKEN</code> を .env.local に設定</p>
            <p><strong>3. チャンネルID取得方法</strong></p>
            <p className="ml-4">Slackでチャンネル名を右クリック → 「リンクをコピー」→ URLの末尾がチャンネルID</p>
            <p><strong>4. 同期対象</strong></p>
            <p className="ml-4">「ナレッジシェア」ワークフローからの投稿のみ自動取得されます</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

