# NEXUS IA PROCESS — Commercial Readiness / Production Hardening

Fecha de corte: 2026-09-26. Fuente: código, migraciones, pruebas, panel Supabase y `NEXUS_AUDITORIA_PRODUCTO_2026-09-25.md`. Estado general: **NO READY FOR PILOT** y **NO READY FOR CLIENT ACCESS**. PASS significa prueba ejecutada y evidencia observable; un diseño o una prueba omitida no es PASS.

ADAPTA OS y NEXUS IA PROCESS son el mismo producto. En Supabase, el proyecto ADAPTA OS está en la rama `main / PRODUCTION`; staging sería el mismo producto y código conectado a una base aislada, no una aplicación distinta.

Verificación local del incremento: `npm test` **149 PASS / 16 SKIP** (los SKIP requieren Supabase real); `npm run lint` y `npm run build` PASS. [GitHub Actions #36193825123](https://github.com/cristianuis/ADAPTA-PROCESS/actions/runs/36193825123) terminó **Success** con `RUN_RLS_INTEGRATION=1` y Supabase efímero: aplica 0001–0026 y ejecuta las 16 integraciones, incluida la prueba negativa de Storage. Los 16 SKIP locales no se contabilizan como PASS locales; sí fueron ejecutados en CI. Esto no equivale a staging hospedado ni a E2E de producto.

## Umbrales innegociables

**READY FOR PILOT**: un consultor administrador completa una intervención sintética y una intervención acompañada con la primera empresa, de alta a Informe 360, sin modificación manual de datos ni riesgo crítico conocido; cada conclusión importante tiene fuente; informe descargable y recuperable; RLS y backup/restauración de base y archivos verificados en test; fallos de IA y sesión no exponen datos. Puede ser operado solo por el consultor, sin cuentas cliente.

**READY FOR CLIENT ACCESS**: además de READY FOR PILOT, dos organizaciones independientes y sus seis roles mínimos pueden entrar y actuar solo dentro de su ámbito; RLS, Storage, reportes, invitación/revocación, URL/API directa, concurrencia, auditoría y recuperación están probados mediante clientes autenticados reales en staging. No basta una comprobación visual de UI.

## Matriz de evidencia

| Control | Estado | Evidencia disponible / razón de no PASS |
| --- | --- | --- |
| Alta de empresa e intervención | PARTIAL | Formularios, tablas y acciones existen; falta ejecutar una intervención sintética completa en staging |
| Documentos empresariales | FAIL | No hay carga privada/versionada, extracción ni referencia de página para documentos fuente; el DOCX final sí usa Storage privado |
| Entrevista → hallazgo → evidencia | PARTIAL | Cotejo literal implementado para entrevista; referencias documentales/observacionales son manuales; falta persistencia y prueba E2E |
| AS-IS, diagnóstico, PEMM, RACI | PARTIAL | Entidades/pantallas implementadas; RACI deriva de actividades; no hay prueba integral ni rúbrica de madurez empresarial global |
| Riesgos y causa raíz | FAIL | No hay registro formal de riesgo/control ni árbol de causas persistido y validado para el recorrido solicitado |
| TO-BE, mejora, roadmap y KPI | PARTIAL | Persistencia disponible; operaciones compuestas no siempre atómicas; falta prueba de concurrencia y recorrido real |
| Informe 360 y recuperación | PARTIAL | DOCX generado y guardado en bucket privado; puerta de preparación ahora exige hallazgo con soporte y TO-BE vinculado; descarga y fuga entre tenants no probadas en staging |
| Seguridad multiempresa / RBAC | FAIL | Solo existe consultor administrador global; no hay membresías/roles por organización |
| RLS entre organizaciones | PARTIAL | CI aislado comprobó clientes, proyectos, iniciativas, RPCs y binarios de informes con dos consultores; faltan seis roles, matriz A/B exhaustiva en todas las entidades y tenant organizacional real |
| Integración Supabase | PARTIAL | 16 integraciones reales pasaron en Supabase efímero en CI #36193825123; falta staging hospedado persistente, seed y recorrido completo |
| Staging hospedado | FAIL | Verificado en dashboard 2026-09-26: la organización Free usa sus 2 proyectos activos y bloquea crear un tercero. El proyecto ADAPTA OS ofrece branching solo tras upgrade a Pro; el branch de vista previa cuesta desde USD 0.01344/h y la documentación advierte que ese uso no está cubierto por el spend cap. Los branches son data-less por defecto (sin filas ni objetos Storage de producción). No se creó un branch, no se actualizó el plan ni se incurrieron costos. |
| E2E automatizado | FAIL | No hay suite de navegador contra aplicación + Supabase test; tests unitarios no sustituyen E2E |
| Autenticación, invitación y revocación | FAIL | Login privado del administrador; no hay invitación/roles de cliente ni prueba de desactivación/sesión revocada |
| Auditoría y concurrencia | FAIL | No hay trazabilidad suficiente de cada acción sensible ni control de versión de todas las escrituras críticas |
| Backup de base | PARTIAL | Workflow cifra dump y restaura esquema/datos en Postgres temporal; falta evidencia de ejecución actual y prueba de recuperación del servicio completo |
| Backup de archivos | FAIL | El dump PostgreSQL no conserva por sí mismo los binarios de Supabase Storage |
| Manejo de errores | PARTIAL | Varias rutas devuelven errores explícitos; faltan pruebas de fallos de red, IA, Storage y escritura parcial |
| Evidencia/IA/economía sin certeza falsa | PARTIAL | Citas IA filtradas y revisión humana; se corrigió puerta de informe y texto de validación de cliente; otras referencias siguen siendo manuales |
| Experiencia de cliente | FAIL | Portal e identidad de cliente no implementados; no debe habilitarse acceso todavía |

## Caso E2E sintético obligatorio, aún NO ejecutado

Empresa ficticia: **Operadora Nómada S.A.S.**, sin datos de personas reales. Problema: solicitudes de servicio se duplican entre correo y hoja de cálculo; proceso de recepción y asignación. Dos usuarios sintéticos de organizaciones A/B deberán demostrar que B no ve nada de A. El caso A debe crear empresa, intervención, documento de procedimiento, dos entrevistas, hallazgo con cita cotejada, SIPOC y actividades con RACI, PEMM con respaldo, riesgo/causa, oportunidad, TO-BE soportado, iniciativa/acciones, indicador de tiempo de ciclo (`menor_es_mejor`), línea base y seguimiento, DOCX final y descarga. Se debe comprobar cada lectura tras escribir, invalidar sesión y repetir una URL/API directa. Los módulos inexistentes arriba son rupturas conocidas: no se saltarán para llamar E2E al resultado.

## Modelo RBAC diseñado, NO implementado

La unidad de aislamiento será `clientes.id` como organización, con membresía activa explícita `(cliente_id, user_id, rol)`; `proyectos.cliente_id` y cada descendiente deberán heredar el mismo tenant mediante FK compuesta o ruta relacional verificable. El administrador global actual solo podrá migrar datos/gestionar la plataforma, no será la regla ordinaria de autorización entre empresas. Las invitaciones no activarán acceso hasta aceptarse y asociarse a la membresía; la revocación deberá invalidar de inmediato la siguiente petición, no depender de un claim JWT obsoleto.

| Rol | Alcance previsto |
| --- | --- |
| `owner` | Titular de organización, membresías y todos sus proyectos |
| `consultant` | Trabaja en proyectos asignados, crea propuestas e informes, sin administrar titularidad |
| `client_admin` | Supervisa proyectos y usuarios de su empresa, valida entregables, sin acceder a otras empresas |
| `process_owner` | Edita y valida únicamente procesos que tiene asignados |
| `collaborator` | Aporta entrevistas/evidencia y acciones asignadas, sin publicar conclusiones |
| `viewer` | Lectura de entregables y datos expresamente publicados para su organización |

La autorización debe ser *deny by default*: lectura/escritura distintas por tabla y operación, con pruebas directas PostgREST/RPC/Storage para cada rol. Un rol en la interfaz no constituye una política RLS. El detalle de asignación por proyecto y visibilidad de borradores se cerrará con pruebas sintéticas antes de habilitar cuentas cliente.

## Cambios de hardening de este tramo

- Las pruebas de integración ahora requieren `TEST_SUPABASE_*` exclusivos, referencia de proyecto coincidente y rechazo explícito del proyecto productivo conocido. La prueba RLS de token crea y elimina su propia empresa sintética; dejó de usar el primer proyecto disponible.
- El workflow manual `staging-integration.yml` ejecutará las pruebas con secretos exclusivos de staging una vez exista el proyecto; su presencia en el repositorio no demuestra una ejecución exitosa.
- El Informe 360 solo cuenta hallazgos con soporte textual suficiente; una cita cotejada exige fuente de entrevista identificable. Para habilitar TO-BE debe existir un paso soportado por un hallazgo revisado. El reporte ya no presenta la marca booleana del consultor como aprobación independiente del cliente.
- La misma comprobación de soporte se usa en la guía de avance, matriz y selección de hallazgos TO-BE. La coincidencia por prefijo de rutas públicas se cerró (`/login-interno` ya no se considera pública).
- `0025_fase_con_evidencia_soportada.sql` prepara la alineación de la fase persistida con esos requisitos y el recálculo al cambiar pasos TO-BE. **Pendiente de aplicar y probar en staging; no desplegado en producción.**
- `0026_integridad_cliente_proyecto.sql` impide por FK compuesta que un proyecto apunte a un cliente de otro consultor, incluso mediante API directa. Se incorporan pruebas negativas de cruce entre clientes, proyectos, iniciativas y binarios de informes en Storage; **no desplegado en producción**.

## Incidencias abiertas y secuencia de cierre

1. P0: habilitar Supabase staging **separado**. La organización Free ya usa sus dos espacios de proyecto. La vía directa de proyecto nuevo exige pausar/eliminar otro proyecto; la vía branch desde ADAPTA OS es data-less por defecto, pero el panel exige Pro y factura cómputo desde USD 0.01344/h (el branching no está cubierto por Spend Cap). El propietario debe efectuar cualquier upgrade/pago; mientras tanto solo se usa CI efímero, que aplicó 0001–0026 y pasó las 16 integraciones. No aplicar 0025/0026 a producción ni reutilizar `.env.local` o datos productivos.
2. P0: ejecutar el caso sintético completo, corregir bloqueos funcionales, introducir repositorio documental privado mínimo y capturar una prueba de restauración que incluya los binarios.
3. P0: asegurar integridad transaccional y optimismo/concurrencia en iniciativas, validación IA, TO-BE y entregables; verificar con dos sesiones.
4. P0 para acceso cliente: modelo de organización/membresía `owner`, `consultant`, `client_admin`, `process_owner`, `collaborator`, `viewer`, RLS de todas las entidades y Storage. Aplicar primero en staging y someter a pruebas negativas A/B antes de producción.
5. P1: auditoría de acciones sensibles, revocación/invitación/desactivación, recuperación de borrados, suite E2E de navegador y prueba con primera empresa acompañada.

## Riesgos residuales

Un dump de DB restaurado no prueba recuperación de archivos. El booleano `validado_cliente` no registra identidad, fecha o aceptación independiente. La escala PEMM describe una evaluación específica y no constituye un índice global de madurez. Las integraciones que aparecen como SKIP en la ejecución local sí corren en CI aislado; ninguna prueba de flujo completo ni de seis roles se ha ejecutado. Ningún dato de clientes se insertó en test; solo fixtures sintéticos en el runner efímero.
