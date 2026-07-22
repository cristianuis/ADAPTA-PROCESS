-- ADAPTA OS — Fase 3 (Entregables)
-- Tabla: entregables + RLS
-- Nota: el archivo DOCX se genera bajo demanda (route handler) y se descarga directo al
-- navegador — esta tabla solo registra el historial/versión, no almacena el binario.

create table entregables (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos not null,
  tipo text check (tipo in ('diagnostico','propuesta','manual','tablero','auditoria')) not null,
  nombre text not null,
  fase text,
  version integer not null default 1,
  estado text check (estado in ('borrador','revision','entregado','aceptado')) not null default 'borrador',
  fecha_entrega date,
  created_at timestamptz default now()
);

alter table entregables enable row level security;

create policy "consultor administra entregables de sus proyectos"
  on entregables for all
  using (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ))
  with check (proyecto_id in (
    select p.id from proyectos p join consultores c on c.id = p.consultor_id where c.user_id = auth.uid()
  ));
