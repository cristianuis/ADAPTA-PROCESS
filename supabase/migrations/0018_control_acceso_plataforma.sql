-- Cierra el autoaprovisionamiento de consultores y restringe funciones
-- privilegiadas que aceptan IDs de proyectos.
-- La asignación inicial solo se hace automáticamente si existe exactamente
-- un perfil consultor. Si hay cero o varios, no se elige una cuenta a ciegas.

begin;

create schema if not exists lancelot_private;
revoke all on schema lancelot_private from public, anon, authenticated;

create table if not exists lancelot_private.administradores_plataforma (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table lancelot_private.administradores_plataforma enable row level security;
revoke all on table lancelot_private.administradores_plataforma from public, anon, authenticated;

-- Bootstrap seguro para la instalación actual conocida (un consultor).
-- Si hay más de uno, el operador identifica al propietario y lo añade desde
-- SQL Editor siguiendo las instrucciones al final de este archivo.
do $$
begin
  if (select count(*) from public.consultores) = 1 then
    insert into lancelot_private.administradores_plataforma (user_id)
    select consultor.user_id
    from public.consultores as consultor
    on conflict (user_id) do nothing;
  end if;
end;
$$;

create or replace function lancelot_private.es_administrador_plataforma(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from lancelot_private.administradores_plataforma as administrador
    where administrador.user_id = p_user_id
  );
$$;
revoke all on function lancelot_private.es_administrador_plataforma(uuid)
  from public, anon, authenticated;

create or replace function lancelot_private.puede_acceder_proyecto(p_proyecto_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.role()) = 'service_role', false)
    or lancelot_private.es_administrador_plataforma((select auth.uid()))
    or exists (
      select 1
      from public.proyectos as proyecto
      join public.consultores as consultor
        on consultor.id = proyecto.consultor_id
      where proyecto.id = p_proyecto_id
        and consultor.user_id = (select auth.uid())
    );
$$;
revoke all on function lancelot_private.puede_acceder_proyecto(uuid)
  from public, anon, authenticated;

create or replace function public.es_administrador_lancelot()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lancelot_private.es_administrador_plataforma((select auth.uid()));
$$;
revoke all on function public.es_administrador_lancelot() from public, anon;
grant execute on function public.es_administrador_lancelot() to authenticated;

-- El registro autenticado ya no basta para crear una identidad consultora.
drop policy if exists "consultor ve y edita su propio perfil" on public.consultores;
drop policy if exists "consultor lee su propio perfil" on public.consultores;
drop policy if exists "admin administra perfiles de consultor" on public.consultores;

create policy "consultor lee su propio perfil"
  on public.consultores for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.es_administrador_lancelot()
  );

create policy "admin administra perfiles de consultor"
  on public.consultores for all to authenticated
  using (public.es_administrador_lancelot())
  with check (public.es_administrador_lancelot());

-- Solo el dueño del proyecto, un administrador o el backend privilegiado
-- puede solicitar el recálculo. El cálculo interno no se publica como RPC.
revoke all on function public.calcular_fase_metodologica(uuid)
  from public, anon, authenticated;
grant execute on function public.calcular_fase_metodologica(uuid) to service_role;

create or replace function public.recalcular_fase_metodologica(p_proyecto_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fase text;
begin
  if not lancelot_private.puede_acceder_proyecto(p_proyecto_id) then
    raise exception 'Acceso denegado'
      using errcode = '42501';
  end if;

  v_fase := public.calcular_fase_metodologica(p_proyecto_id);

  update public.proyectos
  set fase_metodologica = v_fase
  where id = p_proyecto_id
    and fase_metodologica is distinct from v_fase;

  return v_fase;
end;
$$;
revoke all on function public.recalcular_fase_metodologica(uuid)
  from public, anon;
grant execute on function public.recalcular_fase_metodologica(uuid)
  to authenticated, service_role;

-- La lista de prospectos contiene datos personales: limitarla al propietario
-- de plataforma, no a cualquier usuario que haya obtenido perfil consultor.
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
  if not lancelot_private.es_administrador_plataforma((select auth.uid())) then
    raise exception 'Acceso denegado'
      using errcode = '42501';
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

-- Si el bootstrap automático no asignó administrador, ejecuta UNA VEZ desde
-- Supabase SQL Editor después de reemplazar el correo por el del propietario:
-- Primero confirma que el SELECT siguiente devuelve una sola fila:
-- select id, email from auth.users where lower(email) = lower('TU_CORREO_ADMIN');
-- insert into lancelot_private.administradores_plataforma (user_id)
-- select id from auth.users where lower(email) = lower('TU_CORREO_ADMIN');
-- Verifica que insertó exactamente una fila antes de permitir invitaciones.
