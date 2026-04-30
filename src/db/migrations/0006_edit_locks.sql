-- Phase 2: Pessimistic edit locks
-- One row per (resource_type, resource_id). Lazy-expiring; no cron.

create type public.lock_resource_type as enum (
  'tour',
  'show',
  'comedian',
  'venue',
  'show_tickets',
  'show_accommodation',
  'show_travel',
  'settings_team'
);

create table public.edit_locks (
  resource_type public.lock_resource_type not null,
  resource_id uuid not null,
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null,
  acquired_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (resource_type, resource_id)
);

create index edit_locks_org_idx on public.edit_locks(org_id);
create index edit_locks_user_idx on public.edit_locks(user_id);
create index edit_locks_expires_idx on public.edit_locks(expires_at);
