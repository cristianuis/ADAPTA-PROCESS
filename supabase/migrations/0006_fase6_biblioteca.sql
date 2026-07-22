-- ADAPTA OS — Fase 6 (Capitalización)
-- Tablas: plantillas_proceso, benchmarks + RLS
-- Nota de privacidad: estas tablas cuelgan de consultor_id (no de proyecto_id) porque
-- son reutilizables entre clientes por diseño. Nunca deben contener datos identificables
-- de un cliente específico — solo estructura/método (plantillas) o cifras agregadas (benchmarks).

create table plantillas_proceso (
  id uuid primary key default gen_random_uuid(),
  consultor_id uuid references consultores not null,
  nombre text not null,
  sector text,
  tipo_proceso text,
  descripcion text,
  estructura jsonb not null default '{}'::jsonb,
  veces_usada integer not null default 0,
  created_at timestamptz default now()
);

create table benchmarks (
  id uuid primary key default gen_random_uuid(),
  consultor_id uuid references consultores not null,
  sector text not null,
  indicador text not null,
  valor_p25 numeric,
  valor_mediana numeric,
  valor_p75 numeric,
  num_observaciones integer not null default 1,
  actualizado_at timestamptz default now()
);

alter table plantillas_proceso enable row level security;
alter table benchmarks enable row level security;

create policy "consultor administra sus propias plantillas"
  on plantillas_proceso for all
  using (consultor_id in (select id from consultores where user_id = auth.uid()))
  with check (consultor_id in (select id from consultores where user_id = auth.uid()));

create policy "consultor administra sus propios benchmarks"
  on benchmarks for all
  using (consultor_id in (select id from consultores where user_id = auth.uid()))
  with check (consultor_id in (select id from consultores where user_id = auth.uid()));
