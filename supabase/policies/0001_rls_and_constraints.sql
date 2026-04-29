-- Row-Level Security policies and additional integrity constraints.
-- Apply AFTER Drizzle migrations.
--
-- Strategy: every table is scoped by `org_id`. A user may only see/modify
-- rows whose org_id appears in their org_members membership.

-- Helper: returns the orgs the current authenticated user belongs to.
create or replace function public.current_user_orgs()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.org_members where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every app table.
-- ---------------------------------------------------------------------------
alter table public.organisations    enable row level security;
alter table public.org_members      enable row level security;
alter table public.venues           enable row level security;
alter table public.comedians        enable row level security;
alter table public.tours            enable row level security;
alter table public.shows            enable row level security;
alter table public.ticket_tiers     enable row level security;
alter table public.accommodations   enable row level security;
alter table public.travel           enable row level security;
alter table public.reminders        enable row level security;

-- ---------------------------------------------------------------------------
-- organisations: members can read & update their org. Inserts happen
-- server-side via the service role (auth bootstrap), so no insert policy.
-- ---------------------------------------------------------------------------
create policy "org members can read their org"
  on public.organisations for select
  using (id in (select public.current_user_orgs()));

create policy "org members can update their org"
  on public.organisations for update
  using (id in (select public.current_user_orgs()));

-- ---------------------------------------------------------------------------
-- org_members: a user can read their own membership rows.
-- ---------------------------------------------------------------------------
create policy "users read their own memberships"
  on public.org_members for select
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Generic tenant-scoped policies for all data tables.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'venues', 'comedians', 'tours', 'shows',
    'ticket_tiers', 'accommodations', 'travel', 'reminders'
  ];
begin
  foreach t in array tables loop
    execute format($f$
      create policy "tenant read %1$s"
        on public.%1$I for select
        using (org_id in (select public.current_user_orgs()))
    $f$, t);

    execute format($f$
      create policy "tenant insert %1$s"
        on public.%1$I for insert
        with check (org_id in (select public.current_user_orgs()))
    $f$, t);

    execute format($f$
      create policy "tenant update %1$s"
        on public.%1$I for update
        using (org_id in (select public.current_user_orgs()))
        with check (org_id in (select public.current_user_orgs()))
    $f$, t);

    execute format($f$
      create policy "tenant delete %1$s"
        on public.%1$I for delete
        using (org_id in (select public.current_user_orgs()))
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Prevent double-booking the same comedian on the same date.
-- A show belongs to a tour which belongs to a comedian.
-- We enforce this via a denormalised comedian_id column kept in sync
-- by trigger, with a unique index.
-- ---------------------------------------------------------------------------
alter table public.shows
  add column if not exists comedian_id uuid references public.comedians(id);

create or replace function public.shows_set_comedian_id()
returns trigger
language plpgsql
as $$
begin
  select t.comedian_id into new.comedian_id
  from public.tours t
  where t.id = new.tour_id;
  return new;
end $$;

drop trigger if exists shows_set_comedian_id on public.shows;
create trigger shows_set_comedian_id
  before insert or update of tour_id on public.shows
  for each row execute function public.shows_set_comedian_id();

-- Backfill any existing rows.
update public.shows s
set comedian_id = t.comedian_id
from public.tours t
where s.tour_id = t.id and s.comedian_id is null;

create unique index if not exists shows_comedian_date_unique
  on public.shows (comedian_id, show_date)
  where archived_at is null and status <> 'cancelled';

-- ---------------------------------------------------------------------------
-- Auto-update updated_at on row changes.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare
  t text;
  tables text[] := array['venues', 'comedians', 'tours', 'shows'];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format($f$
      create trigger touch_updated_at
        before update on public.%I
        for each row execute function public.touch_updated_at()
    $f$, t);
  end loop;
end $$;
