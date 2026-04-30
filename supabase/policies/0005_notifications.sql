-- Phase 4: Notifications RLS
-- A user can only read/update their own notifications.

alter table public.notifications enable row level security;

drop policy if exists "notifications_self_select" on public.notifications;
create policy "notifications_self_select"
on public.notifications
for select
using (user_id = auth.uid());

drop policy if exists "notifications_self_update" on public.notifications;
create policy "notifications_self_update"
on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Add to realtime publication so the bell can subscribe
do $$ begin
  perform 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications';
  if not found then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
