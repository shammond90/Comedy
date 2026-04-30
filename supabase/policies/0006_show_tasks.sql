-- Phase 7: show_tasks RLS — same tenant rules as shows.

alter table public.show_tasks enable row level security;

drop policy if exists "show_tasks_tenant_select" on public.show_tasks;
create policy "show_tasks_tenant_select"
on public.show_tasks
for select
using (org_id in (select public.current_user_orgs()));

drop policy if exists "show_tasks_tenant_modify" on public.show_tasks;
create policy "show_tasks_tenant_modify"
on public.show_tasks
for all
using (org_id in (select public.current_user_orgs()))
with check (org_id in (select public.current_user_orgs()));
