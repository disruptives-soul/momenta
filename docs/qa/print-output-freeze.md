# Print Output Freeze

Estado aprobado por CTO:

- Arquitectura y UX principal congeladas.
- No agregar nuevas capacidades al editor hasta cerrar QA de Print Output.
- Prioridad exclusiva:
  1. Fuentes reales.
  2. Paridad Konva/PDF.
  3. Color.
  4. Impresion fisica A3.
  5. Naming.
  6. ZIP.

Regla operativa:

- Toda propiedad editable sin paridad fiable en PDF queda deshabilitada temporalmente.
- El editor mantiene contenido, posicion, tamano de fuente, ancho de caja, color controlado, alineacion, duplicar/eliminar/reordenar.
- Tipografia/peso quedan congelados hasta cargar fuentes reales y validar preview vs PDF.
- Calibration Mode queda fuera del alcance actual y empieza despues de aprobar Print Output.
- R2 queda despues de Calibration Mode.

Notas tecnicas:

- El PDF usa `master.jpg` original via `embedJpg()` sin Sharp ni PNG intermedio.
- Sharp queda solo para derivados de preview.
- El renderer PDF soporta tracking en texto recto para evitar divergencias con templates que ya lo traen definido.
- `pnpm render:print-qa` valida PPI, ruta de color, naming, ZIP y tamano fisico de la pagina 1.
- `pnpm render:print-qa:strict` debe usarse para cerrar produccion, porque falla si no existen fuentes reales.

Estado ultimo QA automatizado:

- Fuentes reales: bloqueado, no hay `.ttf/.otf/.woff/.woff2` en `features/rendering/assets`.
- PPI: OK para invitacion A3, stickers A3, banner 2x1 m y backing 1x1 m.
- Color pipeline: OK a nivel codigo, el PDF embebe JPG original con `embedJpg()`.
- PDF fisico: OK, pagina 1 respeta tamano fisico por Product y pagina 2 contiene instrucciones.
- Naming: OK para `space-birthday-invitation-a3.pdf`, `space-birthday-stickers-a3.pdf`, `space-birthday-banner-2x1m.pdf`, `space-birthday-backing-1x1m.pdf`.
- ZIP: OK, `momenta-space-birthday.zip` contiene PDFs unicos.
- Impresion A3: pendiente manual, imprimir al 100% y medir 297 x 420 mm.
