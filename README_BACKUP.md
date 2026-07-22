# Backup y restauración — ADAPTA OS

Backup diario gratuito vía GitHub Actions (`.github/workflows/backup.yml`). Corre a las 07:00 UTC (~2am Colombia), sube el dump como un **GitHub Release** de este repo, y en cada corrida prueba automáticamente que el dump se puede restaurar (contra una base de datos efímera de prueba, nunca contra producción — si la restauración de prueba falla, el workflow falla y te avisa).

## Configuración inicial (una sola vez)

1. Ve a tu proyecto Supabase → **Settings → Database → Connection string** → copia la URI en modo **Session pooler** (o "Transaction pooler"; evita "Direct connection" si tu red no soporta IPv6).
2. Ve a este repo en GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
3. Nombre: `SUPABASE_DB_URL`. Valor: la connection string del paso 1 (incluye la contraseña de la base de datos — trátala como una contraseña, no la compartas).
4. Guarda. El workflow ya está listo para correr (manual o por el cron diario).

## Cómo restaurar un backup manualmente

1. Ve a la pestaña **Releases** de este repo en GitHub.
2. Busca el release con la fecha que quieres restaurar (`backup-2026-07-22`, por ejemplo) y descarga el archivo `adapta-os-backup-YYYY-MM-DD.dump`.
3. Necesitas `pg_restore` instalado localmente (viene con `postgresql-client`; en Windows, instala PostgreSQL o solo las "Command Line Tools" desde postgresql.org).
4. Consigue la connection string de **destino** (Settings → Database → Connection string de Supabase — normalmente la de un proyecto nuevo o el mismo si estás recuperando datos perdidos).
5. Corre:
   ```bash
   pg_restore --dbname="<CONNECTION_STRING_DESTINO>" --no-owner --no-privileges --clean --if-exists adapta-os-backup-YYYY-MM-DD.dump
   ```
   - `--clean --if-exists` borra las tablas existentes antes de recrearlas — úsalo solo si quieres **reemplazar** el estado actual, no si quieres combinar datos.
   - `--no-owner --no-privileges` evita errores por roles que no existen en el proyecto de destino.
6. Verifica que los datos aparecen en el dashboard de Supabase o en la app.

## Notas

- El dump usa formato `custom` de `pg_dump` (`-F c`), no SQL plano — por eso se restaura con `pg_restore`, no con `psql`.
- Cada corrida del workflow ya prueba la restauración automáticamente contra una base de datos temporal — si ves el workflow en verde en la pestaña Actions, el backup de esa fecha es restaurable, no solo "se generó".
- Si algún día cambias de plan a Supabase Pro, este workflow sigue siendo útil como respaldo adicional fuera de Supabase — no hace daño tenerlo corriendo en paralelo.
