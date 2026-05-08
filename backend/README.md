# 1% — Backend

Bun + Hono + Drizzle + Postgres. Hospedado no Railway.

## Rodar local

```bash
bun install
cp .env.example .env   # preencha com seus valores
bun run db:push        # cria as tabelas no Postgres
bun run dev            # http://localhost:3000
```

Gera um JWT secret forte:
```bash
openssl rand -base64 32
```

## Deploy no Railway

1. New Project → New Service → Deploy from GitHub repo (esse monorepo).
2. Em **Service Settings → Root Directory**: `backend`.
3. Build/start: o Dockerfile cuida disso.
4. Em **Variables**, define:
   - `DATABASE_URL` (referencia o Postgres do mesmo projeto: `${{Postgres.DATABASE_URL}}`)
   - `APP_JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `APPLE_CLIENT_ID=com.umporcento.app`
   - `PORT=3000`
5. Em **Networking**, gera domínio público — vai virar a URL base que o app chama.

Depois do primeiro deploy, roda `bun run db:push` localmente apontando pro DATABASE_URL público pra criar as tabelas (uma vez só, ou quando o schema mudar).

## API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | – | health check |
| POST | `/auth/login` | – | `{ provider: "apple"\|"google", idToken }` → `{ jwt, user }` |
| GET | `/me` | Bearer | dados do usuário logado |
| DELETE | `/me` | Bearer | apaga conta + todos os dados (cascade) |
| GET | `/sync/pull?since=<iso>` | Bearer | linhas atualizadas desde `since` |
| POST | `/sync/push` | Bearer | envia linhas locais novas/modificadas |
