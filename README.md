# 協作討論模組

**技術棧：** Vue 3 + Node.js/Express + Supabase + Gemini API

---

## 專案結構

```
collab-chat/
├── supabase/
│   └── schema.sql        ← 先執行這個建立 tables
├── backend/              ← Node.js API Server
│   ├── index.js
│   ├── routes/
│   │   ├── auth.js       ← 註冊 / 登入
│   │   ├── rooms.js      ← 聊天室 CRUD
│   │   ├── messages.js   ← 訊息 CRUD
│   │   └── ai.js         ← 手動呼叫 AI
│   ├── middleware/
│   │   └── auth.js       ← JWT 驗證
│   └── lib/
│       ├── supabase.js   ← Supabase client
│       └── aiTrigger.js  ← AI 觸發邏輯 + Gemini
└── frontend/             ← Vue 3 + Vite
    └── src/
        ├── views/        ← Login / Register / Rooms / Chat
        ├── composables/  ← useChat (Supabase Realtime)
        ├── stores/       ← auth (Pinia)
        └── lib/          ← api.js, supabase.js
```

---

## 設定步驟

### 1. 建立 Supabase Tables
進入 Supabase Dashboard → **jo940309's Org → e-learning**
→ SQL Editor → 貼上 `supabase/schema.sql` → Run

### 2. 後端設定
```bash
cd backend
cp .env.example .env
# 填入 .env：
# SUPABASE_URL          → Supabase 專案 URL
# SUPABASE_SERVICE_ROLE_KEY → 在 Settings > API 取得
# GEMINI_API_KEY        → https://aistudio.google.com/app/apikey
npm install
npm run dev
```

### 3. 前端設定
```bash
cd frontend
cp .env.example .env
# 填入 .env：
# VITE_SUPABASE_URL     → 同上
# VITE_SUPABASE_ANON_KEY → 在 Settings > API 取得（anon key）
# VITE_API_URL          → http://localhost:3001
npm install
npm run dev
```

---

## API 路由

| Method | Path | 說明 |
|--------|------|------|
| POST | /api/auth/register | 註冊 |
| POST | /api/auth/login | 登入 |
| GET | /api/rooms | 取得所有聊天室 |
| POST | /api/rooms | 建立聊天室 |
| GET | /api/rooms/:id | 取得單一聊天室 |
| GET | /api/messages/:roomId | 取得訊息歷史 |
| POST | /api/messages/:roomId | 發送訊息 |
| POST | /api/ai/ask/:roomId | 手動呼叫 AI 引導 |

---

## AI 觸發邏輯

**自動觸發**：使用者訊息含關鍵字時自動觸發
- 關鍵字：`怎麼辦`、`不知道`、`卡住`、`不確定`、`求助`... 等

**手動觸發**：點擊聊天室右上角「🤖 請 AI 引導」按鈕

AI 回覆會透過 **Supabase Realtime** 自動推送給所有成員，不需重整頁面。

---

## Gemini API 免費取得

1. 前往 https://aistudio.google.com/app/apikey
2. 點「Create API key」
3. 貼入後端 `.env` 的 `GEMINI_API_KEY`

免費版使用 `gemini-1.5-flash`（每分鐘 15 requests）
