-- ADAPTA OS — Fase 4 (Arquitectura de procesos)
-- Tablas: procesos, sipoc, actividades, indicadores + RLS

create table procesos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos not null,
  codigo text,
  nombre text not null,
  tipo text check (tipo in ('estrategico','misional','apoyo')) not null,
  objetivo text,
  alcance_inicio text,
  alcance_fin text,
  dueno_nombre text,
  dueno_cargo text,
  prioridad integer check (prioridad between 1 and 5),
  estado text check (estado in ('identificado','diseno','piloto','operando')) not null default 'identificado',
  created_at timestamptz default now()
);

create table sipoc (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid references procesos not null unique,
  proveedores jsonb default '[]'::jsonb,
  entradas jsonb default '[]'::jsonb,
  pasos jsonb default '[]'::jsonb,
  salidas jsonb default '[]'::jsonb,
  clientes jsonb default '[]'::jsonb
);

create table actividades (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid references procesos not null,
  orden integer not null,
  nombre text not null,
  descripcion text,
  rol_responsable text,
  rol_aprobador text,
  roles_consultados text[] default '{}',
  roles_informados text[] default '{}',
  tiempo_estimado_min integer,
  es_valor_agregado boolean default true,
  sistema_soporte text
);

create table indicadores (
  id uuid primary key default gen_random_uuid(),
  proceso_id uuid references procesos not null,
  nombre text not null,
  tipo text check (tipo in ('eficacia','eficiencia','calidad')) not null,
  formula text,
  unidad text,
  fuente_datos text not null,
  mecanismo_captura text not null,
  frecuencia text,
  meta numeric,
  responsable text,
  activo boolean not null default true
);

alter table procesos enable row level security;
alter table sipoc enable row level security;
alter table actividades enable row level security;
alter table indicadores enable row level security;

create policy "consultor administra procesos de sus proyectos"
  on procesos for all
  using (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ))
  with check (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ));

create policy "consultor administra sipoc de sus procesos"
  on sipoc for all
  using (proceso_id in (
    select pr.id from procesos pr
    join proyectos p on p.id = pr.proyecto_id
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ))
  with check (proceso_id in (
    select pr.id from procesos pr
    join proyectos p on p.id = pr.proyecto_id
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ));

create policy "consultor administra actividades de sus procesos"
  on actividades for all
  using (proceso_id in (
    select pr.id from procesos pr
    join proyectos p on p.id = pr.proyecto_id
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ))
  with check (proceso_id in (
    select pr.id from procesos pr
    join proyectos p on p.id = pr.proyecto_id
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ));

create policy "consultor administra indicadores de sus procesos"
  on indicadores for all
  using (proceso_id in (
    select pr.id from procesos pr
    join proyectos p on p.id = pr.proyecto_id
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ))
  with check (proceso_id in (
    select pr.id from procesos pr
    join proyectos p on p.id = pr.proyecto_id
    join consultores c on c.id = p.consultor_id
    where c.user_id = auth.uid()
  ));
