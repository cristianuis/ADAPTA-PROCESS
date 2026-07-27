-- Separa el estado comercial (decision del consultor) de la fase metodologica
-- (derivada automaticamente de los hitos del recorrido guiado).

begin;

alter table public.proyectos
  add column if not exists estado_comercial text not null default 'prospecto',
  add column if not exists fase_metodologica text not null default 'contextualizacion';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'proyectos_estado_comercial_check'
      and conrelid = 'public.proyectos'::regclass
  ) then
    alter table public.proyectos
      add constraint proyectos_estado_comercial_check
      check (estado_comercial in ('prospecto', 'contratado', 'pausado', 'cerrado'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'proyectos_fase_metodologica_check'
      and conrelid = 'public.proyectos'::regclass
  ) then
    alter table public.proyectos
      add constraint proyectos_fase_metodologica_check
      check (
        fase_metodologica in (
          'contextualizacion',
          'definicion',
          'arquitectura',
          'pilotaje',
          'transferencia',
          'anclaje'
        )
      );
  end if;
end;
$$;

-- Migracion del campo legado. Un proyecto con evidencia metodologica ya no
-- puede seguir apareciendo como prospecto aunque el valor anterior lo dijera.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'proyectos'
      and column_name = 'estado'
  ) then
    execute $migracion$
      update public.proyectos as proyecto
      set estado_comercial = case
        when proyecto.estado = 'cerrado' then 'cerrado'
        when proyecto.estado = 'prospecto'
          and not exists (
            select 1 from public.triage_respuestas t where t.proyecto_id = proyecto.id
          )
          and not exists (
            select 1 from public.pemm_evaluaciones p where p.proyecto_id = proyecto.id
          )
          and not exists (
            select 1 from public.entrevistas e where e.proyecto_id = proyecto.id
          )
          and not exists (
            select 1 from public.hallazgos h where h.proyecto_id = proyecto.id
          )
          and not exists (
            select 1 from public.entregables en where en.proyecto_id = proyecto.id
          )
          and not exists (
            select 1 from public.procesos pr where pr.proyecto_id = proyecto.id
          )
          and not exists (
            select 1 from public.auditorias_adopcion a where a.proyecto_id = proyecto.id
          )
        then 'prospecto'
        else 'contratado'
      end
    $migracion$;
  end if;
end;
$$;

create or replace function public.calcular_fase_metodologica(
  p_proyecto_id uuid
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    -- Paso 12 completo: la adopcion ya se audita y entra en anclaje.
    when exists (
      select 1
      from public.auditorias_adopcion as auditoria
      where auditoria.proyecto_id = p_proyecto_id
    ) then 'anclaje'

    -- Paso 11 completo: existe manual para transferir la operacion.
    when exists (
      select 1
      from public.entregables as entregable
      where entregable.proyecto_id = p_proyecto_id
        and entregable.tipo = 'manual'
    ) then 'transferencia'

    -- Paso 10 completo: al menos un proceso critico tiene arquitectura minima.
    when exists (
      select 1
      from public.procesos as proceso
      where proceso.proyecto_id = p_proyecto_id
        and nullif(trim(proceso.dueno_nombre), '') is not null
        and exists (
          select 1 from public.sipoc as s where s.proceso_id = proceso.id
        )
        and exists (
          select 1 from public.actividades as actividad
          where actividad.proceso_id = proceso.id
        )
        and exists (
          select 1
          from public.indicadores as indicador
          where indicador.proceso_id = proceso.id
            and nullif(trim(indicador.fuente_datos), '') is not null
        )
    ) then 'pilotaje'

    -- Paso 9 completo: procesos criticos y responsables definidos.
    when exists (
      select 1
      from public.procesos as proceso
      where proceso.proyecto_id = p_proyecto_id
        and nullif(trim(proceso.dueno_nombre), '') is not null
    ) then 'arquitectura'

    -- Paso 8 completo: diagnostico consolidado, comienza definicion.
    when exists (
      select 1
      from public.entregables as entregable
      where entregable.proyecto_id = p_proyecto_id
        and entregable.tipo = 'diagnostico'
    ) then 'definicion'

    -- Pasos 1 a 8 en progreso.
    else 'contextualizacion'
  end;
$$;

revoke all on function public.calcular_fase_metodologica(uuid) from public;
grant execute on function public.calcular_fase_metodologica(uuid)
  to authenticated, service_role;

create or replace function public.recalcular_fase_metodologica(
  p_proyecto_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fase text;
begin
  v_fase := public.calcular_fase_metodologica(p_proyecto_id);

  update public.proyectos
  set fase_metodologica = v_fase
  where id = p_proyecto_id
    and fase_metodologica is distinct from v_fase;

  return v_fase;
end;
$$;

revoke all on function public.recalcular_fase_metodologica(uuid) from public;
grant execute on function public.recalcular_fase_metodologica(uuid)
  to authenticated, service_role;

create or replace function public.trg_recalcular_fase_metodologica()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proyecto_id uuid;
  v_proceso_id uuid;
begin
  if tg_table_name in ('entregables', 'procesos', 'auditorias_adopcion') then
    v_proyecto_id := case
      when tg_op = 'DELETE' then old.proyecto_id
      else new.proyecto_id
    end;
  else
    v_proceso_id := case
      when tg_op = 'DELETE' then old.proceso_id
      else new.proceso_id
    end;

    select proceso.proyecto_id
    into v_proyecto_id
    from public.procesos as proceso
    where proceso.id = v_proceso_id;
  end if;

  if v_proyecto_id is not null then
    perform public.recalcular_fase_metodologica(v_proyecto_id);
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  v_tabla text;
begin
  foreach v_tabla in array array[
    'entregables',
    'procesos',
    'auditorias_adopcion',
    'sipoc',
    'actividades',
    'indicadores'
  ]
  loop
    execute format(
      'drop trigger if exists trg_actualizar_fase_metodologica on public.%I',
      v_tabla
    );
    execute format(
      'create trigger trg_actualizar_fase_metodologica
       after insert or update or delete on public.%I
       for each row execute function public.trg_recalcular_fase_metodologica()',
      v_tabla
    );
  end loop;
end;
$$;

update public.proyectos as proyecto
set fase_metodologica = public.calcular_fase_metodologica(proyecto.id);

comment on column public.proyectos.estado_comercial is
  'Estado comercial definido manualmente por el consultor.';
comment on column public.proyectos.fase_metodologica is
  'Fase ADAPTA derivada automaticamente de los hitos del recorrido guiado.';

commit;
