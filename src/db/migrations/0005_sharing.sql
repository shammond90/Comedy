-- Phase 1: Multi-user sharing
-- - member_role enum (replaces text role on org_members)
-- - tour_collaborators (per-tour role overrides)
-- - invitations (link-based, expiring)
-- - comedians.user_id (nullable link to auth.users)

create type public.member_role as enum ('viewer', 'editor', 'admin', 'owner');

-- ---------------------------------------------------------------------------
-- org_members: convert text role -> enum, add can_view_financials
-- ---------------------------------------------------------------------------
alter table public.org_members
  alter column role drop default;

alter table public.org_members
  alter column role type public.member_role
  using role::public.member_role;

alter table public.org_members
  alter column role set default 'editor'::public.member_role;

alter table public.org_members
  add column can_view_financials boolean not null default true;

-- ---------------------------------------------------------------------------
-- comedians: optional link to a real user account
-- ---------------------------------------------------------------------------
alter table public.comedians
  add column user_id uuid;

create index if not exists comedians_user_idx on public.comedians(user_id);

-- ---------------------------------------------------------------------------
-- tour_collaborators: per-tour role overrides
-- ---------------------------------------------------------------------------
create table public.tour_collaborators (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  user_id uuid not null,
  role public.member_role not null default 'editor',
  can_view_financials boolean not null default false,
  invited_by uuid,
  created_at timestamptz not null default now(),
  unique (tour_id, user_id)
);

create index tour_collaborators_user_idx on public.tour_collaborators(user_id);
create index tour_collaborators_org_idx on public.tour_collaborators(org_id);

-- ---------------------------------------------------------------------------
-- invitations: link-based, may be org-wide (tour_id null) or per-tour
-- ---------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  tour_id uuid references public.tours(id) on delete cascade,
  email text,
  role public.member_role not null default 'editor',
  can_view_financials boolean not null default true,
  token text not null unique,
  invited_by uuid not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_org_idx on public.invitations(org_id);
create index invitations_token_idx on public.invitations(token);
create index invitations_email_idx on public.invitations(email);
