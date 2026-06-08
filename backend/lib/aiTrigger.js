import Groq from 'groq-sdk'
import supabase from './supabase.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TRIGGER_KEYWORDS = [
  '不知道','怎麼辦','不確定','卡住','卡','求助','幫幫','不懂','怎麼做','如何',
  '搞不清楚','不太懂','沒頭緒','不知如何','有點複雜','有問題','迷惘','困惑',
  'help','stuck','not sure','confused','no idea'
]

const cooldowns = new Map()
const COOLDOWN_MS = 60000

export async function checkAndTriggerAI(roomId, latestMessage) {
  const shouldTrigger = TRIGGER_KEYWORDS.some(kw => latestMessage.includes(kw))
  if (!shouldTrigger) return

  const now = Date.now()
  if (cooldowns.has(roomId) && now - cooldowns.get(roomId) < COOLDOWN_MS) return
  cooldowns.set(roomId, now)

  const { data: msgs } = await supabase.from('messages').select('content, is_ai, sender:users(username)').eq('room_id', roomId).order('created_at', { ascending: false }).limit(20)
  if (!msgs) return

  const context = msgs.reverse().map(m => (m.is_ai ? 'AI' : (m.sender?.username || 'User')) + ': ' + m.content).join('\n')
  const reply = await generateAIResponse(context, latestMessage)
  if (reply) await supabase.from('messages').insert({ room_id: roomId, user_id: null, content: reply, is_ai: true })
}

export async function generateAIResponse(context, userMessage) {
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: '你是協作學習引導助理，請一律使用台灣繁體中文（不可出現簡體字）。根據以下對話，給出150字以內的具體引導建議，幫助團隊釐清思路，提出引導性問題或建議討論方向，不直接給答案。\n\n對話記錄：\n' + context + '\n\n最新訊息：' + userMessage
      }]
    })
    return res.choices[0]?.message?.content || null
  } catch (e) {
    console.error('Groq error:', e.message)
    return null
  }
}

export default { checkAndTriggerAI, generateAIResponse }
