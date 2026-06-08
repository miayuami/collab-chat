<template>
  <div class="auth-wrap">
    <div class="card auth-card">
      <h1 class="auth-title">建立帳號</h1>
      <p class="auth-sub">加入協作討論平台</p>

      <div class="form-group">
        <label>顯示名稱</label>
        <input v-model="username" type="text" placeholder="你的名字" />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" placeholder="your@email.com" />
      </div>
      <div class="form-group">
        <label>密碼</label>
        <input v-model="password" type="password" placeholder="至少 6 個字元" />
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button class="btn btn-primary" style="width:100%" :disabled="loading" @click="submit">
        {{ loading ? '註冊中...' : '註冊' }}
      </button>

      <p class="auth-link">已有帳號？<RouterLink to="/login">返回登入</RouterLink></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (!username.value || !email.value || !password.value) {
    error.value = '請填寫所有欄位'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await auth.register(email.value, password.value, username.value)
    router.push('/rooms')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.auth-card { width: 100%; max-width: 400px; }
.auth-title { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
.auth-sub { color: var(--text-muted); font-size: 14px; margin-bottom: 28px; }
.auth-link { text-align: center; margin-top: 16px; font-size: 13px; color: var(--text-muted); }
.auth-link a { color: var(--accent); text-decoration: none; }
</style>
