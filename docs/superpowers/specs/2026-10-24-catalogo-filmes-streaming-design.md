# Onde Assisto — Catálogo de Filmes em Streaming — Design (v1)

**Data:** 2026-10-24
**Status:** aguardando revisão

## 1. Objetivo

Web app que mostra os filmes disponíveis **agora** em serviços de streaming por assinatura, usando a API do TMDB (dados de disponibilidade fornecidos pelo JustWatch).

- **Contexto:** projeto de curso, mas feito para ser útil a outras pessoas (publicado na internet).
- **Sucesso:** um visitante abre o link, escolhe streamings/gêneros e encontra rapidamente um filme para assistir e onde assisti-lo.

### Decisões tomadas

| Tema | Decisão |
|---|---|
| Filmes incluídos | Todos, de qualquer país de origem |
| Catálogo de streaming | Brasil por padrão; usuário pode trocar o país |
| Tipo de disponibilidade | Somente assinatura (`flatrate`) — sem aluguel/compra |
| Plataforma | Web app responsivo (celular e computador) |
| Idioma | Somente português (pt-BR); se faltar tradução, usa o texto original |
| Tecnologia | Next.js (App Router) + TypeScript + Tailwind CSS |
| Busca de dados | Consulta ao TMDB no servidor, com cache (sem banco de dados) |
| Hospedagem | Vercel (plano grátis) + repositório no GitHub |

## 2. Funcionalidades da v1

1. Grade de filmes disponíveis em streaming no país escolhido.
2. Filtro por streaming (múltipla escolha).
3. Filtro por gênero (múltipla escolha).
4. Busca por nome.
5. Ordenação: Mais populares (padrão), Mais bem avaliados, Lançamentos mais recentes, Título A–Z.
6. Seletor de país.
7. Página de detalhes do filme com "Onde assistir" e trailer.

### Fora do escopo da v1
Séries; favoritos/"quero ver"; login; filtros de ano, nota mínima e duração; aluguel/compra; interface em outros idiomas.

## 3. Identidade visual

- **Nome:** Onde Assisto (logo em texto, vermelho, no cabeçalho; também usado no título da aba).
- **Estilo "Cinema":** fundo preto profundo (`#0b0b0b`), superfícies em cinza muito escuro (`#151515`–`#222`), texto branco/cinza-claro, **vermelho de destaque** (`#e50914`) para logo, filtros selecionados e botões principais; nota em amarelo (`★`, `#ffd54a`).
- Pôsteres são os protagonistas; interface discreta ao redor.
- Fonte sem serifa do sistema (ou Inter via `next/font`).

## 4. Páginas e experiência do usuário

### Catálogo — `/`
- **Cabeçalho:** logo, campo de busca, seletor de país.
- **Barra de filtros:** logos dos streamings do país (múltipla escolha), gêneros (múltipla escolha), seletor de ordenação.
- **Grade de pôsteres:** 2 colunas no celular, 5–6 no computador. **Cartão com informações abaixo:** pôster limpo com a nota (★) num selo no canto superior esquerdo; abaixo do pôster, o título e uma linha com o ano à esquerda e os logos dos streamings à direita. Tudo sempre visível (sem depender de passar o mouse).
- **"Carregar mais"** no fim da grade: traz a próxima página (20 filmes).
- **Filtros na URL**, para links compartilháveis:

| Parâmetro | Valores | Padrão |
|---|---|---|
| `pais` | código ISO 3166-1 (`BR`, `US`, `PT`...) | `BR` |
| `streaming` | IDs de provedor do TMDB separados por vírgula (`8,119`) | todos |
| `genero` | IDs de gênero do TMDB separados por vírgula (`27,35`) | todos |
| `ordem` | `popularidade`, `nota`, `lancamento`, `titulo` | `popularidade` |
| `q` | texto da busca | vazio |

- **Combinação de filtros:** vários streamings = filme em **qualquer** um deles; vários gêneros = filme com **qualquer** um deles.

### Detalhes — `/filme/[id]`
Layout **cinematográfico**:
- **Topo:** imagem de fundo grande (backdrop do filme) que escurece até o preto da página; o pôster fica sobreposto, avançando sobre a borda inferior da imagem, com título, ano · duração e nota ao lado.
- Abaixo: gêneros (etiquetas), sinopse, botão vermelho **"▶ Ver trailer"** e o bloco **"Onde assistir no <país>"**.
- **Onde assistir:** streamings de assinatura no país atual (lido de `?pais=`, padrão `BR`) + link para a página do JustWatch fornecida pelo TMDB.
- **Trailer:** o botão abre o vídeo do YouTube numa janela sobreposta (modal), fechável por botão, tecla Esc ou clique fora. O botão só aparece se houver trailer (prefere vídeo em português; senão, inglês).
- Sem backdrop disponível: topo usa um degradê escuro no lugar da imagem.
- Se o filme não estiver em streaming no país, mostra "Não disponível em streaming no <país> no momento".

### Rodapé
Crédito obrigatório ao TMDB (logo + aviso "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB") e ao JustWatch como fonte dos dados de disponibilidade.

### Estados especiais
- **Carregando:** cartões cinza (skeleton).
- **Vazio:** mensagem + botão "Limpar filtros".
- **Erro:** mensagem + botão "Tentar de novo".

## 5. Arquitetura

Três camadas, cada uma com uma responsabilidade.

### 5.1 Cliente do TMDB — `lib/tmdb/`
Único ponto de contato com o TMDB. Lê o token de `TMDB_API_TOKEN` (somente no servidor), envia `language=pt-BR`, aplica cache e converte respostas para tipos próprios (`Movie`, `MovieDetails`, `Provider`, `Genre`, `Region`). O resto do app nunca usa o formato bruto do TMDB.

| Função | Endpoint TMDB | Cache |
|---|---|---|
| `discoverMovies({ pais, streamings, generos, ordem, pagina })` | `GET /discover/movie` com `watch_region`, `with_watch_monetization_types=flatrate`, `with_watch_providers` (separados por `\|`), `with_genres` (separados por `\|`), `sort_by` | 6h |
| `searchMovies({ texto, pais, streamings, generos, pagina })` | `GET /search/movie` + verificação de provedores de cada resultado | 6h |
| `getMovieProviders(id, pais)` | `GET /movie/{id}/watch/providers` | 6h |
| `getMovieDetails(id, pais)` | `GET /movie/{id}?append_to_response=watch/providers,videos&include_video_language=pt,en` | 6h |
| `getProviders(pais)` | `GET /watch/providers/movie?watch_region=` | 24h |
| `getGenres()` | `GET /genre/movie/list` | 24h |
| `getRegions()` | `GET /watch/providers/regions` | 24h |

**Mapeamento de ordenação:**

| `ordem` | `sort_by` | Parâmetros extras |
|---|---|---|
| `popularidade` | `popularity.desc` | — |
| `nota` | `vote_average.desc` | `vote_count.gte=200` (evita filmes com poucos votos) |
| `lancamento` | `primary_release_date.desc` | `primary_release_date.lte=<hoje>` |
| `titulo` | `title.asc` | — |

**Logos nos cartões:** `/discover/movie` não informa os provedores de cada filme. Para cada página de 20 filmes, o servidor chama `getMovieProviders` em paralelo (com cache de 6h) e anexa os logos aos cartões.

### 5.2 Páginas e rotas — `app/`
- `app/page.tsx` — catálogo; lê os parâmetros da URL e chama o cliente do TMDB no servidor.
- `app/filme/[id]/page.tsx` — detalhes; `not-found` para IDs inexistentes.
- `app/api/movies/route.ts` — rota interna usada pelo "Carregar mais"; recebe os mesmos parâmetros + `pagina` e devolve JSON com filmes já convertidos.
- `lib/filters.ts` — converte a URL em filtros validados e vice-versa.

### 5.3 Componentes — `components/`
`MovieGrid`, `MovieCard`, `FilterBar` (com `ProviderFilter`, `GenreFilter`, `SortSelect`), `SearchBox`, `CountrySelect`, `MovieHero`, `WatchProviders`, `TrailerModal`, `LoadMoreButton`, `EmptyState`, `ErrorState`, `Footer`.

Visual com Tailwind CSS, seguindo a identidade da seção 3.

## 6. Fluxo de dados

### Catálogo
1. Usuário altera um filtro → URL é atualizada (ex.: `/?pais=BR&streaming=8&genero=27`).
2. Servidor valida os parâmetros e chama `discoverMovies`, depois `getMovieProviders` para os 20 filmes.
3. Página chega pronta com os primeiros 20 filmes.
4. "Carregar mais" chama `/api/movies?...&pagina=N` e acrescenta os filmes à grade.

### Busca
1. Usuário digita; o app espera 500 ms sem digitação e então atualiza `q` na URL.
2. Servidor chama `/search/movie` e, em paralelo, `getMovieProviders` para cada resultado.
3. Ficam só os filmes com streaming por assinatura no país; se houver filtro de streaming, só os que estão em algum dos selecionados; se houver filtro de gênero, só os que têm algum dos gêneros selecionados.
4. Ordem por relevância; seletor de ordenação fica desativado. Aparece o aviso "Mostrando resultados disponíveis em streaming no <país>".
5. "Carregar mais" busca a próxima página da busca. Uma página pode ter menos de 20 filmes após a filtragem.

### Troca de país
Limpa o filtro de streaming (os serviços variam por país); mantém gêneros, ordenação e busca.

## 7. Tratamento de erros

| Situação | Comportamento |
|---|---|
| TMDB fora do ar / tempo esgotado (10 s) | Estado de erro com "Tentar de novo"; app não quebra |
| TMDB responde 429 (limite de pedidos) | Uma nova tentativa após 1 s; se falhar, estado de erro |
| ID de filme inexistente | Página "Filme não encontrado" |
| Filme sem pôster | Imagem padrão |
| Parâmetro de URL inválido (`pais=XX`, `ordem=abc`, IDs não numéricos) | Parâmetro ignorado; usa o padrão |
| `TMDB_API_TOKEN` ausente | Erro claro ao iniciar/renderizar: "Defina TMDB_API_TOKEN em .env.local" |
| Falha ao buscar provedores de um filme no cartão | Cartão aparece sem logos; não derruba a página |

## 8. Testes

Desenvolvimento com TDD (teste antes do código).

- **Unitários (Vitest), com respostas falsas do TMDB — sem internet nem token:**
  - Cliente do TMDB: filtros → parâmetros corretos; conversão de respostas; tratamento de erros e 429.
  - `lib/filters.ts`: parâmetros válidos, inválidos e vazios.
  - Busca: remove resultados fora do streaming e aplica filtros de streaming/gênero.
- **Componentes (Testing Library):** `MovieCard`, `FilterBar`, `EmptyState`, `ErrorState`.
- **Ponta a ponta (Playwright):** abrir o catálogo, filtrar, buscar, abrir um filme.

## 9. Deploy

- Repositório no GitHub; projeto conectado à Vercel (plano grátis).
- `TMDB_API_TOKEN` cadastrado como variável de ambiente na Vercel e em `.env.local` (fora do git) para desenvolvimento.
- Cada envio ao GitHub publica automaticamente.

## 10. Pré-requisitos

- Conta gratuita no TMDB e um **API Read Access Token** (Configurações → API).
- Node.js LTS instalado na máquina.
- Contas no GitHub e na Vercel (podem ser criadas na etapa de deploy).
