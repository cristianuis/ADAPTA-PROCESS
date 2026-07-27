-- Define la direccion de mejora de cada indicador. El sentido es obligatorio;
-- los limites solo aplican a indicadores con rango objetivo.

begin;

alter table public.indicadores
  add column if not exists sentido text,
  add column if not exists limite_inferior numeric,
  add column if not exists limite_superior numeric;

-- Inventario validado en produccion el 2026-07-27: ambos indicadores miden
-- cumplimiento porcentual, por lo que un valor mayor representa mejor resultado.
update public.indicadores
set sentido = 'mayor_es_mejor'
where sentido is null
  and nombre in (
    '% pedidos a tiempo',
    '% de pedidos despachados sin error de referencia'
  );

-- Evita inventar un sentido para datos desconocidos en otros ambientes.
do $$
begin
  if exists (select 1 from public.indicadores where sentido is null) then
    raise exception
      'Hay indicadores existentes cuyo sentido debe clasificarse antes de continuar';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'indicadores_sentido_check'
      and conrelid = 'public.indicadores'::regclass
  ) then
    alter table public.indicadores
      add constraint indicadores_sentido_check
      check (
        sentido in ('mayor_es_mejor', 'menor_es_mejor', 'rango_objetivo')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'indicadores_objetivo_check'
      and conrelid = 'public.indicadores'::regclass
  ) then
    alter table public.indicadores
      add constraint indicadores_objetivo_check
      check (
        (
          sentido = 'rango_objetivo'
          and limite_inferior is not null
          and limite_superior is not null
          and limite_inferior <= limite_superior
        )
        or
        (
          sentido in ('mayor_es_mejor', 'menor_es_mejor')
          and limite_inferior is null
          and limite_superior is null
        )
      );
  end if;
end;
$$;

alter table public.indicadores
  alter column sentido set not null;

comment on column public.indicadores.sentido is
  'Direccion de mejora obligatoria: mayor, menor o rango objetivo.';
comment on column public.indicadores.limite_inferior is
  'Limite inferior inclusivo cuando sentido = rango_objetivo.';
comment on column public.indicadores.limite_superior is
  'Limite superior inclusivo cuando sentido = rango_objetivo.';

commit;
