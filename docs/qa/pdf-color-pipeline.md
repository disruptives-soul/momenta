# PDF color pipeline QA

The production PDF renderer must preserve the master artwork raster stream:

```text
master.jpg original bytes
-> pdfDoc.embedJpg()
-> drawImage()
-> drawText()
```

Do not pass the master artwork through Sharp, PNG, JPEG re-encoding, or
`embedPng()` before building the production PDF.

## Local checks

Guardrail for the renderer implementation:

```bash
pnpm.cmd render:color-audit
```

Fixture for visual A/B comparison:

```bash
pnpm.cmd render:color-fixture space-birthday-invitation-v1
```

This creates:

```text
tmp/color-pipeline/space-birthday-invitation-v1/A-original-jpg-embedJpg.pdf
tmp/color-pipeline/space-birthday-invitation-v1/B-sharp-png-embedPng.pdf
```

ICC / PDF ColorSpace inspection:

```bash
pnpm.cmd render:color-profile space-birthday-invitation-v1
```

This writes:

```text
tmp/color-pipeline/space-birthday-invitation-v1/color-profile-report.json
```

## Current A3 finding

For `space-birthday-invitation-v1`, the master currently reports:

- JPEG, 3509 x 4961 px
- 300 PPI
- `space: srgb`
- `hasProfile: true`
- ICC payload present

The inspectable PDF A currently reports:

- `/ColorSpace /DeviceRGB`
- no `/ICCBased`

This means the renderer is no longer doing a Sharp/PNG conversion before PDF,
but color QA is still not finished. If the direct JPG PDF shifts color compared
with the original JPG, the next area to investigate is ICC handling across
Illustrator export, JPEG profile, pdf-lib image embedding, and the PDF viewer.

## Acceptance guidance

Compare `master.jpg` and PDF A in a color-managed application, ideally Acrobat.
Do not add new conversions until that comparison isolates where the color shift
is introduced.

## Master resolution standards

MOMENTA does not use a single 300 PPI master standard for every product family.
Design exports the master at the final resolution needed by the product:

```text
Invitation A3  -> 300 PPI
Stickers A3    -> 300 PPI
Banner 2 x 1 m -> 150 PPI
Backing 1 x 1 m -> 150 PPI
```

The renderer must not resample a 300 PPI master down to 150 PPI. Fabiana exports
the correct master resolution, MOMENTA validates the effective PPI, and the PDF
embeds the original JPG bytes directly.

Approximate fixture dimensions:

```text
A3 at 300 PPI          -> 3508 x 4961 px
Banner 2 x 1 m at 150 -> 11811 x 5906 px
Backing 1 x 1 m at 150 -> 5906 x 5906 px
```
