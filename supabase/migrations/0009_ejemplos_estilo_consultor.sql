-- Bloque 1.3 — campo de "ejemplos de estilo" para inyectar voz propia del consultor en
-- los prompts de redacción. Se agrega el campo y el mecanismo de inyección, pero queda
-- inactivo hasta que el consultor pegue su propio contenido: sin valor, el comportamiento
-- de los prompts es idéntico al de hoy (ver construirBloqueEstiloConsultor en lib/ia).

alter table consultores add column ejemplos_estilo text;
