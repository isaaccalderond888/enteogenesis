-- Permitir que quien llenó una ficha la complete o corrija sin empezar de cero.
--
-- El staff genera un enlace desde el expediente; la persona lo abre sin cuenta,
-- edita lo que falte y guarda sobre el mismo registro.

create table if not exists ficha_links (
  -- Sólo el hash del token. Si la base se filtra, los enlaces no sirven: quien
  -- la lea tendría los hashes, no los tokens que abren la ficha.
  token_hash text primary key,
  ficha_id text not null references fichas (id) on delete cascade,
  creado_por text not null default '',
  creado_at timestamptz not null default now(),
  expira_at timestamptz not null,
  -- Se marca al primer guardado, no al abrir: si abrir lo consumiera, cerrar la
  -- pestaña sin querer dejaría a la persona fuera de su propia ficha.
  usado_at timestamptz
);

create index if not exists ficha_links_ficha_idx on ficha_links (ficha_id);
create index if not exists ficha_links_expira_idx on ficha_links (expira_at);

-- Cada versión anterior de una ficha editada.
--
-- No es historial por prolijidad: es seguridad clínica. Si alguien corrige «ya
-- no tomo sertralina», hace falta poder ver qué decía antes y cuándo cambió.
-- Una ficha que se sobrescribe en silencio borra justo el dato que obliga a
-- preguntar de nuevo.
create table if not exists ficha_versiones (
  id text primary key,
  ficha_id text not null references fichas (id) on delete cascade,
  payload text not null,
  guardada_at timestamptz not null default now()
);

create index if not exists ficha_versiones_ficha_idx
  on ficha_versiones (ficha_id, guardada_at desc);

-- Rastro visible en el expediente.
alter table fichas add column if not exists editada_at timestamptz;
alter table fichas add column if not exists editada_veces integer not null default 0;
