-- La fase corresponde al primer paso pendiente del recorrido, no al
-- entregable más avanzado que se haya creado fuera de secuencia.
begin;

create or replace function public.calcular_fase_metodologica(p_proyecto_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  with pasos as (
    select
      exists (
        select 1 from public.proyectos p
        join public.clientes c on c.id = p.cliente_id
        where p.id = p_proyecto_id and nullif(trim(c.razon_social), '') is not null
      ) as cliente,
      exists (select 1 from public.triage_respuestas t where t.proyecto_id = p_proyecto_id) as triage,
      exists (
        select 1 from public.entrevistas e where e.proyecto_id = p_proyecto_id
        and e.estado = 'respondida' and nullif(trim(e.transcripcion), '') is not null
      ) as entrevista,
      exists (
        select 1 from public.procesos p where p.proyecto_id = p_proyecto_id
        and nullif(trim(p.dueno_nombre), '') is not null
        and exists (select 1 from public.sipoc s where s.proceso_id = p.id)
        and exists (select 1 from public.actividades a where a.proceso_id = p.id)
      ) as as_is,
      exists (
        select 1 from public.pemm_evaluaciones e where e.proyecto_id = p_proyecto_id
        and e.tipo = 'empresa' and e.estado = 'respondida'
      ) as pemm_empresa,
      exists (
        select 1 from public.pemm_evaluaciones e where e.proyecto_id = p_proyecto_id
        and e.tipo = 'proceso' and e.estado = 'respondida'
      ) as pemm_proceso,
      exists (
        select 1 from public.hallazgos h where h.proyecto_id = p_proyecto_id
        and h.estado_evidencia in ('cita_verificada', 'validado_consultor')
      ) as hallazgo,
      exists (
        select 1 from public.iniciativas_mejora i where i.proyecto_id = p_proyecto_id
        and exists (select 1 from public.acciones_mejora a where a.iniciativa_id = i.id)
      ) as plan,
      exists (
        select 1 from public.disenos_tobe d where d.proyecto_id = p_proyecto_id
        and d.estado = 'validado'
        and exists (select 1 from public.procesos p where p.id = d.proceso_id
          and nullif(trim(p.dueno_nombre), '') is not null)
      ) as tobe,
      exists (
        select 1 from public.procesos p where p.proyecto_id = p_proyecto_id
        and nullif(trim(p.dueno_nombre), '') is not null
        and exists (select 1 from public.indicadores i where i.proceso_id = p.id
          and nullif(trim(i.fuente_datos), '') is not null)
      ) and exists (
        select 1 from public.entregables e where e.proyecto_id = p_proyecto_id
        and e.tipo = 'manual'
      ) as medicion_manual
  )
  select case
    when not (cliente and triage) then 'contextualizacion'
    when not (entrevista and as_is) then 'definicion'
    when not (pemm_empresa and pemm_proceso and hallazgo and plan) then 'arquitectura'
    when not tobe then 'pilotaje'
    when not medicion_manual then 'transferencia'
    else 'anclaje'
  end from pasos;
$$;
revoke all on function public.calcular_fase_metodologica(uuid) from public;
grant execute on function public.calcular_fase_metodologica(uuid) to service_role;

create or replace function public.trg_recalcular_fase_metodologica()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_proyecto_id uuid;
  v_proceso_id uuid;
  v_iniciativa_id uuid;
begin
  if tg_table_name in ('entregables', 'procesos', 'auditorias_adopcion',
    'hallazgos', 'iniciativas_mejora', 'disenos_tobe', 'triage_respuestas',
    'entrevistas', 'pemm_evaluaciones') then
    if tg_op = 'DELETE' then v_proyecto_id := old.proyecto_id;
    else v_proyecto_id := new.proyecto_id; end if;
  elsif tg_table_name = 'acciones_mejora' then
    if tg_op = 'DELETE' then v_iniciativa_id := old.iniciativa_id;
    else v_iniciativa_id := new.iniciativa_id; end if;
    select i.proyecto_id into v_proyecto_id from public.iniciativas_mejora i where i.id = v_iniciativa_id;
  else
    if tg_op = 'DELETE' then v_proceso_id := old.proceso_id;
    else v_proceso_id := new.proceso_id; end if;
    select p.proyecto_id into v_proyecto_id from public.procesos p where p.id = v_proceso_id;
  end if;
  if v_proyecto_id is not null then perform public.recalcular_fase_metodologica(v_proyecto_id); end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.trg_recalcular_fase_metodologica() from public;

do $$
declare v_tabla text;
begin
  foreach v_tabla in array array['triage_respuestas', 'entrevistas', 'pemm_evaluaciones'] loop
    execute format('drop trigger if exists trg_actualizar_fase_metodologica on public.%I', v_tabla);
    execute format('create trigger trg_actualizar_fase_metodologica after insert or update or delete on public.%I for each row execute function public.trg_recalcular_fase_metodologica()', v_tabla);
  end loop;
end;
$$;

update public.proyectos p
set fase_metodologica = public.calcular_fase_metodologica(p.id)
where fase_metodologica is distinct from public.calcular_fase_metodologica(p.id);
commit;
