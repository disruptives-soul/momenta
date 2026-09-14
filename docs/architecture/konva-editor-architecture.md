# MOMENTA + Konva Editor Architecture

## Decision

Konva is only the interactive browser editor. It is not the source of truth and it is not the production renderer.

The source of truth remains:

- `PrintableTemplate`
- `PersonalizationData`

The final renderer remains server-side:

- `master.jpg`
- `PersonalizationData`
- `pdf-lib` + `fontkit`
- PDF

## Runtime Split

Browser editor:

- React + Konva
- Uses `preview.webp`
- Shows locked background
- Shows locked editable text fields
- Allows inline text editing through a temporary HTML textarea
- Syncs every change back into `PersonalizationData`

Final render:

- API `/api/render`
- Uses the high-resolution `master.jpg`
- Embeds the JPG directly into the PDF
- Draws text server-side
- Does not use canvas screenshots

## Current Implementation

Editor:

- `features/personalization/components/personalization-editor.tsx`
- `features/template-editor/components/personalization-canvas.tsx`
- `features/template-editor/components/editable-text.tsx`
- `features/template-editor/hooks/use-template-scale.ts`
- `features/template-editor/services/template-layout.ts`

Rendering:

- `features/rendering/services/pdf-template-renderer.ts`
- `features/rendering/services/local-render-provider.ts`
- `features/rendering/templates/*`
- `app/api/render/route.ts`

Domain:

- `domain/entities/printable-template.ts`

## Rules

- The browser never loads the high-resolution `master.jpg` for editing.
- Konva text is not draggable in v1.
- Konva text is not resizable, rotatable, deletable, or font-editable in v1.
- Konva mirrors `PersonalizationData`; it does not own it.
- PDF generation never comes from a Konva screenshot.

## Spike Scope

Implemented now:

- `preview.webp` background in Konva
- Locked background
- Text layers from the shared template config
- Inline textarea editing
- Responsive coordinate scaling from master pixels to screen pixels
- State sync with the existing sessionStorage draft
- `/api/render` continues to produce PDF/PNG/SVG from the same data

Deferred:

- Calibration mode
- Dragging template fields internally
- Undo/redo
- Layers panel
- Font picker
- Color picker
- Image uploads
- R2/Supabase template storage
