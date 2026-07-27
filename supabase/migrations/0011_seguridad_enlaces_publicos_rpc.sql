-- ADAPTA OS ? Seguridad de enlaces p?blicos por token
--
-- Corrige la fuga causada por pol?ticas RLS que usaban `token is not null`.
-- El rol anon deja de acceder directamente a las tablas. Las p?ginas p?blicas
-- solo pueden leer/responder mediante RPCs SECURITY DEFINER que exigen un token
-- UUID exacto y exponen ?nicamente las columnas necesarias.

begin;

-- 1. Cerrar el acceso directo defectuoso.
drop policy if exists "lectura publica de pemm via token"
  on public.pemm_evaluaciones;
drop policy if exists "respuesta publica de pemm via token"
  on public.pemm_evaluaciones;
drop policy if exists "lectura publica de entrevista via token"
  on public.entrevistas;
drop policy if exists "respuesta publica de entrevista via token"
  on public.entrevistas;

revoke all privileges on table public.pemm_evaluaciones from anon;
revoke all privileges on table public.entrevistas from anon;

-- El trigger de 0007 proteg?a columnas frente al UPDATE directo de anon.
-- Ya no es necesario y bloquear?a la invalidaci?n at?mica del token desde el RPC.
drop trigger if exists trg_proteger_pemm_publico
  on public.pemm_evaluaciones;
drop function if exists public.proteger_columnas_pemm_publico();

-- 2. Invalidar todos los enlaces emitidos bajo las pol?ticas vulnerables.
-- Al momento de la auditor?a: 0 PEMM y 1 entrevista respondida de prueba.
-- Si se crea un enlace entre la auditor?a y la aplicaci?n de esta migraci?n,
-- tambi?n se invalida de forma segura y deber? generarse nuevamente desde la UI.
do $$
begin
  if to_regprocedure('public.obtener_pemm_publico(uuid)') is null
     and to_regprocedure('public.obtener_intake_publico(uuid)') is null
  then
    update public.pemm_evaluaciones
    set token = null
    where token is not null;

    update public.entrevistas
    set token = null
    where token is not null;
  end if;
end;
$$;

-- 3. Lectura p?blica m?nima de una invitaci?n PEMM.
drop function if exists public.obtener_pemm_publico(uuid);
create function public.obtener_pemm_publico(p_token uuid)
returns table (
  token uuid,
  estado text,
  tipo text,
  proceso_evaluado text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    evaluacion.token,
    evaluacion.estado,
    evaluacion.tipo,
    evaluacion.proceso_evaluado
  from public.pemm_evaluaciones as evaluacion
  where evaluacion.token = p_token
  limit 1;
$$;

revoke all on function public.obtener_pemm_publico(uuid) from public;
grant execute on function public.obtener_pemm_publico(uuid) to anon, authenticated;

-- 4. Respuesta PEMM de un solo uso. El nivel resultante se calcula en la base
-- para que un consumidor directo del RPC no pueda enviar un valor inconsistente.
drop function if exists public.responder_pemm_publico(
  uuid, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
);
create function public.responder_pemm_publico(
  p_token uuid,
  p_diseno integer default null,
  p_ejecutores integer default null,
  p_responsable integer default null,
  p_infraestructura integer default null,
  p_indicadores integer default null,
  p_liderazgo integer default null,
  p_cultura integer default null,
  p_experiencia integer default null,
  p_gobierno integer default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tipo text;
begin
  select evaluacion.tipo
  into v_tipo
  from public.pemm_evaluaciones as evaluacion
  where evaluacion.token = p_token
    and evaluacion.estado = 'pendiente'
  for update;

  if not found then
    return false;
  end if;

  if v_tipo = 'proceso' then
    if p_diseno is null or p_diseno not between 1 and 4
       or p_ejecutores is null or p_ejecutores not between 1 and 4
       or p_responsable is null or p_responsable not between 1 and 4
       or p_infraestructura is null or p_infraestructura not between 1 and 4
       or p_indicadores is null or p_indicadores not between 1 and 4
    then
      return false;
    end if;

    update public.pemm_evaluaciones
    set diseno = p_diseno,
        ejecutores = p_ejecutores,
        responsable = p_responsable,
        infraestructura = p_infraestructura,
        indicadores = p_indicadores,
        nivel_resultante = least(
          p_diseno,
          p_ejecutores,
          p_responsable,
          p_infraestructura,
          p_indicadores
        ),
        estado = 'respondida',
        token = null
    where token = p_token
      and estado = 'pendiente';
  elsif v_tipo = 'empresa' then
    if p_liderazgo is null or p_liderazgo not between 1 and 4
       or p_cultura is null or p_cultura not between 1 and 4
       or p_experiencia is null or p_experiencia not between 1 and 4
       or p_gobierno is null or p_gobierno not between 1 and 4
    then
      return false;
    end if;

    update public.pemm_evaluaciones
    set liderazgo = p_liderazgo,
        cultura = p_cultura,
        experiencia = p_experiencia,
        gobierno = p_gobierno,
        nivel_resultante = least(
          p_liderazgo,
          p_cultura,
          p_experiencia,
          p_gobierno
        ),
        estado = 'respondida',
        token = null
    where token = p_token
      and estado = 'pendiente';
  else
    return false;
  end if;

  return found;
end;
$$;

revoke all on function public.responder_pemm_publico(
  uuid, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) from public;
grant execute on function public.responder_pemm_publico(
  uuid, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) to anon, authenticated;

-- 5. Lectura p?blica m?nima de una invitaci?n de autoservicio.
drop function if exists public.obtener_intake_publico(uuid);
create function public.obtener_intake_publico(p_token uuid)
returns table (
  token uuid,
  estado text,
  entrevistado_nombre text,
  entrevistado_cargo text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    entrevista.token,
    entrevista.estado,
    entrevista.entrevistado_nombre,
    entrevista.entrevistado_cargo
  from public.entrevistas as entrevista
  where entrevista.token = p_token
    and entrevista.origen = 'autoservicio'
  limit 1;
$$;

revoke all on function public.obtener_intake_publico(uuid) from public;
grant execute on function public.obtener_intake_publico(uuid) to anon, authenticated;

-- 6. Respuesta de autoservicio de un solo uso.
drop function if exists public.responder_intake_publico(uuid, text, text, text);
create function public.responder_intake_publico(
  p_token uuid,
  p_entrevistado_nombre text,
  p_entrevistado_cargo text,
  p_transcripcion text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_token is null
     or p_entrevistado_nombre is null
     or char_length(trim(p_entrevistado_nombre)) < 2
     or p_entrevistado_cargo is null
     or char_length(trim(p_entrevistado_cargo)) < 2
     or p_transcripcion is null
     or char_length(trim(p_transcripcion)) < 40
  then
    return false;
  end if;

  update public.entrevistas
  set entrevistado_nombre = trim(p_entrevistado_nombre),
      entrevistado_cargo = trim(p_entrevistado_cargo),
      transcripcion = p_transcripcion,
      estado = 'respondida',
      token = null
  where token = p_token
    and estado = 'pendiente'
    and origen = 'autoservicio';

  return found;
end;
$$;

revoke all on function public.responder_intake_publico(uuid, text, text, text)
  from public;
grant execute on function public.responder_intake_publico(uuid, text, text, text)
  to anon, authenticated;

commit;
