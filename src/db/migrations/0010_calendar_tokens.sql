-- Phase 5: Calendar feed tokens
-- Public, opaque tokens that authorise read-only ICS subscriptions.

create type public.calendar_scope as enum ('org', 'tour', 'comedian');

create table public.calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  org_id uuid not null references public.organisations(id) on delete cascade,
  scope public.calendar_scope not null,
  scope_id uuid,
  token text not null unique,
  label text,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index calendar_tokens_user_idx on public.calendar_tokens(user_id);
create index calendar_tokens_token_idx on public.calendar_tokens(token);
