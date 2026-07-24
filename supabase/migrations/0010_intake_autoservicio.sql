-- ADAPTA OS — Bloque 3: intake de autoservicio ("describe tu propio proceso")
-- Añade a `entrevistas` el mismo patrón de enlace público con token ya usado en
-- `pemm_evaluaciones`, más un campo `origen` para distinguir una entrevista dirigida
-- por el consultor de una descripción de autoservicio hecha por la propia persona.

alter table entrevistas
  add column token uuid unique,
  add column estado text check (estado in ('pendiente','respondida')) not null default 'respondida',
  add column origen text check (origen in ('entrevista_dirigida','autoservicio')) not null default 'entrevista_dirigida';

-- Enlace público de autoservicio: cualquiera con el token puede leer y responder
-- únicamente la fila que ya tiene ese token asignado por el consultor. Mismo patrón
-- que "lectura publica de pemm via token" / "respuesta publica de pemm via token".
create policy "lectura publica de entrevista via token"
  on entrevistas for select
  to anon
  using (token is not null);

create policy "respuesta publica de entrevista via token"
  on entrevistas for update
  to anon
  using (token is not null and estado = 'pendiente')
  with check (token is not null);
