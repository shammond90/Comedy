-- Phase 1: Sharing — extend RLS for tour_collaborators and invitations.
-- Apply AFTER 0001_rls_and_constraints.sql AND after migration 0005_sharing.sql.

-- ---------------------------------------------------------------------------
-- 1. Extend current_user_orgs() to also include orgs reached via per-tour
--    collaboration (so a comedian invited to one tour can see the org row).
-- ---------------------------------------------------------------------------
create or replace function public.current_user_orgs()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.org_members where user_id = auth.uid()
  union
  select org_id from public.tour_collaborators where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- 2. Helper: tours the current user can access via per-tour collaboration.
-- ---------------------------------------------------------------------------
create or replace function public.current_user_tours()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tour_id from public.tour_collaborators where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- 3. Enable RLS on the new tables.
-- ---------------------------------------------------------------------------
alter table public.tour_collaborators enable row level security;
alter table public.invitations        enable row level security;

-- tour_collaborators: a user can read rows for tours they're already in
-- (org member OR collaborator). Writes are server-side via service role.
create policy "tenant read tour_collaborators"
  on public.tour_collaborators for select
  using (
    org_id in (select public.current_user_orgs())
    or user_id = auth.uid()
  );

-- invitations: only org members can list invites for the org. Public
-- "lookup by token" happens via service role.
create policy "tenant read invitations"
  on public.invitations for select
  using (org_id in (select public.current_user_orgs()));

-- ---------------------------------------------------------------------------
-- 4. Extend table policies so per-tour collaborators can access tour-scoped
--    rows on tours, shows, accommodations, travel and reminders even when
--    they are NOT org members.
-- ---------------------------------------------------------------------------

-- Tours: a collaborator can SELECT/UPDATE/DELETE the tour itself.
create policy "collaborator read tours"
  on public.tours for select
  using (id in (select public.current_user_tours()));

create policy "collaborator update tours"
  on public.tours for update
  using (id in (select public.current_user_tours()))
  with check (id in (select public.current_user_tours()));

-- Shows / accommodations / travel / reminders: collaborator access flows
-- through the parent tour_id where present.
create policy "collaborator read shows"
  on public.shows for select
  using (tour_id in (select public.current_user_tours()));

create policy "collaborator insert shows"
  on public.shows for insert
  with check (tour_id in (select public.current_user_tours()));

create policy "collaborator update shows"
  on public.shows for update
  using (tour_id in (select public.current_user_tours()))
  with check (tour_id in (select public.current_user_tours()));

create policy "collaborator delete shows"
  on public.shows for delete
  using (tour_id in (select public.current_user_tours()));

-- Accommodations / travel attach via show_id; allow collab access if the
-- parent show belongs to a collaborator-accessible tour.
create policy "collaborator read accommodations"
  on public.accommodations for select
  using (
    show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  );

create policy "collaborator write accommodations"
  on public.accommodations for all
  using (
    show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  )
  with check (
    show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  );

create policy "collaborator read travel"
  on public.travel for select
  using (
    show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  );

create policy "collaborator write travel"
  on public.travel for all
  using (
    show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  )
  with check (
    show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  );

-- Reminders attach to either tour or show. Allow collab access on either.
create policy "collaborator read reminders"
  on public.reminders for select
  using (
    tour_id in (select public.current_user_tours())
    or show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  );

create policy "collaborator write reminders"
  on public.reminders for all
  using (
    tour_id in (select public.current_user_tours())
    or show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  )
  with check (
    tour_id in (select public.current_user_tours())
    or show_id in (
      select id from public.shows
      where tour_id in (select public.current_user_tours())
    )
  );
