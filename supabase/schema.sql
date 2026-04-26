-- ============================================
--  SCHEMA SUPABASE · RAPPORTINI ELETTRICISTI
--  Da copiare e incollare nell'SQL Editor di Supabase
-- ============================================

-- Tabella DIPENDENTI
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cognome text not null,
  token text unique not null,
  created_at timestamptz default now()
);

-- Tabella COMMESSE
create table if not exists commesse (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  is_system boolean default false,
  created_at timestamptz default now()
);

-- Tabella RAPPORTINI
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  commessa text not null,
  ora_inizio text,
  ora_fine text,
  plus_one boolean default false,
  ore_lavorate numeric(5,2) default 0,
  permesso_ore numeric(5,2) default 0,
  created_at timestamptz default now()
);

-- Tabella IMPOSTAZIONI (riga unica)
create table if not exists settings (
  id int primary key default 1,
  company_name text default 'Studio Elettrico',
  google_drive_folder_id text default '',
  constraint single_row check (id = 1)
);

-- Inserimento dati di base (solo se mancano)
insert into commesse (nome, is_system) values ('Ferie', true)
  on conflict (nome) do nothing;
insert into commesse (nome, is_system) values ('Malattia', true)
  on conflict (nome) do nothing;

insert into settings (id, company_name) values (1, 'Studio Elettrico')
  on conflict (id) do nothing;

-- ============================================
--  POLITICHE DI ACCESSO (RLS)
-- ============================================
-- Per semplicità abilitiamo accesso completo con la chiave anon.
-- L'app usa una password admin lato client + token unico per dipendente.
-- Per progetti più grandi conviene una RLS più restrittiva.

alter table users enable row level security;
alter table commesse enable row level security;
alter table reports enable row level security;
alter table settings enable row level security;

drop policy if exists "anon_full_access_users" on users;
create policy "anon_full_access_users" on users
  for all using (true) with check (true);

drop policy if exists "anon_full_access_commesse" on commesse;
create policy "anon_full_access_commesse" on commesse
  for all using (true) with check (true);

drop policy if exists "anon_full_access_reports" on reports;
create policy "anon_full_access_reports" on reports
  for all using (true) with check (true);

drop policy if exists "anon_full_access_settings" on settings;
create policy "anon_full_access_settings" on settings
  for all using (true) with check (true);

-- ============================================
--  FINE
-- ============================================
