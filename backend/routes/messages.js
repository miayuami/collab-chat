import { Router } from 'express'
import supabase from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { checkAndTriggerAI } from '../lib/aiTrigger.js'

const router = Router()

// GET /api/messages/:roomId - 取得聊天室訊息歷史
router.get('/:roomId', requireAuth, async (req, res) => {
  const { roomId } = req.params
  const limit = parseInt(req.query.limit) || 50

  const { data, error } = await supabase
    .from('messages')
    .select(`*, sender:users(id, username, avatar_url)`)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/messages/:roomId - 發送訊息
router.post('/:roomId', requireAuth, async (req, res) => {
  const { roomId } = req.params
  const { content } = req.body

  if (!content?.trim()) {
    return res.status(400).json({ error: '訊息不能為空' })
  }

  // 儲存使用者訊息
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: req.user.id,
      content: content.trim(),
      is_ai: false
    })
    .select(`*, sender:users(id, username, avatar_url)`)
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // 非同步檢查是否觸發 AI（不阻塞回應）
  checkAndTriggerAI(roomId, content).catch(console.error)

  res.status(201).json(message)
})

export default router
