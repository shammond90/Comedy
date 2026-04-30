-- Phase 4: Notifications inbox
-- Per-user notification feed with realtime support.

create type public.notification_type as enum (
  'invite_received',
  'tour_shared',
  'role_changed',
  'force_unlocked',
  'reminder_due'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  org_id uuid references public.organisations(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index notifications_user_unread_idx
  on public.notifications(user_id) where read_at is null;
