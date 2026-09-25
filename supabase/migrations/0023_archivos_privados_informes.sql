-- Informe 360 recuperable: binario en Storage privado, metadato en entregables.
begin;

alter table public.entregables add column if not exists archivo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nexus-informes', 'nexus-informes', false, 10485760,
  array['application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "consultor lee informes propios" on storage.objects;
create policy "consultor lee informes propios" on storage.objects for select to authenticated
using (
  bucket_id = 'nexus-informes'
  and exists (
    select 1 from public.proyectos p
    join public.consultores c on c.id = p.consultor_id
    where c.user_id = (select auth.uid())
      and c.id::text = split_part(name, '/', 1)
      and p.id::text = split_part(name, '/', 2)
  )
);

drop policy if exists "consultor sube informes propios" on storage.objects;
create policy "consultor sube informes propios" on storage.objects for insert to authenticated
with check (
  bucket_id = 'nexus-informes'
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}[.]docx$'
  and exists (
    select 1 from public.proyectos p
    join public.consultores c on c.id = p.consultor_id
    where c.user_id = (select auth.uid())
      and c.id::text = split_part(name, '/', 1)
      and p.id::text = split_part(name, '/', 2)
  )
);

drop policy if exists "consultor retira informes propios" on storage.objects;
create policy "consultor retira informes propios" on storage.objects for delete to authenticated
using (
  bucket_id = 'nexus-informes'
  and exists (
    select 1 from public.proyectos p
    join public.consultores c on c.id = p.consultor_id
    where c.user_id = (select auth.uid())
      and c.id::text = split_part(name, '/', 1)
      and p.id::text = split_part(name, '/', 2)
  )
);

commit;
