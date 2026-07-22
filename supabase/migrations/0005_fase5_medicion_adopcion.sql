-- ADAPTA OS — Fase 5 (Medición y adopción)
-- Tablas: mediciones, auditorias_adopcion + RLS

create table mediciones (
  id uuid primary key default gen_random_uuid(),
  indicador_id uuid references indicadores not null,
  periodo date not null,
  valor numeric,
  observaciones text,
  created_at timestamptz default now()
);

create table auditorias_adopcion (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos not null,
  proceso_id uuid references procesos,
  fecha date not null default current_date,
  casos_revisados integer not null default 0,
  casos_conformes integer not null default 0,
  porcentaje_adopcion numeric,
  desviaciones jsonb default '[]'::jsonb,
  causas_identificadas text,
  acciones jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table mediciones enable row level security;
alter table auditorias_adopcion enable row level security;

create policy "consultor administra mediciones de sus indicadores"
  on mediciones for all
  using (indicador_id in (
    select i.id from indicadores i
    join procesos pr on pr.id = i.proceso_id
    join proyectos p on p.id = pr.proyecto_id
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ))
  with check (indicador_id in (
    select i.id from indicadores i
    join procesos pr on pr.id = i.proceso_id
    join proyectos p on p.id = pr.proyecto_id
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ));

create policy "consultor administra auditorias de sus proyectos"
  on auditorias_adopcion for all
  using (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ))
  with check (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ));
