-- Lectura clínica de una ficha, producida por el asistente con los marcos de
-- Isaac. Una por ficha: regenerar reemplaza la anterior, porque lo que importa
-- es la lectura vigente y no su historial.
create table if not exists lecturas (
  ficha_id text primary key references fichas (id) on delete cascade,
  -- El objeto completo en JSON: alertas, lectura, temas, seguridad, huecos y
  -- preguntas abiertas. Se guarda entero para poder cambiar la presentación sin
  -- volver a pagar la generación.
  contenido text not null,
  -- Con qué se produjo. Una lectura clínica envejece cuando cambian el modelo o
  -- los marcos, y sin esto no hay manera de saber cuál hay que rehacer.
  modelo text not null,
  marco_version text not null,
  creada_at timestamptz not null default now()
);
