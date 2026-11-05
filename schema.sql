-- Run once in Supabase → SQL Editor. Idempotent where practical.
-- Model: ONE `posts` table. Shared columns are real columns (indexable/filterable);
-- type-specific fields live in `data` jsonb (shapes documented in js/types.d.ts).

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('photography','journalism','video')),
  title       text not null,
  post_date   date,
  tags        text[] not null default '{}',   -- searchable: GIN index below
  featured    boolean not null default false, -- journalism "Highlighted Article" slot
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint featured_only_journalism check (not featured or type = 'journalism')
);
create index if not exists posts_type_date_idx on public.posts (type, post_date desc);
create index if not exists posts_tags_gin      on public.posts using gin (tags);
-- Backstop: the database itself refuses a second highlighted article.
create unique index if not exists posts_one_featured on public.posts ((true)) where featured;

-- Mutual exclusivity: saving a featured article un-features the previous one, atomically.
create or replace function public.posts_before_write() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.featured then
    update public.posts set featured = false where featured and id <> new.id;
  end if;
  return new;
end $$;
drop trigger if exists posts_before_write on public.posts;
create trigger posts_before_write before insert or update on public.posts
  for each row execute function public.posts_before_write();

-- ---------- Row Level Security: the real authorisation layer ----------
alter table public.posts  enable row level security;
alter table public.admins enable row level security;

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select using (true);

drop policy if exists "posts admin write" on public.posts;
create policy "posts admin write" on public.posts for all to authenticated
  using      (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated
  using (user_id = auth.uid());

-- ---------- Storage bucket for uploads ----------
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "media admin modify" on storage.objects;
create policy "media admin modify" on storage.objects for update to authenticated
  using (bucket_id = 'media' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ---------- Single-owner lock: graydanielgiron@gmail.com is the ONLY account that can exist ----------
-- 1) Refuse to create any other auth user (sign-up, invite, or dashboard), so nobody else can ever hold a session.
create or replace function public.lock_to_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) <> 'graydanielgiron@gmail.com' then
    raise exception 'Sign-ups are closed.';
  end if;
  return new;
end $$;
drop trigger if exists lock_to_owner on auth.users;
create trigger lock_to_owner before insert on auth.users
  for each row execute function public.lock_to_owner();

-- 2) Whenever that account is created, make it the admin automatically.
create or replace function public.grant_owner_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.admins (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists grant_owner_admin on auth.users;
create trigger grant_owner_admin after insert on auth.users
  for each row execute function public.grant_owner_admin();

-- 3) If the account already exists, grant it now.
insert into public.admins (user_id)
select id from auth.users where lower(email) = 'graydanielgiron@gmail.com'
on conflict do nothing;

-- ---------- Seed: your existing Matsuri album (relative URLs resolve from the site root) ----------
insert into public.posts (type, title, tags, data)
select 'photography', 'Matsuri 2026', '{Events}', jsonb_build_object(
  'client', 'Matsuri', 'description', '',
  'thumbnail', 'media/photography/matsuri/thumbnail.png',
  'images', jsonb_build_array('media/photography/matsuri/1.png','media/photography/matsuri/2.png','media/photography/matsuri/3.png','media/photography/matsuri/4.png'))
where not exists (select 1 from public.posts where type = 'photography' and title = 'Matsuri 2026');
