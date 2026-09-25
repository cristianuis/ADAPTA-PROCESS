-- Conserva la cita que sustenta cada hallazgo y distingue la revisión humana.
-- Aditiva, segura para datos existentes y repetible.

begin;

alter table public.hallazgos
  add column if not exists cita_soporte text,
  add column if not exists estado_evidencia text not null default 'pendiente_validacion';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'hallazgos_estado_evidencia_check'
      and conrelid = 'public.hallazgos'::regclass
  ) then
    alter table public.hallazgos
      add constraint hallazgos_estado_evidencia_check
      check (estado_evidencia in (
        'pendiente_validacion', 'validado_consultor', 'cita_verificada'
      )) not valid;
  end if;
end;
$$;

-- Recupera citas que ya estaban dentro del JSON histórico de la entrevista.
-- No las marca como verificadas: hay que validarlas en el flujo actual.
update public.hallazgos as hallazgo
set cita_soporte = validador.value ->> 'cita_soporte'
from public.entrevistas as entrevista
cross join lateral jsonb_array_elements(
  coalesce(entrevista.hallazgos_validados, '[]'::jsonb)
) as validador(value)
where hallazgo.fuente = 'entrevista'
  and hallazgo.fuente_id = entrevista.id
  and validador.value ->> 'hallazgo_id' = hallazgo.id::text
  and nullif(trim(validador.value ->> 'cita_soporte'), '') is not null
  and hallazgo.cita_soporte is null;

commit;
