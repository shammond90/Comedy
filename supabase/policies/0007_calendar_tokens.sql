-- Phase 5: calendar_tokens RLS — owners (creators) can manage their tokens.
-- The public ICS endpoint reads via the service role / DATABASE_URL bypass,
-- so RLS only governs in-app management.

alter table public.calendar_tokens enable row level security;

drop policy if exists "calendar_tokens_self_select" on public.calendar_tokens;
create policy "calendar_tokens_self_select"
on public.calendar_tokens
for select
using (user_id = auth.uid());

drop policy if exists "calendar_tokens_self_modify" on public.calendar_tokens;
create policy "calendar_tokens_self_modify"
on public.calendar_tokens
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
