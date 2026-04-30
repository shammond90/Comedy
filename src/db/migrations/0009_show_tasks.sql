-- Phase 7: Per-show task checklist
-- Lightweight todos attached to a show.

create table public.show_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  show_id uuid not null references public.shows(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  done_at timestamptz,
  done_by_user_id uuid,
  due_at date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index show_tasks_show_idx on public.show_tasks(show_id, sort_order);
create index show_tasks_org_idx on public.show_tasks(org_id);
