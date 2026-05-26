# Sync e autenticação

> Saída do modelo "single-user, 100% offline" pro modelo "single-user, offline-first com backup/sync na nuvem".
>
> **Status: implementado em 2026-05-08.** Esse doc descreve o plano da arquitetura. Pra estado atual e detalhes operacionais, veja [`07-estado-atual.md`](07-estado-atual.md).

## Por quê

Sem login + sync você perde tudo se trocar de celular. Esse doc descreve a arquitetura mínima pra resolver isso sem virar um app de produção complexo.

---

## Stack escolhida

| Camada | Escolha | Motivo |
|---|---|---|
| Hospedagem | **Railway** | Você já usa. Postgres + backend rodam no mesmo painel. |
| Banco | **Postgres** (Railway) | SQL relacional, espelha o schema SQLite local. |
| Backend | **Bun + Hono** (TypeScript) | Runtime + framework leves, fáceis de deployar no Railway. |
| ORM | **Drizzle** | Type-safe, sem ceremônia, schema migra fácil. |
| Auth | **Custom** com Apple Sign-In + Google Sign-In | Backend valida ID tokens via JWKS oficial e emite JWT próprio. |
| App local | **SQLite** (continua) | Banco primário. Sync é só backup/replicação. |
| Sync | Camada própria (`src/sync/`) | Pull → merge → push em momentos discretos (abrir o app, pull-to-refresh). |

**Princípio**: o app continua **offline-first**. SQLite local é a verdade. A nuvem é só backup. Se o servidor cair, app continua funcionando.

---

## Estrutura do repositório (monorepo)

```
1%/
├── app/          # Expo (React Native) — já existe
├── backend/      # Bun + Hono — vai ser criado
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts        # tabelas Drizzle
│   │   │   └── client.ts        # pool postgres
│   │   ├── auth/
│   │   │   ├── apple.ts         # validação JWKS Apple
│   │   │   ├── google.ts        # validação JWKS Google
│   │   │   ├── jwt.ts           # emissão/verificação JWT próprio
│   │   │   └── middleware.ts    # protege rotas
│   │   ├── routes/
│   │   │   ├── auth.ts          # POST /auth/login
│   │   │   └── sync.ts          # GET /sync/pull, POST /sync/push
│   │   └── index.ts             # app Hono
│   ├── drizzle.config.ts
│   ├── package.json
│   └── README.md
└── docs/
```

---

## Fluxo de autenticação

### Apple Sign-In (do app)
```
1. expo-apple-authentication abre prompt nativo
2. usuário aprova → app recebe { identityToken, user, email }
3. app POST /auth/login { provider: "apple", idToken: identityToken }
4. backend baixa JWKS de https://appleid.apple.com/auth/keys (cache 24h)
5. backend valida idToken (assinatura, iss=https://appleid.apple.com, aud=com.umporcento.app)
6. backend extrai sub (id único Apple)
7. backend INSERT/UPDATE em users por (provider='apple', provider_sub=sub)
8. backend emite JWT próprio { user_id, exp: now+30d } assinado HS256 com APP_JWT_SECRET
9. backend responde { jwt, user: { id, nome?, email? } }
```

### Google Sign-In (do app)
```
1. expo-auth-session abre fluxo OAuth Google
2. usuário aprova → app recebe id_token Google
3. app POST /auth/login { provider: "google", idToken: id_token }
4. backend baixa JWKS de https://www.googleapis.com/oauth2/v3/certs (cache)
5. backend valida idToken (iss=https://accounts.google.com, aud=GOOGLE_CLIENT_ID)
6. backend extrai sub
7. resto igual ao fluxo Apple
```

### Requests autenticados
```
App: Authorization: Bearer <jwt>
Backend: middleware decodifica JWT → req.user_id → continua
```

---

## Schema do banco (Postgres)

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL CHECK (provider IN ('apple', 'google')),
  provider_sub TEXT NOT NULL,
  email       TEXT,
  nome        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_sub)
);

-- Espelha o SQLite local. Cada tabela ganha user_id + updated_at.
CREATE TABLE areas (
  id          INTEGER NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  nome        TEXT NOT NULL,
  cor_base    TEXT NOT NULL,
  obrigatoria SMALLINT NOT NULL,
  ordem       INTEGER NOT NULL,
  ativa       SMALLINT NOT NULL,
  paused_until TEXT,
  pause_reason TEXT,
  peso_global REAL NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE TABLE tarefas (
  id          INTEGER NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id     INTEGER NOT NULL,
  nome        TEXT NOT NULL,
  peso        SMALLINT NOT NULL,
  frequencia  TEXT NOT NULL,
  alvo_count  INTEGER NOT NULL,
  ativa       SMALLINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id, area_id) REFERENCES areas(user_id, id) ON DELETE CASCADE
);

CREATE TABLE execucoes (
  id          INTEGER NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tarefa_id   INTEGER NOT NULL,
  data        TEXT NOT NULL,
  status      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE TABLE reflexoes_diarias (
  id          INTEGER NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data        TEXT NOT NULL,
  pergunta    TEXT NOT NULL,
  resposta    TEXT,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

CREATE TABLE autoavaliacao_inicial (
  area_id     INTEGER NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nota        INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, area_id)
);

CREATE TABLE eventos (
  id          INTEGER NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data        TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  payload_json TEXT,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);
```

> **PK composta** `(user_id, id)` permite o app usar IDs auto-incrementais locais sem colidir com outros usuários.

---

## API do backend

```
POST   /auth/login        { provider, idToken }                    → { jwt, user }
GET    /sync/pull?since=  (Authorization: Bearer)                   → { areas, tarefas, execucoes, ... }
POST   /sync/push          (Authorization: Bearer) { ...changes }   → { ok }
GET    /me                 (Authorization: Bearer)                  → { user }
DELETE /me                 (Authorization: Bearer)                  → 204    # apaga conta
```

`since` é um ISO timestamp. Backend devolve só linhas com `updated_at > since`.

---

## Sync no app

```
Abrir app
  ├─ tem JWT no SecureStore?  não → /login
  ├─ pull: GET /sync/pull?since=<last_pull_at>
  ├─ merge linha-por-linha: last-write-wins por updated_at
  ├─ push: POST /sync/push com linhas locais onde updated_at > synced_at
  ├─ atualiza last_pull_at, marca synced_at em cada linha enviada
  └─ pronto
```

Conflitos: last-write-wins. Single-user em até 2 devices não precisa CRDT.

---

## Schema local (SQLite) — alterações

```sql
ALTER TABLE areas              ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE areas              ADD COLUMN synced_at  TEXT;
ALTER TABLE tarefas            ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE tarefas            ADD COLUMN synced_at  TEXT;
ALTER TABLE execucoes          ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE execucoes          ADD COLUMN synced_at  TEXT;
ALTER TABLE reflexoes_diarias  ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE reflexoes_diarias  ADD COLUMN synced_at  TEXT;
ALTER TABLE autoavaliacao_inicial ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE autoavaliacao_inicial ADD COLUMN synced_at  TEXT;
ALTER TABLE eventos            ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
ALTER TABLE eventos            ADD COLUMN synced_at  TEXT;

-- e nova tabela pra meta-state do sync:
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_uuid TEXT,
  jwt TEXT,
  last_pull_at TEXT
);
```

`users` local: passa a guardar `provider`, `provider_sub`, `user_uuid` (do backend).

Triggers SQLite atualizam `updated_at` em todo INSERT/UPDATE — assim toda mutação local fica detectável pro push.

---

## Roteamento do app

```
não logado                → /login
logado, não onboarded     → /onboarding/cadastro
logado, onboarded         → /
```

Tela `/login` tem 2 botões: "Continuar com Google" e "Continuar com Apple".

---

## Setup externo (você faz)

### 1. Railway: Postgres + projeto pro backend (10 min)
1. Acessa https://railway.app → New Project → Deploy PostgreSQL → espera ficar verde.
2. No Postgres service → Variables → copia `DATABASE_URL`. Guarda.
3. No mesmo projeto: New → Empty Service → nome `backend`. (Vou te passar o repo/Dockerfile depois pra apontar pra esse service.)

### 2. Google OAuth Client ID (10 min)
1. https://console.cloud.google.com → New Project: `1Percent`.
2. APIs & Services → OAuth consent screen → External → preenche app name `1%`, e-mails → Save.
3. APIs & Services → Credentials → Create Credentials → OAuth Client ID → **iOS** → Bundle ID `com.umporcento.app`. Copia o **Client ID**.
4. Me manda esse Client ID.

### 3. Apple Sign-In
- **Simulator agora**: nada a fazer. Funciona out of the box (precisa ter conta Apple ID logada no Simulator: `Settings → Apple ID`).
- **iPhone real depois**: aí precisa USD 99/ano + Service ID + Key — eu te guio quando chegar.

### 4. Variáveis de ambiente do backend (Railway → backend service → Variables)
```
DATABASE_URL=<copiada do Postgres do Railway>
APP_JWT_SECRET=<vou gerar e te mando>
GOOGLE_CLIENT_ID=<a que você criou>
APPLE_CLIENT_ID=com.umporcento.app
APPLE_TEAM_ID=               # vazio até pagar Apple Developer
PORT=3000
```

---

## O que eu vou fazer (sequencial)

1. Criar `backend/` com skeleton Hono + Drizzle + endpoints de saúde
2. Schema Drizzle das tabelas
3. Endpoint `POST /auth/login` com validação Apple + Google
4. Middleware de JWT
5. Endpoints `/sync/pull` e `/sync/push`
6. Dockerfile pra Railway
7. README do backend com `bun dev` local
8. No app: tela `/login`
9. No app: módulos de auth Apple e Google
10. No app: cliente HTTP que injeta JWT
11. No app: alterações no schema SQLite + triggers de updated_at
12. No app: módulo `src/sync/` pull/push/merge
13. Testar tudo no Simulator

Tempo estimado: **2–3 dias de código** (vs ~3 horas com Supabase managed). Reposiciono se quiser pular pra opção Supabase.

---

## Custos resumidos (Railway)

| Item | Custo mensal |
|---|---|
| Postgres no Railway | ~USD 5 |
| Backend service no Railway | ~USD 5 |
| Google OAuth | USD 0 |
| Apple Sign-In no Simulator | USD 0 |
| Apple Developer Program (depois, pra device real) | USD 99/ano |

Total operacional: **~USD 10/mês** + Apple Developer quando for hora.

---

## Riscos

- **Validação JWKS errada**: token aceito de fonte que não é a Apple/Google → conta sequestrada. Mitigação: usar `jose` que faz tudo certo se passar `iss`+`aud` corretos. Não rolar a mão.
- **JWT secret vazado**: qualquer um forja sessão. Mitigação: secret só na env do Railway, nunca no repo. `.env` no `.gitignore`.
- **Migration de dados existentes**: você já tem dados locais do onboarding que fez agora. A migração precisa preservar — vou escrever o script com defaults sensatos.
- **Custo no Railway esticando**: se o app for usado pesado, Railway cobra por uso. Pra single-user é desprezível, mas fico de olho.
