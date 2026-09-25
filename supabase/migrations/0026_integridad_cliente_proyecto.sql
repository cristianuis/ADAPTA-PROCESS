-- Un proyecto nunca puede apuntar a un cliente de otro consultor.
-- Esta relación también impide reasignaciones que crucen el límite del tenant
-- mientras se prepara el modelo de membresías por organización.
do $$
begin
  if exists (
    select 1
    from public.proyectos as p
    join public.clientes as c on c.id = p.cliente_id
    where p.consultor_id <> c.consultor_id
  ) then
    raise exception 'Hay proyectos con cliente y consultor de organizaciones diferentes; corregirlos antes de aplicar 0026';
  end if;
end $$;

create unique index if not exists clientes_id_consultor_id_unique
  on public.clientes (id, consultor_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.proyectos'::regclass
      and conname = 'proyectos_cliente_consultor_fk'
  ) then
    alter table public.proyectos
      add constraint proyectos_cliente_consultor_fk
      foreign key (cliente_id, consultor_id)
      references public.clientes (id, consultor_id)
      not valid;
  end if;
end $$;

alter table public.proyectos validate constraint proyectos_cliente_consultor_fk;
