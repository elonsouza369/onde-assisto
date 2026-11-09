-- Listas pessoais "Quero assistir" e "Já assistidos".
-- Cada usuário tem no máximo uma linha por filme: o estado é "quero" ou "assistido".

create table public.lista_filmes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  filme_id integer not null check (filme_id > 0),
  status text not null check (status in ('quero', 'assistido')),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, filme_id)
);

create index lista_filmes_user_status_data
  on public.lista_filmes (user_id, status, atualizado_em desc);

alter table public.lista_filmes enable row level security;

create policy "Dono lê suas linhas"
  on public.lista_filmes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Dono cria suas linhas"
  on public.lista_filmes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Dono altera suas linhas"
  on public.lista_filmes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Dono apaga suas linhas"
  on public.lista_filmes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- O projeto não expõe tabelas novas automaticamente: libera só para usuários logados.
grant select, insert, update, delete on public.lista_filmes to authenticated;
