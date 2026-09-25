# Arquitectura propuesta para el portal de clientes

> Propuesta no implementada ni verificación de permisos. Desde el 2026-09-24 prevalece el [plan INNO IA](LANCELOT_INNO_IA_PLAN_MAESTRO_2026-09.md). Los roles descritos aquí son antecedentes, no garantía de aislamiento actual.

El portal no debe reutilizar el panel del consultor. Son dos superficies con
permisos y recorridos diferentes.

## Roles

- `administrador`: Cristian Alfonso. Control total sobre prospectos, clientes,
  proyectos, diagnósticos y configuración.
- `cliente`: usuario invitado y asignado a una empresa concreta. Sin capacidad
  para crear clientes, cambiar metodología o consultar otras organizaciones.

## Acceso

1. El registro público permanece deshabilitado.
2. El administrador invita al cliente desde una acción de servidor mediante
   Supabase Auth Admin.
3. La invitación se vincula explícitamente con `cliente_id`.
4. El cliente define su contraseña desde el enlace de invitación.
5. El middleware dirige cada rol a una superficie distinta.

## Primera versión del portal

El cliente solo debería consultar:

- perfil de su empresa;
- proyectos que le fueron asignados;
- estado comercial y fase metodológica;
- entregables marcados como visibles para cliente.

No debería consultar entrevistas individuales, prompts, notas internas,
costos, biblioteca del consultor ni configuración.

## Frontera de seguridad

La autorización se debe aplicar en PostgreSQL/RLS o en RPC autenticadas que
validen `auth.uid()` y la asignación a `cliente_id`. Ocultar botones en React no
es una medida de autorización.

La invitación usa la clave secreta exclusivamente en servidor. Nunca se expone
la service-role key al navegador.
