-- Ejecutar solo despues de desplegar el codigo que usa estado_comercial y
-- fase_metodologica. La migracion 0012 conserva temporalmente esta columna
-- para permitir un despliegue sin interrupciones.

begin;

alter table public.proyectos
  drop column if exists estado;

commit;
