# Zazzle-Like Editor Shell

## Decision

The render pipeline does not change.

MOMENTA keeps:

- `PrintableTemplate` as template definition
- `PersonalizationData` as source of truth
- Konva as browser-only interaction layer
- `pdf-lib` + `fontkit` as final PDF renderer

This increment adds the editor shell around the existing Konva canvas.

## Implemented Shell

- `EditorTopbar`
  - save status
  - undo
  - redo
  - preview mode
  - continue

- `EditorRail`
  - edit active
  - add text disabled
  - layers disabled
  - guides disabled

- `InspectorPanel`
  - text fields synchronized with the canvas
  - selecting a field focuses the input
  - focusing an input selects the canvas text

- `CanvasViewport`
  - centered canvas
  - zoom controls
  - preview mode without editing controls
  - Konva stage still uses `preview.webp`

- `SurfaceNavigator`
  - switches between configured templates/surfaces
  - keeps existing personalization data where fields overlap

## Interaction Rules

Allowed in v1:

- select text
- edit text content
- inline edit through textarea
- edit through inspector
- zoom
- undo/redo over `PersonalizationData`
- switch surfaces/templates

Blocked in v1:

- move artwork
- move text freely
- resize text manually
- rotate text
- delete template fields
- upload files
- change background
- free font/color picker

## Field Permissions

Template fields now support optional controls:

```ts
controls: {
  content: true,
  move: false,
  resize: false,
  font: false,
  color: false,
  rotate: false,
  delete: false,
}
```

Current templates default to content-only editing when `controls` is absent.

## Next

- Add real `TemplateSurface` when invitation front/back or party-pack pieces need to be modeled under one product.
- Add internal calibration mode before exposing any move/resize controls.
- Add layers only if production templates require a layer inspector.
