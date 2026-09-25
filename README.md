# NEXUS IA PROCESS

Herramienta de consultoría y mejora de procesos: clientes/proyectos, recorrido guiado, diagnóstico, procesos e indicadores, entregables e iniciativas/acciones/mediciones. La IA es apoyo opcional, no sustituto de validación profesional.

## Estado y dirección

Existe una base funcional para consultoría; **todavía no está acreditada para operación empresarial multiusuario**. INNO IA es la empresa inicial confirmada para definir y validar esa evolución.

Referencia vigente: [Arquitectura y MVP NEXUS](docs/NEXUS_ARQUITECTURA_MVP.md), con el [plan INNO IA](docs/LANCELOT_INNO_IA_PLAN_MAESTRO_2026-09.md) como antecedente.

Verificación inicial del 2026-09-25, tras el módulo AS-IS → TO-BE → Informe 360 (histórica; ver estado actualizado en la auditoría de readiness):

- Tests: 125 aprobados, 14 omitidos en 4 suites de integración que requieren entorno aislado.
- Lint: 0 errores, 0 advertencias.
- Build: correcto; avisos de convención `middleware` y `localStorage` en Node.
- Producción Supabase `yemhtfcytrjimsdehlbf`: migraciones `0018`–`0020` aplicadas; permisos efectivos y esquema comprobados por SQL Editor. Backup cifrado del mismo día completado con restauración automatizada.
- No se ha validado todavía uso completo con empleados de clientes ni aislamiento multiempresa para un portal.

Antes de invitar empleados: modelar membresías de cliente y probar aislamiento. Antes de presentar beneficios: distinguir línea base, proyección y resultado verificado. Detalle y criterios de salida en el plan.

## Desarrollo local

1. Instalar versiones fijadas por `package-lock.json`: `npm ci`.
2. Crear `.env.local` a partir de `.env.local.example` con un entorno de desarrollo autorizado.
3. Revisar migraciones aplicadas antes de ejecutar SQL. No correr indiscriminadamente todo el histórico en una base existente.
4. Ejecutar `npm run dev` y abrir `http://localhost:3000`.
5. Usar cuenta de prueba provisionada por el administrador. No habilitar registro público para resolver problemas de acceso.

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Credencial pública, sujeta a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Credencial privilegiada, exclusivamente servidor |
| `ANTHROPIC_API_KEY` | IA desde servidor |

No incluir secretos en commits, documentación, capturas o cliente web. Service-role no sirve para probar permisos de empleados. Secretos de backup: [README_BACKUP.md](README_BACKUP.md).

## Comandos y pruebas

```bash
npm run dev
npm run lint
npm test
npm run build
npm start
```

Las integraciones se habilitan mediante variables de ejecución y por defecto se omiten. Inspeccionar fixtures antes de habilitarlas: algunas escriben datos. Usar Supabase de pruebas, no clientes reales. Tests verdes no sustituyen aislamiento, pruebas de navegador ni restauración.

Para integración, configura exclusivamente las variables de `.env.test.example` en la sesión de pruebas. `TEST_SUPABASE_PROJECT_REF` debe coincidir con el subdominio del proyecto de staging; la guardia rechaza el proyecto productivo conocido y la reutilización de `NEXT_PUBLIC_SUPABASE_URL`. No ejecutar `RUN_RLS_INTEGRATION=1` antes de aplicar migraciones y verificar que staging no contiene datos reales. La matriz de criterios y los FAIL/PARTIAL vigentes están en [Commercial Readiness](docs/NEXUS_COMMERCIAL_READINESS.md).

## Base de datos

Hay 24 migraciones en `supabase/migrations/`, de `0001` a `0024`:

- `0001`–`0006`: núcleo, diagnóstico, entregables, arquitectura, medición/adopción y biblioteca.
- `0007`–`0010`: encuesta pública, instrumentación IA, estilo e intake.
- `0011`–`0014`: enlaces por RPC, separación de estados y sentido de indicadores.
- `0015`–`0017`: demo/prospectos, Lancelot Loop e impacto/plan de mejora.
- `0018`–`0020`: control de acceso, correcciones conservadoras de resultados y evidencia trazable en hallazgos.
- `0021`: relación hallazgo–proceso, diseño TO-BE separado del AS-IS, pasos futuros sustentados y tipo Informe 360. Aplicada a producción el 2026-09-25; verificar permisos y esquema en cada entorno.
- `0022`: fase metodológica derivada del recorrido integral actualizado, sin mezclarla con el estado comercial. Aplicada a producción el 2026-09-25.
- `0023`: bucket privado para conservar y volver a descargar el Informe 360; políticas por consultor y proyecto. Aplicada a producción el 2026-09-25, sin variable de entorno adicional.
- `0024`: la fase sigue el primer paso pendiente del recorrido, aunque existan entregables posteriores; recalcula al cambiar triage, entrevistas o PEMM. Aplicada a producción el 2026-09-25 y contrastada con los tres proyectos existentes.

El Informe 360 se habilita solo si constan entrevista, PEMM respondido, hallazgo revisado, proceso AS-IS levantado, TO-BE validado, indicador e iniciativa con acciones. Su síntesis la redacta o revisa el consultor. Las candidatas de automatización no se presentan como automatizaciones construidas; un diseño validado tampoco se confunde con aceptación del cliente.

SQL en el repositorio no demuestra aplicación en cada entorno. Comparar esquema, políticas, funciones y grants efectivos. No reescribir migraciones aplicadas. Contrastar `lib/supabase/types.ts` con el esquema; no presumir sincronización automática.

## Stack y mantenimiento

Next.js 16.2.11, React 19.2.4, TypeScript, Supabase, Tailwind CSS 4, Base UI/shadcn, Zod 3, Recharts, Mermaid, docx y Anthropic SDK, según `package.json`.

Leer [AGENTS.md](AGENTS.md) y guías relevantes de `node_modules/next/dist/docs/` antes de modificar Next.js. No asumir equivalencia entre versiones. Usar `lib/design/tokens.ts` para decisiones visuales compartidas.

## Documentación

- [Plan vigente INNO IA](docs/LANCELOT_INNO_IA_PLAN_MAESTRO_2026-09.md).
- [Arquitectura y MVP NEXUS](docs/NEXUS_ARQUITECTURA_MVP.md).
- [Backup](README_BACKUP.md): complementar con límites de recuperación observados en el plan.
- [Auditoría de agosto](docs/LANCELOT_2_AUDITORIA_Y_ARQUITECTURA.md): antecedente histórico.
- [Propuesta de portal](docs/arquitectura-portal-clientes.md): no representa permisos implementados.

No borrar datos para «dejar limpio» sin inventario, objetivos exactos autorizados y recuperación verificada. No publicar garantías de ahorro o preparación empresarial sin evidencias.
