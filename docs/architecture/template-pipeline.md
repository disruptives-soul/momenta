# Template pipeline

## Principle

Design does not maintain `template.json` manually.

Fabiana/design should deliver only:

- `master.jpg`.
- Physical product size, for example `127 x 178 mm` or `297 x 420 mm`.
- Editable field list.
- Typography decisions.

Momenta owns the technical template configuration.

## Current pilot

For the current spike, Momenta reuses the existing template configuration and
adapts field coordinates to the final master image.

The renderer reads `widthPx` and `heightPx` from `master.jpg` with
`sharp().metadata()` on the server. The public/browser preview can keep cached
canvas dimensions until the internal calibration tool exists.

## Asset flow

```txt
master.jpg
  -> Sharp
  -> preview.webp
  -> browser preview

master.jpg
  -> pdf-lib + fonts + personalization data
  -> PDF
```

The browser must not load the high-resolution master.

## Storage rule

During the spike, masters live in server-only local assets:

```txt
features/rendering/assets/{collection}/{product}/master.jpg
```

Public preview assets live under:

```txt
public/momenta/{collection}/{product}/preview.webp
```

Later:

```txt
R2
  master.jpg
  preview.webp

Supabase
  metadata
  paths
  versions
```

## Calibration mode target

Future internal tool:

1. Upload or select `master.jpg`.
2. Read pixel dimensions automatically.
3. Select physical size from product metadata.
4. Place editable fields over the master.
5. Drag, resize and align text boxes.
6. Select font, min/max size, max lines, line height and autofit fallback.
7. Save/export template config automatically.

This removes manual JSON editing from the workflow.
