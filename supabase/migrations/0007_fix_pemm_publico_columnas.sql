-- Fix de auditoría de seguridad (Parte 1.2): la policy "respuesta publica de pemm via
-- token" solo restringe QUÉ FILA puede tocar un usuario anon (una con token asignado,
-- en estado pendiente), pero Postgres RLS no restringe QUÉ COLUMNAS puede cambiar dentro
-- de esa fila. Sin este trigger, alguien con un token válido podría —vía un PATCH directo
-- a la REST API con la anon key pública, sin pasar por nuestro Server Action— reasignar
-- la evaluación a otro proyecto, cambiar el nivel del respondiente, vaciar el token, etc.
-- Este trigger limita las actualizaciones de rol anon a únicamente los campos de respuesta
-- (los puntajes 1-4, nivel_resultante, evidencias, estado) — exactamente lo que
-- responderPemmPublico() en lib/actions/pemm.ts efectivamente necesita escribir.

create or replace function proteger_columnas_pemm_publico()
returns trigger as $$
begin
  if auth.role() = 'anon' then
    if new.proyecto_id is distinct from old.proyecto_id
       or new.proceso_evaluado is distinct from old.proceso_evaluado
       or new.tipo is distinct from old.tipo
       or new.respondiente_nivel is distinct from old.respondiente_nivel
       or new.respondiente_nombre is distinct from old.respondiente_nombre
       or new.fuente is distinct from old.fuente
       or new.token is distinct from old.token
       or new.created_at is distinct from old.created_at
    then
      raise exception 'No autorizado a modificar estos campos vía enlace público.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_proteger_pemm_publico
  before update on pemm_evaluaciones
  for each row
  execute function proteger_columnas_pemm_publico();
