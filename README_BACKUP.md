# Backup y restauracion - ADAPTA OS

El backup corre diariamente a las 07:00 UTC mediante GitHub Actions. El flujo:

1. genera un `pg_dump` completo en formato custom;
2. lo cifra localmente con GPG y AES-256;
3. elimina el dump sin cifrar;
4. descifra el archivo cifrado y restaura el esquema `public` en PostgreSQL efimero;
5. compara conteos de clientes y proyectos con produccion;
6. publica un artifact privado de GitHub Actions durante 30 dias.

No se publican backups como GitHub Releases.

## Secretos necesarios

- `SUPABASE_DB_URL`: conexion Session Pooler de Supabase.
- `BACKUP_ENCRYPTION_PASSPHRASE`: clave aleatoria de al menos 32 caracteres.

La copia de recuperacion se conserva fuera del repositorio en:

`C:\Users\crisd\Documents\ADAPTA_OS_BACKUP_RECOVERY.txt`

Sin esa clave no es posible recuperar los archivos `.dump.gpg`.

## Politica de retencion

- Frecuencia: diaria.
- Retencion: 30 dias.
- Destino: GitHub Actions Artifacts, privado y cifrado en reposo por GitHub.
- Cifrado adicional antes de la carga: GPG AES-256.
- Los runners y archivos temporales se eliminan al terminar cada job.

## Restaurar manualmente

1. Abre GitHub -> Actions -> `Backup diario cifrado de base de datos`.
2. Abre la ejecucion deseada y descarga `adapta-os-backup-YYYY-MM-DD`.
3. Extrae el ZIP; contiene `adapta-os-backup-YYYY-MM-DD.dump.gpg`.
4. Copia la clave desde el archivo local de recuperacion a un archivo temporal, por ejemplo `backup-passphrase.txt`, dejando solamente el valor despues de `=`.
5. Descifra:

   ```bash
   gpg --batch --yes --pinentry-mode loopback \
     --passphrase-file backup-passphrase.txt \
     --output adapta-os-backup-YYYY-MM-DD.dump \
     --decrypt adapta-os-backup-YYYY-MM-DD.dump.gpg
   ```

6. Restaura sobre una base de destino vacia:

   ```bash
   pg_restore \
     --dbname="<CONNECTION_STRING_DESTINO>" \
     --no-owner --no-privileges \
     --clean --if-exists \
     adapta-os-backup-YYYY-MM-DD.dump
   ```

`--clean --if-exists` reemplaza objetos existentes. No debe apuntarse a produccion sin revisar antes el destino.

## Que valida automaticamente

La prueba usa exactamente el artifact despues de cifrarlo y descifrarlo. Verifica:

- integridad del archivo custom mediante `pg_restore --list`;
- restauracion de las secciones pre-data, data y post-data;
- al menos 17 tablas del esquema `public`;
- igualdad de conteos de `clientes` y `proyectos` entre origen y restauracion.

El job falla antes de publicar si el cifrado, descifrado o restauracion no son validos.
