-- ADAPTA OS — Fase 2 (Diagnóstico)
-- Tablas: pemm_evaluaciones, entrevistas, hallazgos + RLS

create table pemm_evaluaciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos not null,
  proceso_evaluado text,
  tipo text check (tipo in ('proceso','empresa')) not null,
  respondiente_nivel text check (respondiente_nivel in ('direccion','mando_medio','operacion')),
  respondiente_nombre text,
  fuente text check (fuente in ('consultor','encuesta_publica')) not null default 'consultor',
  token uuid unique,
  estado text check (estado in ('pendiente','respondida')) not null default 'pendiente',
  -- Habilitadores de proceso (P1-P4 de Hammer)
  diseno integer check (diseno between 1 and 4),
  ejecutores integer check (ejecutores between 1 and 4),
  responsable integer check (responsable between 1 and 4),
  infraestructura integer check (infraestructura between 1 and 4),
  indicadores integer check (indicadores between 1 and 4),
  -- Capacidades de empresa (E1-E4 de Hammer)
  liderazgo integer check (liderazgo between 1 and 4),
  cultura integer check (cultura between 1 and 4),
  experiencia integer check (experiencia between 1 and 4),
  gobierno integer check (gobierno between 1 and 4),
  nivel_resultante integer,
  evidencias jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table entrevistas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos not null,
  entrevistado_nombre text,
  entrevistado_cargo text,
  nivel text check (nivel in ('direccion','mando_medio','operacion')),
  fecha date,
  transcripcion text,
  hallazgos_ia jsonb,
  hallazgos_validados jsonb default '[]'::jsonb,
  nivel_resistencia text check (nivel_resistencia in ('bajo','medio','alto')),
  senales_gobierno jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table hallazgos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos not null,
  titulo text not null,
  descripcion text,
  categoria text check (categoria in ('proceso','gobierno','tecnologia','cultura','datos')),
  impacto integer check (impacto between 1 and 5) not null,
  esfuerzo integer check (esfuerzo between 1 and 5) not null,
  fuente text check (fuente in ('entrevista','observacion','documental','financiero')) not null,
  fuente_id uuid,
  origen text check (origen in ('ia','manual')) not null default 'manual',
  created_at timestamptz default now()
);

-- ============================================
-- RLS
-- ============================================
alter table pemm_evaluaciones enable row level security;
alter table entrevistas enable row level security;
alter table hallazgos enable row level security;

create policy "consultor administra pemm de sus proyectos"
  on pemm_evaluaciones for all
  using (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ))
  with check (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ));

-- Enlace público de encuesta: cualquiera con el token puede leer y responder
-- únicamente la fila que ya tiene ese token asignado por el consultor.
create policy "lectura publica de pemm via token"
  on pemm_evaluaciones for select
  to anon
  using (token is not null);

create policy "respuesta publica de pemm via token"
  on pemm_evaluaciones for update
  to anon
  using (token is not null and estado = 'pendiente')
  with check (token is not null);

create policy "consultor administra entrevistas de sus proyectos"
  on entrevistas for all
  using (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ))
  with check (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ));

create policy "consultor administra hallazgos de sus proyectos"
  on hallazgos for all
  using (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ))
  with check (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ));
