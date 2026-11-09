# Login e Minhas Listas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Login com e-mail e senha (Supabase) e listas pessoais "Quero assistir" / "Já assistidos", com abas na página inicial, botões de marcar e selos nos cartões.

**Architecture:** A sessão do Supabase vive em cookies lidos no servidor via `@supabase/ssr`; todo acesso ao Supabase passa por `lib/supabase/` (`server-only`). Marcações e login são Server Actions; `proxy.ts` só renova a sessão. O banco guarda apenas `(user_id, filme_id, status)`; os dados dos filmes continuam vindo de `lib/tmdb/`.

**Tech Stack:** Next.js 16.4 (App Router, `proxy.ts`, Server Actions, `refresh` de `next/cache`), React 19 (`useActionState`, `useOptimistic`), `@supabase/supabase-js` + `@supabase/ssr`, Tailwind 4, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-08-login-e-minhas-listas-design.md`

## Global Constraints

- Ler `node_modules/next/dist/docs/` antes de usar uma API do Next (AGENTS.md). Middleware se chama **proxy** (`proxy.ts` na raiz, export `proxy`).
- Variáveis só de servidor: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. Nunca `NEXT_PUBLIC_`. Sem elas, o app funciona como hoje (ninguém logado).
- Nenhum cliente do Supabase no navegador. Módulos de `lib/supabase/` e `lib/listas.ts` importam `server-only`.
- Tabela `public.lista_filmes(user_id, filme_id, status, atualizado_em)`, PK `(user_id, filme_id)`, `status in ('quero','assistido')`, RLS com `(select auth.uid()) = user_id`, grants só para `authenticated`.
- Endereços: `/entrar` (`?modo=criar`, `voltar`, `filme`, `marcar`), `/?aba=quero-assistir`, `/?aba=assistidos`, `GET /api/lista?aba=&pagina=&pais=`.
- Listas: 24 por página, mais recentes primeiro (`atualizado_em desc`).
- Visual: seguir os tokens de `app/globals.css` (preto, `accent` vermelho, `match` verde, `muted`), botões `rounded-sm`, foco visível branco.
- Textos fixos (pt-BR, exatamente assim):
  - Login: abas "Entrar" / "Criar conta"; campos "E-mail" / "Senha"; botões "Entrar" / "Criar conta".
  - Erros de login: "E-mail ou senha incorretos." · "Já existe uma conta com esse e-mail. Entre com sua senha." · "A senha precisa ter pelo menos 6 caracteres." · "Digite um e-mail válido." · "Não foi possível conectar agora. Tente de novo em instantes."
  - Marcar: "+ Quero assistir" · "✓ Já assisti" · erro "Não foi possível salvar. Tente de novo."
  - Cabeçalho: "Entrar" · abas "Catálogo" / "Quero assistir" / "Já assistidos" · "Sair".
  - Selos (texto acessível): "Na sua lista Quero assistir" · "Você já assistiu".
  - Aba: título "Quero assistir" / "Já assistidos" + contagem "· 1 filme" / "· N filmes".
  - Vazio: "Nenhum filme aqui ainda. Encontre algo no catálogo e toque em + Quero assistir." · "Nenhum filme aqui ainda. Quando terminar um filme, toque em ✓ Já assisti na página dele." · botão "Explorar catálogo".

## Review Focus

1. **`voltar` malicioso** (`//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:`) → sempre cai em `/`. Teste: Task 3 (`caminhoSeguro`).
2. **"Confirm email" ainda ligado no Supabase** → `signUp` volta sem sessão; a pessoa vê "Conta criada. Confirme seu e-mail para entrar." em vez de ficar presa num redirect para a aba protegida. Teste: Task 4 (`criarConta` sem `session`).
3. **Duplo clique / troca rápida nos botões de marcar** → estado final igual ao último clique; o banco nunca tem duas linhas (PK). Teste: Task 3 (`MarkButtons` clica "Quero" e logo "Já assisti" → última chamada `"assistido"`).
4. **Supabase não configurado** (sem env) → catálogo renderiza, cabeçalho mostra "Entrar", `/entrar` mostra o erro de conexão ao enviar. Testes: Task 1 (`getUsuario` → `null`), Task 2 (`getMarcas` → `{}`), Task 4 (`entrar` sem cliente).
5. **Filme removido do TMDB numa lista** (404) → cartão pulado, contagem do título continua a do banco. Teste: Task 2 (`getLista` com um `getMovieDetails` rejeitado).

---

## Estrutura de arquivos

```
supabase/migrations/20261108000000_lista_filmes.sql   tabela, índice, RLS, grants
proxy.ts                         renova sessão (cookies)
lib/supabase/server.ts           createSupabase(): cliente do servidor ou null
lib/supabase/auth.ts             getUsuario()
lib/supabase/erros.ts            mensagemDeErro()
lib/marcas.ts                    Marca, parseMarca, Aba, ABAS, parseAba (sem server-only)
lib/listas.ts                    getMarcas, getLista, salvarMarca (server-only)
lib/redirect.ts                  caminhoSeguro()
app/filme/actions.ts             marcarFilme (Server Action)
app/entrar/actions.ts            entrar, criarConta, sair (Server Actions)
app/entrar/page.tsx              tela de login
app/api/lista/route.ts           "Carregar mais" das abas
components/MarkButtons.tsx       botões de marcar (client)
components/LoginForm.tsx         formulário (client, useActionState)
components/ListaView.tsx         aba de lista (server)
components/SiteHeader.tsx        + usuário, abas, menu (modificado)
components/MovieCard.tsx         + selo (modificado)
components/MovieGrid.tsx         endpoint/marcas/empty (modificado)
app/page.tsx, app/layout.tsx, app/filme/[id]/page.tsx, components/FeaturedHero.tsx (modificados)
```

---

### Task 1: Base do Supabase (dependências, banco, cliente, sessão)

**Files:**
- Create: `supabase/migrations/20261108000000_lista_filmes.sql`, `lib/supabase/server.ts`, `lib/supabase/auth.ts`, `proxy.ts`
- Modify: `package.json` (deps), `.env.local.example`
- Test: `tests/unit/supabase/auth.test.ts`

**Interfaces:**
- Produces: `createSupabase(): Promise<SupabaseClient | null>` (null sem env); `type Usuario = { id: string; email: string }`; `getUsuario(): Promise<Usuario | null>` (memorizado com `cache` do React).

- [ ] **Step 1:** `npm install @supabase/supabase-js @supabase/ssr`. Acrescentar a `.env.local.example`:
  ```
  SUPABASE_URL=https://seu-projeto.supabase.co
  SUPABASE_PUBLISHABLE_KEY=cole-sua-chave-publica-aqui
  ```
- [ ] **Step 2: Escrever a migração** conforme a seção 2 da spec (create table com `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`, `filme_id integer not null check (filme_id > 0)`, `status text not null check (status in ('quero','assistido'))`, `atualizado_em timestamptz not null default now()`, `primary key (user_id, filme_id)`; `create index lista_filmes_user_status_data on public.lista_filmes (user_id, status, atualizado_em desc)`; `alter table … enable row level security`; 4 políticas `to authenticated` com `(select auth.uid()) = user_id` (`using` em select/update/delete, `with check` em insert/update); `grant select, insert, update, delete on public.lista_filmes to authenticated`).
- [ ] **Step 3: Pausa — guiar o usuário**, passo a passo: (a) SQL Editor → colar o script → Run; (b) Authentication → Sign In / Providers → Email → desligar "Confirm email"; (c) Project Settings → API Keys / Data API → copiar Project URL e a chave pública (publishable/anon) para `.env.local`. Nunca pedir a senha do banco nem a secret key.
- [ ] **Step 4: Testes que falham** em `tests/unit/supabase/auth.test.ts` (`// @vitest-environment node`; `vi.mock("@/lib/supabase/server")`):
  - `"getUsuario devolve null sem Supabase configurado"`: `createSupabase` → `null` ⇒ `null`.
  - `"getUsuario devolve id e e-mail"`: `auth.getUser` → `{ data: { user: { id: "u1", email: "a@b.com" } }, error: null }` ⇒ `{ id: "u1", email: "a@b.com" }`.
  - `"getUsuario devolve null em erro ou exceção"`: `{ data: { user: null }, error: {} }` ⇒ `null`; `getUser` rejeitando ⇒ `null`.
- [ ] **Step 5:** `npx vitest run tests/unit/supabase` → FAIL (módulo inexistente).
- [ ] **Step 6: Implementar** `createSupabase` com `createServerClient(url, key, { cookies: { getAll, setAll } })` sobre `await cookies()` (`setAll` em `try/catch`, pois Server Components não podem gravar cookies). `getUsuario` usa `auth.getUser()` (valida no servidor), nunca `getSession()`.
- [ ] **Step 7: `proxy.ts`**: se faltar env, `NextResponse.next()`. Senão, `createServerClient` lendo `request.cookies.getAll()` e gravando em `request.cookies` e num `NextResponse.next({ request })` recriado; `await supabase.auth.getUser()`; devolver essa resposta. `config.matcher`: `["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]`.
- [ ] **Step 8:** `npx vitest run tests/unit/supabase` → PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 9: Commit** `feat: base do Supabase (tabela, cliente e sessão)`.

### Task 2: Camada de listas

**Files:**
- Create: `lib/marcas.ts`, `lib/listas.ts`
- Test: `tests/unit/marcas.test.ts`, `tests/unit/listas.test.ts`

**Interfaces:**
- Consumes: `createSupabase`, `getUsuario` (Task 1); `getMovieDetails(id, pais)` de `lib/tmdb`.
- Produces (`lib/marcas.ts`, sem `server-only`): `type Marca = "quero" | "assistido"`; `parseMarca(v: unknown): Marca | null`; `type Aba = "quero-assistir" | "assistidos"`; `ABAS: Record<Aba, { marca: Marca; titulo: string }>` (`"Quero assistir"` / `"Já assistidos"`); `parseAba(v: string | undefined): Aba | null`.
- Produces (`lib/listas.ts`): `LISTA_POR_PAGINA = 24`; `type ListaPage = MoviePage & { total: number }`; `getMarcas(): Promise<Record<number, Marca>>`; `getLista(marca: Marca, pagina: number, pais: string): Promise<ListaPage>` (lança `Error` se o Supabase falhar); `salvarMarca(filmeId: number, marca: Marca | null): Promise<{ erro: string } | null>`.

- [ ] **Step 1: Testes que falham.** `marcas.test.ts`: `parseMarca` aceita só `"quero"`/`"assistido"`; `parseAba` aceita só as duas abas (`"x"`, `""`, `undefined` ⇒ `null`). `listas.test.ts` (node; mock de `@/lib/supabase/server`, `@/lib/supabase/auth` e `@/lib/tmdb`):
  - `"getMarcas devolve {} sem usuário"` e `"getMarcas devolve {} se o Supabase falhar"`.
  - `"getMarcas mapeia filme_id para status"`: linhas `[{filme_id: 1, status: "quero"}, {filme_id: 2, status: "assistido"}]` ⇒ `{ 1: "quero", 2: "assistido" }`.
  - `"getLista pede a página certa em ordem recente"`: página 2 ⇒ `.eq("status","quero")`, `.order("atualizado_em", { ascending: false })`, `.range(24, 47)`, `select` com `{ count: "exact" }`.
  - `"getLista pula filme que falhou no TMDB"`: ids `[10, 20]`, `getMovieDetails(20)` rejeita ⇒ `movies.map(m => m.id)` = `[10]`, `total` = valor de `count` (ex.: 30), `totalPages` = 2.
  - `"salvarMarca faz upsert por usuário e filme"`: ⇒ `upsert({ filme_id: 7, status: "assistido", atualizado_em: expect.any(String) }, { onConflict: "user_id,filme_id" })`; devolve `null`.
  - `"salvarMarca com null apaga a linha"`: ⇒ `delete().eq("filme_id", 7)`.
  - `"salvarMarca devolve erro em falha"`: `{ error: {} }` ou sem cliente ⇒ `{ erro: "Não foi possível salvar. Tente de novo." }`.
- [ ] **Step 2:** `npx vitest run tests/unit/marcas.test.ts tests/unit/listas.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** `getLista` converte `MovieDetails` em `Movie` (`genreIds` de `genres.map(g => g.id)`), com `Promise.allSettled`, mantendo a ordem do banco; `totalPages = Math.max(1, Math.ceil(total / 24))`.
- [ ] **Step 4:** mesmos testes → PASS.
- [ ] **Step 5: Commit** `feat: camada de listas (marcas, lista paginada, salvar)`.

### Task 3: Marcar filmes (ação + botões)

**Files:**
- Create: `lib/redirect.ts`, `app/filme/actions.ts`, `components/MarkButtons.tsx`
- Modify: `app/filme/[id]/page.tsx`, `components/FeaturedHero.tsx`, `app/page.tsx` (passar `marca` ao destaque)
- Test: `tests/unit/redirect.test.ts`, `tests/unit/actions/marcar.test.ts`, `tests/unit/components/mark-buttons.test.tsx`

**Interfaces:**
- Consumes: `getUsuario`, `salvarMarca`, `getMarcas`, `Marca`, `parseMarca`.
- Produces: `caminhoSeguro(v: string | null | undefined): string`; `marcarFilme(filmeId: number, marca: Marca | null, voltar: string): Promise<{ erro: string } | undefined>`; `<MarkButtons filmeId={number} marca={Marca | null} />`.

- [ ] **Step 1: Testes que falham.**
  - `caminhoSeguro`: `"/filme/1?pais=BR"` passa igual; `"//evil.com"`, `"/\\evil.com"`, `"https://evil.com"`, `"javascript:alert(1)"`, `""`, `null` ⇒ `"/"`.
  - `marcarFilme` (node; mock de `next/navigation` `redirect` lançando, `next/cache` `refresh`, auth e listas): sem usuário ⇒ `redirect("/entrar?voltar=%2Ffilme%2F5&filme=5&marcar=quero")`; sem usuário e `marca` null ⇒ `redirect` sem `filme`/`marcar`; com usuário ⇒ `salvarMarca(5, "quero")` e `refresh()`; `filmeId` 0/1.5 ou `marca` inválida ⇒ `{ erro: "Não foi possível salvar. Tente de novo." }` sem salvar; `salvarMarca` com erro ⇒ devolve o erro, sem `refresh`.
  - `MarkButtons` (mock de `@/app/filme/actions`, `next/navigation` `usePathname` → `"/filme/5"`, `useSearchParams` → `"pais=BR"`): nomes "+ Quero assistir" e "✓ Já assisti" com `aria-pressed`; clicar em "+ Quero assistir" ⇒ `aria-pressed="true"` imediato e `marcarFilme(5, "quero", "/filme/5?pais=BR")`; com `marca="quero"`, clicar nele ⇒ chamada com `null`; clicar "Quero" e logo "Já assisti" ⇒ última chamada `"assistido"`; ação devolvendo erro ⇒ volta ao estado anterior e mostra o texto em `role="status"`.
- [ ] **Step 2:** rodar os três arquivos → FAIL.
- [ ] **Step 3: Implementar.** `actions.ts` com `"use server"`. `MarkButtons` com `useOptimistic` + `startTransition`; estilo: inativo igual a "Mais informações" (`bg-white/25`), ativo `bg-white text-black`.
- [ ] **Step 4: Integrar.** Página do filme: `const marcas = await getMarcas()` e `<MarkButtons filmeId marca={marcas[id] ?? null} />` ao lado do trailer em `MovieHero` (nova prop `acoes?: ReactNode` em `MovieHero` para não acoplar). `FeaturedHero` recebe `marca: Marca | null` e renderiza `MarkButtons` após "Mais informações". Ajustar `tests/unit/components/details.test.tsx` se mudar a assinatura.
- [ ] **Step 5:** `npm test` → PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 6: Commit** `feat: marcar filmes como quero assistir ou já assisti`.

### Task 4: Entrar, criar conta e sair

**Files:**
- Create: `lib/supabase/erros.ts`, `app/entrar/actions.ts`, `app/entrar/page.tsx`, `components/LoginForm.tsx`
- Test: `tests/unit/supabase/erros.test.ts`, `tests/unit/actions/entrar.test.ts`, `tests/unit/components/login-form.test.tsx`

**Interfaces:**
- Consumes: `createSupabase`, `getUsuario`, `salvarMarca`, `parseMarca`, `caminhoSeguro`.
- Produces: `mensagemDeErro(e: { code?: string } | null | undefined): string`; `type EstadoLogin = { erro?: string; email?: string }`; `entrar(estado: EstadoLogin, form: FormData): Promise<EstadoLogin>`; `criarConta(estado, form)`: idem; `sair(): Promise<void>` (signOut + `redirect("/")`). Campos do form: `email`, `senha`, `voltar`, `filme`, `marcar`.

- [ ] **Step 1: Testes que falham.**
  - `mensagemDeErro`: `invalid_credentials` ⇒ "E-mail ou senha incorretos."; `user_already_exists` e `email_exists` ⇒ "Já existe uma conta…"; `weak_password` ⇒ "A senha precisa ter pelo menos 6 caracteres."; `email_address_invalid` ⇒ "Digite um e-mail válido."; outro/ausente ⇒ "Não foi possível conectar agora. Tente de novo em instantes."
  - `entrar`/`criarConta` (node): e-mail sem `@` ⇒ `{ erro: "Digite um e-mail válido.", email }` sem chamar o Supabase; senha com 5 caracteres ⇒ erro de senha; sucesso ⇒ `signInWithPassword({ email, password })` e `redirect("/filme/5")`; sucesso com `filme=5&marcar=quero` ⇒ `salvarMarca(5, "quero")` antes do redirect; `voltar="//evil.com"` ⇒ `redirect("/")`; erro do Supabase ⇒ `{ erro: mensagemDeErro(error), email }`; sem cliente ⇒ erro de conexão; `criarConta` com `data.session` nulo ⇒ `{ erro: "Conta criada. Confirme seu e-mail para entrar.", email }`.
  - `LoginForm` (mock das ações): aba "Entrar" ativa por padrão e "Criar conta" com `modo="criar"`; campos com rótulos "E-mail"/"Senha" (`type="email"`, `type="password"`, `minLength={6}`, `autoComplete` certo); `voltar`/`filme`/`marcar` vão em inputs ocultos; erro devolvido aparece em `role="alert"` e o e-mail continua preenchido.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3: Implementar.** `page.tsx` (server) lê `searchParams`; se `getUsuario()` existe ⇒ `redirect("/")`; abas são `Link`s para `/entrar?modo=criar&…` preservando `voltar/filme/marcar`. Layout centralizado, cartão `bg-black/75` sobre o fundo preto, título da aba em `font-display`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: entrar, criar conta e sair`.

### Task 5: Cabeçalho com usuário e abas

**Files:**
- Modify: `components/SiteHeader.tsx`, `app/layout.tsx`
- Test: `tests/unit/components/site-header.test.tsx`

**Interfaces:**
- Consumes: `getUsuario`, `Usuario`, `sair`, `ABAS`.
- Produces: `<SiteHeader usuario={{ email: string } | null} />`.

- [ ] **Step 1: Testes que falham** (mock de `next/navigation` e `@/app/entrar/actions`):
  - sem usuário: link "Entrar" com `href="/entrar?voltar=%2F%3Faba%3Dassistidos"` quando a URL é `/?aba=assistidos`; nenhuma aba; em `/entrar` o link não aparece.
  - com usuário: links "Catálogo" (`/`), "Quero assistir" (`/?aba=quero-assistir`), "Já assistidos" (`/?aba=assistidos`); a aba da URL tem `aria-current="page"`; com `pais=US` os links levam `&pais=US`; botão "Sair" presente; inicial "A" para `ana@x.com`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3: Implementar.** `layout.tsx` passa `await getUsuario()` (só `email`). Menu em `<details>`/`<summary>` (sem JS). Celular: abas em segunda linha com `overflow-x-auto`. Envolver o uso de `useSearchParams` em `<Suspense>` se o build exigir (ver docs).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: cabeçalho com login, abas e menu`.

### Task 6: Selos nos cartões e grade reutilizável

**Files:**
- Modify: `components/MovieCard.tsx`, `components/MovieGrid.tsx`, `components/SkeletonGrid.tsx` (se importar algo alterado), `app/page.tsx`
- Test: `tests/unit/components/grid.test.tsx`

**Interfaces:**
- Consumes: `Marca`, `getMarcas`.
- Produces: `<MovieCard movie pais marca?: Marca />`; `<MovieGrid initial={MoviePage} endpoint={string} pais={string} marcas={Record<number, Marca>} empty?: ReactNode />` — "Carregar mais" busca `${endpoint}${endpoint.includes("?") ? "&" : "?"}pagina=N`; `empty` substitui o `EmptyState` padrão.

- [ ] **Step 1: Testes que falham:** `MovieCard` com `marca="quero"` ⇒ texto acessível "Na sua lista Quero assistir"; `"assistido"` ⇒ "Você já assistiu"; sem `marca` ⇒ nenhum dos dois. `MovieGrid` com `endpoint="/api/lista?aba=assistidos&pais=BR"` ⇒ fetch de `/api/lista?aba=assistidos&pais=BR&pagina=2`; com `endpoint="/api/movies"` ⇒ `/api/movies?pagina=2`; repassa `marcas[id]` aos cartões; `empty` customizado aparece quando não há filmes. Atualizar os testes existentes do `MovieGrid` para as novas props.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3: Implementar.** Selo: canto inferior direito, círculo `bg-black/80`, ícone de marcador branco (quero) ou ✓ `text-match` (assistido), `sr-only` com o texto. `app/page.tsx` (catálogo) passa `endpoint={"/api/movies?" + filtersToSearchParams(filters)}` e `marcas={await getMarcas()}`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: selos de lista nos cartões`.

### Task 7: Abas de lista na página inicial

**Files:**
- Create: `components/ListaView.tsx`, `app/api/lista/route.ts`
- Modify: `app/page.tsx`
- Test: `tests/unit/api-lista.test.ts`, `tests/unit/components/lista-view.test.tsx`

**Interfaces:**
- Consumes: `parseAba`, `ABAS`, `getLista`, `getMarcas`, `getUsuario`, `MovieGrid`.
- Produces: `<ListaView aba={Aba} pais={string} />` (async server component); `GET /api/lista`.

- [ ] **Step 1: Testes que falham.**
  - rota: `aba=x` ou `pagina=0`/`abc` ⇒ 400 `{ error: "parâmetros inválidos" }`; sem usuário ⇒ 401 `{ error: "faça login" }`; ok ⇒ 200 com o `ListaPage` e `getLista("assistido", 2, "BR")` para `aba=assistidos&pagina=2`; `getLista` lançando ⇒ 502 `{ error: "Não foi possível carregar a lista" }`.
  - `ListaView` (renderizar o resultado de `await ListaView(...)`; mock de `@/lib/listas`): título "Quero assistir" com "· 12 filmes" e "· 1 filme" no singular; vazio ⇒ mensagem da aba + link "Explorar catálogo" para `/`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3: Implementar.** Em `app/page.tsx`: `const aba = parseAba(first(params.aba))`; com aba ⇒ sem usuário `redirect("/entrar?voltar=" + encodeURIComponent("/?aba=" + aba))`, senão renderiza `<main className="… pt-28">` com `<ListaView>`; sem aba ⇒ catálogo como hoje. `ListaView` usa `MovieGrid` com `endpoint="/api/lista?aba=…&pais=…"` e `empty` da aba.
- [ ] **Step 4:** `npm test` → PASS; `npx tsc --noEmit` e `npm run lint` limpos.
- [ ] **Step 5: Commit** `feat: abas Quero assistir e Já assistidos`.

### Task 8: Fluxo completo, documentação e conferência visual

**Files:**
- Create: `tests/e2e/listas.spec.ts`
- Modify: `playwright.config.ts`, `README.md`

- [ ] **Step 1:** `playwright.config.ts`: no topo, `try { process.loadEnvFile(".env.local"); } catch {}`.
- [ ] **Step 2: Teste E2E** `"listas: criar conta, marcar, mover e desmarcar"` com `test.skip(!process.env.SUPABASE_URL, "Supabase não configurado")`: e-mail `e2e+${Date.now()}@exemplo.com`, senha `senha-e2e-123`; criar conta em `/entrar?modo=criar`; abrir o primeiro filme do catálogo; clicar "+ Quero assistir"; ir a "Quero assistir" no cabeçalho e ver 1 cartão; voltar ao filme, clicar "✓ Já assisti"; "Quero assistir" vazia e "Já assistidos" com 1; desmarcar; "Sair" mostra "Entrar".
- [ ] **Step 3:** `npm run test:e2e` → PASS (os dois arquivos).
- [ ] **Step 4: README:** seção "Login e listas (Supabase)" com: criar projeto, rodar `supabase/migrations/…sql` no SQL Editor, desligar "Confirm email", preencher `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` no `.env.local` e na Vercel; atualizar "Como o código está organizado" com `lib/supabase/`, `lib/listas.ts` e `proxy.ts`.
- [ ] **Step 5: Conferência visual:** screenshots (desktop 1600×900 e celular 390×844) de cabeçalho sem/com login, `/entrar` (as duas abas, com erro), página do filme com os botões, destaque, catálogo com selos, as duas abas cheias e vazias. Corrigir o que destoar do visual atual.
- [ ] **Step 6:** `npm test`, `npx tsc --noEmit`, `npm run lint` → tudo limpo.
- [ ] **Step 7: Commit** `test: fluxo e2e das listas; docs: Supabase no README`.
