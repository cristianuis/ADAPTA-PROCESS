# Lancelot 2.0 — auditoría y arquitectura de reconstrucción

Fecha de corte: 2026-08-12  
Alcance: Fase 0 del Prompt Maestro. No modifica producción ni introduce funcionalidades.

## Dictamen ejecutivo

Lancelot ya es un producto funcional, no un prototipo vacío: autentica al consultor, separa clientes y proyectos, guía un recorrido de 12 pasos, captura diagnóstico, modela procesos, genera entregables, mide indicadores y ofrece una capa de IA opcional. La línea base compila y tiene 105 pruebas en verde.

El principal hueco no es “falta de más módulos”, sino la ausencia de un circuito persistente entre diagnóstico y resultado económico. Hoy un hallazgo termina en una puntuación de impacto/esfuerzo y el recorrido salta al informe. No existe una cuantificación defendible, un caso de negocio, un plan de acciones ni una medición de beneficio realizado. Por eso la siguiente reconstrucción debe cerrar primero:

`hallazgo → impacto económico → iniciativa → acción → medición → aprendizaje`

Construir portal de cliente, BPMN avanzado, benchmarking externo o integraciones antes de probar este circuito con un cliente real aumentaría complejidad sin validar valor comercial.

## Evidencia del sistema actual

### Capacidades existentes

- Núcleo comercial-operativo: `consultores`, `clientes` y `proyectos` en `supabase/migrations/0001_fase1_core.sql`.
- Diagnóstico: PEMM, entrevistas y hallazgos en `supabase/migrations/0002_fase2_diagnostico.sql`.
- Diseño básico de procesos: procesos, SIPOC, actividades/RACI e indicadores en `supabase/migrations/0004_fase4_arquitectura.sql`.
- Medición y adopción: mediciones de indicadores y auditorías en `supabase/migrations/0005_fase5_medicion_adopcion.sql`.
- Entregables DOCX, biblioteca, demo pública, prospectos y Lancelot Loop ya tienen rutas y persistencia.
- El recorrido central está definido en `lib/proyectos/recorrido-guiado.ts:12` y la siguiente acción se calcula de forma determinista en `lib/lancelot/siguiente-accion.ts:238`.

### Uso real observado en producción

Conteos agregados obtenidos por REST con credencial de servidor, sin leer ni registrar nombres, correos o contenido:

| Entidad | Filas |
|---|---:|
| Consultores | 1 |
| Clientes | 3 |
| Proyectos | 3 |
| Triage | 3 |
| PEMM | 5 |
| Entrevistas | 8 |
| Hallazgos | 6 |
| Procesos | 2 |
| SIPOC | 1 |
| Actividades | 2 |
| Indicadores | 2 |
| Mediciones | 6 |
| Auditorías de adopción | 0 |
| Entregables | 3 |
| Prediagnósticos públicos | 2 |
| Sesiones/vueltas de Lancelot | 2 / 2 |

Conclusión: existe uso interno suficiente para diseñar el siguiente eslabón, pero todavía no hay evidencia de una adopción completa con cliente real. El portal de cliente y las fases de expansión permanecen condicionados.

## Hallazgos priorizados

### P0 — seguridad y continuidad: controlados

- Los accesos públicos defectuosos por `token is not null` sobreviven únicamente en migraciones históricas; la migración `0011_seguridad_enlaces_publicos_rpc.sql` elimina las políticas, revoca acceso directo de `anon` y expone RPC de token exacto (`:20`, `:50`, `:182`). No se debe reintroducir acceso directo anónimo.
- Existen pruebas de aislamiento por token en `lib/security/__tests__/public-token-rpc.integration.test.ts`.
- El backup ya se cifra con GPG, se conserva como artifact privado por 30 días y se restaura en PostgreSQL dentro del workflow (`.github/workflows/backup.yml:86`, `:103`, `:131`, `:178`).
- La clave de servidor continúa fuera del cliente. La auditoría REST confirmó que las claves secretas modernas de Supabase deben usarse como `apikey` de servidor, no como bearer de navegador.

### P1 — ruptura del flujo de valor: crítico para vender y demostrar resultados

- `hallazgos.impacto` es solo una escala 1–5 (`supabase/migrations/0002_fase2_diagnostico.sql:51`); no representa dinero, tiempo, volumen, riesgo ni confianza del cálculo.
- No existen entidades para iniciativa, plan de acciones o beneficio realizado.
- En `lib/actions/lancelot-guide.ts:109-110`, los pasos 7 y 8 se consideran completos con el mismo hecho: que exista el informe. La visita a la matriz se guarda temporalmente en `localStorage`, por lo que no es trazabilidad metodológica.
- El recorrido considera validados solo los hallazgos de origen IA (`app/(dashboard)/proyectos/[proyectoId]/page.tsx:74`), aunque un hallazgo manual ya fue validado por el consultor al crearlo.

Decisión: Fase 1 añade únicamente las entidades indispensables para cerrar el circuito económico y reemplaza la “visita a una pantalla” por evidencia persistida.

### P2 — diseño de procesos insuficiente para comparar estado actual y futuro

- `procesos` guarda una sola versión y `actividades` una sola secuencia. No puede mostrar AS-IS frente a TO-BE, alternativas o cambios aprobados.
- Mermaid se deriva de actividades, pero no es todavía un editor de flujo con decisiones, eventos y conexiones.

Decisión: después de validar la Fase 1, introducir versiones mínimas de proceso, nodos y conexiones. BPMN completo queda fuera hasta demostrar necesidad real.

### P3 — trazabilidad y gobierno

- Entregables tienen estado y versión, pero no hay decisiones, aprobaciones ni historial de transición de iniciativas.
- Las auditorías guardan causas y acciones en JSON; eso sirve para el MVP, pero no permite seguimiento transversal.

Decisión: agregar historial y aprobaciones solo sobre objetos usados en Fases 1 y 2. No crear un motor genérico de workflow.

### P4 — procedimientos y transferencia

- El manual se genera desde actividades, pero no existe captura visual paso a paso, evidencia de capacitación ni verificación por procedimiento.

Decisión: procedimiento visual y checklist después de que haya un proceso futuro aprobado.

### P5 — ciclo comercial incompleto

- La demo pública captura prospectos, y proyectos separan estado comercial de fase metodológica, pero no hay oportunidad, reunión, propuesta y conversión como un embudo conectado.

Decisión: construir este ciclo después del circuito de impacto para que la propuesta comercial pueda prometer resultados medibles, no solo actividades.

### Deuda técnica no bloqueante

- Next.js 16.2.11 reporta que `middleware.ts` está deprecado y debe migrarse a `proxy.ts`.
- ESLint queda en verde con una advertencia del compilador de React por `watch()` en `components/proyectos/ProyectoForm.tsx:49`.
- Algunas comprobaciones de completitud dependen de la existencia de filas, no de calidad o estado explícito.
- La capa de acciones depende correctamente de RLS, pero debe mantener autorización y validación dentro de cada Server Action porque los action IDs son invocables como POST.

## Arquitectura objetivo

### Principios

1. Una sola acción principal visible: “Haz esto ahora”.
2. Todo hito metodológico debe corresponder a un dato persistido, nunca a visitar una pantalla.
3. IA propone; el consultor confirma; la base conserva el resultado confirmado.
4. RLS deny-by-default. `anon` no recibe acceso directo a tablas privadas.
5. Cada entidad nueva debe cerrar una relación del circuito de valor.
6. Campos estructurados para estados, montos y relaciones; JSON solo para material flexible que no necesita consulta transversal.
7. El portal de cliente no se habilita hasta completar y usar las fases internas con un cliente real.

### Mapa funcional objetivo

```text
Empresa / proyecto
  ├─ diagnóstico y evidencia
  │    └─ hallazgos validados
  │          └─ cuantificaciones económicas
  ├─ plan de mejora
  │    └─ iniciativas vinculadas a hallazgos
  │          ├─ acciones y responsables
  │          └─ mediciones de beneficio realizado
  ├─ arquitectura de procesos
  │    └─ versión actual → versión futura
  ├─ gobierno
  │    └─ decisiones, aprobaciones e historial
  └─ transferencia
       └─ procedimiento, capacitación y adopción
```

## Secuencia de reconstrucción y puertas de salida

### Fase 1 — impacto económico y plan de mejora

Entidades justificadas:

- `cuantificaciones_impacto`: conserva fórmula, supuestos, fuente, confianza y valor anual de cada componente económico de un hallazgo.
- `iniciativas_mejora`: convierte problemas priorizados en hipótesis de intervención con inversión, beneficio objetivo, responsable y criterio de éxito.
- `iniciativa_hallazgos`: permite que una iniciativa resuelva varios hallazgos sin duplicarlos y fuerza que pertenezcan al mismo proyecto.
- `acciones_mejora`: hace ejecutable la iniciativa con responsable, fecha y estado.
- `mediciones_impacto`: separa estimación de resultado realizado y permite línea base, seguimiento y cierre.

No se agregan todavía causas raíz, evidencias genéricas, riesgos, controles, aprobaciones ni roles de cliente.

Puerta de salida:

- Al menos un hallazgo real cuantificado con supuestos.
- Una iniciativa vinculada, con inversión y beneficio objetivo.
- Una acción asignada.
- Una medición posterior registrada.
- El paso recomendado por Lancelot cambia a partir de esos datos persistidos.

### Fase 2 — proceso actual y proceso futuro

Versiones mínimas, nodos y conexiones; comparación de tiempos, esperas y puntos de control. Validar un proceso real antes de ampliar símbolos o simulación.

### Fase 3 — aprobaciones y trazabilidad

Historial de cambios y aprobación explícita de iniciativa/proceso futuro. Prueba RLS entre dos empresas antes de liberar.

### Fase 4 — procedimiento visual

Pasos, imágenes, responsables, checklist y evidencia de entrenamiento sobre un proceso futuro aprobado.

### Fase 5 — ciclo comercial

Oportunidad, reunión, propuesta y conversión a proyecto, conectadas con el diagnóstico público y el caso de valor.

### Fases 6–8 — condicionadas

Portal de cliente, biblioteca de aprendizaje avanzada, integraciones, benchmarking y simulación requieren uso real previo. No deben implementarse solo porque están en el roadmap.

## Línea base de calidad

- Tests: 105 pasaron; 4 de integración quedaron omitidos por depender de credenciales/estado externo.
- Lint: 0 errores, 1 advertencia no bloqueante.
- Build: compilación y TypeScript en verde; 27 páginas estáticas generadas.
- Advertencia de plataforma: migrar `middleware.ts` a `proxy.ts` durante una fase técnica controlada.

## Siguiente punto de control

La migración `0017_impacto_y_plan_mejora.sql` debe revisarse y pegarse manualmente en Supabase. Solo después de confirmar su aplicación se implementarán tipos, acciones, componentes, recorrido guiado, pruebas RLS y verificación productiva de la Fase 1.
