<template>
  <div class="rooms-layout">
    <header class="top-bar">
      <span class="logo">💬 協作討論</span>
      <div class="user-info">
        <span>{{ auth.user?.username }}</span>
        <button class="btn btn-ghost" style="padding:6px 14px;font-size:13px" @click="logout">登出</button>
      </div>
    </header>

    <main class="rooms-main">
      <div class="rooms-header">
        <h2>討論室列表</h2>
        <button class="btn btn-primary" @click="showCreate = true">＋ 建立討論室</button>
      </div>

      <div v-if="loading" class="placeholder">載入中...</div>
      <div v-else-if="rooms.length === 0" class="placeholder">目前沒有討論室，建立一個吧！</div>
      <div v-else class="rooms-grid">
        <div
          v-for="room in rooms"
          :key="room.id"
          class="room-card"
          @click="$router.push(`/rooms/${room.id}`)"
        >
          <div class="room-icon">💬</div>
          <div class="room-info">
            <h3>{{ room.name }}</h3>
            <p v-if="room.description">{{ room.description }}</p>
            <span class="room-meta">由 {{ room.creator?.username || '未知' }} 建立</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 建立討論室 Modal -->
    <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
      <div class="card modal-card">
        <h3 style="margin-bottom:20px">建立新討論室</h3>
        <div class="form-group">
          <label>討論室名稱</label>
          <input v-model="newRoom.name" placeholder="例：第一組討論室" autofocus />
        </div>
        <div class="form-group">
          <label>說明（選填）</label>
          <input v-model="newRoom.description" placeholder="這個討論室的用途..." />
        </div>
        <p v-if="createError" class="error-msg">{{ createError }}</p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost" @click="showCreate = false">取消</button>
          <button class="btn btn-primary" @click="createRoom">建立</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { api } from '../lib/api.js'

const router = useRouter()
const auth = useAuthStore()
const rooms = ref([])
const loading = ref(false)
const showCreate = ref(false)
const createError = ref('')
const newRoom = ref({ name: '', description: '' })

onMounted(async () => {
  loading.value = true
  try { rooms.value = await api.getRooms() }
  finally { loading.value = false }
})

async function createRoom() {
  if (!newRoom.value.name.trim()) { createError.value = '請填寫名稱'; return }
  try {
    const room = await api.createRoom(newRoom.value)
    rooms.value.unshift(room)
    showCreate.value = false
    newRoom.value = { name: '', description: '' }
    router.push(`/rooms/${room.id}`)
  } catch (e) { createError.value = e.message }
}

function logout() { auth.logout(); router.push('/login') }
</script>

<style scoped>
.rooms-layout { min-height: 100vh; display: flex; flex-direction: column; }
.top-bar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo { font-weight: 600; font-size: 16px; }
.user-info { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--text-muted); }
.rooms-main { padding: 32px 24px; max-width: 900px; margin: 0 auto; width: 100%; }
.rooms-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.rooms-header h2 { font-size: 20px; font-weight: 600; }
.placeholder { color: var(--text-muted); text-align: center; padding: 60px 0; }
.rooms-grid { display: grid; gap: 12px; }
.room-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.room-card:hover { border-color: var(--accent); background: var(--surface2); }
.room-icon { font-size: 28px; flex-shrink: 0; }
.room-info h3 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
.room-info p { font-size: 13px; color: var(--text-muted); margin-bottom: 6px; }
.room-meta { font-size: 12px; color: var(--text-muted); }
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal-card { width: 100%; max-width: 420px; }
</style>
