# Cloudflare R2 adapter

MOMENTA uses R2 for large and generated files while the storefront/catalog can
come from the local registry during the MVP or from a CMS later.

## Bucket

Current MVP bucket:

```txt
momenta-assets
```

Recommended prefixes:

```txt
collections/
  space-birthday/
    _collection.json
    invitation-a3/
      v1/
        _product.json
        _assets-required.json
        master.jpg
        preview.webp
        template.json
    stickers-a3/
      v1/
        master.jpg
        preview.webp
        template.json

fonts/

generated/
  orders/
```

R2 does not create real folders. Folders appear when objects with those prefixes
exist.

## Environment

```env
R2_ACCOUNT_ID=0b36b3ff49cb18a8f3fe9505900986fd
R2_BUCKET_NAME=momenta-assets
R2_ENDPOINT=https://0b36b3ff49cb18a8f3fe9505900986fd.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
MOMENTA_ADMIN_SECRET=
```

Keep `R2_SECRET_ACCESS_KEY` and `MOMENTA_ADMIN_SECRET` out of chat and commit
history.

## Provision local catalog into R2

Without WordPress, the local product registry is the temporary headless source.
Provision it into R2 with:

```bash
curl -X POST \
  -H "Authorization: Bearer $MOMENTA_ADMIN_SECRET" \
  https://momenta-gamma.vercel.app/api/admin/catalog/provision
```

For a read-only preview of the objects that will be created:

```bash
curl https://momenta-gamma.vercel.app/api/admin/catalog/provision \
  -H "Authorization: Bearer $MOMENTA_ADMIN_SECRET"
```

In local development, if `MOMENTA_ADMIN_SECRET` and R2 credentials are missing,
the provider falls back to `tmp/storage` so the flow can be tested without
Cloudflare credentials.

## Future CMS handoff

When WordPress/WooCommerce is introduced, it should not write directly to R2 in
the first iteration. It should call a MOMENTA webhook. Next.js remains the
orchestrator that validates product data, creates the expected R2 prefixes,
generates or stores `template.json`, and writes the final R2 keys back to the
CMS.
