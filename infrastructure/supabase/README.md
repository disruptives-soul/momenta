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

## Suggested first tables

```sql
create table purchased_projects (
  id text primary key,
  user_id uuid,
  order_id text,
  product_snapshot jsonb not null,
  template_snapshot jsonb not null,
  scene jsonb not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table generated_files (
  id text primary key,
  purchased_project_id text references purchased_projects(id),
  format text not null,
  storage_key text not null,
  content_type text not null,
  created_at timestamptz not null default now()
);
```

This comes after Print Output QA and after R2 is connected. Until then, the local
repository keeps the editor and checkout demo moving without blocking on auth.
