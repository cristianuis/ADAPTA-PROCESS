-- Auditoría Bloque 3 — instrumentación de costo de IA (sin dashboard todavía,
-- solo el registro; habilita decisiones futuras de Parte 2 con datos reales,
-- no antes).

create table llamadas_ia (
  id uuid primary key default gen_random_uuid(),
  consultor_id uuid references consultores not null,
  proyecto_id uuid references proyectos,
  endpoint text not null,
  modelo text not null,
  tokens_entrada integer,
  tokens_salida integer,
  created_at timestamptz default now()
);

alter table llamadas_ia enable row level security;

create policy "consultor ve sus propias llamadas ia"
  on llamadas_ia for all
  using (consultor_id in (select id from consultores where user_id = auth.uid()))
  with check (consultor_id in (select id from consultores where user_id = auth.uid()));
