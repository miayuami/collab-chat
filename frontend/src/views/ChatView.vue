<template>
  <div class="chat-layout">
    <header class="chat-header">
      <button class="back-btn" @click="$router.push('/rooms')">← 返回</button>
      <div class="room-title">
        <span>💬</span>
        <h2>{{ room?.name || '載入中...' }}</h2>
      </div>
      <div class="header-actions">
        <button class="ai-btn" :disabled="aiLoading || aiCooldown > 0" @click="triggerAI">
          <span>🤖</span>
          <span>{{ aiLoading ? 'AI 思考中...' : aiCooldown > 0 ? `冷卻中 ${aiCooldown}s` : '請 AI 引導' }}</span>
        </button>
    <div class="menu-wrap" ref="menuWrap">
      <button class="menu-btn" @click.stop="showMenu = !showMenu">⚙️</button>
      <div v-if="showMenu" class="dropdown">
        <button @click="openRename">✏️ 更改名稱</button>
        <button class="danger" @click="confirmDelete">🗑️ 刪除聊天室</button>
      </div>
    </div>
      </div>
    </header>

    <div class="messages-area" ref="messagesEl">
      <div v-if="loading" class="msg-placeholder">載入訊息中...</div>
      <div v-else-if="messages.length === 0" class="msg-placeholder">還沒有訊息，開始討論吧！</div>
      <TransitionGroup name="msg" tag="div" class="messages-list">
        <div v-for="msg in messages" :key="msg.id" class="msg-wrapper"
          :class="{ 'msg-mine': msg.user_id === auth.user?.id, 'msg-ai': msg.is_ai }">
          <div v-if="msg.is_ai" class="msg-bubble msg-bubble-ai">
            <div class="ai-label">🤖 AI 引導</div>
            <p v-html="renderMarkdown(msg.content)"></p>
            <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
          </div>
          <template v-else-if="msg.user_id !== auth.user?.id">
            <div class="msg-avatar">{{ initial(msg.sender?.username) }}</div>
            <div class="msg-bubble msg-bubble-other">
              <span class="msg-name">{{ msg.sender?.username || '使用者' }}</span>
              <p>{{ msg.content }}</p>
              <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
            </div>
          </template>
          <div v-else class="msg-bubble msg-bubble-mine">
            <p>{{ msg.content }}</p>
            <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div class="input-area">
      <textarea v-model="draft" placeholder="輸入訊息... (Enter 送出，Shift+Enter 換行)"
        rows="1" @keydown.enter.exact.prevent="send" @input="autoResize" ref="inputEl" />
      <button class="send-btn" :disabled="!draft.trim() || sending" @click="send">
        {{ sending ? '⏳' : '➤' }}
      </button>
    </div>

    <!-- 改名 Modal -->
    <div v-if="showRename" class="modal-overlay" @click.self="showRename = false">
      <div class="modal-card">
        <h3>更改聊天室名稱</h3>
        <input v-model="newName" placeholder="輸入新名稱" @keyup.enter="submitRename" autofocus />
        <p v-if="renameError" class="error-msg">{{ renameError }}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showRename = false">取消</button>
          <button class="btn btn-primary" @click="submitRename">確認</button>
        </div>
      </div>
    </div>

    <!-- 刪除確認 Modal -->
    <div v-if="showDelete" class="modal-overlay" @click.self="showDelete = false">
      <div class="modal-card">
        <h3>刪除聊天室</h3>
        <p style="color: var(--text-muted); margin: 12px 0">確定要刪除「{{ room?.name }}」嗎？此操作無法復原，所有訊息將一併刪除。</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showDelete = false">取消</button>
          <button class="btn btn-danger" @click="submitDelete">刪除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useChat } from '../composables/useChat.js'
import { api } from '../lib/api.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const roomId = route.params.id

const room = ref(null)
const draft = ref('')
const sending = ref(false)
const aiLoading = ref(false)
const aiCooldown = ref(0)
let cooldownTimer = null
const messagesEl = ref(null)
const inputEl = ref(null)
const showMenu = ref(false)
const showRename = ref(false)
const showDelete = ref(false)
const newName = ref('')
const renameError = ref('')

const { messages, loading, loadMessages, subscribeRealtime, sendMessage, askAI } = useChat(roomId)

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) { document.removeEventListener('click', el._clickOutside) }
}

function restoreCooldown() {
  const saved = localStorage.getItem(`ai_cooldown_${roomId}`)
  if (saved) {
    const remaining = Math.ceil((parseInt(saved) - Date.now()) / 1000)
    if (remaining > 0) { aiCooldown.value = remaining; startCooldownTimer() }
    else localStorage.removeItem(`ai_cooldown_${roomId}`)
  }
}

function startCooldownTimer() {
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    aiCooldown.value--
    if (aiCooldown.value <= 0) {
      aiCooldown.value = 0
      clearInterval(cooldownTimer)
      localStorage.removeItem(`ai_cooldown_${roomId}`)
    }
  }, 1000)
}

onMounted(async () => {
  room.value = await api.getRoom(roomId)
  await loadMessages()
  subscribeRealtime()
  scrollToBottom()
  restoreCooldown()
})

onUnmounted(() => {
  clearInterval(cooldownTimer)
  document.removeEventListener('click', closeMenu)
})

function closeMenu(e) {
  const wrap = document.querySelector('.menu-wrap')
  if (wrap && !wrap.contains(e.target)) showMenu.value = false
}

onMounted(() => document.addEventListener('click', closeMenu))
watch(messages, () => nextTick(scrollToBottom), { deep: true })

async function send() {
  if (!draft.value.trim() || sending.value) return
  const content = draft.value.trim()
  draft.value = ''
  sending.value = true
  try { await sendMessage(content) }
  finally { sending.value = false; inputEl.value?.focus() }
}

async function triggerAI() {
  if (aiCooldown.value > 0 || aiLoading.value) return
  aiLoading.value = true
  try {
    await askAI()
    aiCooldown.value = 60
    localStorage.setItem(`ai_cooldown_${roomId}`, (Date.now() + 60000).toString())
    startCooldownTimer()
  } catch (e) {
    alert('AI 呼叫失敗: ' + e.message)
  } finally {
    aiLoading.value = false
  }
}

function openRename() {
  newName.value = room.value?.name || ''
  renameError.value = ''
  showRename.value = true
  showMenu.value = false
}

async function submitRename() {
  if (!newName.value.trim()) { renameError.value = '名稱不能為空'; return }
  try {
    await api.updateRoom(roomId, { name: newName.value.trim() })
    room.value.name = newName.value.trim()
    showRename.value = false
  } catch (e) {
    renameError.value = e.message
  }
}

function confirmDelete() {
  showDelete.value = true
  showMenu.value = false
}

async function submitDelete() {
  try {
    await api.deleteRoom(roomId)
    router.push('/rooms')
  } catch (e) {
    alert('刪除失敗: ' + e.message)
  }
}

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

function scrollToBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function autoResize(e) {
  e.target.style.height = 'auto'
  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

function initial(name) {
  return name ? name.charAt(0).toUpperCase() : '?'
}
</script>

<style scoped>
.chat-layout { height: 100vh; display: flex; flex-direction: column; }
.chat-header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
.back-btn { background: none; color: var(--text-muted); font-size: 14px; padding: 6px 10px; border-radius: 6px; transition: color 0.2s; }
.back-btn:hover { color: var(--text); }
.room-title { display: flex; align-items: center; gap: 8px; flex: 1; }
.room-title h2 { font-size: 16px; font-weight: 600; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.ai-btn { display: flex; align-items: center; gap: 6px; background: var(--ai-dim); color: var(--ai); border: 1px solid rgba(72,212,168,0.3); border-radius: 8px; padding: 7px 14px; font-size: 13px; font-weight: 500; transition: all 0.2s; min-width: 130px; justify-content: center; }
.ai-btn:hover:not(:disabled) { background: rgba(72,212,168,0.2); }
.ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.menu-wrap { position: relative; }
.menu-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; font-size: 16px; cursor: pointer; transition: background 0.2s; }
.menu-btn:hover { background: var(--border); }
.dropdown { position: absolute; right: 0; top: calc(100% + 6px); background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 6px; min-width: 160px; z-index: 50; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.dropdown button { display: block; width: 100%; text-align: left; background: none; color: var(--text); padding: 8px 12px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: background 0.15s; }
.dropdown button:hover { background: var(--surface2); }
.dropdown button.danger { color: #ff6b6b; }
.dropdown button.danger:hover { background: rgba(255,107,107,0.1); }
.messages-area { flex: 1; overflow-y: auto; padding: 20px; scroll-behavior: smooth; }
.messages-area::-webkit-scrollbar { width: 4px; }
.messages-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.msg-placeholder { text-align: center; color: var(--text-muted); padding: 40px; }
.messages-list { display: flex; flex-direction: column; gap: 12px; }
.msg-wrapper { display: flex; align-items: flex-end; gap: 8px; }
.msg-mine { flex-direction: row-reverse; }
.msg-ai { justify-content: center; }
.msg-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-dim); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--accent); flex-shrink: 0; }
.msg-bubble { max-width: 65%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; }
.msg-bubble p { word-break: break-word; margin: 0; }
.msg-time { display: block; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
.msg-bubble-other { background: var(--surface2); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
.msg-name { display: block; font-size: 12px; color: var(--accent); font-weight: 500; margin-bottom: 3px; }
.msg-bubble-mine { background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
.msg-bubble-mine .msg-time { color: rgba(255,255,255,0.65); }
.msg-bubble-ai { background: var(--ai-dim); border: 1px solid rgba(72,212,168,0.25); border-radius: 12px; max-width: 75%; color: var(--text); }
.ai-label { font-size: 12px; color: var(--ai); font-weight: 600; margin-bottom: 6px; }
.input-area { background: var(--surface); border-top: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: flex-end; gap: 10px; flex-shrink: 0; }
.input-area textarea { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; color: var(--text); font-size: 14px; resize: none; max-height: 120px; transition: border-color 0.2s; line-height: 1.5; }
.input-area textarea:focus { border-color: var(--accent); }
.input-area textarea::placeholder { color: var(--text-muted); }
.send-btn { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: opacity 0.2s; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn:not(:disabled):hover { opacity: 0.85; }
.msg-enter-active { transition: all 0.25s ease; }
.msg-enter-from { opacity: 0; transform: translateY(8px); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 24px; width: 100%; max-width: 400px; }
.modal-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.modal-card input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-size: 14px; outline: none; box-sizing: border-box; }
.modal-card input:focus { border-color: var(--accent); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.btn { padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
.btn-danger { background: #ff6b6b; color: #fff; }
.error-msg { color: #ff6b6b; font-size: 13px; margin-top: 6px; }
</style>


