-- ADAPTA OS — Fase 1 (Núcleo)
-- Tablas: consultores, clientes, proyectos, triage_respuestas + RLS

create table consultores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  nombre text not null,
  email text not null,
  empresa text,
  logo_url text,
  color_primario text default '#1A4731',
  color_secundario text default '#C8D830',
  tarifa_hora_objetivo numeric,
  created_at timestamptz default now()
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  consultor_id uuid references consultores not null,
  razon_social text not null,
  nit text,
  sector text,
  subsector text,
  num_empleados integer,
  facturacion_anual numeric,
  ciudad text,
  contacto_nombre text,
  contacto_cargo text,
  contacto_email text,
  contacto_telefono text,
  notas text,
  created_at timestamptz default now()
);

create table proyectos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes not null,
  consultor_id uuid references consultores not null,
  nombre text not null,
  arquetipo text check (arquetipo in ('A','B','C','D','E')),
  estado text check (estado in ('prospecto','diagnostico','definicion','arquitectura','pilotaje','transferencia','anclaje','cerrado')) default 'prospecto',
  fecha_inicio date,
  fecha_fin_estimada date,
  valor_contrato numeric,
  modelo_cobro text,
  criterios_exito jsonb,
  created_at timestamptz default now()
);

create table triage_respuestas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos not null unique,
  p1_documentacion_existe integer check (p1_documentacion_existe between 0 and 2),
  p2_documentacion_se_usa integer check (p2_documentacion_se_usa between 0 and 2),
  p3_se_mide_desempeno integer check (p3_se_mide_desempeno between 0 and 2),
  p4_duenos_proceso integer check (p4_duenos_proceso between 0 and 2),
  p5_disparador text check (p5_disparador in ('crecimiento','problema','requisito_externo')),
  p6_estructura_decision integer check (p6_estructura_decision between 0 and 2),
  puntaje_total integer,
  arquetipo_sugerido text,
  alerta_gobierno boolean default false,
  notas text,
  created_at timestamptz default now()
);

-- ============================================
-- RLS: un consultor solo ve sus propios datos
-- ============================================
alter table consultores enable row level security;
alter table clientes enable row level security;
alter table proyectos enable row level security;
alter table triage_respuestas enable row level security;

create policy "consultor ve y edita su propio perfil"
  on consultores for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "consultor ve y edita solo sus clientes"
  on clientes for all
  using (consultor_id in (select id from consultores where user_id = auth.uid()))
  with check (consultor_id in (select id from consultores where user_id = auth.uid()));

create policy "consultor ve y edita solo sus proyectos"
  on proyectos for all
  using (consultor_id in (select id from consultores where user_id = auth.uid()))
  with check (consultor_id in (select id from consultores where user_id = auth.uid()));

create policy "consultor ve y edita triage de sus proyectos"
  on triage_respuestas for all
  using (proyecto_id in (
    select p.id from proyectos p
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ))
  with check (proyecto_id in (
    select p.id from proyectos p
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ));
