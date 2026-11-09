# Onde Assisto

Catálogo de filmes disponíveis **agora** nos serviços de streaming por assinatura (Netflix, Prime Video, Max, Disney+...). O Brasil vem como padrão e dá para trocar o país. O app permite filtrar por streaming e gênero, buscar pelo nome e ordenar os resultados.

Feito com Next.js, TypeScript e Tailwind CSS, usando a API do [TMDB](https://www.themoviedb.org).

## Pré-requisitos

- [Node.js](https://nodejs.org) LTS (versão 22 ou mais nova)
- Um **API Read Access Token** do TMDB. Para conseguir um, crie uma conta grátis e acesse *Configurações → API*. O token é o mais longo e começa com `eyJ`.

## Como rodar no seu computador

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie o arquivo de exemplo de configuração:
   ```bash
   cp .env.local.example .env.local
   ```
3. Abra o `.env.local` e cole o seu token no lugar de `cole-seu-token-aqui`.
   Esse arquivo **não vai para o GitHub**, porque o `.gitignore` o ignora.
4. Inicie o app:
   ```bash
   npm run dev
   ```
5. Abra http://localhost:3000 no navegador.

## Login e listas (Supabase)

Quem cria uma conta pode marcar filmes como **Quero assistir** ou **Já assisti** e vê essas listas em abas na página inicial. Sem o Supabase configurado, o catálogo continua funcionando normalmente; só o login e as listas ficam indisponíveis.

1. Crie uma conta grátis em https://supabase.com e um projeto (região *South America (São Paulo)*).
2. No painel do projeto, abra **SQL Editor**, cole o conteúdo de `supabase/migrations/20261108000000_lista_filmes.sql` e clique em **Run**.
3. Em **Authentication → Sign In / Providers → Email**, desligue **Confirm email** (assim a pessoa entra logo após criar a conta).
4. Em **Project Settings → API Keys**, copie o endereço do projeto e a chave pública (*publishable*) para o `.env.local`:
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Nunca use a chave secreta (*secret*) nem a senha do banco aqui.
5. Reinicie o `npm run dev`.

## Testes

```bash
npm test           # testes automáticos (rápidos, não usam a internet)
npm run test:e2e   # abre o app num navegador e testa os fluxos principais (precisa do token; o das listas só roda com o Supabase configurado)
```

Na primeira vez que for rodar o teste no navegador, instale o Chromium com `npx playwright install chromium`.

## Publicar na Vercel (grátis)

1. Envie o projeto para um repositório no GitHub.
2. Em https://vercel.com, clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione `TMDB_API_TOKEN` com o seu token (e, para o login, `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`).
4. Clique em **Deploy**. A partir daí, cada envio ao GitHub publica uma nova versão automaticamente.

## Como o código está organizado

- `app/`: as páginas (o catálogo em `/` e os detalhes em `/filme/[id]`) e a rota interna `/api/movies`, usada pelo botão "Carregar mais".
- `components/`: as peças visuais (cartão, grade, filtros, trailer...).
- `lib/filters.ts`: lê e escreve os filtros no endereço da página.
- `lib/supabase/`: o único lugar que conversa com o Supabase (sessão, usuário logado, mensagens de erro do login). `proxy.ts` renova a sessão a cada visita.
- `lib/listas.ts`: lê e grava as listas "Quero assistir" e "Já assistidos".
- `lib/tmdb/`: o único lugar que conversa com o TMDB. As respostas ficam guardadas em cache: as listas por 24h e os filmes por 6h.
- `docs/superpowers/`: a especificação e o plano do projeto.

## Créditos

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
Os dados de disponibilidade em streaming são fornecidos pelo JustWatch.
