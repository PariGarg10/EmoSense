-- EmoSense initial schema (run in Supabase SQL editor or via CLI)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user', 'caregiver', 'therapist')),
  sensory_preferences jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.emotion_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_at timestamptz not null default now(),
  emotion text not null,
  confidence numeric,
  source text not null check (source in ('scan', 'manual')),
  scan_image_path text,
  note text
);

create table if not exists public.behaviour_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_at timestamptz not null default now(),
  time_of_day text,
  emotion text not null,
  activities text[] default '{}',
  energy_level integer check (energy_level between 1 and 5),
  note text
);

create table if not exists public.caregiver_links (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'revoked')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.emotion_logs enable row level security;
alter table public.behaviour_logs enable row level security;
alter table public.caregiver_links enable row level security;

-- Profiles: users manage their own row
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Emotion logs: owner CRUD
create policy "emotion_logs_select_own" on public.emotion_logs
  for select using (auth.uid() = user_id);

create policy "emotion_logs_insert_own" on public.emotion_logs
  for insert with check (auth.uid() = user_id);

create policy "emotion_logs_update_own" on public.emotion_logs
  for update using (auth.uid() = user_id);

-- Behaviour logs: owner CRUD
create policy "behaviour_logs_select_own" on public.behaviour_logs
  for select using (auth.uid() = user_id);

create policy "behaviour_logs_insert_own" on public.behaviour_logs
  for insert with check (auth.uid() = user_id);

create policy "behaviour_logs_update_own" on public.behaviour_logs
  for update using (auth.uid() = user_id);

-- Caregiver links
create policy "caregiver_links_select_related" on public.caregiver_links
  for select using (
    auth.uid() = caregiver_id or auth.uid() = subject_id
  );

create policy "caregiver_links_insert_caregiver" on public.caregiver_links
  for insert with check (auth.uid() = caregiver_id);

create policy "caregiver_links_update_parties" on public.caregiver_links
  for update using (
    auth.uid() = caregiver_id or auth.uid() = subject_id
  );

-- Cross-read: caregiver may read subject emotion logs when link active
create policy "emotion_logs_select_via_caregiver" on public.emotion_logs
  for select using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.status = 'active'
        and cl.caregiver_id = auth.uid()
        and cl.subject_id = emotion_logs.user_id
    )
  );

create policy "behaviour_logs_select_via_caregiver" on public.behaviour_logs
  for select using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.status = 'active'
        and cl.caregiver_id = auth.uid()
        and cl.subject_id = behaviour_logs.user_id
    )
  );
