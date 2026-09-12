create table if not exists staff (
  user_id text primary key,
  email text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists staff_invites (
  email text primary key
);

create table if not exists fichas (
  id text primary key,
  nombre text not null,
  email text not null,
  telefono text not null,
  retiro text not null,
  payload text not null,
  flags text not null default '[]',
  hold_count integer not null default 0,
  lectura text not null default '',
  status text not null default 'nueva',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists fichas_created_at_idx on fichas (created_at desc);
create index if not exists fichas_status_idx on fichas (status);
create index if not exists fichas_email_idx on fichas (email);
