# Onde Assisto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app "Onde Assisto" que lista os filmes disponíveis em streaming por assinatura no país escolhido (padrão Brasil), com filtros por streaming e gênero, busca, ordenação e página de detalhes.

**Architecture:** Next.js (App Router) renderiza as páginas no servidor e consulta a API do TMDB por um cliente único em `lib/tmdb/`, com cache via `fetch(..., { next: { revalidate } })`. Os filtros vivem na URL (`lib/filters.ts`); componentes de cliente só alteram a URL ou pedem mais páginas à rota interna `/api/movies`. Sem banco de dados.

**Tech Stack:** Next.js (versão estável atual via `create-next-app@latest`), React, TypeScript, Tailwind CSS, Vitest + Testing Library + jsdom, Playwright. Node 24 (já instalado).

**Spec:** `docs/superpowers/specs/2026-10-24-catalogo-filmes-streaming-design.md`

## Global Constraints

- Token só no servidor: variável `TMDB_API_TOKEN` (API Read Access Token, enviado como `Authorization: Bearer <token>`); nunca prefixar com `NEXT_PUBLIC_`. Módulos de `lib/tmdb/` importam `server-only`.
- Toda chamada ao TMDB envia `language=pt-BR`; base `https://api.themoviedb.org/3`; imagens em `https://image.tmdb.org/t/p/<tamanho><path>`.
- Somente assinatura: `with_watch_monetization_types=flatrate` e, nos provedores de um filme, só a lista `flatrate`.
- Cache: listas (provedores, gêneros, regiões) `revalidate: 86400`; catálogo, busca, provedores de filme e detalhes `revalidate: 21600`.
- Tempo limite de 10 s por chamada; em 429, uma nova tentativa após 1 s.
- Parâmetros de URL: `pais` (padrão `BR`), `streaming` e `genero` (IDs separados por vírgula), `ordem` (`popularidade` padrão, `nota`, `lancamento`, `titulo`), `q`; rota interna aceita também `pagina` (1–500).
- Vários streamings/gêneros combinam com OU (separador `|` no TMDB).
- Interface inteiramente em pt-BR. `<html lang="pt-BR">`, título "Onde Assisto".
- Cores (Tailwind, definidas como tokens em `app/globals.css`): fundo `#0b0b0b`, superfície `#151515`, superfície elevada `#222222`, destaque `#e50914`, nota `#ffd54a`.
- Imagens via `next/image` com `images.unoptimized: true` (evita o limite de otimização do plano grátis da Vercel).
- Textos fixos:
  - Erro: "Não foi possível carregar os filmes" + botão "Tentar de novo"
  - Vazio: "Nenhum filme encontrado com esses filtros." + botão "Limpar filtros"
  - Busca: "Mostrando resultados disponíveis em streaming em {país}"
  - Detalhes: título do bloco "Onde assistir · {país}"; sem streaming: "Não disponível em streaming em {país} no momento"; botão "▶ Ver trailer"; botão "Carregar mais"
  - 404 do filme: "Filme não encontrado"
  - Token ausente: "Defina TMDB_API_TOKEN em .env.local"
  - Rodapé: "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB." e "Dados de disponibilidade: JustWatch."

## Review Focus

1. **Filme com dados faltando** (sem pôster, sem data, sem backdrop, sem duração, sem sinopse) → cartão e página renderizam com imagem/degradê padrão e campos omitidos, nunca "undefined"/"NaN". Testes: Task 3 (`mapMovie`/`mapDetails` com campos nulos), Task 8 (`MovieCard` sem pôster).
2. **Busca com acentos e símbolos** ("ação & cia") → enviada codificada, resultados corretos. Teste: Task 2 (`tmdbFetch` codifica `query`).
3. **Troca de país com streaming selecionado** → filtro de streaming limpo; IDs inválidos/lixo na URL ignorados. Testes: Task 1 (`withCountry`, `parseFilters` com `streaming=8,abc,-1`).
4. **"Carregar mais" repetindo filmes** (popularidade muda entre páginas no TMDB) → grade não mostra o mesmo filme duas vezes; botão some na última página. Teste: Task 8 (`MovieGrid` deduplica por `id`).
5. **Filme sem trailer ou só com vídeos fora do YouTube / sem tipo Trailer** → botão "▶ Ver trailer" não aparece. Testes: Task 3 (`pickTrailer`), Task 11 (`MovieHero` sem `trailerKey`).

---

## Estrutura de arquivos

```
app/
  layout.tsx            cabeçalho (logo), <Footer>, fonte, lang pt-BR
  globals.css           Tailwind + tokens de cor
  page.tsx              catálogo (server)
  loading.tsx           grade skeleton
  error.tsx             ErrorState (client)
  api/movies/route.ts   "Carregar mais"
  filme/[id]/page.tsx   detalhes (server)
  filme/[id]/not-found.tsx
components/
  MovieCard.tsx  MovieGrid.tsx  SkeletonGrid.tsx  EmptyState.tsx  ErrorState.tsx
  SearchBox.tsx  CountrySelect.tsx  FilterBar.tsx  ProviderFilter.tsx  GenreFilter.tsx  SortSelect.tsx
  MovieHero.tsx  WatchProviders.tsx  TrailerModal.tsx  Footer.tsx
lib/
  filters.ts            URL <-> Filters
  useFilterNavigation.ts hook client: aplica Filters na URL
  tmdb/types.ts         tipos de domínio
  tmdb/http.ts          tmdbFetch, erros
  tmdb/images.ts        imageUrl
  tmdb/mappers.ts       bruto TMDB -> domínio
  tmdb/lists.ts         getProviders, getGenres, getRegions
  tmdb/catalog.ts       getMovieProviders, discoverMovies, searchMovies, fetchCatalogPage
  tmdb/details.ts       getMovieDetails
tests/
  unit/**               Vitest
  fixtures/*.json       respostas falsas do TMDB
  e2e/catalog.spec.ts   Playwright
```

---

### Task 0: Projeto Next.js + ferramentas de teste

**Files:**
- Create: projeto Next.js na raiz, `vitest.config.ts`, `vitest.setup.ts`, `tests/stubs/server-only.ts`, `.env.local.example`, `tests/unit/smoke.test.ts`
- Modify: `.gitignore` (manter `.superpowers/` + regras do Next), `next.config.ts`, `app/globals.css`, `app/layout.tsx`, `package.json`

**Interfaces:**
- Produces: scripts `npm run dev`, `npm run build`, `npm test` (= `vitest run`), `npm run test:e2e` (= `playwright test`); alias `@/*` → raiz; classes Tailwind `bg-bg`, `bg-surface`, `bg-surface-2`, `text-accent`/`bg-accent`, `text-rating`.

- [ ] **Step 1: Gerar o projeto.** `npx create-next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --turbopack`. Se recusar por arquivos existentes (`.superpowers/`), gerar em `./_scaffold` e mover todo o conteúdo (incluindo dotfiles) para a raiz, mesclando `.gitignore` (manter a linha `.superpowers/`); apagar `_scaffold`.
- [ ] **Step 2: Instalar dependências.** `npm i server-only` e `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom @playwright/test` e `npx playwright install chromium`.
- [ ] **Step 3: Configurar Vitest.** `vitest.config.ts`: plugin react, `environment: 'jsdom'`, `setupFiles: ['./vitest.setup.ts']`, `include: ['tests/unit/**/*.test.{ts,tsx}']`, alias `@` → raiz e `server-only` → `tests/stubs/server-only.ts` (arquivo vazio `export {}`). `vitest.setup.ts` importa `@testing-library/jest-dom/vitest`. Scripts em `package.json`: `"test": "vitest run"`, `"test:e2e": "playwright test"`.
- [ ] **Step 4: Tema e layout.** Em `app/globals.css`, após o import do Tailwind, declarar os tokens de cor das Global Constraints em `@theme` (`--color-bg`, `--color-surface`, `--color-surface-2`, `--color-accent`, `--color-rating`); `body` com `bg-bg text-white`. `app/layout.tsx`: `lang="pt-BR"`, metadata `title: "Onde Assisto"`, descrição "Descubra quais filmes estão disponíveis nos streamings agora.", cabeçalho com o logo "Onde Assisto" em `text-accent font-extrabold` linkando para `/`. Remover o conteúdo de exemplo do `app/page.tsx` (deixar um `<main>` vazio). `next.config.ts`: `images: { unoptimized: true }`.
- [ ] **Step 5: `.env.local.example`** com a linha `TMDB_API_TOKEN=cole-seu-token-aqui`. Confirmar que `.env*.local` está no `.gitignore`.
- [ ] **Step 6: Teste de fumaça.**

```ts
// tests/unit/smoke.test.ts
import { render, screen } from '@testing-library/react'
it('renderiza com jsdom', () => {
  render(<p>Onde Assisto</p>)
  expect(screen.getByText('Onde Assisto')).toBeInTheDocument()
})
```
(arquivo `.test.tsx`)

- [ ] **Step 7: Verificar.** `npm test` → 1 passed. `npm run build` → build concluído sem erros.
- [ ] **Step 8: Commit.** `git add -A && git commit -m "chore: projeto Next.js com Tailwind, Vitest e Playwright"`

---

### Task 1: Filtros na URL (`lib/filters.ts`)

**Files:**
- Create: `lib/filters.ts`, `tests/unit/filters.test.ts`

**Interfaces:**
- Produces:
  - `type SortOrder = 'popularidade' | 'nota' | 'lancamento' | 'titulo'`
  - `type Filters = { pais: string; streamings: number[]; generos: number[]; ordem: SortOrder; q: string }`
  - `const DEFAULT_COUNTRY = 'BR'`
  - `parseFilters(params: Record<string, string | string[] | undefined>, validCountries?: string[]): Filters`
  - `filtersToSearchParams(f: Filters, extra?: { pagina?: number }): URLSearchParams` — omite valores padrão/vazios; chaves `pais`, `streaming`, `genero`, `ordem`, `q`, `pagina`.
  - `withCountry(f: Filters, pais: string): Filters` — troca país e zera `streamings`.
  - `isSearch(f: Filters): boolean` — `q.trim() !== ''`.

- [ ] **Step 1: Testes que falham**

```ts
import { parseFilters, filtersToSearchParams, withCountry } from '@/lib/filters'

describe('parseFilters', () => {
  it('usa padrões quando vazio', () => {
    expect(parseFilters({})).toEqual({ pais: 'BR', streamings: [], generos: [], ordem: 'popularidade', q: '' })
  })
  it('lê todos os parâmetros', () => {
    expect(parseFilters({ pais: 'us', streaming: '8,119', genero: '27,35', ordem: 'nota', q: ' batman ' }))
      .toEqual({ pais: 'US', streamings: [8, 119], generos: [27, 35], ordem: 'nota', q: 'batman' })
  })
  it('ignora valores inválidos', () => {
    expect(parseFilters({ pais: 'XX', streaming: '8,abc,-1,2.5', genero: 'x', ordem: 'abc' }, ['BR', 'US']))
      .toEqual({ pais: 'BR', streamings: [8], generos: [], ordem: 'popularidade', q: '' })
  })
  it('ignora pais fora do formato mesmo sem lista', () => {
    expect(parseFilters({ pais: 'Brasil' }).pais).toBe('BR')
  })
  it('usa o primeiro valor quando repetido', () => {
    expect(parseFilters({ ordem: ['titulo', 'nota'] }).ordem).toBe('titulo')
  })
})

describe('filtersToSearchParams', () => {
  it('omite padrões', () => {
    expect(filtersToSearchParams(parseFilters({})).toString()).toBe('')
  })
  it('serializa filtros e página', () => {
    const f = { pais: 'US', streamings: [8, 119], generos: [27], ordem: 'nota' as const, q: 'ação & cia' }
    const p = filtersToSearchParams(f, { pagina: 2 })
    expect(p.get('pais')).toBe('US'); expect(p.get('streaming')).toBe('8,119')
    expect(p.get('genero')).toBe('27'); expect(p.get('ordem')).toBe('nota')
    expect(p.get('q')).toBe('ação & cia'); expect(p.get('pagina')).toBe('2')
  })
})

it('withCountry limpa streamings e mantém o resto', () => {
  const f = { pais: 'BR', streamings: [8], generos: [27], ordem: 'nota' as const, q: 'x' }
  expect(withCountry(f, 'US')).toEqual({ ...f, pais: 'US', streamings: [] })
})
```

- [ ] **Step 2:** `npx vitest run tests/unit/filters.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3: Implementar** as funções acima. IDs válidos: inteiros positivos (`/^\d+$/`, > 0). País: `/^[A-Za-z]{2}$/` em maiúsculas e, se `validCountries` for dado, contido nele.
- [ ] **Step 4:** Rodar de novo → PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat: filtros na URL"` (adicionar arquivos novos antes com `git add`).

---

### Task 2: Cliente HTTP do TMDB, tipos e imagens

**Files:**
- Create: `lib/tmdb/types.ts`, `lib/tmdb/http.ts`, `lib/tmdb/images.ts`, `tests/unit/tmdb/http.test.ts`, `tests/unit/tmdb/images.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  - `type Provider = { id: number; name: string; logoUrl: string | null }`
  - `type Genre = { id: number; name: string }`
  - `type Region = { code: string; name: string }`
  - `type Movie = { id: number; title: string; year: number | null; posterUrl: string | null; rating: number; genreIds: number[]; providers: Provider[] }`
  - `type MoviePage = { movies: Movie[]; page: number; totalPages: number }`
  - `type MovieDetails = { id: number; title: string; year: number | null; runtime: number | null; overview: string; rating: number; posterUrl: string | null; backdropUrl: string | null; genres: Genre[]; trailerKey: string | null; providers: Provider[]; watchLink: string | null }`
- Produces (`http.ts`):
  - `class TmdbError extends Error { status: number }`; `class TmdbNotFoundError extends TmdbError`
  - `tmdbFetch<T>(path: string, params: Record<string, string | number | undefined>, revalidate: number): Promise<T>`
  - `const REVALIDATE_LISTS = 86400`, `const REVALIDATE_CONTENT = 21600`
- Produces (`images.ts`): `imageUrl(path: string | null | undefined, size: 'w92' | 'w342' | 'w780' | 'w1280'): string | null`

- [ ] **Step 1: Testes que falham** (`http.test.ts`; `vi.stubEnv('TMDB_API_TOKEN', 'test-token')`, `vi.stubGlobal('fetch', fetchMock)`)

```ts
it('monta URL com language=pt-BR, parâmetros codificados e cabeçalho Bearer', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: 1 }), { status: 200 }))
  const data = await tmdbFetch('/search/movie', { query: 'ação & cia', page: 2, skip: undefined }, 21600)
  expect(data).toEqual({ ok: 1 })
  const [url, init] = fetchMock.mock.calls[0]
  const u = new URL(url)
  expect(u.origin + u.pathname).toBe('https://api.themoviedb.org/3/search/movie')
  expect(u.searchParams.get('language')).toBe('pt-BR')
  expect(u.searchParams.get('query')).toBe('ação & cia')
  expect(u.searchParams.get('page')).toBe('2')
  expect(u.searchParams.has('skip')).toBe(false)
  expect(init.headers.Authorization).toBe('Bearer test-token')
  expect(init.next).toEqual({ revalidate: 21600 })
  expect(init.signal).toBeDefined()
})
it('tenta de novo uma vez após 429', async () => { /* fake timers; 1ª resposta 429, 2ª 200; avançar 1000 ms; fetch chamado 2x; resolve com dados */ })
it('lança TmdbError se o 429 se repetir', async () => { /* duas 429 → rejects.toBeInstanceOf(TmdbError), status 429 */ })
it('lança TmdbNotFoundError em 404', ...)
it('lança TmdbError com status em 500', ...)
it('exige o token', async () => {
  vi.stubEnv('TMDB_API_TOKEN', '')
  await expect(tmdbFetch('/x', {}, 1)).rejects.toThrow('Defina TMDB_API_TOKEN em .env.local')
})
```

`images.test.ts`: `imageUrl('/a.jpg','w342') === 'https://image.tmdb.org/t/p/w342/a.jpg'`; `imageUrl(null,'w342') === null`; `imageUrl('', 'w92') === null`.

- [ ] **Step 2:** `npx vitest run tests/unit/tmdb` → FAIL.
- [ ] **Step 3: Implementar.** `http.ts` começa com `import 'server-only'`; tempo limite via `AbortSignal.timeout(10000)`; espera de 1 s com `setTimeout` em Promise.
- [ ] **Step 4:** Rodar → PASS.
- [ ] **Step 5: Commit.** `feat: cliente HTTP do TMDB`

---

### Task 3: Conversores (bruto TMDB → domínio)

**Files:**
- Create: `lib/tmdb/mappers.ts`, `tests/unit/tmdb/mappers.test.ts`, `tests/fixtures/movie-details.json` (resposta de `/movie/693134?append_to_response=watch/providers,videos`, reduzida: campos usados + `watch/providers.results.BR` com `link`, `flatrate` (2 itens) e `rent` (1 item), `videos.results` com 1 Teaser YouTube `en`, 1 Trailer Vimeo, 1 Trailer YouTube `en`, 1 Trailer YouTube `pt`)

**Interfaces:**
- Consumes: tipos e `imageUrl` da Task 2.
- Produces:
  - `mapMovie(raw: RawMovie, providers?: Provider[]): Movie` — `year` = ano de `release_date` ou `null`; `posterUrl` com `w342`; `rating` = `vote_average` arredondado a 1 casa; `title` = `title`, senão `original_title`.
  - `mapProviders(raw: RawProvider[] | undefined): Provider[]` — ordena por `display_priority`, logo `w92`.
  - `pickTrailer(videos: RawVideo[]): string | null` — só `site === 'YouTube'` e `type === 'Trailer'`; prefere `iso_639_1 === 'pt'`, depois `'en'`; retorna `key`.
  - `mapDetails(raw: RawMovieDetails, pais: string): MovieDetails` — `providers` = `flatrate` da região `pais`; `watchLink` = `link` da região; `backdropUrl` `w1280`; `runtime` `null` se 0/ausente; `overview` `''` se ausente.
  - Tipos `RawMovie`, `RawProvider`, `RawVideo`, `RawMovieDetails` exportados (só os campos usados).

- [ ] **Step 1: Testes que falham**

```ts
it('mapMovie converte campos', () => {
  expect(mapMovie({ id: 1, title: 'Duna', original_title: 'Dune', release_date: '2024-02-27', poster_path: '/p.jpg', vote_average: 8.137, genre_ids: [878] }))
    .toEqual({ id: 1, title: 'Duna', year: 2024, posterUrl: 'https://image.tmdb.org/t/p/w342/p.jpg', rating: 8.1, genreIds: [878], providers: [] })
})
it('mapMovie tolera campos ausentes', () => {
  const m = mapMovie({ id: 2, title: '', original_title: 'Orig', release_date: '', poster_path: null, vote_average: 0, genre_ids: [] })
  expect(m).toMatchObject({ title: 'Orig', year: null, posterUrl: null, rating: 0 })
})
it('mapProviders ordena por prioridade', ...)          // [{priority 5}, {priority 1}] → ids na ordem 1º/2º
it('pickTrailer prefere YouTube Trailer em pt', ...)   // com a lista da fixture → key do trailer pt
it('pickTrailer cai para en', ...)                     // sem pt → key do trailer YouTube en
it('pickTrailer ignora teasers e outros sites', () => { expect(pickTrailer([{ site: 'Vimeo', type: 'Trailer', iso_639_1: 'pt', key: 'v' }, { site: 'YouTube', type: 'Teaser', iso_639_1: 'pt', key: 't' }])).toBeNull() })
it('mapDetails usa só flatrate do país', ...)          // fixture, 'BR' → 2 providers, watchLink da fixture; 'US' → providers [] e watchLink null
it('mapDetails tolera backdrop/runtime/overview ausentes', ...) // backdropUrl null, runtime null, overview ''
```

- [ ] **Step 2:** Rodar → FAIL. **Step 3:** Implementar. **Step 4:** Rodar → PASS.
- [ ] **Step 5: Commit.** `feat: conversores de dados do TMDB`

---

### Task 4: Listas (provedores, gêneros, regiões)

**Files:**
- Create: `lib/tmdb/lists.ts`, `tests/unit/tmdb/lists.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `REVALIDATE_LISTS`, `mapProviders`.
- Produces:
  - `getProviders(pais: string): Promise<Provider[]>` — `GET /watch/providers/movie` com `watch_region=pais`; ordena por `display_priorities[pais]` (fallback `display_priority`).
  - `getGenres(): Promise<Genre[]>` — `GET /genre/movie/list`, campo `genres`.
  - `getRegions(): Promise<Region[]>` — `GET /watch/providers/regions`; `name` = `native_name || english_name`; ordenado por `name` com `localeCompare('pt-BR')`.

- [ ] **Step 1: Testes que falham** — mockar `@/lib/tmdb/http` (`vi.mock`) e verificar: caminho e parâmetros corretos, `revalidate` 86400, conversão e ordenação (ex.: regiões `[{iso_3166_1:'US', english_name:'United States', native_name:'Estados Unidos'}, {iso_3166_1:'BR', english_name:'Brazil', native_name:'Brasil'}]` → `[{code:'BR',name:'Brasil'},{code:'US',name:'Estados Unidos'}]`).
- [ ] **Step 2–4:** FAIL → implementar → PASS (`npx vitest run tests/unit/tmdb/lists.test.ts`).
- [ ] **Step 5: Commit.** `feat: listas de provedores, gêneros e regiões`

---

### Task 5: Catálogo e busca

**Files:**
- Create: `lib/tmdb/catalog.ts`, `tests/unit/tmdb/catalog.test.ts`

**Interfaces:**
- Consumes: `Filters`, `isSearch` (Task 1); `tmdbFetch`, `REVALIDATE_CONTENT`, tipos (Task 2); `mapMovie`, `mapProviders` (Task 3).
- Produces:
  - `getMovieProviders(id: number, pais: string): Promise<Provider[]>` — `GET /movie/{id}/watch/providers`, `flatrate` de `results[pais]`, `[]` se ausente.
  - `discoverMovies(f: Filters, pagina: number): Promise<MoviePage>`
  - `searchMovies(f: Filters, pagina: number): Promise<MoviePage>`
  - `fetchCatalogPage(f: Filters, pagina: number): Promise<MoviePage>` — `isSearch(f) ? searchMovies : discoverMovies`.
  - `const MAX_PAGE = 500`

- [ ] **Step 1: Testes que falham** (mock de `tmdbFetch` por caminho; `vi.setSystemTime(new Date('2026-10-24T12:00:00Z'))`)

```ts
it('discover envia filtros corretos', async () => {
  await discoverMovies({ pais: 'BR', streamings: [8, 119], generos: [27, 35], ordem: 'nota', q: '' }, 2)
  expect(fetchMock).toHaveBeenCalledWith('/discover/movie', expect.objectContaining({
    watch_region: 'BR', with_watch_monetization_types: 'flatrate', with_watch_providers: '8|119',
    with_genres: '27|35', sort_by: 'vote_average.desc', 'vote_count.gte': 200, page: 2, include_adult: 'false',
  }), 21600)
})
it.each([
  ['popularidade', { sort_by: 'popularity.desc' }],
  ['lancamento', { sort_by: 'primary_release_date.desc', 'primary_release_date.lte': '2026-10-24' }],
  ['titulo', { sort_by: 'title.asc' }],
])('ordem %s', ...)
it('discover sem streamings não envia with_watch_providers', ...)
it('discover anexa provedores de cada filme e tolera falha individual', async () => {
  // 2 filmes; providers do 1º ok, do 2º rejeita → movies[0].providers.length > 0, movies[1].providers = []
})
it('totalPages é limitado a 500', ...)                  // total_pages 9999 → 500
it('busca mantém só filmes em streaming no país', ...) // 3 resultados; 1 sem flatrate em BR → 2 filmes
it('busca aplica filtro de streaming e gênero (OU)', ...)
it('busca envia query e include_adult=false', ...)
it('fetchCatalogPage escolhe busca quando há q', ...)
```

- [ ] **Step 2:** FAIL. **Step 3:** Implementar; provedores dos filmes em paralelo com `Promise.allSettled`. **Step 4:** PASS.
- [ ] **Step 5: Commit.** `feat: catálogo e busca no TMDB`

---

### Task 6: Detalhes do filme

**Files:**
- Create: `lib/tmdb/details.ts`, `lib/tmdb/index.ts` (reexporta tipos, erros e funções públicas de `lists`, `catalog`, `details`), `tests/unit/tmdb/details.test.ts`

**Interfaces:**
- Consumes: `tmdbFetch`, `mapDetails`, fixture `movie-details.json`.
- Produces: `getMovieDetails(id: number, pais: string): Promise<MovieDetails>` — `GET /movie/{id}` com `append_to_response: 'watch/providers,videos'`, `include_video_language: 'pt,en'`, `revalidate` 21600; propaga `TmdbNotFoundError`.

- [ ] **Step 1: Testes** — parâmetros corretos; resultado igual a `mapDetails(fixture, 'BR')`; 404 → `rejects.toBeInstanceOf(TmdbNotFoundError)`.
- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit.** `feat: detalhes do filme`

---

### Task 7: Rota interna `/api/movies`

**Files:**
- Create: `app/api/movies/route.ts`, `tests/unit/api-movies.test.ts`

**Interfaces:**
- Consumes: `parseFilters` (Task 1), `getRegions`, `fetchCatalogPage`, `MAX_PAGE`.
- Produces: `GET /api/movies?<filtros>&pagina=N` → `200` com `MoviePage` em JSON; `400 { error: 'pagina inválida' }` se `pagina` não for inteiro em 1..500; `502 { error: 'Não foi possível carregar os filmes' }` se o TMDB falhar.

- [ ] **Step 1: Testes** (mock de `@/lib/tmdb`): `pagina=2&streaming=8` → `fetchCatalogPage` chamado com filtros parseados e `2`, status 200; `pagina=0`, `pagina=501`, `pagina=abc` → 400; `fetchCatalogPage` rejeitando → 502.
- [ ] **Step 2–4:** FAIL → implementar (chamar `GET(new Request('http://x/api/movies?...'))` no teste) → PASS.
- [ ] **Step 5: Commit.** `feat: rota de paginação do catálogo`

---

### Task 8: Grade de filmes (cartão, carregar mais, estados)

**Files:**
- Create: `components/MovieCard.tsx`, `components/MovieGrid.tsx`, `components/SkeletonGrid.tsx`, `components/EmptyState.tsx`, `components/ErrorState.tsx`, `tests/unit/components/grid.test.tsx`

**Interfaces:**
- Consumes: `Movie`, `MoviePage`, `Filters`, `filtersToSearchParams`.
- Produces:
  - `MovieCard({ movie, pais }: { movie: Movie; pais: string })` — link `/filme/{id}?pais={pais}`; pôster (ou bloco cinza com o título se `posterUrl` nulo) com selo `★ {rating}` no canto superior esquerdo (`text-rating`, fundo preto translúcido; omitir se `rating` = 0); abaixo: título (máx. 2 linhas), linha com ano à esquerda (omitido se `null`) e até 3 logos 20×20 à direita (`alt` = nome do provedor).
  - `MovieGrid({ initial, filters }: { initial: MoviePage; filters: Filters })` — client; grade `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`; botão "Carregar mais" enquanto `page < totalPages`; busca `/api/movies?{filtersToSearchParams(filters, { pagina: page + 1 })}`; deduplica por `id`; durante o carregamento o botão fica desabilitado com texto "Carregando..."; em falha mostra `ErrorState` cujo botão tenta a mesma página de novo. Se `initial.movies` vazio, renderiza `EmptyState`.
  - `EmptyState({ pais }: { pais: string })` — texto e link "Limpar filtros" para `/?pais={pais}` (ou `/` se `BR`).
  - `ErrorState({ onRetry }: { onRetry: () => void })`
  - `SkeletonGrid({ count = 12 }: { count?: number })` — cartões cinza `animate-pulse` na mesma grade.

- [ ] **Step 1: Testes que falham**

```tsx
it('MovieCard mostra título, ano, nota e logos', ...)   // getByText('Duna'), '2024', '★ 8.1', getByAltText('Netflix'); link href '/filme/1?pais=BR'
it('MovieCard sem pôster e sem ano não quebra', ...)    // posterUrl null, year null → título visível, sem 'null'/'NaN' no texto
it('MovieGrid carrega mais, deduplica e esconde o botão na última página', async () => {
  // initial: filmes [1,2], page 1, totalPages 2; fetch → { movies: [2,3], page: 2, totalPages: 2 }
  // clicar "Carregar mais" → fetch chamado com URL contendo 'pagina=2'; 3 cartões; botão ausente
})
it('MovieGrid mostra erro e tenta de novo', ...)       // 1º fetch rejeita → 'Não foi possível carregar os filmes'; clicar 'Tentar de novo' → 2º fetch; cartões novos
it('MovieGrid vazio mostra EmptyState', ...)           // 'Nenhum filme encontrado com esses filtros.' e link 'Limpar filtros'
```

- [ ] **Step 2–4:** FAIL → implementar → PASS (`npx vitest run tests/unit/components/grid.test.tsx`).
- [ ] **Step 5: Commit.** `feat: grade de filmes com carregar mais`

---

### Task 9: Busca, país e barra de filtros

**Files:**
- Create: `lib/useFilterNavigation.ts`, `components/SearchBox.tsx`, `components/CountrySelect.tsx`, `components/FilterBar.tsx`, `components/ProviderFilter.tsx`, `components/GenreFilter.tsx`, `components/SortSelect.tsx`, `tests/unit/components/filters-ui.test.tsx`

**Interfaces:**
- Consumes: `Filters`, `filtersToSearchParams`, `withCountry`, `isSearch`; `Provider`, `Genre`, `Region`.
- Produces:
  - `useFilterNavigation(): (next: Filters) => void` — client; `router.push('/?' + params, { scroll: false })` (ou `/` se vazio).
  - `SearchBox({ filters }: { filters: Filters })` — input `type="search"`, placeholder "Buscar filme...", `aria-label="Buscar filme"`; navega 500 ms após a última digitação com `{ ...filters, q }`.
  - `CountrySelect({ filters, regions }: { filters: Filters; regions: Region[] })` — `<select aria-label="País">`; ao mudar navega com `withCountry(filters, code)`.
  - `FilterBar({ filters, providers, genres, countryName }: { filters: Filters; providers: Provider[]; genres: Genre[]; countryName: string })` — compõe os três abaixo e, se `isSearch(filters)`, mostra "Mostrando resultados disponíveis em streaming em {countryName}".
  - `ProviderFilter({ providers, selected, onChange })` — linha com rolagem horizontal de botões com logo (`aria-pressed`, `title` = nome); selecionado com borda `accent`.
  - `GenreFilter({ genres, selected, onChange })` — chips com `aria-pressed`; selecionado `bg-accent`.
  - `SortSelect({ value, disabled, onChange })` — `<select aria-label="Ordenar por">` com opções "Mais populares", "Mais bem avaliados", "Lançamentos mais recentes", "Título A–Z"; desabilitado durante busca.

- [ ] **Step 1: Testes que falham** (`vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))`; fake timers para a busca)

```tsx
it('SearchBox navega só após 500 ms', ...)              // digitar 'bat' → push não chamado em 499 ms; chamado em 500 ms com '/?q=bat'
it('CountrySelect troca país e limpa streamings', ...)  // filters com streamings [8] e generos [27] → push('/?pais=US&genero=27')
it('ProviderFilter alterna seleção', ...)               // clicar Netflix (8) com selected [] → onChange([8]); de novo com [8] → onChange([])
it('GenreFilter alterna seleção', ...)
it('SortSelect desabilitado na busca e com aviso', ...) // FilterBar com q='x' → select disabled; texto do aviso presente
```

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit.** `feat: busca, país e filtros`

---

### Task 10: Página do catálogo, carregamento, erro e rodapé

**Files:**
- Modify: `app/page.tsx`, `app/layout.tsx`
- Create: `app/loading.tsx`, `app/error.tsx`, `components/Footer.tsx`, `public/tmdb-logo.svg`, `tests/unit/components/footer.test.tsx`

**Interfaces:**
- Consumes: tudo das Tasks 1, 4, 5, 8, 9.
- Produces: `/` funcional.

- [ ] **Step 1: Teste do rodapé** — renderiza os dois textos de crédito das Global Constraints e uma imagem com `alt="TMDB"` linkando para `https://www.themoviedb.org`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar `Footer` (logo oficial baixado de https://www.themoviedb.org/about/logos-attribution e salvo em `public/tmdb-logo.svg`) e incluí-lo em `layout.tsx` → **Step 4:** PASS.
- [ ] **Step 5: Montar `app/page.tsx`** (server component, `searchParams` é `Promise` — usar `await`): buscar `getRegions()`, depois `parseFilters(await searchParams, regions.map(r => r.code))`; em paralelo `getProviders(f.pais)`, `getGenres()`, `fetchCatalogPage(f, 1)`; renderizar barra superior (`SearchBox`, `CountrySelect`), `FilterBar` e `<MovieGrid key={filtersToSearchParams(f).toString()} initial={...} filters={f} />`. Erros sobem para `app/error.tsx`.
- [ ] **Step 6:** `app/loading.tsx` → `<SkeletonGrid />`; `app/error.tsx` (`'use client'`) → `<ErrorState onRetry={reset} />`.
- [ ] **Step 7: Verificar manualmente.** Criar `.env.local` a partir do exemplo com o token real; `npm run dev`; em http://localhost:3000: grade aparece; marcar Netflix e Terror muda a URL e a grade; busca "batman" mostra o aviso; trocar país para Estados Unidos limpa streamings; "Carregar mais" acrescenta filmes. Remover temporariamente o token → mensagem de erro clara no terminal.
- [ ] **Step 8:** `npm test` e `npm run build` → sem falhas.
- [ ] **Step 9: Commit.** `feat: página do catálogo`

---

### Task 11: Página de detalhes do filme

**Files:**
- Create: `components/MovieHero.tsx`, `components/WatchProviders.tsx`, `components/TrailerModal.tsx`, `app/filme/[id]/page.tsx`, `app/filme/[id]/not-found.tsx`, `tests/unit/components/details.test.tsx`

**Interfaces:**
- Consumes: `getMovieDetails`, `getRegions`, `TmdbNotFoundError`, `parseFilters`, `MovieDetails`.
- Produces:
  - `MovieHero({ movie }: { movie: MovieDetails })` — backdrop em largura total (altura ~60vh no desktop, ~40vh no celular) com degradê até `bg-bg`; sem backdrop → degradê escuro `from-surface-2 to-bg`; pôster sobreposto (margem negativa) com título, "{ano} · {h}h{mm}" (partes ausentes omitidas) e `★ {rating}`; abaixo: gêneros em chips, sinopse, `TrailerModal` se `trailerKey`.
  - `TrailerModal({ trailerKey }: { trailerKey: string })` — client; botão "▶ Ver trailer" (`bg-accent`); abre `<dialog>`/overlay com iframe `https://www.youtube-nocookie.com/embed/{key}?autoplay=1`; fecha por botão "Fechar", Esc e clique fora.
  - `WatchProviders({ providers, watchLink, countryName })` — título "Onde assistir · {país}"; logos 48×48 com nome; link "Ver no JustWatch" (`target="_blank" rel="noopener noreferrer"`) se `watchLink`; sem provedores → "Não disponível em streaming em {país} no momento".

- [ ] **Step 1: Testes que falham**

```tsx
it('MovieHero mostra dados e duração formatada', ...)   // runtime 166 → '2024 · 2h46'
it('MovieHero sem backdrop, runtime e trailer', ...)    // nenhum 'null'/'NaN'; sem botão 'Ver trailer'
it('TrailerModal abre e fecha com Esc', ...)            // clicar '▶ Ver trailer' → iframe com src contendo '/embed/abc'; Esc → iframe some
it('WatchProviders lista provedores e link', ...)
it('WatchProviders sem provedores mostra aviso', ...)   // 'Não disponível em streaming em Brasil no momento'
```

- [ ] **Step 2–4:** FAIL → implementar componentes → PASS.
- [ ] **Step 5: Montar a página.** `params` e `searchParams` são `Promise`. ID não numérico → `notFound()`. `getMovieDetails(id, f.pais)`; `TmdbNotFoundError` → `notFound()`. `generateMetadata` com título "{filme} · Onde Assisto". Link "← Voltar" para `/?pais={pais}`. `not-found.tsx`: "Filme não encontrado" + link para o catálogo.
- [ ] **Step 6: Verificar manualmente** em `npm run dev`: abrir um filme pela grade; trailer abre e fecha; `/filme/999999999` e `/filme/abc` mostram "Filme não encontrado".
- [ ] **Step 7:** `npm test` e `npm run build` → sem falhas.
- [ ] **Step 8: Commit.** `feat: página de detalhes do filme`

---

### Task 12: Teste de ponta a ponta e README

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/catalog.spec.ts`, `README.md`

**Interfaces:**
- Consumes: app completo; precisa de `.env.local` com token real.

- [ ] **Step 1: `playwright.config.ts`** — `testDir: 'tests/e2e'`, `webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true }`, apenas Chromium, `baseURL` `http://localhost:3000`.
- [ ] **Step 2: Teste** (asserções tolerantes a dados reais):

```ts
test('fluxo principal', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /Onde Assisto/ })).toBeVisible()
  const cards = page.locator('a[href^="/filme/"]')
  await expect(cards.first()).toBeVisible()
  await page.getByRole('button', { name: /Terror/ }).click()
  await expect(page).toHaveURL(/genero=27/)
  await page.getByLabel('Buscar filme').fill('batman')
  await expect(page).toHaveURL(/q=batman/)
  await expect(page.getByText(/Mostrando resultados disponíveis/)).toBeVisible()
  await cards.first().click()
  await expect(page.getByText(/Onde assistir ·/)).toBeVisible()
})
```

- [ ] **Step 3:** `npm run test:e2e` → 1 passed.
- [ ] **Step 4: README.md** (pt-BR, para iniciantes): o que é o app; pré-requisitos (Node LTS, token TMDB); passos `npm install`, copiar `.env.local.example` para `.env.local` e colar o token, `npm run dev`; comandos de teste; publicação na Vercel (importar repositório do GitHub, adicionar `TMDB_API_TOKEN` em Settings → Environment Variables, Deploy); créditos TMDB/JustWatch.
- [ ] **Step 5:** `npm test`, `npm run build` → sem falhas.
- [ ] **Step 6: Commit.** `test: fluxo principal e2e; docs: README`
