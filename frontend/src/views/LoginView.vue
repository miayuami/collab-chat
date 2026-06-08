<template>
  <div class="auth-wrap">
    <div class="card auth-card">
      <h1 class="auth-title">協作討論空間</h1>
      <p class="auth-sub">登入以加入討論</p>

      <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" placeholder="your@email.com" @keyup.enter="submit" />
      </div>
      <div class="form-group">
        <label>密碼</label>
        <input v-model="password" type="password" placeholder="••••••••" @keyup.enter="submit" />
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button class="btn btn-primary" style="width:100%" :disabled="loading" @click="submit">
        {{ loading ? '登入中...' : '登入' }}
      </button>

      <p class="auth-link">還沒有帳號？<RouterLink to="/register">立即註冊</RouterLink></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (!email.value || !password.value) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
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
.auth-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
}
.auth-sub { color: var(--text-muted); font-size: 14px; margin-bottom: 28px; }
.auth-link {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-muted);
}
.auth-link a { color: var(--accent); text-decoration: none; }
</style>
