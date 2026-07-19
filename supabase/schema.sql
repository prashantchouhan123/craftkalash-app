-- CraftKalash Production-Ready Supabase Database Schema
-- All tables are fully normalized, indexed, secure (RLS), and compatible with camelCase and snake_case models.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  phone text,
  avatar text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. CATEGORIES TABLE
-- ==========================================
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  image text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 3. PRODUCTS TABLE
-- ==========================================
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories(id) on delete set null,
  category text not null default 'puzzles-blocks', -- Slug mapping for backward compatibility with frontend code
  name text not null,
  slug text not null unique,
  description text not null,
  sku text not null unique,
  price numeric(10,2) not null check (price >= 0),
  "originalPrice" numeric(10,2) check ("originalPrice" >= 0),
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  "bestSeller" boolean not null default false,
  "isNew" boolean not null default true,
  materials text[] not null default '{}',
  details text[] not null default '{}',
  dimensions text,
  "ageRange" text not null,
  "inStock" boolean not null default true,
  image text not null,
  "hoverImage" text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 4. PRODUCT IMAGES TABLE
-- ==========================================
create table if not exists public.product_images (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  sort_order integer default 0 not null
);

-- ==========================================
-- 5. WISHLIST TABLE
-- ==========================================
create table if not exists public.wishlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  unique (user_id, product_id)
);

-- ==========================================
-- 6. CART TABLE
-- ==========================================
create table if not exists public.cart (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique
);

-- ==========================================
-- 7. CART ITEMS TABLE
-- ==========================================
create table if not exists public.cart_items (
  id uuid default uuid_generate_v4() primary key,
  cart_id uuid references public.cart(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1 check (quantity > 0),
  unique (cart_id, product_id)
);

-- ==========================================
-- 8. ADDRESSES TABLE
-- ==========================================
create table if not exists public.addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'India',
  default_address boolean not null default false
);

-- ==========================================
-- 9. ORDERS TABLE
-- ==========================================
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  address_id uuid references public.addresses(id) on delete set null,
  order_number text not null unique,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount numeric(10,2) not null default 0.00 check (discount >= 0),
  shipping numeric(10,2) not null default 0.00 check (shipping >= 0),
  total numeric(10,2) not null check (total >= 0),
  payment_method text not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'pending' check (order_status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 10. ORDER ITEMS TABLE
-- ==========================================
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

-- ==========================================
-- 11. REVIEWS TABLE
-- ==========================================
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (product_id, user_id)
);

-- ==========================================
-- 12. COUPONS TABLE
-- ==========================================
create table if not exists public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  active boolean not null default true,
  expiry timestamp with time zone not null
);

-- ==========================================
-- 13. NEWSLETTER TABLE
-- ==========================================
create table if not exists public.newsletter (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ==========================================
-- DATABASE INDEXES FOR PERFORMANCE
-- ==========================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_category_slug on public.products(category);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_wishlist_user on public.wishlist(user_id);
create index if not exists idx_cart_user on public.cart(user_id);
create index if not exists idx_cart_items_cart on public.cart_items(cart_id);
create index if not exists idx_addresses_user on public.addresses(user_id);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_reviews_product on public.reviews(product_id);
create index if not exists idx_coupons_code on public.coupons(code);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.wishlist enable row level security;
alter table public.cart enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.newsletter enable row level security;

-- profiles Policies
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- categories Policies
create policy "Allow public read access to categories" on public.categories
  for select using (true);

create policy "Allow admin write access to categories" on public.categories
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- products Policies
create policy "Allow public read access to published products" on public.products
  for select using (status = 'published');

create policy "Allow admin full access to products" on public.products
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- product_images Policies
create policy "Allow public read access to product images" on public.product_images
  for select using (true);

create policy "Allow admin full access to product images" on public.product_images
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- wishlist Policies
create policy "Allow users to manage own wishlist" on public.wishlist
  for all using (auth.uid() = user_id);

-- cart Policies
create policy "Allow users to manage own cart" on public.cart
  for all using (auth.uid() = user_id);

-- cart_items Policies
create policy "Allow users to manage own cart items" on public.cart_items
  for all using (
    exists (
      select 1 from public.cart
      where cart.id = cart_items.cart_id and cart.user_id = auth.uid()
    )
  );

-- addresses Policies
create policy "Allow users to manage own addresses" on public.addresses
  for all using (auth.uid() = user_id);

create policy "Allow admin full access to addresses" on public.addresses
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- orders Policies
create policy "Allow users to read own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Allow users to insert own orders" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Allow admin full access to orders" on public.orders
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- order_items Policies
create policy "Allow users to read own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

create policy "Allow users to insert own order items" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );

create policy "Allow admin full access to order items" on public.order_items
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- reviews Policies
create policy "Allow public read access to reviews" on public.reviews
  for select using (true);

create policy "Allow users to manage own reviews" on public.reviews
  for all using (auth.uid() = user_id);

-- coupons Policies
create policy "Allow public select access to active coupons" on public.coupons
  for select using (active = true and expiry > now());

create policy "Allow admin full access to coupons" on public.coupons
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- newsletter Policies
create policy "Allow public to subscribe to newsletter" on public.newsletter
  for insert with check (true);

create policy "Allow admin to read newsletter list" on public.newsletter
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


-- ==========================================================
-- TRIGGERS TO AUTOMATICALLY CREATE PROFILE ON USER SIGNUP
-- ==========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Craft Explorer'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'customer'
  );
  
  -- Create empty cart for new user
  insert into public.cart (user_id) values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================================
-- SUPABASE STORAGE BUCKETS CONFIGURATION (SQL PROVISIONING)
-- NOTE: In many standard Supabase setups, users running the SQL editor do not
-- own the `storage` schema tables. If you encounter the error:
-- "ERROR: 42501: must be owner of table objects"
-- you should leave this section commented out and configure your storage buckets
-- ("product-images", "banners", "avatars") directly via the Supabase Dashboard UI.
-- ==========================================================
-- insert into storage.buckets (id, name, public)
-- values 
--   ('product-images', 'product-images', true),
--   ('banners', 'banners', true),
--   ('avatars', 'avatars', true)
-- on conflict (id) do nothing;
-- 
-- -- Enable RLS on storage if it is not already enabled
-- -- alter table storage.objects enable row level security;
-- 
-- -- Storage policies for public read / secure write
-- -- drop policy if exists "Public read access to product-images" on storage.objects;
-- -- create policy "Public read access to product-images" on storage.objects
-- --   for select using (bucket_id = 'product-images');
-- 
-- -- drop policy if exists "Admin write access to product-images" on storage.objects;
-- -- drop policy if exists "Allow public uploads" on storage.objects;
-- -- drop policy if exists "Allow public updates" on storage.objects;
-- -- drop policy if exists "Allow public deletes" on storage.objects;
-- 
-- -- create policy "Allow public uploads" on storage.objects
-- --   for insert with check (bucket_id = 'product-images');
-- 
-- -- create policy "Allow public updates" on storage.objects
-- --   for update using (bucket_id = 'product-images');
-- 
-- -- create policy "Allow public deletes" on storage.objects
-- --   for delete using (bucket_id = 'product-images');
-- 
-- -- drop policy if exists "Public read access to banners" on storage.objects;
-- -- create policy "Public read access to banners" on storage.objects
-- --   for select using (bucket_id = 'banners');
-- 
-- -- drop policy if exists "Admin write access to banners" on storage.objects;
-- -- drop policy if exists "Allow banner uploads" on storage.objects;
-- -- drop policy if exists "Allow banner updates" on storage.objects;
-- -- drop policy if exists "Allow banner deletes" on storage.objects;
-- 
-- -- create policy "Allow banner uploads" on storage.objects
-- --   for insert with check (bucket_id = 'banners');
-- 
-- -- create policy "Allow banner updates" on storage.objects
-- --   for update using (bucket_id = 'banners');
-- 
-- -- create policy "Allow banner deletes" on storage.objects
-- --   for delete using (bucket_id = 'banners');
-- 
-- -- drop policy if exists "Public read access to avatars" on storage.objects;
-- -- create policy "Public read access to avatars" on storage.objects
-- --   for select using (bucket_id = 'avatars');
-- 
-- -- drop policy if exists "Users manage their own avatars" on storage.objects;
-- -- drop policy if exists "Allow avatar uploads" on storage.objects;
-- -- drop policy if exists "Allow avatar updates" on storage.objects;
-- -- drop policy if exists "Allow avatar deletes" on storage.objects;
-- 
-- -- create policy "Allow avatar uploads" on storage.objects
-- --   for insert with check (bucket_id = 'avatars');
-- 
-- -- create policy "Allow avatar updates" on storage.objects
-- --   for update using (bucket_id = 'avatars');
-- 
-- -- create policy "Allow avatar deletes" on storage.objects
-- --   for delete using (bucket_id = 'avatars');


-- ==========================================
-- PRE-SEED STORE CATEGORIES
-- ==========================================
insert into public.categories (id, name, slug, image, description)
values
  ('11111111-1111-1111-1111-111111111111', 'Infant & Toddler', 'infant-toddler', 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=300', 'Gentle materials, soothing sounds, and safe edges for early developmental stages.'),
  ('22222222-2222-2222-2222-222222222222', 'Imaginary Play', 'imaginary-play', 'https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=300', 'Open-ended worlds, wooden kitchen sets, and storytelling block sets.'),
  ('33333333-3333-3333-3333-333333333333', 'Puzzles & Blocks', 'puzzles-blocks', 'https://images.unsplash.com/photo-1608447714925-599deeb5a682?auto=format&fit=crop&q=80&w=300', 'Geometric stackers, nesting trees, and spatial logic timber blocks.'),
  ('44444444-4444-4444-4444-444444444444', 'Vehicles & Motion', 'vehicles-motion', 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=300', 'Smooth-rolling locomotives, modern racer cars, and dynamic motion blocks.')
on conflict (slug) do update set
  name = excluded.name,
  image = excluded.image,
  description = excluded.description;


-- ==========================================
-- PRE-SEED STORE PRODUCTS
-- ==========================================
insert into public.products (
  id, category_id, category, name, slug, description, sku, price, "originalPrice",
  stock, featured, "bestSeller", "isNew", materials, details, dimensions, "ageRange", "inStock", image, "hoverImage", status
) values
  (
    '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    '33333333-3333-3333-3333-333333333333',
    'puzzles-blocks',
    'Waldorf Forest Nesting Trees',
    'waldorf-forest-trees',
    'A beautiful set of 6 nesting pine and maple trees. Hand-dyed using plant-based pigments, this open-ended toy helps develop size-relationship concepts and motor coordination.',
    'CRAFT-WALDORF_FOREST_TREES',
    48.00,
    55.00,
    15,
    true,
    true,
    false,
    array['Sustainable Beechwood', 'Organic Linseed Oil', 'Non-toxic Stains'],
    array['Handcrafted from sustainable European Beechwood.', 'Protected with certified organic linseed oil and water-based stains.', 'Sized perfectly for little hands to stack, nest, or sort by shade.', 'Includes premium organic cotton storage bag.'],
    '18cm x 12cm x 6cm (stacked)',
    '18 months +',
    true,
    'https://images.unsplash.com/photo-1608447714925-599deeb5a682?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800',
    'published'
  ),
  (
    '2a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    '33333333-3333-3333-3333-333333333333',
    'puzzles-blocks',
    'Earthy Archipelago Arch Stacker',
    'earthy-archipelago-arch',
    'An architectural marvel in earth tones. This 10-piece stacking arch serves as a bridge, tunnel, cradle, or modern display. Ideal for teaching structural balance and architectural gravity.',
    'CRAFT-EARTHY_ARCHIPELAGO_ARCH',
    64.00,
    null,
    15,
    true,
    false,
    true,
    array['FSC-Certified Linden Wood', 'Natural Chalk Dyes'],
    array['Sculpted from a single solid block of premium linden wood.', 'Colored with warm matte earthy organic dyes.', 'No lacquer coatings, preserving the rich, tactile natural texture.', 'Fosters lateral creative thinking and patience.'],
    '30cm x 15cm x 7cm',
    '12 months +',
    true,
    'https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
    'published'
  ),
  (
    '3a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    '22222222-2222-2222-2222-222222222222',
    'imaginary-play',
    'Nordic Mini Wooden Kitchen Set',
    'nordic-play-kitchen-set',
    'Bring mini culinary dreams to life. This polished kitchenware set includes a wooden cooking pot with lid, frying pan, kettle, cutting board, and essential stirring spoons.',
    'CRAFT-NORDIC_PLAY_KITCHEN_SET',
    52.00,
    65.00,
    15,
    false,
    true,
    false,
    array['European Maple', 'Raw Beeswax Polish'],
    array['Made of ultra-smooth solid European Maple wood.', 'Zero synthetic paint or dyes—pure polished raw wood grain.', 'Beeswax finish gives a subtle honey aroma and water resistance.', 'Inspires screen-free child roleplaying and fine motor skills.'],
    'Pot: 10cm diameter, Pan: 15cm length',
    '3 years +',
    true,
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1608447714925-599deeb5a682?auto=format&fit=crop&q=80&w=800',
    'published'
  ),
  (
    '4a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    '44444444-4444-4444-4444-444444444444',
    'vehicles-motion',
    'Retro Heirloom Steam Locomotive',
    'retro-steam-locomotive',
    'A classic rolling masterpiece. Crafted with a beautiful dark walnut body and maple accent steam pipes, this magnetic train carriage is both highly functional and heirloom-grade.',
    'CRAFT-RETRO_STEAM_LOCOMOTIVE',
    38.00,
    null,
    15,
    false,
    false,
    true,
    array['Contrasting Walnut & Maple', 'Safe Rare-Earth Magnets', 'Brass Axles'],
    array['Premium dual-tone styling using contrasting American Walnut and Sugar Maple.', 'Embedded secure magnets to attach extra carriages easily.', 'Precision brass-axled rolling wheels for quiet, smooth motion.', 'Beautiful enough to sit on a collector shelf when play is done.'],
    '16cm x 8cm x 7.5cm',
    '2 years +',
    true,
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800',
    'published'
  ),
  (
    '5a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    '33333333-3333-3333-3333-333333333333',
    'puzzles-blocks',
    'Geometric Walnut Tangram Board',
    'geometric-tangram-board',
    'Exercise logical thought with 7 chunky geometric plates nested in a sturdy, heavy walnut frame. Excellent for learning shapes, negative space, and complex symmetry.',
    'CRAFT-GEOMETRIC_TANGRAM_BOARD',
    42.00,
    null,
    15,
    false,
    false,
    false,
    array['Black Walnut Frame', 'Beechwood Blocks', 'Organic Oil Finish'],
    array['Extra-thick 2cm geometric shapes for tactile satisfaction.', 'Sanded and bevelled manually for rounded corners and soft touch.', 'Packaged in an elegant gift box with design silhouette template card.'],
    '20cm x 20cm x 3.5cm',
    '4 years +',
    true,
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1608447714925-599deeb5a682?auto=format&fit=crop&q=80&w=800',
    'published'
  ),
  (
    '6a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    '33333333-3333-3333-3333-333333333333',
    'puzzles-blocks',
    'Balancing Acrobat Interlocking Blocks',
    'balancing-acrobat-blocks',
    'Stack them, turn them upside down, and lock their arms together. These acrobat figures challenge children to build tall human towers, testing gravity and balancing concepts.',
    'CRAFT-BALANCING_ACROBAT_BLOCKS',
    45.00,
    null,
    15,
    true,
    false,
    false,
    array['Linden Wood', 'Water-based eco paint'],
    array['Set of 12 distinct acrobats with subtle modern color blocks.', 'Fosters focus, hand-eye patience, and spatial prediction.', 'Lightweight but highly durable linden wood.'],
    'Each acrobat: 7.5cm x 7cm x 1.8cm',
    '3 years +',
    true,
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
    'published'
  ),
  (
    '7a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    '11111111-1111-1111-1111-111111111111',
    'infant-toddler',
    'Earthy Maple Teething Ring & Rattle',
    'earthy-teething-rattle',
    'Soothe painful baby teething gums with the soft wood antibacterial power of wild maple. Includes raw wooden rings that clink softly, providing immediate sensory comfort.',
    'CRAFT-EARTHY_TEETHING_RATTLE',
    24.00,
    null,
    15,
    false,
    true,
    false,
    array['Raw Organic Sugar Maple', 'Organic Cotton Ribbons'],
    array['Naturally antibacterial wood fibers with food-grade conditioning.', 'GOTS-certified unbleached organic cotton ribbon loop included.', 'Completely free from chemical lacquers, phthalates, or plastics.', 'Easy to clean with a damp, clean cloth and air-dried.'],
    '9cm diameter, 2.2cm thickness',
    '3 months +',
    true,
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=800',
    'published'
  ),
  (
    '8a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    '44444444-4444-4444-4444-444444444444',
    'vehicles-motion',
    'Curious Minds Wooden Marble Run',
    'kinetic-marble-run',
    'Construct magnificent paths with drop-through chimes, xylophone plates, and gravity-powered slides. This marble track system grows with your child, teaching STEM basics.',
    'CRAFT-KINETIC_MARBLE_RUN',
    78.00,
    89.00,
    0,
    false,
    false,
    false,
    array['Solid Beechwood', 'Non-toxic Plant Pigments', 'Brass chime pins'],
    array['24 modular beechwood blocks with complex interior channels.', 'Includes 6 premium safe solid wood marbles (oversized for throat safety).', 'Provides acoustic chimes and spiral spinner widgets.', 'Sturdy heavy blocks to ensure stable high constructions.'],
    'Box: 38cm x 28cm x 10cm',
    '4 years +',
    false,
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
    'published'
  )
on conflict (slug) do update set
  name = excluded.name,
  price = excluded.price,
  "originalPrice" = excluded."originalPrice",
  description = excluded.description,
  image = excluded.image,
  "hoverImage" = excluded."hoverImage",
  stock = excluded.stock,
  "inStock" = excluded."inStock";
