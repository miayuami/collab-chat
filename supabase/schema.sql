-- =============================================
-- 協作討論模組 Schema
-- 專案: e-learning (jo940309's Org)
-- 注意: 只新增以下 tables，不修改現有資料
-- =============================================

-- 1. users (使用者資料，搭配 Supabase Auth)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null unique,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "使用者可讀取所有用戶資料" on public.users
  for select using (true);

create policy "使用者只能更新自己的資料" on public.users
  for update using (auth.uid() = id);

create policy "使用者可新增自己的資料" on public.users
  for insert with check (auth.uid() = id);

-- 2. chat_rooms (聊天室)
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.chat_rooms enable row level security;

create policy "所有登入使用者可讀取聊天室" on public.chat_rooms
  for select using (auth.role() = 'authenticated');

create policy "登入使用者可建立聊天室" on public.chat_rooms
  for insert with check (auth.role() = 'authenticated');

-- 3. messages (訊息)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  content text not null,
  is_ai boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "登入使用者可讀取訊息" on public.messages
  for select using (auth.role() = 'authenticated');

create policy "登入使用者可發送訊息" on public.messages
  for insert with check (auth.role() = 'authenticated');

-- 開啟 Realtime (messages table)
alter publication supabase_realtime add table public.messages;
