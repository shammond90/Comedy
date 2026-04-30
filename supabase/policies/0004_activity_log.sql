-- Phase 3: Activity log RLS

alter table public.activity_log enable row level security;

-- Anyone in the org (member OR collaborator on any tour in the org) can read.
create policy "tenant read activity_log"
  on public.activity_log for select
  using (org_id in (select public.current_user_orgs()));
