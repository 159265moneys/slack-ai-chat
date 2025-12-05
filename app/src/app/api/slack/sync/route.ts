// ===========================================
// Slack 同期 API
// ワークフロー投稿を自動取得してナレッジ化
// ===========================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/rag'

interface SlackMessage {
  ts: string
  text: string
  user?: string
  bot_id?: string
  username?: string
  subtype?: string
}

// Slackタグを削除する
function removeSlackTags(text: string): string {
  return text
    .replace(/<!channel>/g, '')           // <!channel>
    .replace(/<!here>/g, '')               // <!here>
    .replace(/<!everyone>/g, '')           // <!everyone>
    .replace(/<@[A-Z0-9]+>/g, '')          // <@U123ABC> ユーザーメンション
    .replace(/<#[A-Z0-9]+\|[^>]+>/g, '')   // <#C123|channel-name> チャンネルリンク
    .replace(/<#[A-Z0-9]+>/g, '')          // <#C123> チャンネルリンク（名前なし）
    .replace(/:\w+:/g, '')                  // :emoji: カスタム絵文字
    .trim()
}

// URLを抽出する関数
function extractUrls(text: string): string[] {
  const urls: string[] = []
  
  // Slack形式のリンク <URL|表示テキスト> または <URL>
  const slackLinkPattern = /<(https?:\/\/[^|>]+)(?:\|[^>]*)?>/g
  let match
  while ((match = slackLinkPattern.exec(text)) !== null) {
    if (match[1]) urls.push(match[1])
  }
  
  // 通常のURL（Slackリンク形式以外）
  const urlPattern = /https?:\/\/[^\s<>]+/g
  const normalUrls = text.match(urlPattern)
  if (normalUrls) {
    for (const url of normalUrls) {
      // 既に追加済みでなければ追加
      if (!urls.includes(url)) {
        urls.push(url)
      }
    }
  }
  
  return urls
}

// フィールド間の値を抽出する関数
function extractFieldValue(text: string, fieldName: string, nextFields: string[]): string {
  // *フィールド名* のパターンを探す
  const fieldPattern = new RegExp(`\\*${fieldName}\\*[\\s\\n]*`, 'i')
  const match = text.match(fieldPattern)
  if (!match) return ''
  
  const startIdx = match.index! + match[0].length
  
  // 次のフィールドの開始位置を探す
  let endIdx = text.length
  for (const nextField of nextFields) {
    const nextPattern = new RegExp(`\\*${nextField}\\*`, 'i')
    const nextMatch = text.substring(startIdx).match(nextPattern)
    if (nextMatch && nextMatch.index !== undefined) {
      const potentialEnd = startIdx + nextMatch.index
      if (potentialEnd < endIdx) {
        endIdx = potentialEnd
      }
    }
  }
  
  const value = text.substring(startIdx, endIdx).trim()
  // 空白文字のみや改行のみの場合は空文字を返す
  return value.replace(/^\s+|\s+$/g, '') || ''
}

// ワークフロー投稿からメタデータを抽出（改善版）
function parseWorkflowMessage(rawText: string): {
  title: string
  poster: string
  phase: string
  theme: string
  company: string
  jobType: string
  links: string[]
  content: string
  cleanedText: string
} {
  // Slackタグを削除
  const text = removeSlackTags(rawText)
  
  // 定義されたフィールド一覧
  const allFields = ['投稿者', '業務フェーズ', 'SNS関連の場合、URL掲載', 'テーマ・ノウハウ', '会社名', '職種・領域', '内容']
  
  // 各フィールドを抽出
  const poster = extractFieldValue(text, '投稿者', allFields.filter(f => f !== '投稿者'))
  const phase = extractFieldValue(text, '業務フェーズ', allFields.filter(f => f !== '業務フェーズ'))
  const theme = extractFieldValue(text, 'テーマ・ノウハウ', allFields.filter(f => f !== 'テーマ・ノウハウ'))
  const company = extractFieldValue(text, '会社名', allFields.filter(f => f !== '会社名'))
  const jobType = extractFieldValue(text, '職種・領域', allFields.filter(f => f !== '職種・領域'))
  
  // URLを抽出
  const links = extractUrls(rawText)
  
  // 内容は *内容* 以降すべて
  let content = ''
  const contentPattern = /\*内容\*[\s\n]*/i
  const contentMatch = text.match(contentPattern)
  if (contentMatch && contentMatch.index !== undefined) {
    content = text.substring(contentMatch.index + contentMatch[0].length).trim()
  }
  
  // 内容がない場合はフォールバック
  if (!content) {
    content = text
  }
  
  // タイトルを生成（テーマがあればテーマ、なければ業務フェーズ）
  let title = ''
  
  if (theme) {
    title = phase ? `【${phase}】${theme}` : theme
  } else if (phase) {
    title = `【${phase}】${poster || 'ナレッジ'}`
  } else {
    // フォールバック: 最初の50文字
    title = text.substring(0, 50).replace(/\n/g, ' ') + '...'
  }

  return {
    title,
    poster: poster || '無記載',
    phase: phase || '無記載',
    theme: theme || '無記載',
    company: company || '無記載',
    jobType: jobType || '無記載',
    links,
    content, // *内容* 以降のみ（重複なし）
    cleanedText: text // タグ削除済みの全文
  }
}

// POST: チャンネル同期実行
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channel_id, full_sync } = body // full_sync: 全件再同期フラグ

    console.log('[Slack Sync] Starting sync for channel_id:', channel_id, 'full_sync:', full_sync)

    if (!channel_id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'channel_id is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // チャンネル情報取得
    const { data: channel, error: channelError } = await db
      .from('slack_channels')
      .select('*')
      .eq('id', channel_id)
      .single()

    console.log('[Slack Sync] Channel data:', channel, 'Error:', channelError)

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Channel not found', details: channelError },
        { status: 404 }
      )
    }

    const slackToken = process.env.SLACK_BOT_TOKEN
    if (!slackToken) {
      return NextResponse.json(
        { error: 'Configuration Error', message: 'SLACK_BOT_TOKEN is not set' },
        { status: 500 }
      )
    }

    console.log('[Slack Sync] Fetching messages from Slack channel:', channel.slack_channel_id)

    // 同期ログ開始
    const { data: syncLog } = await db
      .from('slack_sync_logs')
      .insert({
        channel_id: channel.id,
        sync_type: 'manual',
        status: 'success',
      })
      .select()
      .single()

    // Slack API でメッセージ取得（ページネーション対応）
    const allMessages: SlackMessage[] = []
    let cursor: string | undefined = undefined
    let pageCount = 0
    const maxPages = full_sync ? 10 : 1 // full_syncなら最大10ページ（約2000件）

    while (pageCount < maxPages) {
      const url = new URL('https://slack.com/api/conversations.history')
      url.searchParams.set('channel', channel.slack_channel_id)
      url.searchParams.set('limit', '200')
      
      // full_syncでなければ、前回同期以降のメッセージのみ取得
      if (!full_sync && channel.last_synced_ts) {
        url.searchParams.set('oldest', channel.last_synced_ts)
      }
      
      // ページネーションカーソル
      if (cursor) {
        url.searchParams.set('cursor', cursor)
      }

      console.log(`[Slack Sync] Calling Slack API (page ${pageCount + 1}):`, url.toString())

      const slackRes = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
      })

      const slackData = await slackRes.json()
      
      console.log('[Slack Sync] Slack API response ok:', slackData.ok, 'error:', slackData.error, 'messages count:', slackData.messages?.length)

      if (!slackData.ok) {
        console.error('[Slack Sync] Slack API Error:', slackData)
        if (syncLog) {
          await db
            .from('slack_sync_logs')
            .update({
              status: 'failed',
              error_message: slackData.error,
              completed_at: new Date().toISOString(),
            })
            .eq('id', syncLog.id)
        }

        return NextResponse.json(
          { error: 'Slack API Error', message: slackData.error },
          { status: 500 }
        )
      }

      // メッセージを追加
      if (slackData.messages) {
        allMessages.push(...slackData.messages)
      }
      
      pageCount++
      
      // 次のページがあるかチェック
      if (slackData.has_more && slackData.response_metadata?.next_cursor) {
        cursor = slackData.response_metadata.next_cursor
        console.log(`[Slack Sync] More pages available, fetching next...`)
      } else {
        break
      }
    }
    
    console.log('[Slack Sync] Total messages fetched:', allMessages.length)

    let sourcesCreated = 0
    let latestTs = channel.last_synced_ts
    let processedCount = 0
    let skippedCount = 0

    // ワークフロー投稿（bot_idがある or usernameが「ナレッジシェア」）を処理
    for (const msg of allMessages) {
      // ワークフロー投稿かどうかをチェック
      const isWorkflowPost = 
        msg.bot_id || 
        msg.username === 'ナレッジシェア' ||
        msg.subtype === 'bot_message'

      if (!isWorkflowPost || !msg.text) continue
      
      processedCount++
      console.log(`[Slack Sync] Processing workflow message ${processedCount}: ${msg.text.substring(0, 50)}...`)

      try {
        // 既存チェック（アクティブなソースのみ）
        const { data: existing } = await db
          .from('sources')
          .select('id')
          .eq('slack_message_id', msg.ts)
          .eq('is_active', true)
          .single()

        if (existing) {
          console.log(`[Slack Sync] Message ${msg.ts} already exists, skipping`)
          skippedCount++
          continue
        }

        // メッセージをパース（タグ削除・構造化）
        const parsed = parseWorkflowMessage(msg.text)
        console.log(`[Slack Sync] Parsed - title: ${parsed.title}, poster: ${parsed.poster}, theme: ${parsed.theme}`)

        // エンベディング生成（クリーンな全文を使用）
        console.log(`[Slack Sync] Generating embedding...`)
        const embedding = await generateEmbedding(parsed.cleanedText)
        console.log(`[Slack Sync] Embedding generated, length: ${embedding.length}`)

        // ソース登録（内容部分のみを保存）
        const { error: insertError } = await db.from('sources').insert({
          title: parsed.title,
          content: parsed.content, // *内容* 以降のみ（重複なし）
          source_type: 'slack',
          slack_message_id: msg.ts,
          slack_channel_id: channel.slack_channel_id,
          slack_user_id: msg.user || null,
          slack_permalink: `https://slack.com/archives/${channel.slack_channel_id}/p${msg.ts.replace('.', '')}`,
          embedding: JSON.stringify(embedding),
          metadata: {
            poster: parsed.poster,
            phase: parsed.phase,
            theme: parsed.theme,
            company: parsed.company,
            jobType: parsed.jobType,
            links: parsed.links, // 資料・リンク
            rawContent: msg.text, // 元のSlackメッセージも保持
          },
          is_active: true,
        })

        if (insertError) {
          console.error(`[Slack Sync] Insert error:`, insertError)
          continue
        }

        sourcesCreated++
        console.log(`[Slack Sync] Source created: ${parsed.title}`)

        // 最新のタイムスタンプを記録
        if (!latestTs || msg.ts > latestTs) {
          latestTs = msg.ts
        }
      } catch (err) {
        console.error(`[Slack Sync] Error processing message:`, err)
        continue
      }
    }

    // チャンネルの最終同期時刻を更新
    await db
      .from('slack_channels')
      .update({
        last_synced_at: new Date().toISOString(),
        last_synced_ts: latestTs,
      })
      .eq('id', channel.id)

    // 同期ログ更新（成功）
    if (syncLog) {
      await db
        .from('slack_sync_logs')
        .update({
          messages_fetched: allMessages.length,
          sources_created: sourcesCreated,
          status: 'success',
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id)
    }

    return NextResponse.json({
      success: true,
      messages_fetched: allMessages.length,
      workflow_messages: processedCount,
      sources_created: sourcesCreated,
      skipped_existing: skippedCount,
    })
  } catch (error) {
    console.error('Slack sync error:', error)
    return NextResponse.json(
      { error: 'Internal Error', message: 'Slack同期中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

