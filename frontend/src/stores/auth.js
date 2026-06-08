import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../lib/api.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token') || null)

  async function login(email, password) {
    const data = await api.login({ email, password })
    user.value = data.user
    token.value = data.token
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  async function register(email, password, username) {
    await api.register({ email, password, username })
    await login(email, password)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { user, token, login, register, logout }
})
