# NEXUS IA PROCESS — auditoría de consolidación

Fecha: 2026-09-25. Alcance: revisión del repositorio, pruebas automatizadas disponibles y comprobaciones públicas de producción. Este documento distingue implementación de capacidad demostrada; no certifica el uso con datos de un cliente nuevo.

## Dictamen

NEXUS dispone de un recorrido consultivo funcional para un consultor administrador, desde empresa/proyecto hasta entrevistas, AS-IS, hallazgos, TO-BE, mejora, indicadores e Informe 360. **No está demostrado todavía que una consultoría empresarial completa pueda ejecutarse de principio a fin sin intervención técnica.** Tampoco es un SaaS multiempresa con portal de clientes. Antes de vender acceso a terceros se necesita un piloto completo, pruebas de autorización cruzada en un entorno aislado y una restauración comprobada con el esquema y los archivos actuales.

## Evidencia verificada en esta revisión

- `npm test`: 131 pruebas aprobadas, 14 omitidas. Las omitidas incluyen integración de RLS/RPC que requiere `RUN_RLS_INTEGRATION=1` y un Supabase de pruebas separado. No se ejecutaron escrituras de fixtures en producción.
- `npm run lint` y `npm run build`: aprobados. El build conserva avisos de deprecación de middleware y localStorage; no se interpretan como pruebas de funcionamiento.
- Producción: `/proyectos` sin sesión redirige a `/login`; tokens UUID inexistentes de `/encuesta/pemm/[token]` y `/encuesta/proceso/[token]` muestran «Este enlace no es válido». No se comprobó con dos identidades reales distintas.
- Migraciones 0018–0024: la documentación previa registra su aplicación en producción. La revisión de este tramo no repitió un inventario SQL completo de políticas, grants y funciones, por lo que no se declara una nueva certificación RLS.
- La puerta de `requireConsultor` exige `es_administrador_lancelot()`. El portal para clientes invitados no existe; se corrigió el texto público y de login que lo daba a entender.

## Funciones terminadas o disponibles para piloto interno

| Área | Estado comprobable | Límite |
| --- | --- | --- |
| Empresas, proyectos, guía de 12 pasos | Persistencia y fase derivada implementadas | Falta prueba integral de un caso real completo |
| Entrevistas y análisis IA | Registro, transcripción, propuestas y revisión humana | Llamada real al proveedor y calidad de respuesta no evaluadas en esta auditoría |
| AS-IS, SIPOC, actividades, RACI | Representación operativa persistida | RACI se deriva de actividades; no es workflow de aprobación |
| Hallazgos y priorización | Evidencia textual y estado de validación | Observación/documento/finanzas siguen siendo referencias manuales sin objeto documental verificable |
| TO-BE | Diseño separado y validación condicionada por hallazgos | Sin versionado formal ni prueba de ejecución de proceso |
| Iniciativas, acciones, indicadores, medición | Modelos y pantallas disponibles | Algunas operaciones de varias escrituras no son atómicas |
| Informe 360 | Generación y almacenamiento privado del DOCX | No es aceptación firmada por el cliente ni garantía de precisión metodológica |

## Correcciones de este tramo

1. El hallazgo manual de entrevista ahora exige seleccionar una entrevista respondida del mismo proyecto y coteja la cita con la transcripción antes de marcarla como verificada. Persiste el identificador de fuente; el formulario muestra el origen. Una referencia no entrevistada sigue siendo validación manual, no cotejo automático.
2. Se retiraron porcentajes de progreso ficticios en la página pública. La tarjeta explica que ilustra el método, no el avance de una empresa real.
3. Login y página de consultoría dejan de prometer acceso de clientes aún no implementado.
4. Se añadieron pruebas unitarias del contrato de fuente del hallazgo. La autorización real entre empresas sigue pendiente de integración aislada.

## Funciones parciales, deuda y riesgos

| Prioridad | Hallazgo | Riesgo / criterio de salida |
| --- | --- | --- |
| P0 | No hay entorno Supabase de integración aislado ni E2E de recorrido completo | Crear entorno espejo sin datos de clientes; probar usuario A/B, RPC, Storage, creación → informe, errores y restauración |
| P0 | Modelo de acceso centrado en un administrador, sin membresías por empresa | No invitar clientes hasta definir tenant, roles, revocación y pruebas negativas de RLS |
| P0 | No se ha probado una consultoría completa con datos de una empresa piloto | Ejecutar un caso de INNO IA con fuentes, validaciones, indicadores y entrega; registrar defectos y tiempo real |
| P1 | Creación/vinculación de iniciativa y validación de hallazgo IA hacen varias escrituras | Mover cada operación lógica a transacción/RPC idempotente y probar fallo intermedio |
| P1 | Soporte documental sin carga, extracción, ubicación, versión ni política de retención | Añadir repositorio privado con consentimiento, referencias verificables y borrado antes de análisis documental con IA |
| P1 | Observaciones, finanzas y documentos admiten referencia libre revisada por consultor | Registrar tipo/ubicación/fecha/autor y estado; no llamar a estas fuentes «cita cotejada» |
| P1 | Respuestas de IA no están evaluadas con corpus de casos, costo, latencia y fallos | Crear fixtures anonimizados y medir citas válidas, alucinación, tiempo y degradación sin IA |
| P1 | Faltan estados explícitos de aprobación de cliente, historial de cambios y versionado formal | Implementar tras definir quién valida, qué se congela y cómo se reabre; preservar auditoría |
| P2 | Dashboard, búsqueda, filtros y UX móvil no tienen prueba de tareas observada | Probar 375/390 px y 3–5 usuarios; instrumentar tiempo a siguiente acción y puntos de abandono |
| P2 | Riesgos, causa raíz, automatizaciones y roadmap existen solo de forma parcial o descriptiva | Definir criterio y dueño por objeto antes de convertirlos en puntuación, aprobación o ejecución automática |
| P2 | Aviso de middleware de Next y rutas/nombres heredados Lancelot | Migrar según guía de Next 16 y retirar nombres internos solo con pruebas de regresión |

## Decisiones arquitectónicas vigentes

- Mantener Next.js 16, Supabase/RLS y el proveedor IA actual; no introducir infraestructura o «agentes» sin necesidad medida.
- Tratar IA como propuesta y mantener aprobación humana; separar hecho/cita cotejada, inferencia y recomendación.
- Derivar la fase metodológica de los requisitos del recorrido, no de una selección manual.
- Conservar rutas/tablas históricas por compatibilidad y hacer migraciones aditivas.
- No usar producción para pruebas que crean identidades o fixtures. No declarar aislamiento multiempresa probado hasta ejecutar A/B contra un entorno espejo.

## Checklist de salida a uso real

1. Montar Supabase de pruebas con migraciones actuales, políticas y Storage; correr integración RLS y restore cifrado.
2. Completar un caso interno de INNO IA de empresa a Informe 360, con fuentes reales o anonimizadas, medición y validación humana; registrar errores sin corrección manual de base.
3. Ejecutar E2E automatizado de flujo feliz y fallos (sin datos, sesión caducada, IA caída, cita falsa, permiso cruzado, exportación fallida).
4. Hacer revisión de UX móvil y de tareas con usuarios representativos; corregir lo observado.
5. Definir y probar roles/tenancy antes de habilitar cuentas cliente; cerrar retención, consentimiento, soporte y recuperación.
6. Publicar una lista de capacidades respaldadas por evidencia, no una promesa de automatización o ROI universal.
