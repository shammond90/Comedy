-- Phase 2: edit_locks RLS + realtime publication.
-- Apply AFTER 0006_edit_locks.sql.

alter table public.edit_locks enable row level security;

-- Anyone in the org can see active locks (so peers can show "locked by X").
create policy "tenant read edit_locks"
  on public.edit_locks for select
  using (org_id in (select public.current_user_orgs()));

-- Per-tour collaborators also need to see locks on their tour and its shows.
-- (org_id is denormalised on edit_locks so the org policy already covers
-- them via current_user_orgs() now including collaborator orgs.)

-- Realtime publication so clients receive INSERT/UPDATE/DELETE events.
alter publication supabase_realtime add table public.edit_locks;
