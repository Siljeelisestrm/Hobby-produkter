-- Dashboard widgets: private, personal widgets shown on "Min side" for each user.
-- Kjør dette i Supabase SQL Editor for å legge til dashboard-funksjonaliteten.

create table if not exists public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type text not null check (type in ('counter', 'countdown', 'note', 'stash-value')),
  size text not null default 'medium' check (size in ('small', 'medium', 'large')),
  position integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_widgets enable row level security;

-- Oppdater sjekk-constraint for type dersom tabellen allerede finnes fra før
-- (f.eks. før "stash-value"-widgeten ble lagt til).
alter table public.dashboard_widgets drop constraint if exists dashboard_widgets_type_check;
alter table public.dashboard_widgets
  add constraint dashboard_widgets_type_check
  check (type in ('counter', 'countdown', 'note', 'stash-value'));

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.dashboard_widgets to authenticated;

drop policy if exists "Users can view own widgets" on public.dashboard_widgets;
create policy "Users can view own widgets"
  on public.dashboard_widgets
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Users can insert own widgets" on public.dashboard_widgets;
create policy "Users can insert own widgets"
  on public.dashboard_widgets
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Users can update own widgets" on public.dashboard_widgets;
create policy "Users can update own widgets"
  on public.dashboard_widgets
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can delete own widgets" on public.dashboard_widgets;
create policy "Users can delete own widgets"
  on public.dashboard_widgets
  for delete
  to authenticated
  using (owner_id = auth.uid());

create or replace function public.set_dashboard_widget_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_dashboard_widgets_updated_at on public.dashboard_widgets;
create trigger set_dashboard_widgets_updated_at
  before update on public.dashboard_widgets
  for each row execute function public.set_dashboard_widget_updated_at();

create index if not exists dashboard_widgets_owner_position_idx
  on public.dashboard_widgets (owner_id, position);
