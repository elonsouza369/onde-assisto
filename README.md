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

## Testes

```bash
npm test           # testes automáticos (rápidos, não usam a internet)
npm run test:e2e   # abre o app num navegador e testa o fluxo principal (precisa do token)
```

Na primeira vez que for rodar o teste no navegador, instale o Chromium com `npx playwright install chromium`.

## Publicar na Vercel (grátis)

1. Envie o projeto para um repositório no GitHub.
2. Em https://vercel.com, clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione `TMDB_API_TOKEN` com o seu token.
4. Clique em **Deploy**. A partir daí, cada envio ao GitHub publica uma nova versão automaticamente.

## Como o código está organizado

- `app/`: as páginas (o catálogo em `/` e os detalhes em `/filme/[id]`) e a rota interna `/api/movies`, usada pelo botão "Carregar mais".
- `components/`: as peças visuais (cartão, grade, filtros, trailer...).
- `lib/filters.ts`: lê e escreve os filtros no endereço da página.
- `lib/tmdb/`: o único lugar que conversa com o TMDB. As respostas ficam guardadas em cache: as listas por 24h e os filmes por 6h.
- `docs/superpowers/`: a especificação e o plano do projeto.

## Créditos

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
Os dados de disponibilidade em streaming são fornecidos pelo JustWatch.
