import { Router } from 'express'
import supabase from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('chat_rooms').select('*, creator:users(username)').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', requireAuth, async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: '請填寫聊天室名稱' })
  const { data, error } = await supabase.from('chat_rooms').insert({ name, description, created_by: req.user.id }).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('chat_rooms').select('*, creator:users(username)').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: '找不到聊天室' })
  res.json(data)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: '名稱不能為空' })
  const { data, error } = await supabase.from('chat_rooms').update({ name, description }).eq('id', req.params.id).select().single()
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('chat_rooms').delete().eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

export default router
