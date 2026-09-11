create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  details text,
  status text not null check (status in ('beholdt', 'vurderes-solgt', 'solgt')),
  sold_price_nok integer check (sold_price_nok is null or sold_price_nok >= 0),
  image_url text,
  extra_image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists extra_image_urls text[] not null default '{}';

alter table public.products enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.products to anon, authenticated;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can insert products" on public.products;
create policy "Public can insert products"
  on public.products
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can delete products" on public.products;
create policy "Public can delete products"
  on public.products
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "Public can update products" on public.products;
create policy "Public can update products"
  on public.products
  for update
  to anon, authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Public can upload product images" on storage.objects;
create policy "Public can upload product images"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Public can delete product images" on storage.objects;
create policy "Public can delete product images"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'product-images');
