# Momenta: brief tecnico para CTO

## Resumen ejecutivo

Momenta esta construido como un prototipo navegable de validacion, no como una
plataforma productiva completa. El objetivo actual es probar si los usuarios
entienden la propuesta, encuentran una coleccion, personalizan una pieza gratis
y muestran intencion de compra por un producto premium.

La base tecnica esta desarrollada con Next.js App Router, React, TypeScript y
Tailwind CSS. La arquitectura elegida es un monolito modular: una sola aplicacion
con limites internos claros por dominio/feature. Esto permite validar rapido el
MVP sin cargar el proyecto con microservicios, pero deja preparados puertos para
integraciones futuras como Supabase, Cloudflare R2, Mercado Pago, Resend y un
motor real de renderizado.

Estado actual: la Stage 1 esta implementada tecnicamente y pendiente de
validacion manual/usuarios. Los comandos `pnpm.cmd lint`, `pnpm.cmd typecheck`
y `pnpm.cmd build` pasan correctamente.

## Producto validado en Stage 1

El alcance actual valida una unica coleccion piloto:

- Coleccion: Space Birthday.
- Categoria: Cumpleanos infantiles.
- Producto free: Invitacion esencial.
- Producto premium: Stickers pack.
- Precio premium validado: ARS 1.990.
- Formatos comunicados: PNG y PDF.
- Personalizacion free: nombre, edad, fecha, hora, lugar y mensaje opcional.
- Personalizacion premium: nombre y edad.

La experiencia cubre el flujo completo de validacion:

```txt
Home
-> Catalogo
-> Categoria Cumpleanos infantiles
-> Space Birthday
-> Personalizacion gratis
-> Revision de datos
-> Preview simulado
-> Descarga simulada
-> Upsell Premium
-> Detalle Stickers pack
-> Checkout simulado
-> Confirmacion de intencion de compra
```

## Stack tecnico

- Framework: Next.js 16.2.12 con App Router.
- UI: React 19.2.8.
- Lenguaje: TypeScript 5.9.3.
- Estilos: Tailwind CSS 4.3.3.
- Componentes base: componentes propios con `class-variance-authority`,
  `clsx`, `tailwind-merge` y `@radix-ui/react-slot`.
- Iconografia: `lucide-react`.
- Package manager: pnpm 10.27.0, forzado por script `preinstall`.
- Deploy esperado: Vercel.

Scripts principales:

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

En Windows PowerShell, el repo recomienda usar `pnpm.cmd`.

## Arquitectura

La decision arquitectonica formal esta documentada en
`docs/architecture/adr-0001-modular-monolith.md`.

El proyecto esta organizado asi:

```txt
app/              Rutas Next.js, paginas y route handlers
features/         Modulos de producto con UI, servicios, acciones y repositorios
domain/           Entidades de negocio independientes del framework
services/ports/   Interfaces para proveedores externos
infrastructure/   Adaptadores futuros para vendors
components/       Componentes compartidos de UI/layout
lib/              Utilidades comunes
types/            Tipos globales cuando realmente aplican
public/           Assets publicos
docs/             Producto, arquitectura, QA, analytics e investigacion
```

Principios aplicados:

- La logica de negocio no debe vivir dentro de componentes React.
- La UI no debe importar clientes directos de proveedores externos.
- Los proveedores se acceden por interfaces/puertos.
- El motor de render SVG/PNG/PDF debe mantenerse independiente de React.
- Las integraciones reales se agregan como adaptadores, no como dependencias
  mezcladas dentro del flujo visual.

## Como esta construido el prototipo

### Rutas principales

Las rutas implementadas son:

| Ruta | Rol |
| --- | --- |
| `/` | Home y propuesta de valor |
| `/catalog` | Catalogo minimo |
| `/categories/childrens-birthdays` | Categoria piloto |
| `/collections/space-birthday` | Detalle de coleccion y seleccion Free/Premium |
| `/collections/space-birthday/personalize` | Formulario guiado de personalizacion |
| `/projects/[projectId]/review` | Revision de datos ingresados |
| `/projects/[projectId]/preview` | Generacion y preview simulados |
| `/projects/[projectId]/download` | Descarga simulada |
| `/collections/space-birthday/stickers-pack` | Detalle premium |
| `/checkout/mock` | Checkout simulado |
| `/checkout/mock/success` | Confirmacion de intencion |
| `/api/health` | Health check |

El build actual clasifica varias paginas como estaticas y otras como dinamicas:

- Estaticas: home, catalogo, categoria, personalizacion, premium detail,
  success, robots.
- Dinamicas/server-rendered on demand: coleccion por slug, review, preview,
  download, checkout mock, health.

### Datos

La Stage 1 usa datos mock/locales. No hay base de datos real conectada.

Fuentes principales:

- `features/catalog/data/mock-categories.ts`
- `features/collections/data/mock-collections.ts`
- `features/products/data/mock-products.ts`
- `features/premium/data/mock-premium-offer.ts`

El repositorio de colecciones esta abstraido mediante:

- `features/collections/repositories/collection-repository.ts`
- `features/collections/repositories/static-collection-repository.ts`

Esto permite reemplazar el origen mock por Supabase/PostgreSQL en una etapa
posterior sin reescribir las pantallas.

### Personalizacion

El flujo de personalizacion es client-side y guarda el borrador en
`sessionStorage`.

Archivos clave:

- `features/personalization/components/personalization-flow.tsx`
- `features/personalization/config/personalization-steps.ts`
- `features/personalization/services/personalization-draft-storage.ts`
- `features/personalization/validators/personalization-validator.ts`

Campos validados:

- `name`: requerido, maximo 30 caracteres.
- `age`: requerido, entero entre 1 y 99.
- `date`: requerido, fecha valida y no anterior al dia actual.
- `time`: requerido, formato HH:mm.
- `place`: requerido, maximo 60 caracteres.
- `message`: opcional, maximo 120 caracteres.

La navegacion de formulario es por pasos:

```txt
Nombre
-> Edad
-> Fecha y hora
-> Lugar
-> Mensaje adicional
-> Revision
```

### Preview y descarga

El preview no genera archivos reales. Es una simulacion HTML/CSS para validar
confianza y comprension del resultado.

Archivos clave:

- `features/result/components/preview-simulation.tsx`
- `features/result/components/prototype-invitation-preview.tsx`
- `features/result/components/download-simulation.tsx`
- `features/result/services/prototype-result.ts`

El flujo simula:

- generacion en progreso;
- preview listo;
- errores controlados con query param de desarrollo;
- confirmacion de preview;
- descarga simulada;
- upsell premium posterior.

Importante: este preview esta documentado como `Prototype preview renderer`.
No debe tratarse como motor productivo de renderizado.

### Premium y checkout

El producto premium es un Stickers pack de una pagina A4 con 12 stickers
circulares de 5 cm.

Archivos clave:

- `features/premium/components/premium-detail.tsx`
- `features/premium/components/premium-stickers-preview.tsx`
- `features/premium/components/mock-checkout.tsx`
- `features/premium/components/mock-checkout-success.tsx`
- `features/premium/data/mock-premium-offer.ts`

El checkout no abre Mercado Pago ni procesa pagos. Solo mide intencion de compra
mediante un evento explicito:

```txt
purchase_intent_confirmed
```

Esto es importante porque el proyecto separa un click de curiosidad de una
intencion declarada de compra.

### Analytics de validacion

Los eventos de la Stage 1 se guardan solo en `sessionStorage` y se loguean en
consola. No se envian a Google Analytics, Clarity ni servicios externos.

Archivos clave:

- `features/analytics/services/track-validation-event.ts`
- `features/analytics/services/mock-event-store.ts`
- `features/analytics/components/debug-events-panel.tsx`

El visor de debug se habilita con:

```txt
?debugEvents=1
```

Reglas aplicadas:

- No registrar valores personales.
- No guardar nombre, edad, fecha, hora, lugar ni mensaje.
- Payloads limitados a ruta, coleccion, producto, paso, campo, precio y moneda.

Funnels principales:

```txt
Free:
collection_viewed
-> personalization_started
-> personalization_completed
-> preview_viewed
-> download_clicked
```

```txt
Premium:
premium_product_viewed
-> premium_cta_clicked
-> mock_checkout_started
-> purchase_intent_confirmed
```

## Preparacion para integraciones futuras

Aunque Stage 1 no conecta servicios externos, el repo ya define interfaces para
proveedores:

- `services/ports/payment-provider.ts`
- `services/ports/render-provider.ts`
- `services/ports/storage-provider.ts`
- `services/ports/mail-provider.ts`

Adaptadores previstos:

- Supabase: autenticacion y PostgreSQL.
- Cloudflare R2: almacenamiento de archivos y URLs firmadas.
- Mercado Pago: Checkout Pro.
- Resend: emails transaccionales.
- Render provider: generacion SVG/PNG/PDF.

Estado actual de esas integraciones: preparadas a nivel de arquitectura, no
implementadas en produccion.

## Seguridad, SEO y publicacion

El sitio esta configurado como preview de validacion:

- `app/layout.tsx` define `robots.index = false` y `follow = false`.
- `next.config.ts` agrega header global `X-Robots-Tag: noindex, nofollow`.
- El copy y docs remarcan que no se debe prometer pago real, descarga real ni
  archivos finales en Stage 1.

Esto reduce el riesgo de indexar una experiencia que todavia es de prueba.

## QA y estado tecnico

Verificacion ejecutada sobre el repo actual:

```txt
pnpm.cmd lint       Passed
pnpm.cmd typecheck  Passed
pnpm.cmd build      Passed
```

El build de Next.js compila correctamente y genera 11 paginas estaticas/dinamicas
segun corresponda.

Documentacion existente de QA:

- `docs/qa/stage-1-qa-run.md`
- `docs/qa/stage-1-checklist.md`
- `docs/qa/stage-1-bug-log.md`
- `docs/qa/stage-1-vercel-preview.md`

Limitaciones pendientes:

- QA visual manual en multiples viewports.
- Revision en Chrome, Edge/Chromium, Firefox y Safari mobile cuando este
  disponible.
- Pasada keyboard-only.
- Spot check con screen reader.
- Testing con usuarios externos.
- Completar reporte de validacion con resultados reales.

## Lo que no esta construido todavia

Por decision de alcance, Stage 1 no incluye:

- Supabase.
- Base de datos real.
- Autenticacion real.
- Cloudflare R2.
- Motor SVG real.
- Sharp.
- pdf-lib.
- PNG/PDF personalizados reales.
- Mercado Pago real.
- Cobros reales.
- Resend.
- Emails reales.
- URLs privadas.
- Descargas protegidas.
- Admin panel.

Esto no es una falla: es una decision explicita para validar producto antes de
invertir en infraestructura productiva.

## Como lo construimos

El proyecto se construyo por etapas:

1. Se definio el alcance piloto y se congelo Stage 0.
2. Se eligio monolito modular para evitar complejidad de microservicios en MVP.
3. Se creo una base Next.js/TypeScript con estructura por features.
4. Se modelaron entidades de dominio y productos imprimibles.
5. Se agregaron datos mock para coleccion, productos, categoria y oferta premium.
6. Se construyo el flujo navegable mobile-first.
7. Se implemento personalizacion guiada con validaciones visibles.
8. Se agrego revision de datos y loop de edicion.
9. Se simulo generacion, preview y descarga.
10. Se agrego detalle premium y checkout simulado.
11. Se instrumentaron eventos de validacion en `sessionStorage`.
12. Se documentaron alcance, decisiones, QA, user testing y eventos.

La logica fue: primero validar experiencia y demanda; despues conectar backend,
pagos, almacenamiento, render real y automatizaciones.

## Recomendacion tecnica para la siguiente etapa

Antes de construir Stage 2/Stage 3, conviene cerrar Stage 1 con evidencia:

1. Ejecutar 5 a 8 pruebas con usuarios externos, priorizando mobile.
2. Completar `docs/product/stage-1-validation-report.md`.
3. Clasificar fricciones por severidad: comprension, navegacion, confianza,
   valor premium y disposicion a pagar.
4. Confirmar si ARS 1.990 tiene traccion.
5. Decidir si el siguiente incremento sera:
   - render real de archivos;
   - persistencia/proyectos;
   - pago real;
   - ampliacion de colecciones;
   - admin interno.

Si Stage 1 valida, el camino tecnico natural es:

```txt
Supabase schema
-> persistencia de proyectos
-> motor de render independiente
-> storage R2 con URLs firmadas
-> Mercado Pago
-> emails Resend
-> downloads protegidos
-> analytics reales
```

## Lectura CTO

Momenta tiene una base tecnica sana para MVP:

- Stack moderno y mantenible.
- Arquitectura simple pero con limites claros.
- Separacion razonable entre UI, dominio, servicios y proveedores.
- Scope controlado para evitar sobreconstruccion.
- Buen soporte documental para producto, QA y analytics.
- Checks tecnicos actuales en verde.

La aplicacion aun no es una plataforma productiva de generacion y venta de
printables. Es un prototipo de validacion bien estructurado, listo para pruebas
con usuarios y preparado para evolucionar hacia backend, pagos y render real si
la validacion confirma demanda.
