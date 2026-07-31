-- Lancelot Loop: memoria privada del copiloto operativo.
-- Solo el consultor propietario puede leer o escribir sus sesiones y vueltas.

create table if not exists lancelot_sesiones (
  id uuid primary key default gen_random_uuid(),
  consultor_id uuid not null references consultores(id) on delete cascade,
  proyecto_id uuid references proyectos(id) on delete set null,
  objetivo text not null,
  foco text not null check (foco in ('comercial', 'entrega', 'sistema')),
  horizonte text not null check (horizonte in ('hoy', 'semana', 'mes')),
  estado text not null default 'activa' check (estado in ('activa', 'cerrada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lancelot_vueltas (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references lancelot_sesiones(id) on delete cascade,
  numero integer not null check (numero > 0),
  retroalimentacion text,
  salida jsonb not null,
  created_at timestamptz not null default now(),
  unique (sesion_id, numero)
);

create index if not exists lancelot_sesiones_consultor_updated_idx
  on lancelot_sesiones (consultor_id, updated_at desc);

create index if not exists lancelot_vueltas_sesion_numero_idx
  on lancelot_vueltas (sesion_id, numero);

alter table lancelot_sesiones enable row level security;
alter table lancelot_vueltas enable row level security;

drop policy if exists "consultor gestiona sus sesiones lancelot" on lancelot_sesiones;
create policy "consultor gestiona sus sesiones lancelot"
  on lancelot_sesiones for all
  using (
    consultor_id in (select id from consultores where user_id = auth.uid())
  )
  with check (
    consultor_id in (select id from consultores where user_id = auth.uid())
  );

drop policy if exists "consultor gestiona vueltas de sus sesiones lancelot" on lancelot_vueltas;
create policy "consultor gestiona vueltas de sus sesiones lancelot"
  on lancelot_vueltas for all
  using (
    sesion_id in (
      select ls.id
      from lancelot_sesiones ls
      join consultores c on c.id = ls.consultor_id
      where c.user_id = auth.uid()
    )
  )
  with check (
    sesion_id in (
      select ls.id
      from lancelot_sesiones ls
      join consultores c on c.id = ls.consultor_id
      where c.user_id = auth.uid()
    )
  );

