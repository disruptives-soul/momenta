# Supabase adapter

Supabase is reserved for durable application state:

- users;
- orders;
- purchased projects;
- personalized `TextElement[]` scenes;
- post-purchase editing/reactivation.

For the current MVP slice, catalog metadata remains in the local registry and
large assets live in Cloudflare R2. Application code should keep using repository
interfaces instead of importing Supabase directly from UI components.

## Project

Dashboard project:

```txt
https://supabase.com/dashboard/project/fvczyxwgrdxvhhjjyxie
```

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not commit service role keys.

## Current MVP tables

```sql
create table if not exists momenta_orders (
  id text primary key,
  status text not null default 'paid_demo',
  total_cents integer not null default 0,
  currency text not null default 'ARS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists momenta_order_items (
  id text primary key,
  order_id text not null references momenta_orders(id) on delete cascade,
  product_id text not null,
  template_id text not null,
  product_snapshot jsonb not null,
  template_snapshot jsonb not null,
  scene jsonb not null default '[]'::jsonb,
  editable_until timestamptz,
  reactivation_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists momenta_generated_files (
  id text primary key,
  order_id text not null references momenta_orders(id) on delete cascade,
  order_item_id text references momenta_order_items(id) on delete cascade,
  kind text not null check (kind in ('pdf', 'zip')),
  storage_provider text not null default 'r2',
  storage_key text not null,
  content_type text not null,
  created_at timestamptz not null default now()
);
```

`/api/render` stores generated PDFs/ZIPs in R2 under
`generated/orders/{orderId}/...` and persists the matching metadata here.
`/account/designs` reads `momenta_order_items` as purchased projects, including
the latest saved `TextElement[]` scene.

If the table was created before post-purchase persistence, run:

```sql
alter table momenta_order_items
  add column if not exists editable_until timestamptz,
  add column if not exists reactivation_count integer not null default 0;
```
