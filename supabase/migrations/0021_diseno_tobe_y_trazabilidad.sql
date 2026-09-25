-- NEXUS: une hallazgos con el proceso observado y conserva un diseno TO-BE
-- separado del AS-IS. Aplicar antes de desplegar el codigo que lo consulta.
begin;

create unique index if not exists procesos_id_proyecto_uidx
  on public.procesos (id, proyecto_id);

alter table public.hallazgos
  add column if not exists proceso_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hallazgos_proceso_proyecto_fkey') then
    alter table public.hallazgos add constraint hallazgos_proceso_proyecto_fkey
      foreign key (proceso_id, proyecto_id)
      references public.procesos (id, proyecto_id) on delete set null (proceso_id);
  end if;
end $$;

create index if not exists hallazgos_proceso_idx on public.hallazgos (proceso_id);

alter table public.entregables drop constraint if exists entregables_tipo_check;
alter table public.entregables add constraint entregables_tipo_check
  check (tipo in ('diagnostico', 'propuesta', 'manual', 'tablero', 'auditoria', 'informe_360'));

create table if not exists public.disenos_tobe (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  proceso_id uuid not null,
  objetivo text not null,
  criterio_validacion text not null,
  decisiones text not null,
  estado text not null default 'borrador'
    check (estado in ('borrador', 'validado')),
  validado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disenos_tobe_proceso_proyecto_fkey foreign key (proceso_id, proyecto_id)
    references public.procesos(id, proyecto_id) on delete cascade,
  constraint disenos_tobe_proceso_key unique (proceso_id),
  constraint disenos_tobe_id_proyecto_key unique (id, proyecto_id),
  constraint disenos_tobe_textos_check check (
    char_length(trim(objetivo)) >= 10 and
    char_length(trim(criterio_validacion)) >= 10 and
    char_length(trim(decisiones)) >= 10
  ),
  constraint disenos_tobe_validacion_check check (
    (estado = 'validado' and validado_at is not null) or
    (estado = 'borrador' and validado_at is null)
  )
);

create table if not exists public.pasos_tobe (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  diseno_id uuid not null,
  orden integer not null check (orden > 0),
  nombre text not null check (char_length(trim(nombre)) >= 2),
  responsable text not null check (char_length(trim(responsable)) >= 2),
  cambio text not null check (char_length(trim(cambio)) >= 10),
  tipo_cambio text not null check (tipo_cambio in ('conservar', 'modificar', 'nuevo')),
  automatizacion text not null check (automatizacion in ('manual', 'asistida', 'candidata')),
  hallazgo_id uuid,
  created_at timestamptz not null default now(),
  constraint pasos_tobe_diseno_proyecto_fkey foreign key (diseno_id, proyecto_id)
    references public.disenos_tobe(id, proyecto_id) on delete cascade,
  constraint pasos_tobe_hallazgo_proyecto_fkey foreign key (hallazgo_id, proyecto_id)
    references public.hallazgos(id, proyecto_id) on delete restrict,
  constraint pasos_tobe_orden_key unique (diseno_id, orden),
  constraint pasos_tobe_cambio_soportado_check
    check (tipo_cambio = 'conservar' or hallazgo_id is not null)
);

create index if not exists pasos_tobe_diseno_idx
  on public.pasos_tobe (diseno_id, orden);

alter table public.disenos_tobe enable row level security;
alter table public.pasos_tobe enable row level security;
revoke all on public.disenos_tobe from anon;
revoke all on public.pasos_tobe from anon;
grant select, insert, update, delete on public.disenos_tobe to authenticated;
grant select, insert, update, delete on public.pasos_tobe to authenticated;

drop policy if exists "consultor administra disenos tobe de sus proyectos" on public.disenos_tobe;
create policy "consultor administra disenos tobe de sus proyectos"
on public.disenos_tobe for all to authenticated
using (proyecto_id in (
  select p.id from public.proyectos p join public.consultores c on c.id = p.consultor_id
  where c.user_id = (select auth.uid())
))
with check (proyecto_id in (
  select p.id from public.proyectos p join public.consultores c on c.id = p.consultor_id
  where c.user_id = (select auth.uid())
));

drop policy if exists "consultor administra pasos tobe de sus proyectos" on public.pasos_tobe;
create policy "consultor administra pasos tobe de sus proyectos"
on public.pasos_tobe for all to authenticated
using (proyecto_id in (
  select p.id from public.proyectos p join public.consultores c on c.id = p.consultor_id
  where c.user_id = (select auth.uid())
))
with check (proyecto_id in (
  select p.id from public.proyectos p join public.consultores c on c.id = p.consultor_id
  where c.user_id = (select auth.uid())
));

drop trigger if exists trg_disenos_tobe_updated_at on public.disenos_tobe;
create trigger trg_disenos_tobe_updated_at before update on public.disenos_tobe
for each row execute function public.actualizar_updated_at_lancelot();

create or replace function public.verificar_diseno_tobe()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_diseno_id uuid;
begin
  if tg_table_name = 'pasos_tobe' then
    if tg_op = 'DELETE' then
      v_diseno_id := old.diseno_id;
    else
      v_diseno_id := new.diseno_id;
    end if;
    if exists (select 1 from public.disenos_tobe d
      where d.id = v_diseno_id and d.estado = 'validado') then
      raise exception 'Reabre el diseno TO-BE antes de cambiar sus pasos';
    end if;
    if tg_op = 'UPDATE' then
      if old.diseno_id <> new.diseno_id and exists (
        select 1 from public.disenos_tobe d where d.id = old.diseno_id and d.estado = 'validado'
      ) then
        raise exception 'Reabre el diseno TO-BE de origen antes de mover sus pasos';
      end if;
    end if;
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.proyecto_id, new.proceso_id)
      is distinct from (old.proyecto_id, old.proceso_id) then
      raise exception 'La identidad del diseno TO-BE no se puede cambiar';
    end if;
    if old.estado = 'validado' and new.estado = 'validado'
      and (new.objetivo, new.criterio_validacion, new.decisiones)
        is distinct from (old.objetivo, old.criterio_validacion, old.decisiones) then
      raise exception 'Reabre el diseno TO-BE antes de editarlo';
    end if;
  end if;

  if new.estado = 'validado' then
    if not exists (select 1 from public.pasos_tobe s
      where s.diseno_id = new.id and s.tipo_cambio <> 'conservar') then
      raise exception 'El diseno necesita al menos un cambio sustentado';
    end if;
    if exists (select 1 from public.pasos_tobe s
      left join public.hallazgos h on h.id = s.hallazgo_id
      where s.diseno_id = new.id and s.tipo_cambio <> 'conservar'
        and (h.id is null or h.estado_evidencia not in ('cita_verificada', 'validado_consultor'))) then
      raise exception 'Cada cambio necesita un hallazgo con evidencia revisada';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.verificar_diseno_tobe() from public;
drop trigger if exists trg_verificar_diseno_tobe on public.disenos_tobe;
create trigger trg_verificar_diseno_tobe before insert or update on public.disenos_tobe
for each row execute function public.verificar_diseno_tobe();
drop trigger if exists trg_verificar_pasos_tobe on public.pasos_tobe;
create trigger trg_verificar_pasos_tobe before insert or update or delete on public.pasos_tobe
for each row execute function public.verificar_diseno_tobe();

comment on table public.disenos_tobe is 'Diseno futuro revisable, separado de las actividades AS-IS.';
comment on table public.pasos_tobe is 'Pasos futuros con cambio y hallazgo del mismo proyecto como soporte.';

commit;
