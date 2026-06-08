import { ref, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import { api } from '../lib/api.js'

export function useChat(roomId) {
  const messages = ref([])
  const loading = ref(false)
  let channel = null

  async function loadMessages() {
    loading.value = true
    try {
      messages.value = await api.getMessages(roomId)
    } finally {
      loading.value = false
    }
  }

  function subscribeRealtime() {
    channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, sender:users(id, username, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (data) {
            const exists = messages.value.find(m => m.id === data.id)
            if (!exists) messages.value.push(data)
          }
        }
      )
      .subscribe()
  }

  async function sendMessage(content) {
    const message = await api.sendMessage(roomId, content)
    const exists = messages.value.find(m => m.id === message.id)
    if (!exists) messages.value.push(message)
    return message
  }

  async function askAI() {
    await api.askAI(roomId)
  }

  function unsubscribe() {
    if (channel) supabase.removeChannel(channel)
  }

  onUnmounted(unsubscribe)

  return { messages, loading, loadMessages, subscribeRealtime, sendMessage, askAI, unsubscribe }
}
