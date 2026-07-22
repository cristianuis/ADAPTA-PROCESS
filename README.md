# ADAPTA OS

Plataforma operativa de un consultor en estructuración organizacional (Modelo ADAPTA). Las 6 fases del blueprint están construidas: núcleo (clientes/proyectos/triage), diagnóstico (PEMM + entrevistas con IA + hallazgos), entregables (DOCX), arquitectura de procesos (SIPOC/RACI/Mermaid/indicadores), medición y adopción, y biblioteca de conocimiento. Ver `CLAUDE.md` para reglas de construcción y `../the-architect-main/output/adapta-os-blueprint.md` para la especificación original.

## Estado de esta build

- ✅ `npm run build` — compila sin errores, 37 rutas
- ✅ `npm run lint` — sin errores (1 warning benigno de React Compiler sobre `watch()` de react-hook-form)
- ✅ `npm test` — 25/25 tests pasando (clasificación de arquetipo, nivel PEMM, matriz RACI, tarifa/cotización, adopción)
- ✅ **Fases 1-4 verificadas end-to-end contra un Supabase real** (proyecto del usuario): signup → perfil → cliente → proyecto → triage → PEMM (consultor + encuesta pública por token) → entrevistas → hallazgos (manual + validación IA) → procesos/SIPOC/actividades/Mermaid/RACI/indicadores → generación de los 3 primeros DOCX (Informe de Diagnóstico, Propuesta Comercial, Manual de Procesos).
- ⚠️ **Fases 5-6 (mediciones/tablero/adopción, biblioteca/benchmarks) construidas y con build/lint/test verdes, pero sus migraciones (`0005`, `0006`) no se alcanzaron a correr contra Supabase real** — hubo un corte de conectividad de red hacia supabase.com durante la sesión de build. Corre esas dos migraciones (ver abajo) y prueba esos módulos antes de darlos por completamente verificados.
- La llamada real a la API de Anthropic (análisis de entrevistas, resúmenes, justificaciones, hipótesis de causa raíz) no se probó en vivo — requiere que completes `ANTHROPIC_API_KEY` en `.env.local`. El manejo de error sin key sí está verificado (falla con mensaje claro, no con excepción sin capturar).

## Puesta en marcha

1. **Crea un proyecto en [supabase.com](https://supabase.com)** (tú, no yo — requiere tu cuenta).
2. Copia `.env.local.example` a `.env.local` y completa:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ANTHROPIC_API_KEY=
   ```
   Las 3 primeras están en Supabase → Settings → API Keys (formato nuevo `sb_publishable_...` / `sb_secret_...`). La de Anthropic en console.anthropic.com — solo se usa desde Fase 2 en adelante.
3. Corre **las 6 migraciones en orden** en el SQL Editor de tu proyecto Supabase:
   - `0001_fase1_core.sql` — consultores, clientes, proyectos, triage_respuestas
   - `0002_fase2_diagnostico.sql` — pemm_evaluaciones, entrevistas, hallazgos
   - `0003_fase3_entregables.sql` — entregables
   - `0004_fase4_arquitectura.sql` — procesos, sipoc, actividades, indicadores
   - `0005_fase5_medicion_adopcion.sql` — mediciones, auditorias_adopcion
   - `0006_fase6_biblioteca.sql` — plantillas_proceso, benchmarks
4. Instala dependencias y levanta el servidor:
   ```bash
   npm install
   npm run dev
   ```
5. Abre `http://localhost:3000` → `/login` → crea una cuenta → completa tu perfil en `/perfil` → registra un cliente → crea un proyecto → recorre el flujo: triage → PEMM → entrevistas → hallazgos → procesos → tablero → adopción → entregables → biblioteca.

### Nota sobre `lib/supabase/types.ts`

Los tipos de la base de datos están escritos a mano (reflejan exactamente las 6 migraciones SQL) porque no tengo acceso permanente a tu proyecto Supabase para generarlos con la CLI. Una vez que tengas tu proyecto conectado, puedes regenerarlos con:

```bash
npx supabase gen types typescript --project-id <tu-project-id> > lib/supabase/types.ts
```

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — linter
- `npm test` — tests unitarios (Vitest)

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI) + Supabase (Postgres + Auth) + Zod v3 + react-hook-form + Recharts + Mermaid + docx + Anthropic SDK

## Decisiones que se apartan del blueprint original (y por qué)

- **npm en vez de pnpm**: esta máquina no tiene pnpm/corepack instalado. Funcionalmente equivalente.
- **Next.js 16 en vez de 15**: `create-next-app@latest` instaló la versión estable más reciente al momento de construir. App Router funciona igual.
- **Zod v3.24 en vez de v4**: la v4 más reciente tiene un problema de compatibilidad de tipos conocido con `@hookform/resolvers` en campos `z.coerce.number().optional().nullable()` combinados con valores por defecto. v3 es el combo probado en el ecosistema.
- **`@hookform/resolvers` v3.9 en vez de v5**: v5 solo soporta el paquete `zod/v4/core`, incompatible con Zod v3.
- **Botones `asChild` → `render`**: la versión de shadcn/ui instalada usa Base UI en vez de Radix. Base UI no tiene el patrón `asChild` de Radix — usa `render={<Link .../>}` para composición polimórfica.
- **Sin componente `Form` de shadcn**: esa versión del registro no lo expone tal como está documentado en el blueprint; los formularios usan `react-hook-form` o `useState` + `Input`/`Label`/`Select` de shadcn directamente, sin el wrapper `FormField`.
- **Modelo de IA: Haiku por defecto, no Sonnet**: todas las llamadas a Anthropic (`analizar-entrevista`, `resumen-ejecutivo`, `justificacion-metodologica`, `analisis-desviaciones`) usan `claude-haiku-4-5-20251001` en vez del Sonnet que sugería el blueprint original — decisión explícita del usuario de priorizar costo. Si la calidad no alcanza en un caso real, subir a `claude-sonnet-5` es un cambio de una línea por route handler.
- **Entregables no se suben a Supabase Storage**: el DOCX se genera bajo demanda en el route handler y se descarga directo al navegador; la tabla `entregables` solo registra el historial (nombre, tipo, versión), no el binario. Más simple que wirear Storage, y suficiente para el caso de uso.
- **Biblioteca (plantillas/benchmarks) cuelga de `consultor_id`, no de `proyecto_id`**: por diseño, para que sea reutilizable entre clientes — ver la nota de privacidad en `0006_fase6_biblioteca.sql`.

## Bugs reales encontrados y corregidos durante la verificación en vivo

1. **`components/ui/button.tsx`** — Base UI's Button asumía `nativeButton: true` por defecto; con `render={<Link/>}` rompía semántica nativa. Fix centralizado: `nativeButton={!props.render}`.
2. **`TriageForm.tsx`** — RadioGroup de Base UI tiraba warning de uncontrolled→controlled por `field.value` arrancando `undefined`. Fix: default a `""`.
3. **`ProyectoForm.tsx`** — el Select de cliente mostraba el UUID crudo en vez del nombre cuando venía preseleccionado por query param. Fix: `<SelectValue>` con children como función.
4. **IDs duplicados** — `ActividadForm` e `IndicadorForm` usaban ambos `id="nombre"` en diálogos que coexisten en la misma página. Renombrado a `actividad-nombre`.

## Qué falta antes de usarlo con un cliente real

1. Correr las migraciones `0005` y `0006` contra tu Supabase (no se alcanzaron a probar por un corte de red durante el build — ver arriba).
2. Completar `ANTHROPIC_API_KEY` y probar en vivo al menos una vez: análisis de entrevista, resumen ejecutivo, justificación metodológica, hipótesis de causa raíz.
3. Probar el flujo completo tú mismo de punta a punta en un proyecto real, con las 6 fases.
4. Revisar los textos generados por IA en cada punto — la IA propone, tú decides, y eso incluye los textos de ejemplo que dejé (descriptores de arquetipo y PEMM son borradores razonables, no verdad absoluta del método).
5. Configurar logo del consultor: el perfil tiene `logo_url` en el esquema pero no hay UI de carga de archivo todavía — los documentos generados usan solo texto/colores de marca, sin logo embebido.

**Recomendación fuerte que se mantiene**: usa la Fase 1 con un cliente real antes de apoyarte en las fases más avanzadas — el propio blueprint lo advierte, y ahora que todo está construido es más tentador saltarse ese paso.
