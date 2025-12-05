// ===========================================
// API テストスクリプト
// 実行: npx ts-node --esm scripts/test-api.ts
// ===========================================

const API_BASE = 'http://localhost:3000/api'

async function testAPI() {
  console.log('🧪 API テスト開始\n')

  // 1. カテゴリ一覧取得
  console.log('📁 1. カテゴリ一覧取得...')
  const categoriesRes = await fetch(`${API_BASE}/categories`)
  const categories = await categoriesRes.json()
  console.log('   ✅ カテゴリ数:', categories.data?.length || 0)
  const categoryId = categories.data?.[0]?.id
  console.log('   使用カテゴリID:', categoryId)
  console.log('')

  // 2. テストソース登録
  console.log('📝 2. テストソース登録...')
  const testSources = [
    {
      title: '返品ポリシー',
      content: `返品について
- 返品は購入日から30日以内に限り受け付けます
- 未開封・未使用の商品に限ります
- 食品・下着・化粧品は返品不可です
- 返品時は購入時のレシートが必要です
- 返金は元の支払い方法で行います`,
      category_id: categoryId,
    },
    {
      title: 'お詫びメールの書き方',
      content: `お詫びメールのポイント
1. 件名に「お詫び」を明記する
2. 冒頭で謝罪の意を述べる
3. 問題の経緯を簡潔に説明する
4. 再発防止策を提示する
5. 結びで改めて謝罪する

例文:
「この度は、弊社の不手際によりご迷惑をおかけし、誠に申し訳ございません。」`,
      category_id: categoryId,
    },
    {
      title: '営業時間',
      content: `営業時間のご案内
- 平日: 9:00 - 18:00
- 土曜: 10:00 - 17:00
- 日曜・祝日: 休業
- 年末年始: 12/29 - 1/3 休業`,
      category_id: categoryId,
    },
  ]

  for (const source of testSources) {
    const res = await fetch(`${API_BASE}/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(source),
    })
    const data = await res.json()
    if (data.success) {
      console.log(`   ✅ 登録成功: ${source.title}`)
    } else {
      console.log(`   ❌ 登録失敗: ${source.title} - ${data.message}`)
    }
  }
  console.log('')

  // 3. ソース一覧取得
  console.log('📋 3. ソース一覧取得...')
  const sourcesRes = await fetch(`${API_BASE}/sources`)
  const sources = await sourcesRes.json()
  console.log('   ✅ ソース数:', sources.total)
  console.log('')

  // 4. 質問テスト
  console.log('💬 4. 質問テスト...')
  const questionRes = await fetch(`${API_BASE}/chat/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'test-session-1',
      message: '返品のルールを教えてください',
    }),
  })
  const questionData = await questionRes.json()
  console.log('   質問: 返品のルールを教えてください')
  console.log('   回答:', questionData.answer?.substring(0, 100) + '...')
  console.log('   参照ソース数:', questionData.sources?.length || 0)
  console.log('   has_answer:', questionData.has_answer)
  console.log('')

  // 5. 添削テスト
  console.log('✏️ 5. 添削テスト...')
  const reviewRes = await fetch(`${API_BASE}/chat/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'test-session-1',
      text: 'すみません、商品壊れてました。返品したいです。',
    }),
  })
  const reviewData = await reviewRes.json()
  console.log('   元テキスト:', reviewData.original_text)
  console.log('   修正テキスト:', reviewData.revised_text?.substring(0, 100) + '...')
  console.log('   修正数:', reviewData.corrections?.length || 0)
  console.log('')

  console.log('🎉 テスト完了!')
}

testAPI().catch(console.error)



