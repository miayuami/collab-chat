import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'
import messageRoutes from './routes/messages.js'
import aiRoutes from './routes/ai.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '協作討論模組 API 運作中' })
})

app.listen(PORT, () => {
  console.log(`✅ 後端 API 啟動: http://localhost:${PORT}`)
})
