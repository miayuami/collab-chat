import { Router } from 'express'
import supabase from '../lib/supabase.js'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body

  if (!email || !password || !username) {
    return res.status(400).json({ error: '請填寫 email、password、username' })
  }

  // 1. Supabase Auth 建立帳號
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) {
    return res.status(400).json({ error: authError.message })
  }

  // 2. 寫入 public.users
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      username
    })

  if (profileError) {
    return res.status(500).json({ error: '建立使用者資料失敗: ' + profileError.message })
  }

  res.status(201).json({ message: '註冊成功', userId: authData.user.id })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: '請填寫 email 和 password' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return res.status(401).json({ error: '帳號或密碼錯誤' })
  }

  // 取得 user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single()

  res.json({
    token: data.session.access_token,
    user: profile
  })
})

export default router
