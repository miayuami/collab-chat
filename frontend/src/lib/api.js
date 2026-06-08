const BASE = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '請求失敗')
  return data
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getRooms: () => request('/api/rooms'),
  createRoom: (body) => request('/api/rooms', { method: 'POST', body: JSON.stringify(body) }),
  getRoom: (id) => request('/api/rooms/' + id),
  updateRoom: (id, body) => request('/api/rooms/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteRoom: (id) => request('/api/rooms/' + id, { method: 'DELETE' }),
  getMessages: (roomId, limit = 50) => request('/api/messages/' + roomId + '?limit=' + limit),
  sendMessage: (roomId, content) => request('/api/messages/' + roomId, { method: 'POST', body: JSON.stringify({ content }) }),
  askAI: (roomId) => request('/api/ai/ask/' + roomId, { method: 'POST' })
}
