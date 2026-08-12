-- Lancelot 2.0 - Fase 1: impacto economico y plan de mejora.
--
-- Cierra el circuito hallazgo -> cuantificacion -> iniciativa -> accion -> resultado.
-- No crea portal de cliente, aprobaciones, causas raiz, riesgos ni controles.
-- Esta migracion es transaccional e idempotente para poder pegarla nuevamente
-- en el SQL Editor sin dejar una aplicacion parcial.

begin;

-- Las claves compuestas impiden vincular por accidente informacion de dos
-- proyectos distintos, sin modificar la clave primaria historica.
create unique index if not exists hallazgos_id_proyecto_uidx
  on public.hallazgos (id, proyecto_id);

create table if not exists public.cuantificaciones_impacto (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  hallazgo_id uuid not null,
  nombre text not null,
  tipo text not null,
  valor_unitario numeric(18, 2) not null,
  volumen_periodo numeric(18, 4) not null,
  periodos_anio numeric(8, 2) not null default 12,
  porcentaje_capturable numeric(5, 2) not null default 100,
  moneda text not null default 'COP',
  impacto_anual numeric(18, 2) generated always as (
    round(
      valor_unitario * volumen_periodo * periodos_anio * porcentaje_capturable / 100,
      2
    )
  ) stored,
  fuente_calculo text not null,
  supuestos text not null,
  confianza text not null default 'media',
  validado_cliente boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cuantificaciones_hallazgo_proyecto_fkey
    foreign key (hallazgo_id, proyecto_id)
    references public.hallazgos(id, proyecto_id)
    on delete cascade,
  constraint cuantificaciones_nombre_check
    check (char_length(trim(nombre)) >= 3),
  constraint cuantificaciones_tipo_check
    check (tipo in ('ahorro', 'ingreso', 'costo_evitado', 'capacidad_liberada', 'riesgo_reducido')),
  constraint cuantificaciones_valores_check
    check (
      valor_unitario >= 0
      and volumen_periodo >= 0
      and periodos_anio > 0
      and porcentaje_capturable between 0 and 100
    ),
  constraint cuantificaciones_moneda_check
    check (moneda ~ '^[A-Z]{3}$'),
  constraint cuantificaciones_confianza_check
    check (confianza in ('baja', 'media', 'alta')),
  constraint cuantificaciones_fuente_check
    check (char_length(trim(fuente_calculo)) >= 3),
  constraint cuantificaciones_supuestos_check
    check (char_length(trim(supuestos)) >= 3)
);

create table if not exists public.iniciativas_mejora (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  titulo text not null,
  descripcion text,
  hipotesis text not null,
  resultado_esperado text not null,
  criterio_exito text not null,
  estado text not null default 'borrador',
  prioridad smallint not null default 3,
  responsable text,
  fecha_inicio date,
  fecha_objetivo date,
  inversion_estimada numeric(18, 2) not null default 0,
  beneficio_anual_objetivo numeric(18, 2) not null default 0,
  moneda text not null default 'COP',
  roi_estimado numeric(12, 2) generated always as (
    case
      when inversion_estimada > 0
        then round(((beneficio_anual_objetivo - inversion_estimada) / inversion_estimada) * 100, 2)
      else null
    end
  ) stored,
  payback_meses numeric(12, 2) generated always as (
    case
      when beneficio_anual_objetivo > 0
        then round(inversion_estimada / (beneficio_anual_objetivo / 12), 2)
      else null
    end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint iniciativas_titulo_check
    check (char_length(trim(titulo)) >= 3),
  constraint iniciativas_hipotesis_check
    check (char_length(trim(hipotesis)) >= 10),
  constraint iniciativas_resultado_check
    check (char_length(trim(resultado_esperado)) >= 5),
  constraint iniciativas_criterio_check
    check (char_length(trim(criterio_exito)) >= 5),
  constraint iniciativas_estado_check
    check (estado in ('borrador', 'priorizada', 'en_ejecucion', 'bloqueada', 'completada', 'descartada')),
  constraint iniciativas_prioridad_check
    check (prioridad between 1 and 5),
  constraint iniciativas_fechas_check
    check (fecha_objetivo is null or fecha_inicio is null or fecha_objetivo >= fecha_inicio),
  constraint iniciativas_valores_check
    check (inversion_estimada >= 0 and beneficio_anual_objetivo >= 0),
  constraint iniciativas_moneda_check
    check (moneda ~ '^[A-Z]{3}$')
);

create unique index if not exists iniciativas_id_proyecto_uidx
  on public.iniciativas_mejora (id, proyecto_id);

create table if not exists public.iniciativa_hallazgos (
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  iniciativa_id uuid not null,
  hallazgo_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (iniciativa_id, hallazgo_id),
  constraint iniciativa_hallazgos_iniciativa_proyecto_fkey
    foreign key (iniciativa_id, proyecto_id)
    references public.iniciativas_mejora(id, proyecto_id)
    on delete cascade,
  constraint iniciativa_hallazgos_hallazgo_proyecto_fkey
    foreign key (hallazgo_id, proyecto_id)
    references public.hallazgos(id, proyecto_id)
    on delete cascade
);

create table if not exists public.acciones_mejora (
  id uuid primary key default gen_random_uuid(),
  iniciativa_id uuid not null references public.iniciativas_mejora(id) on delete cascade,
  orden integer not null default 1,
  titulo text not null,
  descripcion text,
  responsable text not null,
  fecha_objetivo date,
  estado text not null default 'pendiente',
  evidencia_resultado text,
  completada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint acciones_orden_check
    check (orden > 0),
  constraint acciones_titulo_check
    check (char_length(trim(titulo)) >= 3),
  constraint acciones_responsable_check
    check (char_length(trim(responsable)) >= 2),
  constraint acciones_estado_check
    check (estado in ('pendiente', 'en_curso', 'bloqueada', 'completada', 'cancelada')),
  constraint acciones_completada_check
    check (
      (estado = 'completada' and completada_at is not null)
      or (estado <> 'completada' and completada_at is null)
    )
);

create table if not exists public.mediciones_impacto (
  id uuid primary key default gen_random_uuid(),
  iniciativa_id uuid not null references public.iniciativas_mejora(id) on delete cascade,
  tipo text not null,
  fecha date not null default current_date,
  beneficio_anual_realizado numeric(18, 2) not null default 0,
  costo_acumulado numeric(18, 2) not null default 0,
  valor_indicador numeric,
  unidad_indicador text,
  fuente_datos text not null,
  observaciones text,
  validado_cliente boolean not null default false,
  created_at timestamptz not null default now(),
  constraint mediciones_impacto_tipo_check
    check (tipo in ('linea_base', 'seguimiento', 'cierre')),
  constraint mediciones_impacto_valores_check
    check (beneficio_anual_realizado >= 0 and costo_acumulado >= 0),
  constraint mediciones_impacto_fuente_check
    check (char_length(trim(fuente_datos)) >= 3)
);

create index if not exists cuantificaciones_proyecto_idx
  on public.cuantificaciones_impacto (proyecto_id, created_at desc);
create index if not exists cuantificaciones_hallazgo_idx
  on public.cuantificaciones_impacto (hallazgo_id);
create index if not exists iniciativas_proyecto_estado_idx
  on public.iniciativas_mejora (proyecto_id, estado, prioridad);
create index if not exists iniciativa_hallazgos_proyecto_idx
  on public.iniciativa_hallazgos (proyecto_id);
create index if not exists acciones_iniciativa_estado_idx
  on public.acciones_mejora (iniciativa_id, estado, orden);
create index if not exists mediciones_impacto_iniciativa_fecha_idx
  on public.mediciones_impacto (iniciativa_id, fecha desc);

create or replace function public.actualizar_updated_at_lancelot()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.actualizar_updated_at_lancelot() from public;

drop trigger if exists trg_cuantificaciones_updated_at
  on public.cuantificaciones_impacto;
create trigger trg_cuantificaciones_updated_at
before update on public.cuantificaciones_impacto
for each row execute function public.actualizar_updated_at_lancelot();

drop trigger if exists trg_iniciativas_updated_at
  on public.iniciativas_mejora;
create trigger trg_iniciativas_updated_at
before update on public.iniciativas_mejora
for each row execute function public.actualizar_updated_at_lancelot();

drop trigger if exists trg_acciones_updated_at
  on public.acciones_mejora;
create trigger trg_acciones_updated_at
before update on public.acciones_mejora
for each row execute function public.actualizar_updated_at_lancelot();

alter table public.cuantificaciones_impacto enable row level security;
alter table public.iniciativas_mejora enable row level security;
alter table public.iniciativa_hallazgos enable row level security;
alter table public.acciones_mejora enable row level security;
alter table public.mediciones_impacto enable row level security;

revoke all privileges on table public.cuantificaciones_impacto from anon;
revoke all privileges on table public.iniciativas_mejora from anon;
revoke all privileges on table public.iniciativa_hallazgos from anon;
revoke all privileges on table public.acciones_mejora from anon;
revoke all privileges on table public.mediciones_impacto from anon;

grant select, insert, update, delete on table public.cuantificaciones_impacto to authenticated;
grant select, insert, update, delete on table public.iniciativas_mejora to authenticated;
grant select, insert, update, delete on table public.iniciativa_hallazgos to authenticated;
grant select, insert, update, delete on table public.acciones_mejora to authenticated;
grant select, insert, update, delete on table public.mediciones_impacto to authenticated;

drop policy if exists "consultor administra cuantificaciones de sus proyectos"
  on public.cuantificaciones_impacto;
create policy "consultor administra cuantificaciones de sus proyectos"
on public.cuantificaciones_impacto
for all
to authenticated
using (
  proyecto_id in (
    select proyecto.id
    from public.proyectos as proyecto
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
)
with check (
  proyecto_id in (
    select proyecto.id
    from public.proyectos as proyecto
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
);

drop policy if exists "consultor administra iniciativas de sus proyectos"
  on public.iniciativas_mejora;
create policy "consultor administra iniciativas de sus proyectos"
on public.iniciativas_mejora
for all
to authenticated
using (
  proyecto_id in (
    select proyecto.id
    from public.proyectos as proyecto
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
)
with check (
  proyecto_id in (
    select proyecto.id
    from public.proyectos as proyecto
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
);

drop policy if exists "consultor vincula hallazgos de sus proyectos"
  on public.iniciativa_hallazgos;
create policy "consultor vincula hallazgos de sus proyectos"
on public.iniciativa_hallazgos
for all
to authenticated
using (
  proyecto_id in (
    select proyecto.id
    from public.proyectos as proyecto
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
)
with check (
  proyecto_id in (
    select proyecto.id
    from public.proyectos as proyecto
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
);

drop policy if exists "consultor administra acciones de sus iniciativas"
  on public.acciones_mejora;
create policy "consultor administra acciones de sus iniciativas"
on public.acciones_mejora
for all
to authenticated
using (
  iniciativa_id in (
    select iniciativa.id
    from public.iniciativas_mejora as iniciativa
    join public.proyectos as proyecto on proyecto.id = iniciativa.proyecto_id
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
)
with check (
  iniciativa_id in (
    select iniciativa.id
    from public.iniciativas_mejora as iniciativa
    join public.proyectos as proyecto on proyecto.id = iniciativa.proyecto_id
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
);

drop policy if exists "consultor administra mediciones de impacto de sus iniciativas"
  on public.mediciones_impacto;
create policy "consultor administra mediciones de impacto de sus iniciativas"
on public.mediciones_impacto
for all
to authenticated
using (
  iniciativa_id in (
    select iniciativa.id
    from public.iniciativas_mejora as iniciativa
    join public.proyectos as proyecto on proyecto.id = iniciativa.proyecto_id
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
)
with check (
  iniciativa_id in (
    select iniciativa.id
    from public.iniciativas_mejora as iniciativa
    join public.proyectos as proyecto on proyecto.id = iniciativa.proyecto_id
    join public.consultores as consultor on consultor.id = proyecto.consultor_id
    where consultor.user_id = (select auth.uid())
  )
);

comment on table public.cuantificaciones_impacto is
  'Componentes economicos auditables asociados a hallazgos validados.';
comment on column public.cuantificaciones_impacto.impacto_anual is
  'valor_unitario x volumen_periodo x periodos_anio x porcentaje_capturable.';
comment on table public.iniciativas_mejora is
  'Hipotesis de intervencion priorizadas con caso de negocio y criterio de exito.';
comment on table public.iniciativa_hallazgos is
  'Relacion muchos-a-muchos entre iniciativas y hallazgos del mismo proyecto.';
comment on table public.acciones_mejora is
  'Plan ejecutable de cada iniciativa, con responsable, fecha y evidencia textual.';
comment on table public.mediciones_impacto is
  'Linea base, seguimientos y cierre del beneficio economico realizado.';

commit;
