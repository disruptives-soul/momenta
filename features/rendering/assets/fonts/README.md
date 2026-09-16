# Font Assets

Place production font files here before closing Print Output QA.

Accepted formats:

- `.ttf`
- `.otf`
- `.woff`
- `.woff2`

Rules:

- Use the exact files approved for the collection.
- Reference them from template `fontAsset` entries.
- Run `pnpm render:print-qa:strict` after adding them.
- Do not calibrate Konva/PDF typography with fallback fonts.
