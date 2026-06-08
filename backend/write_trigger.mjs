import { writeFileSync } from 'fs';
const code = import { GoogleGenAI } from '@google/genai'
import supabase from './supabase.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const TRIGGER_KEYWORDS = ['how','help','stuck','not sure','confused','不知道','怎麼辦','不確定','卡住','求助','幫幫','不懂','怎麼做','如何']

export async function checkAndTriggerAI(roomId, latestMessage) {
  const shouldTrigger = TRIGGER_KEYWORDS.some(kw => latestMessage.includes(kw))
  if (!shouldTrigger) return
  const { data: msgs } = await supabase.from('messages').select('content, is_ai, sender:users(username)').eq('room_id', roomId).order('created_at', { ascending: false }).limit(10)
  if (!msgs) return
  const context = msgs.reverse().map(m => (m.is_ai ? 'AI' : (m.sender?.username || 'User')) + ': ' + m.content).join('\n')
  const reply = await generateAIResponse(context, latestMessage)
  if (reply) await supabase.from('messages').insert({ room_id: roomId, user_id: null, content: reply, is_ai: true })
}

export async function generateAIResponse(context, userMessage) {
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'Reply in Traditional Chinese under 100 chars. Guide thinking only.\n\n' + context + '\n\nLatest: ' + userMessage })
    return response.text
  } catch (e) {
    console.error('Gemini error:', e.message)
    return null
  }
}

export default { checkAndTriggerAI, generateAIResponse };
writeFileSync('lib/aiTrigger.js', code, 'utf8');
console.log('done');
