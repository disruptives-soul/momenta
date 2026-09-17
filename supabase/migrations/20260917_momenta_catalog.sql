create table if not exists public.momenta_catalog_collections (
  slug text primary key,
  name text not null,
  description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.momenta_catalog_products (
  id text primary key,
  collection_slug text not null references public.momenta_catalog_collections(slug) on delete cascade,
  slug text not null,
  name text not null,
  piece_type text not null,
  price numeric(12, 2) not null default 0,
  visual_format text,
  width_mm numeric(12, 2),
  height_mm numeric(12, 2),
  print_profile_id text,
  template_id text not null,
  storage_provider text,
  storage_keys jsonb not null default '{}'::jsonb,
  product_payload jsonb not null default '{}'::jsonb,
  print_profile_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (collection_slug, slug)
);

create index if not exists momenta_catalog_products_collection_slug_idx
  on public.momenta_catalog_products(collection_slug);

create index if not exists momenta_catalog_products_template_id_idx
  on public.momenta_catalog_products(template_id);

create table if not exists public.momenta_catalog_templates (
  id text primary key,
  collection_slug text not null references public.momenta_catalog_collections(slug) on delete cascade,
  product_slug text not null,
  template_payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists momenta_catalog_templates_collection_product_idx
  on public.momenta_catalog_templates(collection_slug, product_slug);
