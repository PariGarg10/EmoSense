-- Let people delete their own entries, and speed up per-user date queries.

drop policy if exists "emotion_logs_delete_own" on public.emotion_logs;
create policy "emotion_logs_delete_own" on public.emotion_logs
  for delete using (auth.uid() = user_id);

drop policy if exists "behaviour_logs_delete_own" on public.behaviour_logs;
create policy "behaviour_logs_delete_own" on public.behaviour_logs
  for delete using (auth.uid() = user_id);

create index if not exists emotion_logs_user_logged_at_idx
  on public.emotion_logs (user_id, logged_at desc);

create index if not exists behaviour_logs_user_logged_at_idx
  on public.behaviour_logs (user_id, logged_at desc);

-- Keep notes and display names to a sensible size.
alter table public.emotion_logs
  drop constraint if exists emotion_logs_note_length,
  add constraint emotion_logs_note_length check (note is null or char_length(note) <= 1000);

alter table public.behaviour_logs
  drop constraint if exists behaviour_logs_note_length,
  add constraint behaviour_logs_note_length check (note is null or char_length(note) <= 2000);
