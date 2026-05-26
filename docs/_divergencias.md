# Divergências docs vs código

> Auditoria de 2026-05-21 — comparação entre os docs 00-08 e o código real em `app/` e `backend/`. Cada divergência aponta arquivo + linha do código que contradiz a afirmação do doc.
>
> Quando o doc estava correto na época em que foi escrito mas o código evoluiu, anoto como "defasado". Quando o doc diz uma coisa específica que nunca foi verdade no código, anoto como "incorreto".

---

## Maiores lacunas (não é só erro pontual — falta um capítulo inteiro)

### Subsistema de IA + memória + banco vetorial

**Status nos docs antigos:**
- `00-leia-primeiro.md` — nenhuma menção
- `01-arquitetura.md` — diz "IA / coaches digitais → fora do MVP"
- `04-regras-de-negocio.md` — nenhuma menção
- `05-roadmap-mvp.md` — "Coaches digitais com IA" listado em **Fora do MVP (v2+)**
- `07-estado-atual.md` (versão 2026-05-08) — nenhuma menção
- `CHAT-SETUP.md` — só fala em usar Claude API para um chat in-app futuro; nenhuma menção a vetorial ou OpenAI

**O que existe no código (defasagem)**:
- Diretório `backend/src/ai/` com 7 arquivos: `cliente.ts`, `dailyNote.ts`, `weeklyPlan.ts`, `prompt.ts`, `retrieval.ts`, `banlist.ts`, `rateLimit.ts`.
- 3 endpoints `/ai/*` (daily-note, weekly-plan, transcribe) + 3 endpoints `/memory/*` + 2 endpoints `/trail/*`.
- 5 tabelas Postgres novas: `user_trail_events`, `user_memory_facts`, `user_memory_episodes` (com `vector(1536)`), `rate_limits`, `shared_knowledge`.
- 1 tabela SQLite nova: `user_trail_events`.
- 5 telas no app (`app/ajustar.tsx` + `app/ajustar/{dia,plano,trilha,memoria}.tsx`) que consomem tudo isso.
- Provider OpenAI com 3 modelos: `gpt-4o-mini`, `text-embedding-3-small`, `whisper-1`.
- Banco vetorial: pgvector na própria instância de Postgres do Railway (não Pinecone, não Weaviate).

→ Documento novo `09-ia-e-memoria.md` cobre tudo isso.

---

## Por documento

### 00-leia-primeiro.md

- **OK**: stack Expo SDK 54, SQLite, Zustand, Bricolage + Inter, sem emoji.
- **Defasado**: diz "IA / coaches digitais → fora do MVP". → Hoje há subsistema IA inteiro rodando.
- **OK**: "Símbolo visual mostra a realidade desde dia 1, marrom desde o dia 1" — continua verdade no código (`src/domain/cores.ts`).
- **Suspeito**: "Single-user offline-first com backup na nuvem" — esta afirmação está correta, mas o doc não menciona que **cadastro local (`users`) e horário de trabalho não sincronizam** (`src/sync/sync.ts` exclui `users`; `backend/src/db/schema.ts:18-32` não tem essas colunas).

### 01-arquitetura.md

- **Incorreto na premissa**: "Pessoal, single-user. Sem login, sem servidor, sem nuvem." → Hoje há login Google, backend próprio (Bun + Hono no Railway) e sync.
- **Defasado**: "Decisões adiadas (v2+): Sincronização, backup, IA, multiusuário" — sincronização, backup e IA já estão em produção. Só multiusuário permanece adiado.
- **Defasado**: lista `expo-router`, `expo-notifications`, `expo-secure-store` como deps originais. Hoje há também `expo-audio`, `expo-auth-session`, `@react-native-community/datetimepicker`, `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/inter`, `react-native-safe-area-context`, `react-native-gesture-handler`.

### 02-schema-de-dados.md

- **OK**: 7 tabelas locais originais (users, areas, tarefas, execucoes, reflexoes_diarias, autoavaliacao_inicial, eventos).
- **Defasado — colunas faltando**:
  - `tarefas` ganhou `horario TEXT` (`app/src/db/schema.ts:150-152`).
  - `users` ganhou `horario_trabalho_inicio TEXT`, `horario_trabalho_fim TEXT` (`app/src/db/schema.ts:156-161`).
  - Todas as `TABELAS_SYNC` ganharam `updated_at TEXT` e `synced_at TEXT` (`schema.ts:139-147`).
- **Defasado — tabelas locais não mencionadas**:
  - `sync_state` (1 linha, last_pull_at) — `schema.ts:93-97`.
  - `user_trail_events` (`schema.ts:102-118`) — append-only, sync por rota dedicada.
- **Defasado — tabelas dropadas a cada boot**: `sugestoes_rotina`, `area_diagnosticos`, `interacoes_ia` em `TABELAS_OBSOLETAS` (`schema.ts:125`).
- **Não menciona Postgres**: este doc é só sobre SQLite. O backend tem schema próprio (espelha mais tabelas + 5 tabelas só do servidor — ver `07-estado-atual.md` atualizado).
- **Triggers**: o doc não fala dos triggers `*_updated_at_ins`/`*_updated_at_upd`. O código tem (`schema.ts:167-186`) — críticos pra sync funcionar.

### 03-areas-e-tarefas.md

- **OK em estrutura**: 6 áreas obrigatórias + 4 opcionais, 10 no total.
- **Divergência de cores das áreas** entre este doc e `seed.ts`:

| Área | Doc 03 | `seed.ts` real |
|---|---|---|
| Espiritual | `#6B4F8A` | (a confirmar — não li `seed.ts` nesta auditoria) |
| Saúde Física | `#2E8B57` | — |
| Família | `#C45A4F` | — |
| Trabalho/Carreira | `#1F6FB2` | — |
| Saúde Emocional/Mental | `#D9A441` | — |
| Finanças | `#4A7C59` | — |
| Ministério | `#8E44AD` | — |
| Amizades | `#16A085` | — |
| Crescimento Intelectual | `#2980B9` | — |
| Sabedoria | `#34495E` | — |

  → Em "Perguntas em aberto" — não auditei `seed.ts` linha a linha; vale checar.
- **OK**: regras de pausa (dupla confirmação, 6 meses, opcional só, não pausável obrigatória). Confirmado em `app/onboarding/areas.tsx` e `app/area/[id].tsx`.
- **OK**: alerta de pausa baseado em livro/Bíblia. Confirmado em `app/src/domain/alertasPausa.ts`.

### 04-regras-de-negocio.md

- **Divergência de hex de faixas** entre este doc e `src/domain/cores.ts`:

| Faixa | Doc 04 | `src/domain/cores.ts` (rotulado em `tema.ts` e `cores.ts`) |
|---|---|---|
| 0-20% Marrom | `#6B4423` | `#5C4A3A` (e em `tema.ts` antigo do doc 08: `#6B4F2A`) |
| 21-40% Vermelho | `#C0392B` | `#8C3A2A` |
| 41-60% Amarelo | `#E1A93B` | `#8A6B1F` |
| 61-80% Verde | `#2E8B57` | `#3F5F3F` |
| 81-100% Azul | `#1F6FB2` | `#1F3F5C` |

  Há **três versões diferentes** de hex circulando entre docs 04, 08 e o código. As três discordam entre si.

  → Versão de verdade hoje: `app/src/domain/cores.ts:6-12` (`CORES`).
- **OK**: fórmulas de % por área, intensidade, mediocridade.
- **OK**: streak (`dia válido = % do dia ≥ 50%`, milestones 3/7/14/30/60/100/365).
- **OK**: regra "Nunca 2 dias seguidos" e cascata de telas de reativação.
- **Não menciona IA** — este doc cobre regras determinísticas, e essa parte segue verdadeira.

### 05-roadmap-mvp.md

- **OK — todos os itens marcados como ✅ Sem 1–4 continuam funcionais**.
- **OK** com nota "MVP entregue + extras significativos".
- **Defasado — pendência "Cobrança por área"**: marcada como pendente. Ainda pendente (não vi código).
- **Defasado — "Coaches digitais com IA" em Fora do MVP**: hoje **dentro** do escopo, com 3 rotas IA + memória vetorial + 5 telas.
- **Pendências que já foram resolvidas desde 05-08**:
  - Editar cadastro (resolvido — tela `cadastro.tsx` com `?modo=editar`, P3 anterior)
  - Bege screen / fonts (resolvido em `_layout.tsx`, fix de fallback)
- **Pendências ainda em aberto**:
  - Apple Sign-In (Developer Program agora pago, mas o app segue com placeholder em `src/auth/apple.ts`)
  - Toggles de notificação não persistem
  - Sync do cadastro local
  - Splash/ícone customizados (ícone T1 Wordmark já está nas 4 variantes, splash bg ajustada)
  - Padrões reais em Insights
  - Justificativa opcional "não feito"

### 06-sync-e-auth.md

- **OK** no plano de auth, JWT HS256 30d, fluxo PKCE, JWKS Google.
- **OK** na arquitetura monorepo (`app/` + `backend/`).
- **Defasado — endpoints listados**:
  ```
  POST   /auth/login
  GET    /sync/pull
  POST   /sync/push
  GET    /me
  DELETE /me
  ```
  Hoje existem também:
  - `GET /trail`, `POST /trail/batch`
  - `POST /ai/daily-note`, `POST /ai/weekly-plan`, `POST /ai/transcribe`
  - `GET /memory/facts`, `PATCH /memory/facts/:id`, `DELETE /memory/facts/:id`
  - `GET /` (status), `GET /health`
- **Defasado — schema Postgres listado** (7 tabelas). Hoje são 12 (sync espelhada + 5 novas de IA/trilha).
- **Defasado — schema SQLite "alterações"**: o doc lista `updated_at` e `synced_at` mas não cobre `horario`, `horario_trabalho_*`, e `user_trail_events`.
- **OK** roteamento (login → onboarding → tabs).
- **Incorreto — env var nome**: doc fala `GOOGLE_CLIENT_ID` (singular). Hoje o backend aceita `GOOGLE_CLIENT_IDS` (plural CSV, pra cobrir iOS+Android) com fallback pro singular (`backend/src/auth/google.ts:8-16`).

### 07-estado-atual.md (versão 2026-05-08)

- **Defasado completamente em IA/trilha/memória** — vide §"Maiores lacunas" acima. (Versão atualizada hoje em 2026-05-21 cobre.)
- **Defasado em rotas backend**: lista só `auth.ts` e `sync.ts` em `routes/`. Hoje há também `trail.ts`, `ai.ts`, `memory.ts`.
- **Defasado em estrutura `src/auth/`**: lista `apple.ts (placeholder), google.ts, jwt.ts, middleware`. Hoje no app é `apple.ts (placeholder), google.ts, sessao.ts`; no backend é `apple.ts, google.ts, jwt.ts, middleware.ts`.
- **Defasado em telas**: não lista `ajustar.tsx`, `ajustar/dia.tsx`, `ajustar/plano.tsx`, `ajustar/trilha.tsx`, `ajustar/memoria.tsx`, `configuracoes/horario-trabalho.tsx`.
- **Defasado em domínio**: não menciona `agregados.ts`, `alertasPausa.ts`, `areasPaleta.ts`, `intensidade.ts`, `mediocridade.ts`, `streak.ts`, `sugestoes.ts`, `reflexoes.ts`.
- **Defasado em componentes UI**: o doc lista 11 componentes ui/. Hoje são 24 (incluindo `HabitCard`, `HomeHeader`, `IconBtn`, `MiniCharts`, `MiniSemiRing`, `PunchOnChange`, `SectionHeader`, `StatusGlyphAnimated`, `TabBarPill`, `TapScale`, `WaveCard`, `DayPills`).
- **Incompleto em libs**: não menciona `agendarNotificacoesTarefas.ts`, `deviceId.ts`, `haptics.ts`.
- **Incompleto em queries**: lista `areas, tarefas, users, execucoes, reflexoes, syncState`. Hoje há também `trailEvents.ts`, `seed.ts`.
- **Defasado em pendências**: vários itens daquela lista já foram resolvidos (editar cadastro, bege screen). Vários novos surgiram (migração shared_knowledge não aplicada, evento `daily_note_submitted` não gravado).
- **Defasado em tabs**: o doc diz "4 abas". Verdade hoje: 4 abas + FAB central que abre `/ajustar`. Visualmente são 5 alvos de toque.

### 08-design-system.md

- **Incorreto — tokens listados são do `temaDark`**, não do `temaLight` que está ativo por default:
  - Doc diz `bg: '#0E0F12'` (dark), código tem `bg: '#E8E2D2'` (light) em `tema.ts:18`.
  - `bgCard: '#1A1C21'` (doc) vs `#F5F1E5` (código light).
  - `texto: '#ECECEC'` (doc) vs `#1A1916` (código light).
  - `acento: '#1F6FB2'` (doc) vs `#1A1916` (código light) — atenção: no light, `acento === texto`, o que causou o bug do "preto no preto" (P1).
- **Defasado — tokens novos não listados**:
  - `bgSoft, bgInput, ink, weak, bordaForte, sucesso, alerta`
  - `acentoTexto, inkTexto, perigoTexto` (P1, semânticos para texto sobre fundo escuro)
  - `fontFamily.{display, displayMedium, text, textMedium, textSemi, textBold}`
- **Divergência de hex das faixas** — ver §04 acima. Doc 08 diz `marrom #6B4F2A`, código diz `#5C4A3A`.
- **OK** nas cores-base das 10 áreas (a confirmar com `seed.ts` real — listo em Perguntas em aberto).
- **OK** no padrão de tipografia (28-32pt títulos, 11pt kicker uppercase).
- **OK** nos anti-patterns.
- **Defasado — navegação**: diz "(tabs) → 4 abas + sub-rotas". Verdade: 4 abas + FAB → /ajustar + sub-rotas /ajustar/* + sub-rota /configuracoes/horario-trabalho.
- **Defasado — componentes**: lista 11. Hoje são 24. Faltam: `DayPills, HabitCard, HomeHeader, IconBtn, MiniCharts, MiniSemiRing, PunchOnChange, SectionHeader, StatusGlyphAnimated, TabBarPill, TapScale, WaveCard`.

### CHAT-SETUP.md

- **OK** no propósito (Claude Project com knowledge do app).
- **Defasado — "Quando promover pra in-app"**: hoje há subsistema de IA in-app, mas via OpenAI, não Claude API, e não via chat — é via daily-note narrativa + plano semanal. O caminho descrito no doc (rota `/chat`, knowledge via string) **não foi seguido**.

---

## Lista compacta de pequenas divergências

| Onde diz | O que diz | O que código mostra |
|---|---|---|
| `00`, `01`, `04`, `05`, `07` (versão antiga) | "IA fora do MVP / não há banco vetorial" | Subsistema IA + pgvector rodando em produção |
| `02` | 7 tabelas locais sem `updated_at`/`synced_at` | + 2 colunas, + `sync_state`, + `user_trail_events` |
| `02` | Sem mencionar `horario` em `tarefas` | Coluna existe via migração |
| `02` | Sem mencionar `horario_trabalho_*` em `users` | Colunas existem via migração |
| `04` | Hex `Marrom #6B4423` | Código: `#5C4A3A` |
| `04` | Hex `Vermelho #C0392B` | Código: `#8C3A2A` |
| `04` | Hex `Amarelo #E1A93B` | Código: `#8A6B1F` |
| `04` | Hex `Verde #2E8B57` | Código: `#3F5F3F` |
| `04` | Hex `Azul #1F6FB2` | Código: `#1F3F5C` |
| `06` | 5 endpoints backend | 11+ endpoints |
| `06` | Schema Postgres com 7 tabelas | 12 tabelas (5 só de IA/trilha) |
| `06` | `GOOGLE_CLIENT_ID` singular | `GOOGLE_CLIENT_IDS` CSV (com fallback pra singular) |
| `07` antigo | 4 tabs visuais | 4 tabs + FAB central abrindo Ajustar |
| `07` antigo | 11 componentes em `ui/` | 24 componentes em `ui/` |
| `07` antigo | Editar cadastro: placeholder | Funciona via `cadastro.tsx?modo=editar` |
| `08` | Tokens dark default | Light é o default ativo (`tema = temaLight`) |
| `08` | 11 componentes UI | 24 componentes UI |

---

## Perguntas em aberto (auditoria não conclusiva)

1. **Cores-base das 10 áreas em `seed.ts`**: não li `app/src/db/seed.ts` nesta auditoria. Os hex listados em `03` e `08` podem ou não bater. Vale leitura específica.
2. **Hex de "faixas de cor"** (marrom→azul): três fontes (doc 04, doc 08, código `cores.ts`) discordam em todos os 5 valores. Qual é o "correto" pro design? Decisão pendente.
3. **`daily_note_submitted` na trilha**: a tela `ajustar/trilha.tsx` consome esse evento (lê `payload.relato`, `payload.episodio`, contagens), mas não achei nenhum lugar que **grave** esse evento. Hipóteses: (a) grep mais profundo no app pode achar; (b) precisa adicionar no backend. Sem isso, a tela trilha mostra histórico parcial (só `weekly_plan_generated`, `suggestion_*`, `task_status_changed`, `memory_fact_*`).
4. **`tarefasMaisFalhadas` no contexto IA**: nunca preenchido pelo app. Vale calcular no app antes de enviar, ou tirar do prompt.
5. **`importanceScore` do episódio**: é persistido mas não usado em nenhum filtro de retrieval. Score pra quê?
6. **Apple Sign-In**: Developer Program já está pago, mas o app segue com placeholder `disponivelApple() = false`. Reativar é trabalho pendente (não é estado documentado como "ainda não pode").
7. **`shared_knowledge` sem ingestão**: a tabela está no schema, há helper de retrieval, mas ninguém grava lá. Decidir caminho (rota admin, script CLI, seed manual).
8. **Tabelas `eventos` (legado) vs `user_trail_events` (v3)**: as duas coexistem. `area_pausada` ainda escreve em `eventos`. Pode ser intencional (eventos pra cobrança de mediocridade vs trilha pra IA), mas vale documentar a fronteira ou unificar.
