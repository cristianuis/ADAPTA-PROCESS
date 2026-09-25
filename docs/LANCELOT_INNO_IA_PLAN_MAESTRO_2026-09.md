# Lancelot para INNO IA: auditoría y plan de producto

Fecha de cierre: 2026-09-24. Código revisado: `7a572de`.
Estado: plan en ejecución; no certificación empresarial.

**Actualización 2026-09-25:** las migraciones `0018`, `0019` y `0020` se aplicaron en Supabase producción y se verificaron objetos y permisos efectivos. Este documento conserva el diagnóstico original de 2026-09-24; el estado vigente de producto está en [NEXUS_ARQUITECTURA_MVP.md](NEXUS_ARQUITECTURA_MVP.md). Las pruebas de integración con usuarios de cliente siguen pendientes de un entorno aislado.

## 1. Dirección del producto

Lancelot debe ayudar a Cristian a convertir problemas operativos en mejoras comprobadas, y a la empresa a sostenerlas sin depender de él para cada tarea. Su diferenciador no será tener más pantallas: será conectar trabajo, responsables, evidencia y resultados.

Promesa propuesta: «Sabes qué hacer, quién debe hacerlo y cómo comprobar si funcionó».

INNO IA presta consultoría de innovación, IA y mejoramiento de procesos. Es a la vez la primera operación donde validar Lancelot y un posible canal de comercialización. Aún falta identificar su tamaño, equipo, mezcla de servicios, proceso interno prioritario y perfil de cliente objetivo; no se infieren a partir del nombre. El usuario pretende conservar Lancelot y comercializarlo a través de esa empresa; el acuerdo concreto está pendiente.

Separar desde el diseño:

- **Producto:** control de plataforma bajo el propietario designado por Cristian. Cambiar una marca no transfiere repositorio, dominio, secretos o facturación.
- **INNO IA:** organización piloto y posible canal comercial. Ser canal no concede acceso automático a los datos de todos los clientes captados.
- **Clientes:** datos y membresías separados por organización y asignación. Administración técnica no significa consulta cotidiana indiscriminada de información privada.

Son requisitos del producto, no una declaración de titularidad jurídica. Antes de vender, acordar quién licencia, factura, soporta, paga infraestructura y trata los datos, y qué ocurre al finalizar la relación. No hace falta esperar ese acuerdo para corregir defectos técnicos.

## 2. Evidencia y límites de esta revisión

Se revisaron migraciones, acciones de servidor, interfaz de mejoras, guía metodológica, llamadas de IA, pruebas y backup. Se investigaron referencias primarias de producto y usabilidad. No se escribieron datos en producción, crearon usuarios ni ejecutaron ataques de prueba.

| Verificación local | Resultado | Qué no demuestra |
|---|---|---|
| `npm test` | 110 aprobadas; 9 omitidas en 3 archivos de integración | Aislamiento entre empleados autenticados de empresas distintas |
| `npm run lint` | 0 errores; 1 advertencia de `watch()` en `ProyectoForm.tsx` | Usabilidad o corrección económica |
| `npm run build` | Correcto; avisos de `middleware` y `localStorage` en Node | Estado del despliegue o políticas efectivas de producción |

Vitest requirió permitir subprocesos locales después de un `EPERM` del entorno restringido. No se habilitaron fixtures contra Supabase. La duración informada por el build durante esta sesión interrumpida no se usa como medida de rendimiento.

**Corrección de mi evaluación anterior:** construir el circuito de impacto no acreditó su exactitud económica ni el uso completo por un cliente. Probar pantallas vacías en móvil no cubrió formularios completos. «Todo listo» fue una conclusión demasiado amplia. Esta entrega no certifica producción ni una restauración integral.

## 3. Hallazgos priorizados

Referencias del commit de corte. Confirmado en código no significa explotado en producción.

| ID / prioridad | Evidencia | Corrección y prueba exigida |
|---|---|---|
| SEG-01 / P0 antes de invitar empleados | `lib/actions/consultores.ts`, `guardarPerfilConsultor`: cualquier autenticado puede crear perfil; `0001_fase1_core.sql:73` controla identidad propia, no autorización para ser consultor. `0015_demo_publica_prospectos.sql`, `listar_prospectos_demo`: listado global para cualquier consultor | Impedir autoasignación de capacidades. Invitado no puede convertirse en consultor ni listar prospectos ajenos. Verificar catálogo efectivo antes de declarar fuga activa |
| SEG-02 / P0 | `0012_separar_estado_comercial_fase_metodologica.sql`: funciones `calcular_fase_metodologica` y `recalcular_fase_metodologica`, privilegiadas y ejecutables por autenticados, sin comprobación explícita de propiedad del UUID | Autorizar por recurso, revisar grants y ejecución indirecta. Usuario A no consulta fase ni provoca recálculo de B |
| IMP-01 / P1 antes de presentar ROI | `PlanMejoraWorkspace.tsx:164` inicia cada iniciativa con el impacto total; líneas 265–272 suman sin separar estado/moneda | Evitar doble conteo y solapamientos. Beneficio inicial vacío y atribución explícita |
| IMP-02 / P1 | Mismo componente, línea 252: indicador nulo/unidad vacía; última medición alimenta resultados y validación es checkbox | Separar línea base, proyección y beneficio verificado. Registrar período, fuente, método, validador y evidencia |
| UX-01 / P1 | `PlanMejoraWorkspace.tsx:301`: recomendación cambia pero botón abre creación de iniciativa; línea 288 usa `window.prompt` | Una recomendación abre su tarea exacta; cierre mediante formulario accesible y contextual |
| MET-01 / P1 | `lib/actions/lancelot-guide.ts`: entrevista completa depende de `hallazgos_ia`; criterios por presencia de filas; errores tratados como listas vacías | Vía manual válida, criterios de salida compartidos y error distinto de «sin datos» |
| MET-02 / P1 | `lib/lancelot/siguiente-accion.ts:163`: prioridad comercial/antigüedad; llamador excluye cerrados | Priorizar bloqueos y vencimientos; distinguir cliente sin proyecto activo de cliente sin historial |
| DAT-01 / P1 | `lib/actions/mejoras.ts`: escrituras múltiples sin transacción, compensación no comprobada, actualizaciones sin comprobar filas, orden mediante conteo + 1 | Transacciones, idempotencia, concurrencia y validación de relaciones; ID inexistente no devuelve éxito |
| IA-01 / P1 | `analizar-entrevista/route.ts:159,188` envía transcripción y puede registrar respuesta; `resumen-ejecutivo/route.ts:82` incluye cliente; `lib/rate-limit.ts` limita por memoria de instancia | No afirmar anonimización general ni presupuesto global. Minimizar datos/logs y aplicar cuotas durables |
| OPS-01 / P1 | `.github/workflows/backup.yml`: restaura `public` con Auth simulado y dump sin privilegios; no hay workflow de CI de calidad | Ensayo integral de recuperación y controles antes de desplegar |
| DOC-01 / P2 | README previo: 6 migraciones, 25 pruebas e instrucciones obsoletas de signup | Actualizar y distinguir propuesta, histórico y estado verificado |

El modelo actual por consultor es intencional; falta la autorización para personal de empresas. Revisar además compatibilidad cliente–proyecto–hallazgo–iniciativa. Una clave service-role no representa permisos de un empleado. Las funciones definidoras pueden operar con privilegios del creador: revisar RLS, funciones y grants conjuntamente. [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 4. Referencias: adoptar principios, no acumular módulos

| Fuente | Principio aprovechable | Aplicación acotada |
|---|---|---|
| [Process Street](https://www.process.st/help/docs/workflows/) | Plantilla separada de ejecuciones | Un proceso reutilizable con casos y tareas; no un constructor universal |
| [Asana](https://help.asana.com/s/article/use-dependencies-to-kick-work-off-at-the-right-time) | Dependencias explican qué bloquea el trabajo | Mostrar requisito, responsable y fecha; no necesitar Gantt para una secuencia simple |
| [Bizagi](https://help.bizagi.com/platform/en/simulation_levels.htm) | Validar estructura antes de simular tiempos; simular exige datos | Detectar pasos sin salida/responsable. No llamar BPMN validado a un diagrama Mermaid |
| [KaiNexus](https://support.kainexus.com/what-are-impact-types) | Diferenciar clases de impacto | No sumar tiempo, caja y riesgo como dinero equivalente |
| [NN/g](https://www.nngroup.com/articles/progressive-disclosure/) | Mostrar primero lo frecuente y revelar lo especializado cuando se necesita | Tarea sencilla para ejecutor; PEMM/SIPOC/cálculos avanzados para consultor |

Kanban, guías con capturas y filtros son patrones candidatos, no una obligación de clonar Trello, Scribe o ClickUp. Añadirlos si resuelven una dificultad observada. No contratar ni integrar esas plataformas para aplicar estos principios.

## 4A. Lectura de mercado y posicionamiento para INNO IA

La evidencia disponible orienta el problema, pero no valida todavía disposición a pagar por Lancelot:

- MinCIT reportó en junio de 2025 más de 30.000 mipymes atendidas y, en Fábricas de Productividad y Sostenibilidad, mejoras promedio reportadas de 33,1 % en indicadores clave, incluidos tiempos, costos, control y ventas. En octubre de 2025 informó otro grupo de 5.081 empresas y resultados en productividad operacional, calidad, transformación digital y logística. Es evidencia de demanda por asistencia y mejora medible; no prueba demanda por esta aplicación ni garantiza resultados a nuestros clientes. [MinCIT, balance de 2025](https://www.mincit.gov.co/prensa/noticias/industria/mas-de-30-000-mipymes-han-mejorado-su-productivida) · [MinCIT, Fábricas de Productividad](https://www.mincit.gov.co/prensa/noticias/industria/el-gobierno-del-cambio-ha-impulsado-productividad)
- Competidores generalistas ya ofrecen asignaciones, vistas, plantillas, formularios, carga de trabajo y tableros. No tiene sentido vender Lancelot como sustituto superior de Asana/ClickUp sin pruebas. [Asana: capacidades](https://asana.com/features)
- Herramientas de proceso como Process Street y Kissflow enfatizan ejecución repetible, asignaciones, validación y visibilidad de cada instancia. BPM suites como Bizagi diferencian validación estructural de simulación temporal y análisis de recursos, que requieren datos. Lancelot no debe aparentar simulación ni automatización que aún no tiene. [Process Street](https://www.process.st/project-management-software/) · [Kissflow: acciones de miembros](https://kfdocs.kissflow.com/help/docs/use/tasks/member-actions-in-a-process) · [Bizagi: niveles de simulación](https://help.bizagi.com/platform/en/simulation_levels.htm)
- Suites de process mining como Celonis venden visibilidad del proceso real, análisis y activación a escala; su punto de partida son datos empresariales conectados, no solo entrevistas. Lancelot hoy está más cerca de metodología guiada y ejecución asistida por consultor que de minería de procesos. [Celonis: plataforma](https://www.celonis.com/platform)

**Posicionamiento que sí se puede probar:** «INNO IA convierte una oportunidad de mejora en un proceso operativo con responsable, forma de trabajo y medición; Lancelot mantiene el diagnóstico, las tareas y el resultado conectados». No afirmar que Lancelot encuentra automáticamente desperdicio en ERP, reemplaza un BPM, ni produce ahorro probado sin mediciones.

**Ventaja propia buscada:** empaquetar el criterio del consultor en una ruta de entrega repetible (entender problema → observar evidencia → priorizar → rediseñar → pilotear → medir → transferir), con artefactos consistentes y decisiones visibles. El software apoya la consultoría y crea continuidad después del taller; el juicio de INNO IA, las herramientas que la empresa ya usa y la adopción del equipo siguen siendo parte del servicio.

**Paquete inicial a validar, no aún una tarifa:** «Sprint de proceso con resultado verificable». Un proceso, un dueño, alcance acotado; levantamiento con casos reales; línea base y definición operacional de indicador; rediseño y responsabilidades; piloto de una mejora; revisión con datos y plan de transferencia. Lancelot organiza el trabajo interno y produce una vista legible para compartir; hasta que los permisos/membresías estén probados, compartir fuera del consultor mediante exportables revisados, no dando acceso al sistema.

**Segmento inicial como hipótesis:** pymes de servicios y equipos que realizan trabajo recurrente y pueden observar fechas, retrabajo o fallas de primera vez. Validarlo con las oportunidades reales de INNO IA; no fijar aún un sector, tamaño, precio o ROI estándar. Priorizar procesos donde (a) haya repetición suficiente, (b) dueño con autoridad, (c) dolor verificable, (d) datos recuperables y (e) intervención posible en 2–6 semanas. Rechazar proyectos sin patrocinador, acceso a evidencia o criterio de éxito.

**Validación comercial en cuatro semanas:** entrevistar 5 compradores/usuarios de oportunidades existentes; registrar problema, alternativa actual, costo de no resolver, autoridad/presupuesto y objeciones; realizar 2 diagnósticos de muestra (uno interno, uno con prospecto si acepta); ofertar el paquete a 3 oportunidades calificadas. Éxito mínimo a decidir con INNO IA: un piloto pagado o una razón documentada de rechazo que cambie el paquete. No contar elogios ni clics como validación. Registrar horas del consultor, costo de IA/infra, soporte y entregables para fijar precio y margen. Si ninguno paga, no ampliar el software: revisar segmento, dolor, paquete y canal.

**Preguntas de descubrimiento para el comprador:** ¿qué entrega o servicio se demora/rehace? ¿Cuántos casos y de dónde salen sus fechas? ¿Quién es dueño del proceso y puede cambiarlo? ¿Qué ha intentado? ¿Qué resultado justificaría invertir? ¿Qué herramientas ya usa? ¿Quién autoriza presupuesto y datos? ¿Qué información no puede salir de sus sistemas? Esto discrimina consultoría de proceso frente a implementación de IA, automatización o capacitación.

## 5. Experiencia objetivo

Cuatro entradas para la empresa:

1. **Hoy:** tareas propias, compromisos y bloqueos; una siguiente acción con explicación y botón correcto.
2. **Trabajo:** casos con responsable, estado y fecha. Lista y filtros primero; tablero si ayuda a gestionar simultaneidad.
3. **Procesos:** instrucciones vigentes, entrada, acción, resultado esperado y ejemplo. Metodología avanzada bajo detalle del consultor.
4. **Resultados:** cumplimiento, ciclo, reproceso y beneficio sustentado. Cada cifra abre sus casos/mediciones. «Sin datos» no es cero.

Configuración y administración aparte y según permisos. Público/prediagnóstico separado de operación privada. No reconstruir un cockpit.

Ejemplo ficticio de tarea: «INNO IA · Solicitud 024 · Validar alcance. Falta acordar resultado y fecha. Responsable: persona asignada. Para terminar: alcance aceptado y referencia de confirmación. Botón: Registrar acuerdo. Alternativa: Reportar bloqueo». No describe un caso real.

Conservar azul rey/hueso y `lib/design/tokens.ts`. Verificar contraste, etiquetas, teclado y foco; estados no solo por color. Encabezados apilados, tarjetas en móvil, errores junto al campo, guardado pendiente visible. Reemplazar prompts. Probar a 375/390 px con datos largos, formularios llenos y errores, no solamente pantallas vacías. Sin animaciones decorativas.

## 6. Piloto INNO IA: concreto sin inventar su operación

### Descubrimiento

Sesión de 60–90 minutos con Cristian, responsable operativo y ejecutor. Abrir tres casos recientes: normal, atrasado y devuelto. Identificar inicio, registro, esperas, aceptación y evidencias. Dibujar lo que ocurrió, no el procedimiento ideal.

Elegir proceso por recurrencia, demora/reproceso visible, datos disponibles y capacidad de intervenir. Si no tiene dueño o casos observables, no es buen piloto. Salida: ficha de una página con inicio/fin, incluidos/excluidos, dueño, usuarios, inicialmente hasta seis pasos, reglas de cierre y medida principal.

Hipótesis a validar: si presta servicios, «solicitud → calificación → alcance acordado → ejecución → revisión → aceptación». Si no encaja, sustituir el flujo; no desarrollar CRM por el nombre INNO IA.

Capturar al inicio solo qué se pide, solicitante, responsable y compromiso cuando esté acordado. Pedir el resto cuando corresponda. No imponer triage/PEMM a cada solicitud cotidiana.

### Medición y uso

- Recuperar una línea base comparable, con fuente e inicio/fin. Procurar 20 casos recientes si existen; informar muestra real sin fabricar volumen ni bloquear una operación pequeña.
- Medida principal propuesta: mediana entre inicio y aceptación. Separar trabajo/espera si hay captura fiable.
- Controles: aceptados a la primera y entregados a tiempo. Definir denominadores, cancelaciones, pausas y calendario antes de comparar.
- Revisar semanalmente atascos e introducir una mejora identificable, fechada. Exponer cambios en mezcla y capacidad; antes/después por sí solo no prueba causalidad.
- Objetivos de usabilidad: encontrar primera tarea en menos de 60 s; registrar caso en menos de 2 min; 4 de 5 participantes representativos completan recorrido sin ayuda. Con menos participantes, reportar cuántos. Son metas, no resultados actuales.
- Acordar meta operativa después de medir la línea base. No prometer porcentajes inventados. Si no hay uso o mejora, ajustar o retirar lo innecesario.

## 7. Arquitectura mínima y reglas de confianza

### Acceso y modelo

Reutilizar clientes, proyectos, procesos, hallazgos, iniciativas, acciones e indicadores. No cambiar stack ni reescribir todo.

Añadir membresía explícita usuario–empresa y capacidades acotadas: administrador de plataforma invita/revoca; consultor accede a proyectos asignados; responsable ve su operación; ejecutor ve tareas y contexto autorizados. La pertenencia no proviene de un perfil editable. Cada invitado define su contraseña; no compartir cuentas.

Distinguir proyecto de consultoría (intervención), definición de proceso (instrucciones) y caso operativo (una ejecución). Incorporar caso/tarea operativa solo para el flujo confirmado; no usar iniciativa de mejora para representar cada pedido. Conservar versión identificable de instrucciones por caso, sin diseñar un sistema general de versionado/aprobaciones.

Enlaces coherentes por empresa/proyecto, verificados en base además de UI. Auditoría mínima de actor, fecha, recurso y cambio, sin duplicar contenido sensible. Mutaciones relacionadas en una transacción; reintentos no duplican datos. «Completar» requiere evidencia definida para ese paso, no solo cambiar enum.

### Resultados defendibles

1. Medición con unidad, sentido, período, fuente, muestra y método. Vacío o NaN no equivale a cero.
2. Separar línea base, objetivo, seguimiento, proyección anual y beneficio del período. La línea base no suma realizado.
3. Atribución de una oportunidad a iniciativas sin superar 100%; comprobar pérdidas duplicadas entre hallazgos. Hipótesis inciertas no se suman como hechos.
4. Separar caja recurrente, caja puntual, capacidad, costo evitado y calidad/riesgo. Ingreso no equivale a margen.
5. No sumar monedas sin conversión con fuente/fecha. Excluir descartadas y diferenciar propuestas de verificadas.
6. Validación con actor, fecha, evidencia y alcance. Checkbox del consultor no representa aprobación del cliente.
7. Admitir deterioros y efectos negativos. Incluir costos recurrentes, implementación y supuestos de extrapolación.

Ejemplo ficticio: 40 casos/semana pasan de 30 a 20 minutos. Son 400 minutos = 6 h 40 min de capacidad liberada. No son ahorro de nómina sin eliminar un desembolso. Si permiten más entregas, medir utilización y margen antes de monetizar. No son datos de INNO IA.

### Guía e IA

La siguiente acción considera alcance, prerrequisitos, vencimiento, bloqueo y responsable. Estado comercial, fase metodológica y estado de caso son independientes. Criterios compartidos entre servidor e interfaz; documento generado no significa mejora implantada. «No aplica» requiere motivo. Trabajo manual debe avanzar sin IA.

IA opcional para sintetizar evidencia autorizada, proponer pasos y explicar desviaciones; fuentes del proyecto, distinción dato/inferencia y reconocimiento de información faltante. No cambiar permisos, dinero, cierres o compromisos sin confirmación humana.

Cuota durable por empresa/usuario y presupuesto global, concurrencia limitada, caché por versión de entradas y consumo registrado también ante fallos. No añadir servicio pago por defecto. Retirar logs con transcripciones/respuestas completas; revisar minimización por ruta. Evaluación con al menos 20 casos sintéticos: contradicciones, datos insuficientes, mezcla de clientes e instrucciones maliciosas en documentos. Cero filtraciones/acciones no autorizadas es puerta de salida, no promedio de calidad.

## 8. Secuencia de ejecución

Esfuerzo orientativo, no fechas prometidas. Reestimar por bloque. Cristian decide alcance/comercial; desarrollo implementa; responsable INNO IA valida uso.

| Etapa | Trabajo / dependencia | Evidencia para cerrar | Esfuerzo orientativo |
|---|---|---|---|
| E0 · Preparar | Documentación, inventario de entornos/datos y descubrimiento | Lista conservar/demo/pendiente, sin borrar; dueño y ficha del piloto | 1–2 jornadas + sesión |
| E1 · Proteger | SEG-01/02, invitaciones, membresías, relaciones; dos empresas sintéticas | A no lee/escribe B por REST, RPC, URL o exportación; invitado no se eleva; revocación efectiva | 4–7 jornadas |
| E2 · Confiabilidad | IMP-01/02, DAT-01 y MET-01/02 | Sin doble conteo; baseline excluida; rollback real; doble envío no duplica; errores visibles | 4–7 jornadas |
| E3 · Utilidad | Un flujo elegido, casos, Hoy, instrucciones y móvil | Flujo completo, editar/reabrir sin pérdida y pruebas de tareas | 5–8 jornadas |
| E4 · Operación | CI, recuperación, privacidad, hosting y cuotas IA | Recuperar acceso/datos/permisos; despliegue/rollback; funcionar sin IA | 2–4 jornadas |
| E5 · Piloto | Después de E1–E4; casos reales con soporte cercano | Uso, medidas comparables y decisión de continuar/ajustar | 2–3 semanas de observación, según volumen |
| E6 · Oferta | Aprendizajes, plantilla, exportación y soporte | Segunda instalación aislada sin bifurcar código, alcance/costos aceptados | Reestimar tras piloto |

Seguridad y exactitud económica no deben esperar clientes reales. No añadir módulos durante piloto salvo bloqueo demostrado. La próxima implementación empieza por SEG-01/02, no por colores o portal completo.

### Matriz mínima de pruebas

- Dos empresas, dos consultores, invitado y cuenta sin membresía: SELECT/INSERT/UPDATE/DELETE, RPC, exportación, ID cruzado y cambios de rol; Storage si hay archivos.
- Encuestas: anónimo sin token, token A frente a B, inválido y revocado. Revisar filas, no solo columnas.
- Impacto: dos iniciativas/una oportunidad, descartada, baseline última, monedas distintas, inversión cero, valor negativo y dato ausente; sentidos de indicadores.
- Guía: entrevista manual, cliente solo con proyectos cerrados, fallo de Supabase y CTA en cada estado.
- Persistencia: fallo entre escrituras, reintento, concurrencia, ID inexistente y enlace de otro proyecto del mismo consultor.
- Navegador: invitación, login, crear/editar, asignar, bloquear, cerrar con evidencia, resultado, sesión expirada y teclado; 375/390 px y escritorio.
- Fixtures identificados solo en entorno de pruebas. Producción: comprobaciones no destructivas del despliegue, sin sembrar registros en proyectos reales.

## 9. Limpieza, operación y venta

**Limpieza segura:** esta entrega organiza documentación únicamente. No borrar OdontoVida, entrevistas, leads, tokens o cuentas por suponer que son pruebas. Preparar inventario por ID, propietario y dependencias, con archivo/recuperación. Limpiar datos solo con objetivos exactos aprobados y copia recuperable. No reescribir migraciones aplicadas.

**Backup:** el workflow cifra con GPG y retiene artefactos 30 días; no publica el dump plano como Release. Falta acreditar una ejecución reciente y restaurar integralmente, no solo `public` con Auth simulado. Recuperar esquema, permisos, identidad necesaria, configuración y archivos si existen. Custodiar clave de descifrado fuera del único sistema a recuperar. Proponer pérdida máxima de 24 h y recuperación en 4 h; validarlas en ensayo antes de prometerlas.

**Despliegue:** CI con lint/tests/build y aislamiento en pruebas. Migraciones compatibles, copia previa y reversión ensayada; revertir código no revierte datos automáticamente. No usar datos reales/secretos de producción en previews. Seguir guías locales Next para corregir avisos, no asumir equivalencia con Next 15.

**Costo comercial:** no se confirmó el plan contratado de Vercel. Hobby restringe uso a personal no comercial. Antes de vender, verificar y aprobar plan compatible o evaluar alternativa. Preferir continuar en Vercel si el costo autorizado lo permite; no se contrató nada. [Condiciones Hobby](https://vercel.com/docs/plans/hobby).

**Oferta recomendada:** piloto de un proceso con alcance fijo, seguido de licencia/soporte separados de consultoría. Entregar flujo operativo, responsables, instrucciones, línea base, tablero trazable y revisión. No vender IA ilimitada, personalización infinita, ahorro garantizado ni «1000% de mejora».

Medir horas de implementación, soporte semanal, preparación de informes y costo técnico/IA por cliente. Determinar precio con estos costos y el servicio pactado, no inventar tarifa. Acordar facturación con INNO IA y exportación de datos al cliente.

Fuera de esta etapa: ERP/CRM completo, simulación BPMN, marketplace, benchmarking externo, constructor universal de automatizaciones, app nativa y agentes autónomos. Conservar capacidades útiles existentes; no fabricar entidades para completar una lista.

## 10. Pendientes y próxima entrega

Confirmado: INNO IA ofrece consultoría de innovación, IA y mejoramiento de procesos; existe intención comercial y deseo de conservar control del producto. Pendiente: mezcla de servicios/segmento actual, proceso prioritario dentro de INNO IA, dueño operativo, usuarios, acuerdo comercial, plan real de hosting y presupuesto. La sesión E0 resuelve lo operativo sin pedir al usuario que diseñe el sistema.

Próximo paso: publicar el código y comprobar acceso del propietario. Ejecutar la prueba de aislamiento de futuros usuarios de cliente solo en un proyecto de prueba. Los documentos anteriores permanecen como antecedentes, no garantías actuales.
