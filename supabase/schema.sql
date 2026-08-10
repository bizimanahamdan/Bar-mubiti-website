-- ============================================================
-- BAR MUBITI — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- Then click "Run". Safe to re-run (uses IF NOT EXISTS / drop first).
-- ============================================================

-- ---------- BUSINESS INFO (single row) ----------
create table if not exists business_info (
  id int primary key default 1,
  name text not null default 'Bar Mubiti',
  tagline text default 'Kigali''s home of good grill and good vibes',
  description text default 'Bar Mubiti is a lively bar & grill in Kigali, known for grilled classics, cold drinks and an evening crowd that keeps coming back.',
  address text default '2332+M8F, Kigali',
  phone text default '0788 582 914',
  whatsapp_phone text default '250788582914',
  price_range text default 'RF 1,000 – 15,000',
  google_rating numeric default 3.7,
  google_review_count int default 111,
  map_url text default 'https://www.google.com/maps/search/?api=1&query=Bar+Mubiti+Kigali',
  hero_video_url text,
  constraint single_row check (id = 1)
);
insert into business_info (id) values (1) on conflict (id) do nothing;

-- If you ran schema.sql before this column existed, this line adds it
-- without touching anything else (safe to run even if it already exists):
alter table business_info add column if not exists hero_video_url text;
alter table business_info add column if not exists about_image_url text;

-- ---------- OPENING HOURS ----------
create table if not exists opening_hours (
  id serial primary key,
  day_of_week int not null unique, -- 0=Sunday ... 6=Saturday
  open_time time,
  close_time time,
  is_closed boolean default false
);
insert into opening_hours (day_of_week, open_time, close_time, is_closed)
select d, '11:00', '00:00', false
from generate_series(0,6) as d
on conflict (day_of_week) do nothing;

-- ---------- MENU CATEGORIES ----------
create table if not exists menu_categories (
  id serial primary key,
  name text not null,
  sort_order int default 0
);
insert into menu_categories (name, sort_order) values
  ('Grill & Brochettes', 1),
  ('Starters & Snacks', 2),
  ('Mains', 3),
  ('Drinks & Cocktails', 4),
  ('Soft Drinks & More', 5)
on conflict do nothing;

-- ---------- MENU ITEMS ----------
create table if not exists menu_items (
  id serial primary key,
  category_id int references menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric,
  currency text default 'RWF',
  image_url text,
  is_available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- GALLERY ----------
create table if not exists gallery_images (
  id serial primary key,
  image_url text not null,
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- OFFERS / PROMOTIONS ----------
create table if not exists offers (
  id serial primary key,
  title text not null,
  description text,
  image_url text,
  active boolean default true,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- ---------- TESTIMONIALS ----------
create table if not exists testimonials (
  id serial primary key,
  author_name text not null,
  quote text not null,
  rating numeric,
  source text default 'Google Reviews',
  is_featured boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- RESERVATION / CONTACT REQUESTS ----------
create table if not exists reservation_requests (
  id serial primary key,
  request_type text not null default 'reservation', -- 'reservation' | 'inquiry'
  name text not null,
  phone text not null,
  party_size int,
  preferred_date date,
  preferred_time time,
  message text,
  status text not null default 'new', -- 'new' | 'contacted' | 'confirmed' | 'closed'
  created_at timestamptz default now()
);

-- ---------- SOCIAL LINKS ----------
create table if not exists social_links (
  id serial primary key,
  platform text not null unique, -- 'instagram' | 'facebook' | 'whatsapp' | 'x' | 'tiktok'
  url text
);
insert into social_links (platform, url) values
  ('instagram', ''), ('facebook', ''), ('tiktok', '')
on conflict (platform) do nothing;

-- ---------- SITE SETTINGS ----------
create table if not exists site_settings (
  key text primary key,
  value text
);
insert into site_settings (key, value) values
  ('meta_description', 'Bar Mubiti — a lively bar & grill in Kigali. Grilled classics, cold drinks, good vibes every evening.'),
  ('reservation_note', 'We''ll confirm your table by phone or WhatsApp shortly after you submit.')
on conflict (key) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- Public (anon) visitors can only READ site content and
-- SUBMIT reservation requests. Only a signed-in admin user
-- (created by you in Supabase Auth) can write/edit anything.
-- ============================================================

alter table business_info enable row level security;
alter table opening_hours enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table gallery_images enable row level security;
alter table offers enable row level security;
alter table testimonials enable row level security;
alter table reservation_requests enable row level security;
alter table social_links enable row level security;
alter table site_settings enable row level security;

-- Public read access
drop policy if exists "public read" on business_info;
create policy "public read" on business_info for select using (true);
drop policy if exists "public read" on opening_hours;
create policy "public read" on opening_hours for select using (true);
drop policy if exists "public read" on menu_categories;
create policy "public read" on menu_categories for select using (true);
drop policy if exists "public read" on menu_items;
create policy "public read" on menu_items for select using (true);
drop policy if exists "public read" on gallery_images;
create policy "public read" on gallery_images for select using (true);
drop policy if exists "public read" on offers;
create policy "public read" on offers for select using (true);
drop policy if exists "public read" on testimonials;
create policy "public read" on testimonials for select using (true);
drop policy if exists "public read" on social_links;
create policy "public read" on social_links for select using (true);
drop policy if exists "public read" on site_settings;
create policy "public read" on site_settings for select using (true);

-- Public can INSERT reservation requests only (not read/update/delete others')
drop policy if exists "public insert reservation" on reservation_requests;
create policy "public insert reservation" on reservation_requests for insert with check (true);

-- Signed-in admin (any authenticated user) has full access everywhere.
-- Only you will have an account — sign-up is disabled by default in Supabase,
-- so this stays safe as long as you don't share admin logins.
drop policy if exists "admin full access" on business_info;
create policy "admin full access" on business_info for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on opening_hours;
create policy "admin full access" on opening_hours for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on menu_categories;
create policy "admin full access" on menu_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on menu_items;
create policy "admin full access" on menu_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on gallery_images;
create policy "admin full access" on gallery_images for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on offers;
create policy "admin full access" on offers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on testimonials;
create policy "admin full access" on testimonials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on reservation_requests;
create policy "admin full access" on reservation_requests for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on social_links;
create policy "admin full access" on social_links for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "admin full access" on site_settings;
create policy "admin full access" on site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS (run separately if this errors — see README)
-- Create two PUBLIC buckets named exactly: gallery , menu
-- via Dashboard → Storage → New bucket → toggle "Public bucket" ON
-- (Storage buckets can't reliably be created via SQL editor on all
-- Supabase plans, so the README walks through the UI steps.)
--
-- IMPORTANT: marking a bucket "Public" only allows public READING
-- of files — it does NOT allow uploads. You still need explicit
-- storage RLS policies for the admin panel to be able to upload,
-- replace, or delete photos. Run this after creating the buckets:
-- ============================================================

drop policy if exists "public read gallery" on storage.objects;
create policy "public read gallery" on storage.objects for select using (bucket_id = 'gallery');
drop policy if exists "public read menu" on storage.objects;
create policy "public read menu" on storage.objects for select using (bucket_id = 'menu');

drop policy if exists "admin upload gallery" on storage.objects;
create policy "admin upload gallery" on storage.objects for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');
drop policy if exists "admin upload menu" on storage.objects;
create policy "admin upload menu" on storage.objects for insert with check (bucket_id = 'menu' and auth.role() = 'authenticated');

drop policy if exists "admin update gallery" on storage.objects;
create policy "admin update gallery" on storage.objects for update using (bucket_id = 'gallery' and auth.role() = 'authenticated');
drop policy if exists "admin update menu" on storage.objects;
create policy "admin update menu" on storage.objects for update using (bucket_id = 'menu' and auth.role() = 'authenticated');

drop policy if exists "admin delete gallery" on storage.objects;
create policy "admin delete gallery" on storage.objects for delete using (bucket_id = 'gallery' and auth.role() = 'authenticated');
drop policy if exists "admin delete menu" on storage.objects;
create policy "admin delete menu" on storage.objects for delete using (bucket_id = 'menu' and auth.role() = 'authenticated');

-- ============================================================
-- HERO VIDEO (optional)
-- Create one more PUBLIC bucket named exactly: videos
-- via Dashboard → Storage → New bucket → toggle "Public bucket" ON
-- Then run this section so the admin panel can upload to it.
-- ============================================================
drop policy if exists "public read videos" on storage.objects;
create policy "public read videos" on storage.objects for select using (bucket_id = 'videos');
drop policy if exists "admin upload videos" on storage.objects;
create policy "admin upload videos" on storage.objects for insert with check (bucket_id = 'videos' and auth.role() = 'authenticated');
drop policy if exists "admin update videos" on storage.objects;
create policy "admin update videos" on storage.objects for update using (bucket_id = 'videos' and auth.role() = 'authenticated');
drop policy if exists "admin delete videos" on storage.objects;
create policy "admin delete videos" on storage.objects for delete using (bucket_id = 'videos' and auth.role() = 'authenticated');

-- ============================================================
-- REALTIME (for instant admin notifications on new reservations)
-- Wrapped so it's safe to re-run even if already enabled.
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table reservation_requests;
exception
  when duplicate_object then null;
end $$;

-- Seed a few starter testimonials so the site never looks empty
-- before you've added real reviews (edit/replace these in Admin).
insert into testimonials (author_name, quote, rating, source, is_featured, sort_order)
select 'Google Reviewer', 'Add your first real review from Google in the Admin panel — this is placeholder text.', 4, 'Google Reviews', true, 1
where not exists (select 1 from testimonials);
