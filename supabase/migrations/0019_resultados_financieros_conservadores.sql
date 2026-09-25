-- Retira indicadores financieros que asumían beneficios sin costos recurrentes,
-- permite registrar deterioros y exige evidencia al completar acciones.

begin;

-- Conserva las columnas históricas por si contienen datos previos. La aplicación
-- deja de leerlas y escribirlas; eliminarlas físicamente requerirá una limpieza
-- posterior con inventario y aprobación explícita de retención.

alter table public.mediciones_impacto
  drop constraint if exists mediciones_impacto_valores_check;
alter table public.mediciones_impacto
  add constraint mediciones_impacto_valores_check
  check (costo_acumulado >= 0);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'acciones_completadas_con_evidencia_check'
      and conrelid = 'public.acciones_mejora'::regclass
  ) then
    alter table public.acciones_mejora
      add constraint acciones_completadas_con_evidencia_check
      check (
        estado <> 'completada'
        or char_length(trim(coalesce(evidencia_resultado, ''))) >= 3
      ) not valid;
  end if;
end;
$$;

create or replace function public.validar_cierre_iniciativa()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.estado = 'completada' and old.estado is distinct from 'completada' then
    if not exists (
      select 1 from public.acciones_mejora as accion
      where accion.iniciativa_id = new.id
    ) or exists (
      select 1 from public.acciones_mejora as accion
      where accion.iniciativa_id = new.id
        and (accion.estado <> 'completada'
          or char_length(trim(coalesce(accion.evidencia_resultado, ''))) < 3)
    ) then
      raise exception 'Completa todas las acciones con evidencia antes de cerrar la iniciativa.'
        using errcode = '23514';
    end if;

    if not exists (
      select 1 from public.mediciones_impacto as medicion
      where medicion.iniciativa_id = new.id
        and medicion.tipo = 'cierre'
        and medicion.validado_cliente = true
    ) then
      raise exception 'Registra un cierre confirmado por el cliente antes de completar la iniciativa.'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;
revoke all on function public.validar_cierre_iniciativa() from public;

drop trigger if exists trg_validar_cierre_iniciativa on public.iniciativas_mejora;
create trigger trg_validar_cierre_iniciativa
before update of estado on public.iniciativas_mejora
for each row execute function public.validar_cierre_iniciativa();

commit;
