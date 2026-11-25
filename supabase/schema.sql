-- Da incollare in Supabase: SQL Editor -> New query -> Run.
-- Ogni cliente appartiene a un utente; la Row Level Security impedisce
-- a chiunque altro (anche con la publishable key) di leggerlo o modificarlo.

create table if not exists public.clients (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);

alter table public.clients enable row level security;

-- Nessun accesso per chi non ha fatto login
revoke all on public.clients from anon;
grant select, insert, update, delete on public.clients to authenticated;

drop policy if exists "Leggi i tuoi clienti" on public.clients;
drop policy if exists "Crea i tuoi clienti" on public.clients;
drop policy if exists "Modifica i tuoi clienti" on public.clients;
drop policy if exists "Elimina i tuoi clienti" on public.clients;

create policy "Leggi i tuoi clienti" on public.clients
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Crea i tuoi clienti" on public.clients
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Modifica i tuoi clienti" on public.clients
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Elimina i tuoi clienti" on public.clients
  for delete to authenticated
  using ((select auth.uid()) = user_id);
