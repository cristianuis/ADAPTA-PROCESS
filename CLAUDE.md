# ADAPTA OS

Plataforma operativa de un consultor en estructuración organizacional: diagnostica empresas cliente (triage + PEMM), asiste el levantamiento con IA (entrevistas), genera entregables profesionales (DOCX), diseña arquitectura de procesos (SIPOC/RACI/Mermaid), mide adopción y capitaliza conocimiento entre proyectos (biblioteca de plantillas/benchmarks). Las 6 fases del blueprint están construidas — ver `../the-architect-main/output/adapta-os-blueprint.md` para el diseño original de cada módulo.

## Commands

- `npm run dev` — Levantar servidor de desarrollo
- `npm run build` — Build de producción
- `npm run lint` — Linter
- `npm test` — Tests unitarios (Vitest, 25 tests)
- `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts` — Regenerar tipos tras cambiar el esquema (una vez tengas la CLI conectada a tu proyecto)

## Tech Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI) + Supabase (Postgres + Auth) + Zod v3 + react-hook-form + Recharts + Mermaid + docx + Anthropic SDK (Haiku por defecto)

## Architecture

### Directory Structure
- `app/(auth)/` — Login, sin sidebar
- `app/(dashboard)/` — Todo lo que requiere sesión: perfil, clientes, proyectos, biblioteca
- `app/(dashboard)/proyectos/[proyectoId]/{pemm,entrevistas,hallazgos,procesos,tablero,adopcion,entregables}` — un directorio por módulo, todos cuelgan del proyecto
- `app/encuesta/pemm/[token]/` — única ruta pública sin sesión (fuera de `(auth)`/`(dashboard)`), protegida por token UUID + RLS específica para rol `anon`
- `app/api/ia/*` — route handlers que llaman a Anthropic (nunca desde el cliente)
- `app/api/documentos/*` — route handlers que generan y devuelven DOCX (`docx` + `Packer.toBuffer`)
- `components/ui/` — shadcn/ui, no editar a mano
- `components/{dominio}/` — Componentes organizados por entidad
- `lib/supabase/` — Clientes de Supabase (`client.ts`, `server.ts`, `middleware.ts`) + `types.ts` (tipos de la DB escritos a mano — no hay CLI conectada, ver README)
- `lib/actions/` — Server Actions, una por entidad
- `lib/validations/` — Schemas Zod, uno por entidad
- `lib/documentos/` — Generadores DOCX puros (reciben datos, devuelven un `Document` de `docx`)
- `lib/{triage,pemm,procesos,tarifa,adopcion}/` — Lógica de negocio pura y testeable, sin dependencia de DB, cada una con `__tests__/`
- `supabase/migrations/` — SQL versionado, 0001 a 0006 (una por fase)

### Data Flow
Server Components leen directo de Supabase con el cliente de servidor. Las mutaciones van por Server Actions (o route handlers cuando hay IA o generación de archivos de por medio). RLS en Postgres es la única capa de autorización — no reimplementar chequeos de pertenencia en el código de la aplicación. `requireConsultor()` en `lib/actions/consultores.ts` es el guard que usan todas las páginas que dependen de un perfil de consultor existente.

Las tablas de Fase 6 (`plantillas_proceso`, `benchmarks`) cuelgan de `consultor_id` directamente, no de `proyecto_id` — son reutilizables entre clientes por diseño.

### Key Patterns
- Server Components por defecto. `"use client"` solo en formularios y elementos con estado local.
- Toda mutación pasa por Zod antes de tocar Supabase.
- Los colores de marca del consultor se inyectan como CSS variables inline en `app/(dashboard)/layout.tsx` — nunca hardcodear un hex en un componente de dominio.
- La lógica de negocio (clasificación de arquetipo, nivel PEMM, matriz RACI, tarifa/cotización, % adopción) vive aislada en funciones puras testeables, nunca mezclada con el Server Action que las invoca.
- Botones que navegan usan el patrón Base UI: `<Button render={<Link href="...">texto</Link>} />`, no `asChild` (eso es Radix).
- IDs de campos de formulario deben ser únicos por página, no solo por componente — dos Dialogs distintos en la misma página no pueden usar el mismo `id="nombre"` (bug real ya corregido una vez, ver README).
- Todo route handler de IA verifica `ANTHROPIC_API_KEY` primero y devuelve un error JSON claro si falta — nunca deja que el SDK lance una excepción sin capturar.

## Code Organization Rules

1. **Un componente por archivo.** Máx 300 líneas — si crece, extraer subcomponentes.
2. **Path alias:** usar `@/` para imports desde la raíz.
3. **Sin barrel exports.** Importar directo del archivo fuente.
4. **Server Components por defecto.** `"use client"` únicamente cuando hay interactividad real.
5. **Server Actions junto a Zod schemas.** Toda action valida su input con el schema correspondiente antes de tocar la base de datos.

## Design System

### Colors
- Primary `#1A4731` — botones primarios, sidebar
- Secondary `#C8D830` — acentos, badges de arquetipo
- Background `#F7F8F5`, Surface `#FFFFFF`, Text `#1C1C1A`, Muted `#6B7268`
- Destructive `#B3261E`, Success `#2E7D32`
- Definidos como CSS variables en `app/globals.css` (`:root` y `.dark`); los de marca se sobreescriben por consultor en runtime.

### Typography
- Headings/Body: Inter (600-700 / 400)
- Datos tabulares: JetBrains Mono

### Style
- Border radius 8px (12px en cards), sombra sutil, densidad media, sin animaciones decorativas.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública/publishable (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio/secret — solo server-side, nunca en el cliente |
| `ANTHROPIC_API_KEY` | Requerida para todo lo que llama IA (Fase 2 en adelante): análisis de entrevistas, resúmenes, justificaciones, hipótesis de causa raíz |

## Reglas No Negociables

1. **La IA propone, el consultor decide.** Ningún hallazgo, resumen o texto generado por Claude llega a un entregable sin paso de validación humana explícito en la UI (ver `hallazgos_ia` vs `hallazgos_validados`, y los botones "Generar borrador con IA" que siempre preceden a un textarea editable, nunca a una exportación directa).
2. **RLS activo en toda tabla nueva**, filtrando por `consultor_id` (directo o a través de `proyecto_id`/`proceso_id`) derivado de `auth.uid()`. Ninguna tabla se crea sin su policy. Excepción explícita y documentada: `pemm_evaluaciones` permite lectura/escritura al rol `anon` solo en filas que ya tienen `token` asignado (encuesta pública).
3. **`SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY` nunca se usan en código que corre en el cliente.** Toda llamada a Anthropic vive en un route handler bajo `app/api/ia/`.
4. **Todo formulario valida con Zod antes de llegar a Supabase.** No confiar solo en `required` de HTML o tipos de TS.
5. **La lógica de negocio pura (clasificación, niveles, matrices, tarifas) tiene tests** en su `__tests__/` correspondiente — cualquier cambio a las reglas debe actualizar los tests, no solo el código.
6. **Un indicador sin `fuente_datos` ni `mecanismo_captura` no se puede guardar**, y **máximo 3 indicadores por proceso** — ambas son reglas del método (Hammer/ADAPTA), no límites técnicos arbitrarios; no relajarlas por conveniencia de UX.
7. **El nivel de una evaluación PEMM es el mínimo de sus dimensiones, nunca el promedio** (criterio de Hammer) — ver `lib/pemm/calcular-nivel.ts`.
8. **Benchmarks y plantillas nunca contienen datos identificables de un cliente específico** — son cifras agregadas o estructura reutilizable, ver la nota de privacidad en `0006_fase6_biblioteca.sql`.
