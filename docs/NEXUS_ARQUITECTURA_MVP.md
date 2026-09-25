# NEXUS IA PROCESS — arquitectura de producto y MVP

Fecha: 2026-09-25
Base de partida: aplicación ADAPTA/Lancelot existente, Next.js 16 + Supabase.
Propietario del producto: Cristian Alfonso. Operador piloto/canal previsto: INNO IA (consultoría de innovación, IA y mejoramiento de procesos).
Estado: diseño ejecutable para un piloto interno; no equivale a autorización multiempresa ni certificación de producción.

## Decisión ejecutiva

Interpretamos el prompt como un cambio de marca de Lancelot a **NEXUS IA PROCESS** y una dirección de producto, no como autorización para construir 50 módulos de una vez. Los nombres internos de rutas, tablas y funciones se conservan por compatibilidad; el texto visible se migra por etapas. No borrar información existente, cuentas, proyectos ni historial.

NEXUS será primero el **sistema operativo de entrega de consultoría de INNO IA**: organiza el trabajo del consultor desde el descubrimiento hasta la transferencia, hace explícitas las siguientes acciones y conecta cada hallazgo y decisión con la evidencia que lo respalda. No es todavía un gemelo digital, una suite BPM, un process-mining engine ni un SaaS con roles de cliente.

## 1. Interpretación y promesa

El problema comercial no es falta de documentos o diagramas: es que el conocimiento de cómo opera una empresa está disperso, las mejoras no tienen dueños y es difícil distinguir una hipótesis de un resultado probado. NEXUS debe convertir una intervención de consultoría en una secuencia observable, usable por las personas y evaluable con medidas definidas.

**Promesa verificable propuesta:** «INNO IA te ayuda a entender un proceso real, elegir una mejora, ponerla a prueba y mostrar qué cambió — con evidencia». El software apoya al consultor; no sustituye entrevistas, criterio profesional, decisión del cliente ni verificación de resultados.

La unidad de trabajo del MVP es **una intervención/proyecto de consultoría para una empresa**, no la organización completa. La modelación de la organización se amplía solo si un piloto real demuestra que hace falta.

## 2. Usuario y segmento inicial

- **Consultor de INNO IA (usuario principal):** prepara, analiza, facilita, valida y entrega. Necesita reducir dispersión, retrabajo de análisis y preparación de entregables.
- **Director/propietario/COO de una pyme de servicios (comprador/participante hipótesis):** necesita mejorar un proceso que afecta capacidad, tiempos, errores, experiencia o crecimiento. Autoriza el alcance y valida evidencia.
- **Dueño y ejecutor del proceso (participantes):** describen el trabajo real, prueban la nueva forma y registran excepciones.

El primer segmento sigue siendo hipótesis. Elegir empresas donde el proceso se repite, se puedan observar casos/fechas, exista un patrocinador capaz de actuar y la intervención quepa en 2–6 semanas. No fijar vertical, tamaño, precio o ahorro estándar hasta entrevistar compradores y ofertar el paquete.

## 3. Arquitectura funcional

Recorrido único: **Preparar intervención → entender contexto y casos → formular/validar hallazgos → diseñar proceso y medidas → acordar una mejora → pilotear y registrar evidencia → evaluar resultado → transferir**.

Capacidades actuales reutilizables: clientes/proyectos, triage, PEMM, entrevistas, revisión de hallazgos, arquitectura de procesos (SIPOC, actividades, indicadores), cuantificación/plan de mejora, entregables y auditoría de adopción; guía de siguiente acción y apoyo IA opcional.

Brechas que afectan el objetivo inmediato: el estado de varias pantallas depende de consultas cuyo error se convierte en «sin datos»; hallazgos guardan fuente/origen pero carecen de una referencia tipada robusta a la cita; no hay repositorio/versionado de archivos de empresa; solo está modelado el consultor, no los equipos cliente; el nivel PEMM existente no justifica por sí solo una puntuación global empresarial; no hay RAG, process mining ni análisis de capacidad conectado a sistemas.

Navegación del MVP, sin inflar el sidebar: **Hoy**, **Empresas**, **Intervenciones**, **Biblioteca**, **Configuración**. Dentro de una intervención: Contexto, Descubrimiento, Procesos, Mejoras, Entregables y Medición. Mantener páginas/rutas actuales y mapearlas progresivamente; no eliminar módulos funcionales. La ruta de entrada `/dashboard` redirige a la guía existente en `/lancelot`, que prioriza una sola acción siguiente y evita presentar el resumen como una lista de decisiones.

## 4. Arquitectura IA y evidencia

Una capa de caso de uso en servidor llama al proveedor existente (Anthropic hoy); no se presentan varios «agentes» como arquitectura real. Dividir por funciones puras y comprobables: extraer/sintetizar, proponer clasificación, redactar entregable, evaluar consistencia. Un orquestador en código puede coordinar esos pasos más adelante; agentes autónomos no forman parte del MVP.

Toda salida IA es **propuesta** hasta validación humana. Cada afirmación de hallazgo debe conservar: categoría de soporte (declarado/documental/observado/medido), fuente concreta, fragmento/cita, fecha/contexto, confianza y estado (pendiente de revisar/validada/rechazada). Sin fuente suficiente, se presenta como pregunta o pendiente, no como hecho ni puntuación. Registrar modelo/proveedor y versión de prompt cuando sea viable, pero no guardar transcripciones completas en logs.

RAG solo se autoriza al incorporar documentos con extracción, segmentación, permisos por proyecto, borrado/retención, referencias de página y evaluación contra un conjunto de casos. No enviar documentos empresariales a un proveedor externo hasta definir aviso/consentimiento, minimización y configuración de retención.

## 5. Arquitectura técnica elegida

Conservar el stack existente para evitar migración sin beneficio probado: Next.js 16.2 App Router + React/TypeScript; componentes Tailwind 4 y tokens existentes; Supabase Postgres/Auth/PostgREST/RLS; Server Actions para cambios internos y Route Handlers para IA/exports; generación DOCX/PDF ya integrada; Vitest y ESLint, más GitHub Actions de lint/tests/build. Anthropic sigue como proveedor implementado; una interfaz `ModelProvider` solo se introduce al tener segundo proveedor real.

No sumar Prisma, servicio backend, cola, vector DB, React Flow ni nube de archivos por anticipación. Primero corregir el límite actual de acceso: existe rol de consultor/propietario, no membresía por organización para cliente. Revisar esquema, grants, políticas y RPC juntos. Mantener datos del cliente en Supabase y secretos solo en servidor. Separar un proyecto Supabase de pruebas antes de ejecutar pruebas que crean usuarios o fixtures.

## 6. Modelo de datos: real versus evolutivo

**Ya existe en el producto:** `consultores`, `clientes`, `proyectos`, `triage_respuestas`, `pemm_evaluaciones`, `entrevistas`, `hallazgos`, `procesos`, `sipoc`, `actividades`, `indicadores`, `entregables`, `iniciativas_mejora`, `acciones_mejora`, `mediciones_impacto`, sesiones del loop y auditorías de adopción.

**Brecha prioritaria:** referencia de evidencia de un hallazgo debe ser tipada y verificable. Hoy `hallazgos.fuente` + `fuente_id` son débiles; las citas viven también dentro de JSON de entrevista. Diseñar después una tabla mínima `evidencias` (proyecto_id, tipo, fuente_id, fragmento/ubicación, fecha, estado de validación, creado_por, created_at) y una tabla de vínculo `hallazgo_evidencias` con cardinalidad muchos-a-muchos. Archivos no son obligatorios para el primer piloto: aceptar citas manuales de entrevista/observación y enlaces a documentos existentes. Migración aditiva, RLS del dueño del proyecto, sin reescribir tablas o eliminar datos.

**Futuro condicionado a aprendizaje:** áreas/personas/membresías, sistemas/documentos/versiones, riesgos/controles, mapa organizacional relacional, clientes invitados. Un cliente será `organization/tenant` aislado y no simplemente otro `consultor`. Resolver modelo de tenencia e identidad antes de vender acceso recurrente multiempresa.

## 7. Recorrido de usuario

1. Consultor registra empresa y abre intervención con objetivo, alcance y dueño.
2. Revisa información inicial y selecciona un proceso a partir de casos reales.
3. Entrevista a dueño y ejecutor; registra notas y evidencia en el contexto de la intervención.
4. IA puede proponer temas/hallazgos; consultor ve citas y valida/rechaza.
5. Dibuja el AS-IS con SIPOC/actividades y registra espera, excepción, responsable y medida disponible.
6. Acorda problema/prioridad y baseline; el cliente valida definición y fuente.
7. Diseña una intervención pequeña con dueño, tarea, fecha y criterio de cierre; describe el TO-BE en pasos utilizables.
8. Revisa semanalmente bloqueos y medición comparable; el sistema distingue dato observado, inferencia y supuesto.
9. Entrega informe/manual, valida comprensión y registra aceptación/transferencia.

Si no hay dato, el recorrido ofrece «no medido todavía» o «pendiente de confirmar», nunca un cero implícito. IA no bloquea el trabajo manual.

## 8. UX y visual

Conservar azul rey/hueso, `lib/design/tokens.ts`, navegación móvil existente y densidad baja. Priorizar encabezado con empresa/intervención activa, estado metodológico derivado, una siguiente acción con condición de término y enlaces a evidencia. Tablas se adaptan a tarjetas; formularios muestran errores junto al campo. En detalle, mostrar separación visual: **Hecho / Declarado / Inferencia / Recomendación / Pendiente**. No agregar heatmap/decoración antes de tener datos válidos. Botón principal siempre ejecuta la acción descrita. Usabilidad piloto: primera tarea localizable en 60 s, crear/registrar caso en 2 min; observar tareas con al menos 3–5 usuarios representativos e informar el tamaño real.

## 9. Madurez, resultados e impacto

No existe aún una rúbrica calibrada para un «índice de madurez empresarial» 0–5. Mantener PEMM (modelo y escala propios) separado y explicar su alcance; no promediar PEMM, triage, adopción o percepciones en un número global. Un nuevo marco 0–5 necesitará dimensiones, preguntas ancla por nivel, regla de evidencia mínima, N/A, agregación, tratamiento de contradicciones y revisión por experto antes de liberar puntuaciones.

Indicadores con sentido, unidad, periodo, fuente, responsable, tamaño de muestra, línea base y método. Beneficio estimado separado de beneficio validado, supuestos explícitos y moneda individual. Tiempo/capacidad liberada no equivale automáticamente a ahorro de caja; sin base comparable mostrar «no concluible», no un ROI.

## 10. MVP que se implementa primero

**Entra (aprovechando lo existente):** recorrido consultivo completo para un proceso; entrevista y validación; AS-IS con SIPOC/actividades; uno o más hallazgos trazables; medición base con definición; plan pequeño de mejora, tareas y evidencia de cierre; informe/manual; guía de siguiente acción; soporte IA opcional con revisión humana.

**No entra todavía:** gemelo digital completo; organigrama/personas y roles de cliente; upload universal y RAG; BPMN ejecutable/simulación; minería de eventos; ERP/CRM/WhatsApp; workflow automation; multiagentes; benchmark de terceros; pronóstico de escenarios; madurez global sin rúbrica; SaaS multi-tenant; promesa automática de ROI.

**Puerta comercial de piloto:** completar un caso interno de INNO IA y uno con cliente dispuesto, medir tiempo de preparación/entrega y uso, comparar antes/después con definición consistente, revisar objeciones/disposición a pagar, validar permisos/exportación. Sin seguridad aislada, backup restaurable y resultados revisados, no exponer datos de clientes en portal.

## 11. Roadmap y criterios de salida

| Etapa | Resultado | Prueba de salida |
|---|---|---|
| A · Cerrar cimientos | Branding NEXUS en UI sin romper rutas; seguridad 0018 y finanzas 0019 aplicadas con dueño correcto; CI estable | build/tests; usuario autorizado; no autorizado bloqueado; datos históricos preservados |
| B · Evidencia primero | vínculo verificable hallazgo ↔ evidencia; estado de validación; errores no se disfrazan como ausencia | A no ve B; cada hallazgo aceptado lleva una cita o marca explícita de soporte; entrevista manual funciona |
| C · Piloto interno | un proceso de INNO IA tratado de inicio a transferencia | equipo completa trabajo semanal sin depender de prompt libre; medidas trazables; soporte/horas conocidos |
| D · Piloto cliente | una intervención acotada con cliente, consentimiento y exportable | aislamiento y revocación probados; valor y disposición a pagar observados; restauración probada |
| E · Producto comercial | convertir lo aprendido en configuración, membresías/tenancy, plantillas y operación multiempresa | instalación de segunda empresa aislada y sin bifurcar código; SLA/costo/retención definidos |

Estimación orientativa tras conocer el equipo y el volumen; no prometer fechas o precio antes de medir. No desplegar seguridad nueva antes de migraciones y prueba de autorización.

## 12. Riesgos y decisiones que evitamos

- **Sobreconstrucción:** crear decenas de tablas antes de observar un caso. Mitigación: piloto acotado, extensiones aditivas y backlog condicionado.
- **Falsa certeza IA:** salida convincente sin cita o puntuación sin rúbrica. Mitigación: etiquetas epistemológicas, referencia y validación humana obligatorias.
- **Filtración interempresa:** usar el modelo por consultor como tenancy del cliente. Mitigación: revisar RLS/RPC/storage con pruebas cruzadas antes de invitar usuarios.
- **Impacto financiero falso:** sumar capacidad, ingreso y ahorro, o atribuir el mismo resultado a varias iniciativas. Mitigación: separar categorías, períodos, monedas, costos y atribución.
- **Dependencia de un proveedor de IA:** una capa de abstracción sin segundo proveedor añade complejidad. Mitigación: mantener Anthropic detrás de los handlers del servidor; abstraer solo cuando se seleccione un segundo proveedor.
- **Migration mismatch:** ejecutar DDL sobre producción no auditada o desplegar código dependiente antes del schema. Mitigación: confirmar proyecto, backup/esquema, migraciones ordenadas, smoke test y rollback documentado.
- **Precio/canal sin margen:** vender “software” cuando lo que se compra es consultoría. Mitigación: medir horas, soporte, IA, implementación y costos por intervención antes de fijar oferta.

No usar «digital twin», «AI agents», «ROI medible» o «automatiza toda la empresa» en la oferta hasta poder demostrar su correspondiente capacidad.

## 13. Backlog inicial priorizado

1. **P0 Seguridad:** aplicar y probar el esquema que define al administrador y protege RPC; recuperar acceso verificado del propietario; impedir autoprovisión.
2. **P0 Calidad:** CI lint/tests/build obligatoria; no secretos ni datos de producción en tests.
3. **P1 Evidencia:** consolidar la cita trazable y estados incorporados en `0020_evidencia_trazable_hallazgos.sql`; luego valorar una entidad de evidencia solo cuando el piloto requiera archivos, varias fuentes o referencias ubicables.
4. **P1 Integridad:** consultas del recorrido devuelven `error` separado de estado vacío; transacciones/idempotencia donde varias escrituras representan una acción.
5. **P1 Piloto:** ficha compacta de proceso, baseline y muestra comparable; checklist de transferencia y exportable revisado.
6. **P2 UX:** Inicio/Hoy con prioridad y bloqueo, mobile QA completo, filtros y tarjetas; administración aparte.
7. **P2 Producto:** definir reglas de retención, invitación/revocación, tenancy y plan de hosting comercial.
8. **P3 IA/RAG:** retrieval solo tras pruebas de referencia, privacidad, acceso y evaluación de respuestas.

## 14. Avance del tramo AS-IS → TO-BE → Informe 360

La migración `0021_diseno_tobe_y_trazabilidad.sql` se aplicó en producción el 2026-09-25, tras verificar el respaldo cifrado del día. Añade vínculo opcional de hallazgo al proceso, diseño TO-BE separado y pasos con soporte obligatorio para cambios; mantiene el AS-IS histórico. RLS limita las tablas nuevas al consultor propietario y anon no recibe SELECT. La base impide validar un diseño sin al menos un cambio sustentado en un hallazgo revisado, y bloquea la edición de pasos validados hasta reabrirlo.

La migración `0022_fase_por_recorrido_integral.sql` alinea la fase derivada con los hitos reales del recorrido y se verificó sin divergencias en los proyectos actuales. La guía conserva 12 pasos, ahora ordenados desde entrevista y AS-IS hasta TO-BE, adopción e Informe 360; los informes parciales siguen disponibles sin convertirse en pasos obligatorios.

El Informe 360 reúne las secciones persistidas y se bloquea si falta entrevista, PEMM, hallazgo con evidencia, AS-IS, TO-BE validado, indicador o iniciativa con acciones. Distingue explícitamente proyección, dato registrado y resultado confirmado. No constituye aprobación automática del cliente. Para el piloto sigue pendiente probar la consultoría entera con datos de un caso real y contar con un entorno de integración aislado para tests que escriben datos.

La migración `0023_archivos_privados_informes.sql` conserva cada DOCX 360 en Storage privado y permite volver a descargarlo desde su historial. La ruta usa el cliente autenticado, no la service role; una política verifica consultor y proyecto en la ruta del objeto. Los entregables históricos de otros tipos siguen siendo registros sin binario: no se afirma que esos archivos puedan recuperarse.

El smoke test de producción detectó que entregables antiguos adelantaban la fase de Textiles a «Transferencia» aunque la entrevista seguía pendiente. `0024_fase_primer_paso_pendiente.sql` corrige la fase según el primer requisito faltante de los 12 pasos; los tres proyectos actuales muestran «Definición» y coinciden con el cálculo de la base. Las propuestas de IA se filtran por cita literal antes de persistirse, y una transcripción con hallazgos ya aprobados no puede reemplazarse silenciosamente.

## 15. Resultado actual frente al prompt

Existe un flujo consultivo y documentos, pero no hay gemelo digital ni SaaS seguro multiempresa acreditado. Algunas piezas del prompt ya están representadas por entidades actuales (entrevista, proceso, indicador, iniciativa) y no deben duplicarse. La migración aditiva `0020_evidencia_trazable_hallazgos.sql` incorpora cita y estado de validación; no crea todavía un repositorio documental ni evidencia multimedia. Catálogo organizacional, archivos, TO-BE versionado, riesgos formales y RAG siguen siendo brechas. La identidad visible se actualiza a NEXUS conservando rutas y contratos internos para compatibilidad. Las migraciones `0018`–`0020` se aplicaron en Supabase producción el 2026-09-25 y sus objetos y permisos se comprobaron por SQL Editor antes de publicar código dependiente.
