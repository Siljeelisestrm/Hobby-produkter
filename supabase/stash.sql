-- Hobbybibliotek (stash): privat oversikt over garn, stoff, perler og annet.
-- Kjør dette i Supabase SQL Editor for å legge til denne funksjonaliteten.

create table if not exists public.stash_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  category text not null check (category in ('garn', 'stoff', 'perler', 'annet')),
  title text not null default '',
  quantity numeric(10, 2) not null default 1,
  width_cm numeric(10, 2),
  length_cm numeric(10, 2),
  price_nok numeric(10, 2),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Legg til mål-kolonner dersom tabellen allerede finnes fra før
-- (f.eks. før stoff fikk bredde/lengde i stedet for antall).
alter table public.stash_items add column if not exists width_cm numeric(10, 2);
alter table public.stash_items add column if not exists length_cm numeric(10, 2);

alter table public.stash_items enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.stash_items to authenticated;

drop policy if exists "Users can view own stash items" on public.stash_items;
create policy "Users can view own stash items"
  on public.stash_items
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Users can insert own stash items" on public.stash_items;
create policy "Users can insert own stash items"
  on public.stash_items
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Users can update own stash items" on public.stash_items;
create policy "Users can update own stash items"
  on public.stash_items
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can delete own stash items" on public.stash_items;
create policy "Users can delete own stash items"
  on public.stash_items
  for delete
  to authenticated
  using (owner_id = auth.uid());

create or replace function public.set_stash_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_stash_items_updated_at on public.stash_items;
create trigger set_stash_items_updated_at
  before update on public.stash_items
  for each row execute function public.set_stash_item_updated_at();

create index if not exists stash_items_owner_category_idx
  on public.stash_items (owner_id, category);

-- Bildelagring for hobbybiblioteket
insert into storage.buckets (id, name, public)
values ('stash-images', 'stash-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read stash images" on storage.objects;
create policy "Public can read stash images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'stash-images');

drop policy if exists "Authenticated can upload stash images" on storage.objects;
create policy "Authenticated can upload stash images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'stash-images');

drop policy if exists "Owners can update stash images" on storage.objects;
create policy "Owners can update stash images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'stash-images')
  with check (bucket_id = 'stash-images');

drop policy if exists "Authenticated can delete stash images" on storage.objects;
create policy "Authenticated can delete stash images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'stash-images');
