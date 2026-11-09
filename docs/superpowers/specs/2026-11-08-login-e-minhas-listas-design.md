# Onde Assisto — Login e Minhas Listas — Design

**Data:** 2026-11-08
**Status:** aguardando revisão

## 1. Objetivo

Permitir que a pessoa crie uma conta, entre com e-mail e senha e marque filmes como **"Quero assistir"** (para ver no futuro) ou **"Já assisti"** (já viu inteiro). As duas listas aparecem como abas na página inicial, só para quem está logado.

- **Sucesso:** a pessoa encontra um filme no catálogo, marca "Quero assistir" com um clique, depois acha esse filme na aba "Quero assistir" e, quando assistir, move para "Já assistidos" com outro clique.
- **Público:** começa simples (uso pessoal e de amigos), mas preparado para ser publicado na Vercel para qualquer pessoa.

### Decisões tomadas

| Tema | Decisão |
|---|---|
| Login | E-mail e senha pelo Supabase Auth, **sem confirmação de e-mail** (entra direto ao criar a conta) |
| Estados de um filme | **Um estado por filme:** `quero` ou `assistido`. Marcar um troca o outro; clicar no ativo desmarca |
| Onde marcar | Página do filme e destaque da home. Cartões só mostram um selo (sem botão) |
| Sem login | Botões de marcar aparecem; o clique leva ao login e, depois, volta ao filme já marcado |
| Abas | Catálogo, Quero assistir, Já assistidos — na página inicial, só com login |
| Arquitetura | Sessão em cookie, lida no servidor (`@supabase/ssr`); ações via Server Actions; `proxy.ts` renova a sessão |
| Dados dos filmes | Não copiados: o banco guarda só o id do TMDB; título, pôster e streamings vêm do TMDB como hoje |

### Fora do escopo
"Esqueci minha senha"; confirmação de e-mail; login social (Google etc.); marcar direto no cartão; filtros e ordenação dentro das abas; notas ou comentários pessoais; séries.

## 2. Banco de dados (Supabase)

### Configuração do projeto
- Região South America (São Paulo); Data API ligada; "expor tabelas automaticamente" **desligado**; RLS automático ligado.
- Em **Authentication → Sign In / Providers → Email**, desligar **"Confirm email"**.

### Tabela `public.lista_filmes`

| Coluna | Tipo | Regra |
|---|---|---|
| `user_id` | `uuid` | `default auth.uid()`, referência a `auth.users(id)` com `on delete cascade` |
| `filme_id` | `integer` | id do filme no TMDB, `> 0` |
| `status` | `text` | `check (status in ('quero', 'assistido'))` |
| `atualizado_em` | `timestamptz` | `default now()`; atualizado a cada troca de estado |

- **Chave primária `(user_id, filme_id)`:** garante no banco um único estado por filme.
- **Índice** `(user_id, status, atualizado_em desc)` para as abas.
- **RLS ligado** com quatro políticas (`select`, `insert`, `update`, `delete`) para o papel `authenticated`, todas com `(select auth.uid()) = user_id`.
- **`grant select, insert, update, delete`** na tabela para `authenticated`. Nada para `anon`.

O script fica em `supabase/migrations/20261108000000_lista_filmes.sql` (versionado). É aplicado colando no **SQL Editor** do painel do Supabase, uma única vez, com instruções passo a passo na implementação.

## 3. Login e sessão

### Configuração
- Dependências: `@supabase/supabase-js` e `@supabase/ssr`.
- Variáveis em `.env.local` (e na Vercel), usadas só no servidor: `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (a chave pública do projeto). `.env.local.example` ganha as duas linhas.
- Sem as variáveis, o app funciona como hoje: ninguém está logado, o catálogo funciona, e login/marcação mostram o aviso de indisponibilidade.

### Código
- `lib/supabase/server.ts`: cria o cliente do Supabase no servidor a partir dos cookies (`server-only`). Único ponto que conversa com o Supabase, no espírito de `lib/tmdb/`.
- `lib/supabase/auth.ts`: `getUsuario()` — usuário atual (`{ id, email }`) ou `null`, memorizado por requisição com `cache` do React; valida a sessão com o servidor do Supabase.
- `proxy.ts` (raiz): renova os cookies da sessão a cada requisição de páginas e rotas de API (exclui `_next`, imagens e arquivos estáticos). Não faz redirecionamentos.
- Não há cliente do Supabase no navegador.

### Tela `/entrar`
- Duas abas na mesma página: **Entrar** (padrão) e **Criar conta** (`?modo=criar`). Campos: e-mail e senha (mínimo 6 caracteres).
- Server Actions em `app/entrar/actions.ts`: `entrar`, `criarConta`; e `sair` (usada pelo menu do cabeçalho).
- Erros mostrados abaixo do formulário, mantendo o e-mail digitado (`useActionState`):

| Situação | Mensagem |
|---|---|
| Credenciais erradas | "E-mail ou senha incorretos." |
| E-mail já cadastrado | "Já existe uma conta com esse e-mail. Entre com sua senha." |
| Senha curta/fraca | "A senha precisa ter pelo menos 6 caracteres." |
| E-mail inválido | "Digite um e-mail válido." |
| Supabase indisponível ou não configurado | "Não foi possível conectar agora. Tente de novo em instantes." |

- Quem já está logado e abre `/entrar` vai para `/`.

### Voltar para onde estava
- Parâmetros de `/entrar`: `voltar` (caminho de origem), `filme` (id) e `marcar` (`quero` | `assistido`).
- Depois de entrar ou criar conta: se `filme` e `marcar` forem válidos, grava a marcação; então redireciona para `voltar`.
- `voltar` só é aceito se for caminho interno: começa com `/`, não começa com `//` nem `/\`, sem esquema. Caso contrário, usa `/`. Função pura `caminhoSeguro()` em `lib/redirect.ts`.

## 4. Listas

### Tipos e acesso (`lib/listas.ts`, `server-only`)
- `type Marca = "quero" | "assistido"`.
- `getMarcas(): Promise<Record<number, Marca>>` — todas as marcações do usuário logado (só `filme_id` e `status`), para selos e botões. `{}` sem login ou em caso de falha.
- `getLista(marca, pagina, pais): Promise<MoviePage>` — página de 24 marcações, mais recentes primeiro; busca os detalhes de cada filme no TMDB (`getMovieDetails`, já com cache de 6h) com `Promise.allSettled` e converte para `Movie`. Filmes cuja consulta falhar são pulados nesta resposta.

### Marcar (`app/filme/actions.ts`)
- `marcarFilme(filmeId, marca | null, voltar)`:
  - sem usuário → `redirect` para `/entrar?voltar=…&filme=…&marcar=…`;
  - `marca` → `upsert` em `(user_id, filme_id)` com `atualizado_em = now()`;
  - `null` → `delete` da linha;
  - depois, `refresh()` para atualizar a página;
  - falha do Supabase → devolve `{ erro: "Não foi possível salvar. Tente de novo." }`.
- Valida `filmeId` (inteiro positivo) e `marca` no servidor.

### Abas na página inicial
- Parâmetro `aba` em `/`: ausente = Catálogo; `quero-assistir`; `assistidos`. Valor inválido = Catálogo. `parseAba()` em `lib/filters.ts`.
- Aba de lista sem login → `redirect` para `/entrar?voltar=/?aba=…`.
- Aba de lista: sem destaque e sem filtros; título com contagem ("Quero assistir · 12 filmes"); grade de cartões; "Carregar mais" de 24 em 24 via `GET /api/lista?aba=…&pagina=…&pais=…` (401 sem login).
- Usa o país de `?pais=` (padrão `BR`) para os logos de streaming.
- `MovieGrid` passa a receber a URL base do "Carregar mais" (`endpoint`) em vez de montá-la a partir dos filtros, servindo ao catálogo e às listas.

## 5. Telas

### Cabeçalho (`SiteHeader`)
- Recebe o usuário do layout (`getUsuario()`); lê a aba atual com `useSearchParams`/`usePathname`.
- **Sem login:** logo + botão vermelho **"Entrar"** (leva a `/entrar?voltar=<página atual>`).
- **Com login:** abas **Catálogo · Quero assistir · Já assistidos** ao lado da logo (atual em branco, demais em cinza; `aria-current="page"`); à direita, círculo com a inicial do e-mail que abre menu (`<details>`) com o e-mail e o botão **"Sair"**.
- Celular: as abas descem para uma linha abaixo da logo, com rolagem horizontal.

### Botões de marcar (`MarkButtons`, client)
- Na página do filme e no `FeaturedHero`, ao lado de "Ver trailer": **"+ Quero assistir"** e **"✓ Já assisti"**, com `aria-pressed`.
- Ativo: preenchido. Clicar no ativo desmarca. Clicar no outro troca.
- Resposta imediata com `useOptimistic`; se a ação devolver erro, volta ao estado anterior e mostra a mensagem abaixo dos botões (`role="status"`).

### Selos nos cartões
- `MovieCard` recebe `marca?: Marca`. Selo no canto inferior direito do pôster: ícone de marcador para `quero`, ✓ verde para `assistido`, com texto acessível ("Na sua lista Quero assistir" / "Você já assistiu").
- Vale em todas as grades (catálogo, busca, abas). A página passa `getMarcas()` para `MovieGrid`.

### Lista vazia
- Quero assistir: "Nenhum filme aqui ainda. Encontre algo no catálogo e toque em + Quero assistir."
- Já assistidos: "Nenhum filme aqui ainda. Quando terminar um filme, toque em ✓ Já assisti na página dele."
- Botão **"Explorar catálogo"** → `/`.

## 6. Erros

- Supabase fora do ar/não configurado: catálogo, busca e detalhes funcionam; `getUsuario()` devolve `null`; `getMarcas()` devolve `{}`; login e marcação mostram as mensagens da seção 3/4.
- Sessão expirada durante a marcação: a ação não encontra usuário e segue o fluxo de login com retorno e marcação pendente.
- Filme da lista com falha no TMDB: pulado nesta visita; continua salvo.

## 7. Testes

- **Unitários (Vitest, Supabase simulado como o TMDB):**
  - `caminhoSeguro()` contra entradas maliciosas (`//site`, `/\site`, `https://…`, vazio);
  - mapeamento de erros de login para as mensagens;
  - `entrar`, `criarConta`, `sair`: chamadas ao Supabase, marcação pendente e redirecionamento;
  - `marcarFilme`: sem login (redirect), marcar, trocar, desmarcar, validação e erro;
  - `getLista`/`getMarcas`: ordem, paginação de 24, filme com falha, sem login;
  - `parseAba()`; rota `/api/lista` (400/401/200);
  - componentes: cabeçalho com e sem login e aba ativa, `MarkButtons` (otimista, troca, desmarca, erro), selo no `MovieCard`, lista vazia, formulário de `/entrar` com erros.
- **E2E (Playwright):** criar conta → marcar "Quero assistir" → ver na aba → marcar "Já assisti" → ver na outra aba → desmarcar. Usa um e-mail único por execução (ex.: `e2e+<timestamp>@exemplo.com`). Roda só se `SUPABASE_URL` estiver definido; senão é pulado.
- **Conferência visual:** screenshots de cabeçalho, `/entrar`, abas e botões, no desktop e no celular.
