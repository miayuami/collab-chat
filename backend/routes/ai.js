import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { generateAIResponse } from '../lib/aiTrigger.js'
import supabase from '../lib/supabase.js'

const router = Router()

// POST /api/ai/ask/:roomId - 手動呼叫 AI 引導
router.post('/ask/:roomId', requireAuth, async (req, res) => {
  const { roomId } = req.params

  // 取得最近 10 筆訊息
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('content, is_ai, sender:users(username)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!recentMessages?.length) {
    return res.status(400).json({ error: '目前沒有對話記錄' })
  }

  const context = recentMessages
    .reverse()
    .map(m => {
      const name = m.is_ai ? 'AI助理' : (m.sender?.username || '使用者')
      return `${name}: ${m.content}`
    })
    .join('\n')

  const lastMessage = recentMessages[recentMessages.length - 1]?.content || ''
  const aiReply = await generateAIResponse(context, lastMessage)

  if (!aiReply) {
    return res.status(500).json({ error: 'AI 回覆失敗，請稍後再試' })
  }

  // 儲存 AI 訊息
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: null,
      content: aiReply,
      is_ai: true
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(message)
})

export default router
