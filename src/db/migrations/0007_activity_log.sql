-- Phase 3: Activity log
-- Append-only audit trail of mutations.

create type public.activity_action as enum (
  'create',
  'update',
  'delete',
  'restore',
  'invite',
  'force_unlock',
  'role_change'
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null,
  resource_type text not null,
  resource_id uuid,
  action public.activity_action not null,
  summary text not null,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_org_created_idx on public.activity_log(org_id, created_at desc);
create index activity_log_resource_idx on public.activity_log(resource_type, resource_id, created_at desc);
create index activity_log_user_idx on public.activity_log(user_id);
