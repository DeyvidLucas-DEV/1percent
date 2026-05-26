# Estado atual do app

> Snapshot do que existe hoje no código de `app/` e `backend/`.
> Atualizado em 2026-05-21 por auditoria de leitura (não mexe em código).
>
> A versão anterior deste doc (2026-05-08) está defasada — em particular afirmava que **não havia IA** e mostrava 4 tabelas no backend. Hoje há um subsistema de IA inteiro rodando + 5 tabelas adicionais no Postgres. Veja `09-ia-e-memoria.md` e `_divergencias.md`.

---

## Visão geral

O 1% deixou de ser "single-user, 100% offline, sem login" e virou:

- **Single-user, offline-first**, com backup/sync na nuvem.
- **Login com Google** (Apple Sign-In desativado — `src/auth/apple.ts` retorna sempre `disponivelApple()=false`).
- **4 abas visuais** (Hoje | Áreas | Insights | Configurações) + um **FAB central** na tab bar que abre `/ajustar` (hub do subsistema de IA).
- **Backend próprio** (Bun + Hono + Drizzle + Postgres + pgvector) hospedado no Railway.
- **Subsistema de IA + memória de longo prazo** com OpenAI: `gpt-4o-mini` para texto, `text-embedding-3-small` para embeddings, `whisper-1` para voz. Detalhe completo em `09-ia-e-memoria.md`.

---

## Repositórios e infra

| Item | Valor |
|---|---|
| Repo GitHub | https://github.com/DeyvidLucas-DEV/1percent |
| Backend (URL pública) | https://1percent-production.up.railway.app |
| Postgres | Railway (com extensão `pgvector`) |
| Bundle ID iOS | `com.umporcento.app` |
| Bundle ID Android | `com.umporcento.app` |
| Google OAuth Client ID (iOS) | `863364734205-pauis7u6qhm56rqtq76uv6d24vc94lac.apps.googleusercontent.com` |
| Google OAuth Client ID (Android) | `863364734205-hji6cavhclh7ko68fm6ivt41a439kkfd.apps.googleusercontent.com` |
| URL scheme deep-link | `umporcento` + reversed Google client ID por plataforma |
| Apple Developer Account | Paga em 2026-05; Apple Sign-In **ainda não reativado** no app |
| Firebase | Projeto criado pra FCM V1 (Android) — `google-services.json` commitado |

### Variáveis de ambiente do backend (Railway)

```
DATABASE_URL       = postgresql://...           (do serviço Postgres do mesmo projeto)
APP_JWT_SECRET     = <segredo HS256, 48+ bytes — nunca colar em chat/Git>
GOOGLE_CLIENT_IDS  = <iOS_client_id>,<Android_client_id>  (CSV, fallback pra GOOGLE_CLIENT_ID legado)
APPLE_CLIENT_ID    = com.umporcento.app
OPENAI_API_KEY     = sk-...                     (necessária pra qualquer rota /ai/*)
AI_MODEL           = gpt-4o-mini                (opcional, default)
AI_EMBEDDING_MODEL = text-embedding-3-small     (opcional, default)
PORT               = 3000
```

---

## Estrutura do monorepo

```
1%/
├── app/                          # Expo SDK 54 (React Native + TypeScript)
│   ├── app/                      # rotas (expo-router, file-based)
│   │   ├── _layout.tsx           # bootstrap, redirects, Stack global
│   │   ├── login.tsx             # só Google
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # 4 abas (TabBarPill custom)
│   │   │   ├── index.tsx         # Hoje
│   │   │   ├── areas.tsx         # Áreas
│   │   │   ├── insights.tsx      # Insights
│   │   │   └── config.tsx        # Configurações
│   │   ├── onboarding/
│   │   │   ├── cadastro.tsx      # também usado em modo edit via ?modo=editar
│   │   │   ├── areas.tsx
│   │   │   └── autoavaliacao.tsx
│   │   ├── area/[id].tsx         # detalhe da área (com Pausar/Reativar)
│   │   ├── tarefa/[id].tsx       # editor (id="novo" cria) — picker nativo de horário
│   │   ├── dia/[iso].tsx         # detalhe de um dia (edição retroativa)
│   │   ├── alvo.tsx              # Alvo de Vida (pizza)
│   │   ├── checklist.tsx         # checklist do dia
│   │   ├── reflexao.tsx          # reflexão diária
│   │   ├── reativacao.tsx        # bloqueante após 2+ dias pulados
│   │   ├── ajustar.tsx           # hub do subsistema de IA (abre via FAB)
│   │   ├── ajustar/
│   │   │   ├── dia.tsx           # "Como foi seu dia" — narração + IA
│   │   │   ├── plano.tsx         # plano semanal gerado por IA
│   │   │   ├── trilha.tsx        # linha do tempo dos eventos
│   │   │   └── memoria.tsx       # "O que o 1% aprendeu" (user_memory_facts)
│   │   └── configuracoes/
│   │       └── horario-trabalho.tsx
│   └── src/
│       ├── auth/                 # apple.ts (placeholder), google.ts, sessao.ts
│       ├── components/
│       │   ├── ui/               # 24 componentes (ver §"Design system" abaixo)
│       │   ├── AlvoDeVida.tsx
│       │   ├── Botao.tsx         # variantes primario/secundario/perigo com tokens semânticos
│       │   ├── Campo.tsx
│       │   └── Seletor.tsx
│       ├── db/
│       │   ├── schema.ts         # DDL SQLite + migrações idempotentes + triggers
│       │   ├── seed.ts           # 10 áreas + ~38 tarefas padrão
│       │   ├── bootstrap.ts      # initSchema + seed + permissões + sync background
│       │   ├── types.ts
│       │   └── queries/          # areas, tarefas, users, execucoes, reflexoes,
│       │                         #   syncState, trailEvents, seed (dev)
│       ├── domain/               # cores, percentual, intensidade, mediocridade,
│       │                         #   streak, agregados, alertasPausa, areasPaleta,
│       │                         #   reflexoes, sugestoes (validação IA)
│       ├── lib/
│       │   ├── api.ts            # cliente HTTP com Bearer JWT + upload multipart
│       │   ├── config.ts         # BACKEND_URL + Google Client IDs (iOS/Android)
│       │   ├── notificacoes.ts
│       │   ├── agendarNotificacoesTarefas.ts
│       │   ├── datas.ts
│       │   ├── deviceId.ts
│       │   ├── haptics.ts
│       │   └── tema.ts           # tokens (light + dark, com acentoTexto/inkTexto/perigoTexto)
│       ├── store/appStore.ts     # Zustand
│       └── sync/sync.ts          # pull + push + envio de trilha (idempotente)
│
├── backend/                      # Bun + Hono + Drizzle
│   ├── src/
│   │   ├── auth/                 # apple.ts, google.ts (validação JWKS), jwt.ts, middleware.ts
│   │   ├── db/                   # client.ts (postgres pool), schema.ts (Drizzle + pgvector)
│   │   ├── ai/                   # cliente.ts, prompt.ts, dailyNote.ts, weeklyPlan.ts,
│   │   │                         #   retrieval.ts, banlist.ts, rateLimit.ts
│   │   └── routes/               # auth.ts, sync.ts, trail.ts, ai.ts, memory.ts
│   ├── migrations/
│   │   └── 0001_shared_knowledge.sql   # criada por P4, ainda não aplicada
│   ├── Dockerfile
│   ├── drizzle.config.ts
│   └── package.json
│
├── docs/                         # esses documentos
└── screens/                      # mockups web React (referência, não compilam no app)
```

---

## Tabs e roteamento real

`app/(tabs)/_layout.tsx` declara 4 tabs (`index`, `areas`, `insights`, `config`). O `TabBarPill` custom (`src/components/ui/TabBarPill.tsx`) renderiza só essas 4 + **um FAB central** que faz `router.push('/ajustar')`. Visualmente são 5 alvos de toque, mas Ajustar **não é uma tab** — é uma rota da Stack principal.

Stack global em `app/_layout.tsx`:
- `login`, `(tabs)`
- `onboarding/{cadastro, areas, autoavaliacao}`
- `checklist`, `alvo`
- `area/[id]`, `tarefa/[id]`, `dia/[iso]`
- `reflexao`, `reativacao`
- `ajustar`, `ajustar/{dia, memoria, plano, trilha}`
- `configuracoes/horario-trabalho`

---

## Auth (como funciona hoje)

```
1. App: usuário toca "Continuar com Google"
2. App: AuthRequest com responseType=Code + PKCE → abre Safari → Google
   - Client ID escolhido por Platform.OS (iOS vs Android)
3. Google: redireciona pro app via URL scheme reversed-client-id da plataforma
4. App: troca code por id_token via /oauth2/token (PKCE)
5. App: POST /auth/login { provider: "google", idToken } → backend
6. Backend: valida idToken via JWKS oficial do Google (jose)
   - audience aceita CSV de client IDs (GOOGLE_CLIENT_IDS) — iOS + Android
7. Backend: INSERT/UPDATE em users (chave: provider + provider_sub UNIQUE)
8. Backend: emite JWT próprio HS256 (issuer 'app-1-percent', exp 30d)
9. App: salva JWT + user_uuid no SecureStore
10. Próximas requests: Authorization: Bearer <jwt>
```

Comportamento de cancelamento (depois do P2 aplicado em 2026-05-21): se o usuário fecha o sheet do Google, `loginGoogle()` retorna `{ tipo: 'cancelado' }` em vez de jogar erro — `login.tsx` ignora silenciosamente. Erro real (rede, token inválido) ainda mostra alert.

**Apple Sign-In**: ainda em placeholder (`src/auth/apple.ts:7-13`). Mesmo com Apple Developer Program ativo, o fluxo continua retornando `false`. Reativação:
```bash
cd app && npm install expo-apple-authentication
```
+ `app.json`: `"usesAppleSignIn": true` em `ios` e `"expo-apple-authentication"` em `plugins`. Restaurar versão git anterior de `apple.ts`. `expo prebuild --platform ios --clean && expo run:ios`.

---

## Sync (como funciona)

### Schema local (SQLite) — colunas extras

Toda tabela em `TABELAS_SYNC` tem:
- `updated_at TEXT` — preenchida por trigger AFTER INSERT/UPDATE (`*_updated_at_ins` e `*_updated_at_upd` em `schema.ts:167-186`).
- `synced_at TEXT` — atualizada manualmente após push bem-sucedido.

`TABELAS_SYNC = ['areas', 'tarefas', 'execucoes', 'reflexoes_diarias', 'autoavaliacao_inicial', 'eventos']` (`schema.ts:121`).

Tabela auxiliar:

```sql
CREATE TABLE sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_pull_at TEXT
);
```

### Fluxo (`app/src/sync/sync.ts`)

```
sincronizar()
├─ enviarLocal()       POST /sync/push    (linhas onde updated_at > synced_at)
│                       → marca synced_at = updated_at após sucesso
├─ enviarTrilha()      POST /trail/batch  (até 200 eventos pendentes)
│                       → marca synced_at na user_trail_events
│                       → falha não bloqueia o resto
└─ aplicarPull()       GET /sync/pull?since=<last_pull_at>
                       → last-write-wins por updated_at (skipa se local >= remoto)
                       → setLastPullAt(serverNow)
```

### Quando dispara

- **Bootstrap do app** após login (background, não bloqueia o boot)
- **Manual**: Configurações → Sincronização → "Sincronizar agora"

### O que NÃO sincroniza

- **`users` local** (nome, idade, sexo, peso, altura, estado_civil, filhos, **horario_trabalho_inicio/fim**) — fica só no device. Trocar de device força re-onboarding e perde o horário de trabalho.
- **Toggles de notificação** — estado em-memória da tela Configurações, não chega nem ao SQLite.

---

## Schema SQLite (local) — estado real

Após `initSchema` + `rodarMigracoes`:

### Tabelas sincronizadas

**users** (`id=1 CHECK`, single-user local):
- id, nome, idade, sexo (M/F/O), peso_kg, altura_cm, estado_civil, filhos, created_at, onboarded_at
- **`horario_trabalho_inicio TEXT`**, **`horario_trabalho_fim TEXT`** (adicionados em migração — NÃO sincronizam)
- (sem `updated_at`/`synced_at` — esta tabela não está em `TABELAS_SYNC`)

**areas** (10 linhas semeadas):
- id PK, slug UNIQUE, nome, cor_base, obrigatoria, ordem, ativa, paused_until, pause_reason, peso_global
- + `updated_at`, `synced_at` (migração)

**tarefas**:
- id AUTOINCREMENT, area_id FK, nome, peso (1-3), frequencia (diaria/semanal/mensal), alvo_count, ativa, created_at
- **`horario TEXT`** (migração, HH:MM ou NULL)
- + `updated_at`, `synced_at`

**execucoes**:
- id AUTOINCREMENT, tarefa_id FK, data, status (concluido/parcial/nao_feito), created_at
- UNIQUE(tarefa_id, data)
- Índices: `idx_execucoes_data`, `idx_execucoes_tarefa`
- + `updated_at`, `synced_at`

**reflexoes_diarias**:
- id AUTOINCREMENT, data UNIQUE, pergunta, resposta, created_at
- + `updated_at`, `synced_at`

**autoavaliacao_inicial**:
- id AUTOINCREMENT, area_id FK, nota (0-10), created_at, UNIQUE(area_id)
- + `updated_at`, `synced_at`

**eventos** (legado v1, ainda usada pra `area_pausada`):
- id AUTOINCREMENT, data, tipo, payload_json, created_at
- + `updated_at`, `synced_at`

### Tabelas locais NÃO sincronizadas

**sync_state** (1 linha):
- id=1 CHECK, last_pull_at

**user_trail_events** (trilha longitudinal v3 — sync separado via `/trail/batch`):
- id TEXT PK (UUID gerado no app), tipo, occurred_at, source (app/ai/sync/system), area_id, tarefa_id, session_id, device_id, payload_json (default '{}'), privacy_level (default 'private'), synced_at, created_at
- Índices: `idx_trail_sync(synced_at, occurred_at)`, `idx_trail_tipo_data(tipo, occurred_at)`

### Tabelas obsoletas dropadas (`TABELAS_OBSOLETAS`)

Em todo boot, `rodarMigracoes` faz `DROP TABLE IF EXISTS`:
- `sugestoes_rotina`, `area_diagnosticos`, `interacoes_ia` (do MVP v1 abandonado)

### Triggers

Para cada tabela em `TABELAS_SYNC`:
- `${t}_updated_at_ins` (AFTER INSERT): se `NEW.updated_at IS NULL`, preenche com `datetime('now')`.
- `${t}_updated_at_upd` (AFTER UPDATE): se `OLD.updated_at IS NEW.updated_at`, preenche.

---

## Schema Postgres (backend) — estado real

`backend/src/db/schema.ts` (Drizzle). 10 tabelas:

### Tabelas espelhadas do SQLite (sync)

| Tabela | PK | Notas |
|---|---|---|
| `users` | id UUID | provider + provider_sub UNIQUE. **Sem horario_trabalho_*** (esses ficam só local) |
| `areas` | (user_id, id) | mesmo shape do SQLite, com FK CASCADE em user_id |
| `tarefas` | (user_id, id) | inclui `horario TEXT` |
| `execucoes` | (user_id, id) | |
| `reflexoes_diarias` | (user_id, id) | |
| `autoavaliacao_inicial` | (user_id, area_id) | |
| `eventos` | (user_id, id) | legado, ainda recebe `area_pausada` |

Todas com `updated_at timestamptz default now()`.

### Tabelas do subsistema de IA + trilha

| Tabela | PK | Notas |
|---|---|---|
| `user_trail_events` | (user_id, id UUID) | append-only. `tipo, occurred_at, ingested_at, source, area_id, tarefa_id, session_id, device_id, payload_json JSONB, privacy_level, schema_version`. Índices em `(user_id, occurred_at DESC)` e `(user_id, tipo, occurred_at DESC)` |
| `user_memory_facts` | (user_id, id UUID) | `categoria, chave, valor, confianca (baixa/media/alta), origem_event_id, first_seen_at, last_confirmed_at, active, updated_at`. UNIQUE `(user_id, categoria, chave)`. Índice `(user_id, categoria, active)` |
| `user_memory_episodes` | (user_id, id UUID) | `source_event_id, occurred_at, titulo, resumo, tags TEXT[], area_slugs TEXT[], importance_score REAL, embedding VECTOR(1536), active, created_at`. Índice `(user_id, occurred_at DESC)` |
| `rate_limits` | (user_id, bucket, janela_inicio) | `contagem INTEGER` |
| `shared_knowledge` | id UUID | `fonte, trecho, tags TEXT[], embedding VECTOR(1536), created_at`. **Sem user_id** — escopo global. Migração em `backend/migrations/0001_shared_knowledge.sql` **ainda não aplicada** ao Postgres da Railway. |

ON DELETE CASCADE em tudo — `DELETE /me` apaga toda a conta.

---

## Endpoints do backend — estado real

Todos os endpoints `/sync/*`, `/trail/*`, `/ai/*`, `/memory/*` e `/me` exigem `Authorization: Bearer <jwt>` validado por `exigirAuth`. O `userId` vem **sempre** do JWT, nunca do body.

### Públicos

- `GET /` — `{ name: 'app-1-percent backend', ok: true }`
- `GET /health` — `{ ok: true }`

### Auth

- `POST /auth/login { provider: 'apple'|'google', idToken }` → `{ jwt, user: { id, email, nome } }`
  - Valida via JWKS oficial. Aceita CSV em `GOOGLE_CLIENT_IDS`.

### Conta

- `GET /me` → `{ id, provider, email, nome, createdAt }`
- `DELETE /me` → 204, dispara CASCADE em tudo.

### Sync (pull/push de dado de domínio)

- `GET /sync/pull?since=ISO` → `{ serverNow, areas[], tarefas[], execucoes[], reflexoes[], autoavaliacao[], eventos[] }`. Filtra por `user_id` E `updated_at > since`.
- `POST /sync/push { areas?, tarefas?, execucoes?, reflexoes?, autoavaliacao?, eventos? }` → `{ ok, serverNow }`. Upsert dentro de transação, com `setWhere` = `current.updated_at < novo.updated_at` (last-write-wins server-side).

### Trilha longitudinal

- `GET /trail?cursor=ISO&limit=50` → `{ eventos[], proximoCursor }`. Default limit 50, max 100. Ordena desc por `occurred_at`.
- `POST /trail/batch { eventos: [...] }` (até 500) → `{ ok, serverNow, recebidos }`. Idempotente via `ON CONFLICT DO NOTHING` em `(user_id, id)`.

### IA

- `POST /ai/daily-note { relato (20-8000), occurredAt?, contextoDados? }` → ver `09-ia-e-memoria.md §2.3`.
- `POST /ai/weekly-plan { intencaoDeclarada?, contextoDados? }` → ver `09-ia-e-memoria.md §5`.
- `POST /ai/transcribe` (multipart, campo `audio`, até 25MB) → `{ eventId, texto, duracaoSegundos, custoCentavos }`. Whisper PT-BR.

Todos sob rate-limit `10/h + 30/dia` por usuário (`backend/src/ai/rateLimit.ts`).

### Memória estruturada

- `GET /memory/facts?all=1` (sem `all=1` filtra ativos) → `{ facts: [...] }` ordenado por `updatedAt DESC`.
- `PATCH /memory/facts/:id { valor?, confianca?, active? }` → `{ ok: true }`. Grava `memory_fact_edited` na trilha.
- `DELETE /memory/facts/:id` → 204 (soft delete, `active=false`). Grava `memory_fact_deleted` na trilha.

---

## Telas do app — estado real

### Públicas (não exigem login)

- `/login` — só Google.

### Onboarding (logado, ainda sem `onboarded_at + nome`)

- `/onboarding/cadastro` — cadastro completo. Suporta `?modo=editar` (acessível por Configurações → Editar cadastro) para edição posterior.
- `/onboarding/areas` — confirma as 10 áreas. Permite pausar opcionais (dupla confirmação + alerta baseado em livros/Bíblia) e **reativar** as pausadas.
- `/onboarding/autoavaliacao` — nota 0-10 por área. Salva em `autoavaliacao_inicial`.

### Tabs principais (logado + onboarded)

- `/` (Hoje) — saudação, `DayPills` (semana), banner Mediocridade se aplicável, grid `HabitCard` (até 6 tarefas top peso), `BigRing` + card resumo.
- `/areas` — `AreaCard` por área + card Alvo de Vida.
- `/insights` — gráfico mês com bandas, calendário 7×N, Top/Bottom 3, reflexões anteriores. (O placeholder de "padrões" — texto "você falha mais às terças" — segue placeholder.)
- `/config` — perfil + áreas + toggles notificação (não persistem) + sync + sobre + dev (popular/limpar execuções).

### Sub-rotas

- `/area/[id]` — detalhe da área. Pausar/Reativar opcional com alerta + dupla confirmação.
- `/tarefa/[id]` — editor. id=`novo` cria, número edita. **Picker nativo de horário** (`@react-native-community/datetimepicker`, iOS spinner inline, Android dialog) com botão "Limpar".
- `/dia/[iso]` — detalhe do dia.
- `/alvo` — pizza Alvo de Vida.
- `/checklist` — checklist.
- `/reflexao` — reflexão diária.
- `/reativacao` — bloqueante após 2+ dias pulados.
- `/configuracoes/horario-trabalho` — define janela HH:MM-HH:MM da jornada (só local).

### Subsistema IA (acessado pelo FAB central da tab bar)

- `/ajustar` — hub com 5 cards.
- `/ajustar/dia` — narração diária (texto + gravação por voz). Renderiza response do `/ai/daily-note`.
- `/ajustar/plano` — plano semanal. Renderiza response do `/ai/weekly-plan`.
- `/ajustar/trilha` — linha do tempo paginada (consome `GET /trail`).
- `/ajustar/memoria` — fatos aprendidos (consome `/memory/facts` + edit/delete).

---

## Notificações

`src/lib/notificacoes.ts` + `src/lib/agendarNotificacoesTarefas.ts`:

- `pedirPermissao()`
- `agendarLembretesDiarios()` — 07:00 manhã + 21:30 noite
- `reagendarNotificacoesDeTarefas(tarefas)` — cancela tudo e reagenda lembretes fixos + 1 push diário pra cada tarefa ativa com horário definido

Disparado em:
- Bootstrap (se permissão e logado+onboarded)
- Após criar/editar/desativar/reativar tarefa no editor
- Após aceitar recomendação IA que mexe em tarefa

**Toggles em Configurações → Notificações** continuam visuais, **não persistem** (pendência pré-existente).

---

## Design system (`src/components/ui/` — 24 componentes)

`AlvoDeVida.tsx` (em `components/`), `AreaCard.tsx`, `BigRing.tsx`, `CobrancaBanner.tsx`, `ConfigGroup.tsx`, `ConfigRow.tsx`, `DayPills.tsx`, `HabitCard.tsx`, `HomeHeader.tsx`, `IconBtn.tsx`, `MiniCharts.tsx`, `MiniRing.tsx`, `MiniSemiRing.tsx`, `PageHeader.tsx`, `PunchOnChange.tsx`, `SectionHeader.tsx`, `StatCard.tsx`, `StatusGlyph.tsx`, `StatusGlyphAnimated.tsx`, `TabBarPill.tsx`, `TabIcon.tsx`, `TapScale.tsx`, `TaskRow.tsx`, `WaveCard.tsx`.

Tokens em `src/lib/tema.ts` (light por default; `temaDark` também declarado). Após P1, há tokens semânticos `acentoTexto / inkTexto / perigoTexto` — sempre usar quando o fundo for `tema.acento / tema.ink / tema.perigo`. Sem hex hardcoded.

---

## Coisas que JÁ funcionam

- Login Google (cancelamento tratado em silêncio, P2)
- Onboarding em 3 passos
- Editar cadastro via reuso da tela de onboarding (`?modo=editar`)
- 4 tabs + FAB central abrindo Ajustar (subsistema IA)
- Hoje, Áreas, Insights, Configurações
- Detalhe de área com Pausar/Reativar (P3 — dupla confirmação, mostra "PAUSADA ATÉ d MMM" no header quando aplicável)
- Onboarding com Reativar área pausada (P3)
- Editor de tarefa com picker nativo de horário e botão Limpar (P5)
- Detalhe do dia com edição retroativa (até 48h)
- Alvo de Vida (pizza)
- Reflexão diária com pergunta rotativa
- Reativação bloqueante após 2+ dias pulados
- Banner cobrança quando mediocridade ≥ 0.2
- Horário de trabalho (local-only) usado pela IA como zona proibida em dias úteis
- Sync app ↔ backend (pull + push + envio de trilha; last-write-wins)
- Notificações locais nos horários das tarefas
- % do mês / 7d adaptam quando < 28 / < 7 dias de uso
- Apagar conta (`DELETE /me` + CASCADE + limpa SecureStore)
- **Subsistema IA completo**: daily-note, weekly-plan, transcrição de voz (Whisper), trilha longitudinal, fatos aprendidos, busca vetorial por similaridade ("Eu lembrei disso"), filtro banlist server-side, rate-limit
- **Defesas vetoriais** (P4): `retrievePersonalEpisodes` com default-deny (UUID obrigatório, cast `::uuid`), camada global `shared_knowledge` declarada com helper separado
- Texto de botões escuros agora legível em todas as telas (P1)

## Coisas que NÃO funcionam ainda (pendências)

- Apple Sign-In (Developer Program pago, mas `src/auth/apple.ts` segue placeholder)
- Toggles de notificação não persistem
- CRUD de áreas (só tarefas; áreas vêm fixas do seed)
- Padrões em Insights ("você falha mais às terças") — texto placeholder
- Splash screen customizada (cor de fundo ajustada pra bege, mas asset ainda básico). Ícone T1 Wordmark já está nas 4 variantes (`icon`, `adaptive-icon`, `splash-icon`, `favicon`)
- Cadastro local não sincroniza com a nuvem (perde se trocar de device)
- Horário de trabalho não sincroniza (idem)
- Migração `0001_shared_knowledge.sql` ainda não rodada no Postgres da Railway
- Justificativa opcional ao marcar tarefa como "não feito"
- `shared_knowledge` não tem helper de ingestão — sem rota nem script
- `daily_note_submitted` na trilha: **não vi código que grave esse evento** (ver `_divergencias.md`); trilha.tsx consome.

---

## Como rodar localmente

### App

```bash
cd app
npm install
# Primeira vez (ou após mudar deps nativas / app.json):
npx expo prebuild --platform ios --clean
npx expo run:ios
```

Hot reload (sem deps nativas novas):

```bash
cd app
npx expo start --dev-client
# Simulator com app instalado: Cmd+R recarrega
```

Build Android (EAS):
```bash
eas build -p android --profile preview      # APK de preview
```

Build iOS production (EAS):
```bash
eas build -p ios --profile production
eas submit -p ios --latest                  # envia pra TestFlight
```

### Backend

```bash
cd backend
bun install
cp .env.example .env   # preencha
bun run db:push        # cria/atualiza tabelas (Drizzle)
bun run dev            # http://localhost:3000
```

Aplicar migração no Postgres do Railway:
```bash
cd backend
DATABASE_URL='postgresql://...' bun run db:push
# Se 42P16 com dado real, aplique ALTER TABLE direto via psql.
```

Aplicar a migração avulsa (`shared_knowledge`):
```bash
psql "$DATABASE_URL" -f backend/migrations/0001_shared_knowledge.sql
```

---

## Operações úteis

### Verificar sync no Postgres

Q rápida em `backend/migrations/_diag.sql` (não existe ainda — sugestão):
```sql
SELECT count(*) FROM users;
SELECT count(*) FROM tarefas;
SELECT count(*) FROM user_trail_events;
SELECT count(*) FROM user_memory_episodes;
```

### Resetar dados locais no Simulator

iOS Simulator → Device → Erase All Content and Settings. Ou apagar o app.

⚠️ JWT fica no SecureStore (Keychain) e **persiste entre reinstalações** do app no Simulator/aparelho. Se você reinstalou e o SQLite ficou vazio mas o JWT velho continua válido, o app pode tentar puxar dado de outro usuário. Fix de bootstrap aplicado para detectar e mandar pro onboarding.

### Testar deep link

```bash
xcrun simctl openurl booted umporcento://qualquer/coisa
```

---

## Custos mensais

| Item | Custo |
|---|---|
| Postgres no Railway | ~USD 5/mês |
| Backend service no Railway | ~USD 5/mês |
| Google OAuth | grátis |
| Apple Developer Program | USD 99/ano |
| Firebase / FCM V1 | grátis (free tier) |
| OpenAI (IA + Whisper + embeddings) | variável. Com `gpt-4o-mini` + Whisper, ~$0.001-0.01 por chamada de daily-note/weekly-plan; ~$0.006/min de voz. Rate-limit cobre abuso. |

Total operacional: **~USD 10/mês infra** + uso variável de IA + Apple anual.

---

## Perguntas em aberto

1. **Persistência dos toggles de notificação**: existe há tempos como pendência; nenhuma proposta de schema (ficar em `users`? `device_settings`? AsyncStorage?).
2. **Sync do cadastro local (`users` SQLite)**: o doc 07 antigo já listava como pendência. Como o subsistema de IA precisa de `horario_trabalho_*` pra inferir zona proibida, vale levar pelo menos esses dois campos pro Postgres com merge por device.
3. **Auto-criação de eventos `daily_note_submitted` na trilha**: a tela `ajustar/trilha.tsx` espera esse evento mas não vi quem o grava. Hipóteses: (a) há um caminho no app que faltei, (b) precisa ser adicionado ao backend dentro de `/ai/daily-note`. Necessário pra a tela funcionar como descrita.
4. **`tarefasMaisFalhadas`** nunca é preenchido pelo app, mas é passado no `contextoDados` (vazio). Vale calcular ou tirar do prompt.
5. **`shared_knowledge`** ainda não tem ingestão. Decidir entre rota admin protegida, script CLI ou seed manual.
6. **Tabelas obsoletas** dropadas a cada boot (`sugestoes_rotina`, `area_diagnosticos`, `interacoes_ia`): em algum momento o `DROP TABLE IF EXISTS` pode sair (todo device já está limpo). Vale combinar uma janela.
7. **Diferença entre `eventos` (legado, sync) e `user_trail_events` (v3, append-only)**: as duas coexistem. `area_pausada` ainda escreve em `eventos` enquanto eventos de IA vão pra `user_trail_events`. Pode ser intencional, mas vale documentar fronteira ou unificar.
