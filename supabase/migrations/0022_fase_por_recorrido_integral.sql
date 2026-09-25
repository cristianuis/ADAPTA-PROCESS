-- Alinea fase derivada con el recorrido integral de 12 pasos; no cambia el
-- estado comercial ni permite capturar la fase a mano.
begin;

create or replace function public.calcular_fase_metodologica(p_proyecto_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.auditorias_adopcion a where a.proyecto_id = p_proyecto_id)
      or exists (select 1 from public.entregables e where e.proyecto_id = p_proyecto_id and e.tipo = 'informe_360')
      then 'anclaje'
    when exists (select 1 from public.entregables e where e.proyecto_id = p_proyecto_id and e.tipo = 'manual')
      and exists (select 1 from public.indicadores i join public.procesos p on p.id = i.proceso_id where p.proyecto_id = p_proyecto_id)
      then 'transferencia'
    when exists (select 1 from public.disenos_tobe d where d.proyecto_id = p_proyecto_id and d.estado = 'validado')
      then 'pilotaje'
    when exists (select 1 from public.iniciativas_mejora i where i.proyecto_id = p_proyecto_id
      and exists (select 1 from public.acciones_mejora a where a.iniciativa_id = i.id))
      then 'arquitectura'
    when exists (select 1 from public.hallazgos h where h.proyecto_id = p_proyecto_id
      and h.estado_evidencia in ('cita_verificada', 'validado_consultor'))
      then 'definicion'
    else 'contextualizacion'
  end;
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
  if tg_table_name in ('entregables', 'procesos', 'auditorias_adopcion', 'hallazgos', 'iniciativas_mejora', 'disenos_tobe') then
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
  foreach v_tabla in array array['hallazgos', 'iniciativas_mejora', 'acciones_mejora', 'disenos_tobe'] loop
    execute format('drop trigger if exists trg_actualizar_fase_metodologica on public.%I', v_tabla);
    execute format('create trigger trg_actualizar_fase_metodologica after insert or update or delete on public.%I for each row execute function public.trg_recalcular_fase_metodologica()', v_tabla);
  end loop;
end;
$$;

update public.proyectos p set fase_metodologica = public.calcular_fase_metodologica(p.id);
commit;
