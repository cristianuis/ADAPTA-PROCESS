-- Demo publica de diagnostico. Captura prospectos sin conceder acceso directo
-- a la tabla ni exponer el sistema interno de ADAPTA OS.

begin;

create table if not exists public.demo_diagnosticos (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  nombre text not null,
  email text not null,
  empresa text not null,
  consentimiento_contacto boolean not null default false,
  estado text not null default 'iniciado',
  respuestas smallint[],
  puntaje smallint,
  perfil text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'demo_diagnosticos_estado_check'
      and conrelid = 'public.demo_diagnosticos'::regclass
  ) then
    alter table public.demo_diagnosticos
      add constraint demo_diagnosticos_estado_check
      check (estado in ('iniciado', 'completado'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'demo_diagnosticos_perfil_check'
      and conrelid = 'public.demo_diagnosticos'::regclass
  ) then
    alter table public.demo_diagnosticos
      add constraint demo_diagnosticos_perfil_check
      check (
        perfil is null
        or perfil in (
          'dependencia_operativa',
          'transicion_operativa',
          'sistema_en_desarrollo'
        )
      );
  end if;
end;
$$;

create index if not exists demo_diagnosticos_created_at_idx
  on public.demo_diagnosticos (created_at desc);
create index if not exists demo_diagnosticos_email_lower_idx
  on public.demo_diagnosticos (lower(email));

alter table public.demo_diagnosticos enable row level security;

revoke all on table public.demo_diagnosticos from anon, authenticated;

create or replace function public.iniciar_demo_diagnostico(
  p_nombre text,
  p_email text,
  p_empresa text,
  p_consentimiento boolean,
  p_sitio_web text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token uuid;
  v_nombre text := trim(coalesce(p_nombre, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_empresa text := trim(coalesce(p_empresa, ''));
begin
  -- Campo trampa: los navegadores humanos no lo completan.
  if trim(coalesce(p_sitio_web, '')) <> '' then
    raise exception 'Solicitud no valida';
  end if;

  if char_length(v_nombre) not between 2 and 100 then
    raise exception 'Nombre no valido';
  end if;
  if char_length(v_empresa) not between 2 and 140 then
    raise exception 'Empresa no valida';
  end if;
  if char_length(v_email) > 254
    or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  then
    raise exception 'Correo no valido';
  end if;
  if p_consentimiento is not true then
    raise exception 'Se requiere autorizacion de contacto';
  end if;

  -- Reutiliza un inicio reciente para evitar duplicados por doble clic.
  select demo.token
  into v_token
  from public.demo_diagnosticos as demo
  where lower(demo.email) = v_email
    and demo.estado = 'iniciado'
    and demo.created_at > now() - interval '10 minutes'
  order by demo.created_at desc
  limit 1;

  if v_token is not null then
    return v_token;
  end if;

  insert into public.demo_diagnosticos (
    nombre,
    email,
    empresa,
    consentimiento_contacto
  )
  values (
    v_nombre,
    v_email,
    v_empresa,
    true
  )
  returning token into v_token;

  return v_token;
end;
$$;

revoke all on function public.iniciar_demo_diagnostico(
  text, text, text, boolean, text
) from public;
grant execute on function public.iniciar_demo_diagnostico(
  text, text, text, boolean, text
) to anon, authenticated;

create or replace function public.completar_demo_diagnostico(
  p_token uuid,
  p_respuestas smallint[]
)
returns table (
  p_perfil text,
  p_puntaje smallint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_puntaje smallint;
  v_perfil text;
begin
  if p_token is null
    or coalesce(array_length(p_respuestas, 1), 0) <> 5
    or exists (
      select 1
      from unnest(p_respuestas) as respuesta
      where respuesta < 0 or respuesta > 2
    )
  then
    raise exception 'Respuestas no validas';
  end if;

  select demo.perfil, demo.puntaje
  into v_perfil, v_puntaje
  from public.demo_diagnosticos as demo
  where demo.token = p_token
    and demo.created_at > now() - interval '24 hours';

  if not found then
    raise exception 'Diagnostico no encontrado o vencido';
  end if;

  if v_perfil is not null and v_puntaje is not null then
    return query select v_perfil, v_puntaje;
    return;
  end if;

  select sum(respuesta)::smallint
  into v_puntaje
  from unnest(p_respuestas) as respuesta;

  v_perfil := case
    when v_puntaje <= 3 then 'dependencia_operativa'
    when v_puntaje <= 7 then 'transicion_operativa'
    else 'sistema_en_desarrollo'
  end;

  update public.demo_diagnosticos
  set
    respuestas = p_respuestas,
    puntaje = v_puntaje,
    perfil = v_perfil,
    estado = 'completado',
    completed_at = now()
  where token = p_token;

  return query select v_perfil, v_puntaje;
end;
$$;

revoke all on function public.completar_demo_diagnostico(
  uuid, smallint[]
) from public;
grant execute on function public.completar_demo_diagnostico(
  uuid, smallint[]
) to anon, authenticated;

create or replace function public.listar_prospectos_demo()
returns table (
  id uuid,
  nombre text,
  email text,
  empresa text,
  estado text,
  puntaje smallint,
  perfil text,
  created_at timestamptz,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not exists (
      select 1
      from public.consultores as consultor
      where consultor.user_id = (select auth.uid())
    )
  then
    raise exception 'Acceso denegado';
  end if;

  return query
  select
    demo.id,
    demo.nombre,
    demo.email,
    demo.empresa,
    demo.estado,
    demo.puntaje,
    demo.perfil,
    demo.created_at,
    demo.completed_at
  from public.demo_diagnosticos as demo
  order by demo.created_at desc
  limit 200;
end;
$$;

revoke all on function public.listar_prospectos_demo() from public, anon;
grant execute on function public.listar_prospectos_demo() to authenticated;

commit;
