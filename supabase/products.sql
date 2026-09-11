create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  description text not null default '',
  details text,
  created_year integer check (created_year is null or (created_year >= 1900 and created_year <= 2100)),
  status text not null check (status in ('beholdt', 'vurderes-solgt', 'solgt', 'gave')),
  is_favorite boolean not null default false,
  is_shared boolean not null default false,
  sold_price_nok integer check (sold_price_nok is null or sold_price_nok >= 0),
  image_url text,
  extra_image_urls text[] not null default '{}',
  preview_focus_x real not null default 50,
  preview_focus_y real not null default 50,
  created_at timestamptz not null default now()
);

create table if not exists public.product_likes (
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, user_id)
);

alter table public.products
  add column if not exists owner_id uuid references auth.users (id) on delete cascade;

alter table public.products
  alter column owner_id set default auth.uid();

alter table public.products
  add column if not exists extra_image_urls text[] not null default '{}';

alter table public.products
  add column if not exists preview_focus_x real not null default 50;

alter table public.products
  add column if not exists preview_focus_y real not null default 50;

alter table public.products
  add column if not exists is_favorite boolean not null default false;

alter table public.products
  add column if not exists is_shared boolean not null default false;

alter table public.products
  add column if not exists created_year integer;

alter table public.products
  alter column description set default '';

update public.products
set description = ''
where description is null;

alter table public.products
  alter column description set not null;

alter table public.products
  drop constraint if exists products_status_check;

alter table public.products
  add constraint products_status_check
  check (status in ('beholdt', 'vurderes-solgt', 'solgt', 'gave'));

alter table public.products
  drop constraint if exists products_created_year_check;

alter table public.products
  add constraint products_created_year_check
  check (created_year is null or (created_year >= 1900 and created_year <= 2100));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, bio, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'bio',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    username = excluded.username,
    bio = excluded.bio,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_likes enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;

grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

grant select on table public.product_likes to anon, authenticated;
grant insert, delete on table public.product_likes to authenticated;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Users can read own or shared products" on public.products;
create policy "Users can read own or shared products"
  on public.products
  for select
  to anon, authenticated
  using (is_shared = true or owner_id = auth.uid());

drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products"
  on public.products
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products"
  on public.products
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users can delete own products" on public.products;
create policy "Users can delete own products"
  on public.products
  for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Likes are publicly readable" on public.product_likes;
create policy "Likes are publicly readable"
  on public.product_likes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can like shared products" on public.product_likes;
create policy "Users can like shared products"
  on public.product_likes
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.is_shared = true
    )
  );

drop policy if exists "Users can remove own likes" on public.product_likes;
create policy "Users can remove own likes"
  on public.product_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated can upload product images" on storage.objects;
create policy "Authenticated can upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Owners can update product images" on storage.objects;
create policy "Owners can update product images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists "Authenticated can delete product images" on storage.objects;
create policy "Authenticated can delete product images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Public can read profile images" on storage.objects;
create policy "Public can read profile images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'profile-images');

drop policy if exists "Public can upload profile images" on storage.objects;
create policy "Public can upload profile images"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'profile-images');
