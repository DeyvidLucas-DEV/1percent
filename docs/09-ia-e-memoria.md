# IA e memória — estado real

Auditoria do código em `app/` e `backend/`. Documenta o que **existe e roda hoje**, não o que estava planejado. Os docs 04, 05 e 07 ainda dizem que IA está fora do escopo; este doc invalida essa afirmação. Veja `_divergencias.md` pra lista completa.

Última leitura: 2026-05-21.

---

## 1. Visão geral

O app tem um subsistema completo de IA e memória de longo prazo rodando em produção. Camadas:

1. **App** (Expo/React Native): aba **Ajustar Rota** acessada pelo FAB central da tab bar. 5 telas: hub, narração diária, plano semanal, trilha longitudinal, "o que o 1% aprendeu".
2. **Backend** (Bun/Hono no Railway): 5 endpoints `/ai/*` + `/memory/*` + `/trail/*`.
3. **OpenAI**: gera embeddings (`text-embedding-3-small`, 1536d), executa LLM (`gpt-4o-mini` por padrão) e faz transcrição de voz (`whisper-1`).
4. **Postgres + pgvector**: persiste fatos, episódios (com vetor), trilha longitudinal, rate-limits.

Provider único: **OpenAI**. Chave em `OPENAI_API_KEY` (env do backend). Nunca sai do servidor — app não faz chamada direta à OpenAI.

---

## 2. Fluxo da narração diária ("Como foi seu dia")

### 2.1 Onde o usuário entra
- **Tela hub**: `app/ajustar.tsx`. Acessada pelo FAB central da tab bar (`src/components/ui/TabBarPill.tsx:54`, `router.push('/ajustar')`).
- Cards do hub: "Contar como foi o dia" (destaque), "Plano da semana", "Sua trilha", "O que o 1% aprendeu", "Reflexão do dia".

### 2.2 Tela de narração
`app/ajustar/dia.tsx` (cabeçalho "Como foi seu dia").

O usuário escreve um relato (mín 20, máx 8000 chars) **ou** grava por voz:

- **Voz** → `expo-audio` (`HIGH_QUALITY`, m4a no iOS). `useAudioRecorder` + `useAudioRecorderState`. Botão alterna gravar/parar. Ao parar, faz `POST /ai/transcribe` (multipart) e concatena o texto ao campo de relato.
- **Texto** + `contextoDados` (montado localmente a partir de `carregarDashboard` + `listarTarefasAtivas` + `getUser`) → `POST /ai/daily-note`.

Contexto que sai do device pro backend (`app/ajustar/dia.tsx:194-215`):
```
percentualGeral7d, areasFortes[3], areasNegligenciadas[3],
intensidade ('leve'|'moderada'|'intensa'|'desorganizada'),
cargaSemanal (peso × frequência semanal),
horarioTrabalho {inicio, fim} ou null,
tarefasAtivas[ { id, areaSlug, nome, frequencia, alvoCount, peso, horario } ]
```

### 2.3 Backend processa (`backend/src/routes/ai.ts:56`)

Sequência exata:

1. **Auth**: `exigirAuth` valida JWT → `c.set('userId', uid)`. `userId` jamais vem do body.
2. **Rate-limit** (`backend/src/ai/rateLimit.ts`): reserva 1 chamada em dois buckets atômicos:
   - hora: 10 chamadas
   - dia: 30 chamadas
   - Estourou → `429 { error: 'rate_limited', bucket, max, resetEm }`.
3. **Retrieval de episódios passados** (`retrievePersonalEpisodes`): gera embedding do relato, busca top-5 episódios do mesmo `user_id` com similaridade ≥ 0.30. Detalhes em §3.
4. **Chamada LLM** (`gerarExtracaoMemoria` em `backend/src/ai/dailyNote.ts`):
   - Modelo: `gpt-4o-mini` (env `AI_MODEL`)
   - `temperature: 0.3`, `max_tokens: 1500`
   - System prompt: `PROMPT_DAILY_NOTE` (`backend/src/ai/prompt.ts:53`)
   - User message: bloco de episódios recuperados (se houver) + contexto formatado + "Relato do usuário sobre o dia: ..."
   - `response_format: json_schema` strict (5 campos: `eventosClassificados`, `fatosCandidatos`, `episodio`, `recomendacoesImediatas`)
5. **Persiste fatos** em `user_memory_facts`. UPSERT por `(user_id, categoria, chave)` UNIQUE. Se já existia, sobe a confiança via `subirConfianca()` (`baixa → media → alta`, nunca desce). Coleta `fatosCriados[]` e `fatosReconfirmados[]` pro payload da trilha.
6. **Persiste episódio** em `user_memory_episodes` (se a IA preencheu — pode vir `null`):
   - Gera embedding do texto concatenado `titulo + resumo + tags + areaSlugs + relato`
   - INSERT SQL bruto com `::vector` (Drizzle não tem DSL pra pgvector ainda)
   - Campos: `user_id`, `id` (uuid), `source_event_id` (uuid do daily-note), `occurred_at`, `titulo`, `resumo`, `tags[]`, `area_slugs[]`, `importance_score` (0-1), `embedding` (1536d), `active=true`
   - Falha silenciosa: se cair, devolve `episodioErroPersistencia` no response pro app exibir em "FALHA AO SALVAR EPISÓDIO (DEBUG)".
7. **Filtro banlist** (`backend/src/ai/banlist.ts`): descarta recomendações cujo texto contém palavra ou frase proibida (lista de 13 raízes + 10 frases compostas, normalizadas sem acento). Defesa em profundidade — o prompt já manda não usar essas palavras, mas o `gpt-4o-mini` reincide.
8. **Atribui UUID a cada recomendação válida** e grava 1 evento `suggestion_presented` por recomendação em `user_trail_events` (`payload.fonteEventId = dailyNoteEventId`).
9. **Resposta** ao app:
   ```ts
   {
     eventId,                       // uuid do daily-note
     extracao,                      // o que a IA extraiu (4 listas)
     recomendacoes,                 // só as que passaram da banlist, com id
     episodiosLembrados,            // top-5 do retrieval (para "Eu lembrei disso")
     episodioPersistidoId,          // uuid ou null
     episodioErroPersistencia,      // string ou null (debug)
     tokensInput, tokensOutput
   }
   ```

### 2.4 O que o app exibe (`app/ajustar/dia.tsx:484-651`)

Blocos na ordem:
- **LEITURA DIRETA**: `eventosClassificados` da IA (`stressor_reported` / `routine_pattern` / `area_neglected` / `preference_signal`), com pílula de confiança.
- **EU LEMBREI DISSO**: cards dos `episodiosLembrados`, cada um com data (`d 'de' MMM`), pílula "X% similar" (similaridade × 100, arredondada), título e resumo.
- **FATOS APRENDIDOS**: `fatosCandidatos` agrupados por categoria, com pílula de confiança.
- **EPISÓDIO**: titulo + resumo do episódio (se a IA gerou).
- **AJUSTES SUGERIDOS**: cards das `recomendacoes`. Cada card mostra tipo, descrição, e:
  - Se `pausarTarefa`: bloco "VAI PAUSAR" + nome + motivo
  - Se `criarTarefa`: bloco "VAI VIRAR TAREFA" + nome + área + frequência + horário
  - Botões "Recusar" e "Aceitar" (rótulo muda: "Aceitar e criar tarefa", "Aceitar (substituir tarefa)", "Aceitar e pausar", "Aceitar")

### 2.5 Aceitar/recusar uma recomendação (`aceitarRec` / `recusarRec`)

- **Aceitar**:
  1. Se `pausarTarefa`: `inativarTarefa(tarefaId)` local.
  2. Se `criarTarefa`: passa pela `validarSugestaoTarefaIA` (domínio local em `src/domain/sugestoes.ts`). Se válida, cria tarefa via `criarTarefa()`. Se inválida, registra `motivoRecusa` mas considera a sugestão aceita "em intenção".
  3. Reagenda notificações locais (`reagendarTudo()`).
  4. Insere evento local `suggestion_accepted` em `user_trail_events` com `payload = { recomendacaoId, tipo, descricao, fonteEventId, tarefaCriadaId, tarefaPausadaId, tarefaRecusadaPor }`.
- **Recusar**:
  1. Insere `suggestion_rejected` em `user_trail_events` com `payload = { recomendacaoId, tipo, descricao, fonteEventId }`.
- Ambos sobem ao backend pela próxima `sincronizar()` via `POST /trail/batch`.

### 2.6 Esquema completo do que a IA produz

`backend/src/ai/dailyNote.ts:75-80` (Zod):

| Campo | Tipo | Descrição |
|---|---|---|
| `eventosClassificados[]` | objeto | tipo, areaSlug nullable, descricao, confianca |
| `fatosCandidatos[]` | objeto | categoria, chave (snake_case, max 80), valor, confianca, deveConfirmarComUsuario |
| `episodio` | objeto ou null | titulo, resumo, tags[], areaSlugs[], importanceScore (0-1) |
| `recomendacoesImediatas[]` | até 3 | tipo (7 opções), descricao, exigeConfirmacao=true, criarTarefa nullable, pausarTarefa nullable |

Tipos de recomendação:
- `plano_minimo`, `mudar_horario`, `reduzir_carga`, `priorizar_area`, `acao_reparadora`, `conversa_dificil`, `pausar_tarefa`

Categorias de fato (no prompt): `rotina, familia, trabalho, financas, espiritual, saude_fisica, saude_emocional, amizades, crescimento, sabedoria`.

---

## 3. Recuperação de episódios similares ("Eu lembrei disso")

### 3.1 Stack
- **Produto**: pgvector (extensão do Postgres). Não há serviço externo de vetor (Pinecone, Weaviate, etc.).
- **Conexão**: `backend/src/db/client.ts` abre pool postgres-js via `DATABASE_URL`.
- **Modelo de embedding**: `text-embedding-3-small` da OpenAI, 1536 dimensões (`backend/src/ai/cliente.ts:7-8`).
- **Custo**: ~$0.02 por 1M tokens. Cada relato gera 1 embedding.
- **Truncamento**: texto de embedding limitado a 30k chars na função `gerarEmbedding`.

### 3.2 Schema da tabela vetorial

`backend/src/db/schema.ts:197-219` — `user_memory_episodes`:

| Coluna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid NOT NULL | FK → users(id) ON DELETE CASCADE |
| `id` | uuid NOT NULL | UUID gerado no app/backend |
| `source_event_id` | uuid NOT NULL | aponta pro `daily-note` que originou |
| `occurred_at` | timestamptz NOT NULL | quando aconteceu (do relato ou ISO informado) |
| `titulo` | text NOT NULL | gerado pela IA |
| `resumo` | text NOT NULL | gerado pela IA |
| `tags` | text[] | default `{}` |
| `area_slugs` | text[] | default `{}` |
| `importance_score` | real NOT NULL | 0..1, sugerido pela IA |
| `embedding` | **vector(1536)** | gerado por OpenAI |
| `active` | boolean | default true |
| `created_at` | timestamptz | default now |

- **PK composta**: `(user_id, id)` — auto-gera índice por user_id.
- **Índice extra**: `idx_episodes_user_time` em `(user_id, occurred_at DESC)`.
- **Sem índice ANN/HNSW**: KNN exato com WHERE user_id é suficiente até ~10k episódios por usuário (nota no schema).

### 3.3 Como a busca é feita

`backend/src/ai/retrieval.ts:69-92` — `retrievePersonalEpisodes(userId, textoQuery, opts)`:

```sql
SELECT
  id, occurred_at, titulo, resumo, tags, area_slugs,
  importance_score,
  1 - (embedding <=> $1::vector) AS similaridade
FROM user_memory_episodes
WHERE user_id = $2::uuid
  AND active = true
  AND id NOT IN (...excluirIds)        -- opcional
  AND 1 - (embedding <=> $1::vector) >= $3   -- minSim
ORDER BY embedding <=> $1::vector
LIMIT $4
```

- **`<=>`** = distância cosseno do pgvector (0 = idêntico, 2 = oposto).
- **similaridade = `1 - distância cosseno`**, range `[-1, 1]`. É o que vira "X% similar" no app (multiplica por 100, arredonda).
- **Limiar mínimo**:
  - daily-note: 0.30, k=5 (`backend/src/routes/ai.ts:79`)
  - weekly-plan: 0.28, k=6 (`backend/src/routes/ai.ts:472`)
- **Default-deny**: `exigirUserIdValido()` (`backend/src/ai/retrieval.ts:31`) **rejeita** chamada se `userId` não for string UUID válida. Cast explícito `::uuid` no SQL impede coerção silenciosa.

### 3.4 Escopo por usuário — como é hoje

**Toda busca pessoal filtra por `user_id`. O `user_id` vem do JWT no backend, nunca do client.**

Caminho:
1. `Authorization: Bearer <jwt>` → `exigirAuth` middleware (`backend/src/auth/middleware.ts:17`).
2. `verificarJwt(token)` decodifica e valida HS256 com `APP_JWT_SECRET`. Extrai `payload.uid`.
3. `c.set('userId', uid)` — fica disponível em todos os handlers.
4. Todo caller de `retrievePersonalEpisodes` passa `c.get('userId')`:
   - `routes/ai.ts:79` (daily-note)
   - `routes/ai.ts:472` (weekly-plan)
5. Nenhum endpoint pessoal aceita `user_id` no body — auditado em `ai.ts`, `memory.ts`, `trail.ts`, `sync.ts`.

**Schema-level**: toda tabela pessoal tem `userId` como parte da PK composta, com FK ON DELETE CASCADE → `users.id`. Não há tabela pessoal sem `user_id`.

Auditoria preventiva feita em 2026-05-21 (P4): confirmamos no Postgres da Railway que `users` e `user_memory_episodes` estão **vazias em produção**. Sem dado real circulando, vazamento cross-user é tecnicamente impossível pelo caminho de retrieval. Defesas aplicadas mesmo assim (default-deny, separação semântica entre helper pessoal e helper global).

### 3.5 Camada global de conhecimento (preparada, ainda não usada)

`backend/src/db/schema.ts:225-237` declara `shared_knowledge`:

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | default `gen_random_uuid()` |
| `fonte` | text | "Eclesiastes 11:6", "Atomic Habits cap 3" |
| `trecho` | text | conteúdo |
| `tags` | text[] | default `{}` |
| `embedding` | vector(1536) | |
| `created_at` | timestamptz | default now |

- **Sem `user_id`** — é o ÚNICO escopo onde busca vetorial sem filtro de pessoa é permitida.
- Helper correspondente: `retrieveSharedKnowledge` (`backend/src/ai/retrieval.ts:140`).
- Falha silenciosa via try/catch — se a tabela ainda não existe, retorna `[]` com warn.
- **Migração SQL pronta mas não aplicada**: `backend/migrations/0001_shared_knowledge.sql`. Rodar via `bun run db:push` ou aplicar o SQL manualmente.
- Tipo de retorno (`ConhecimentoCompartilhado`) é **diferente** do `EpisodioRecuperado` por design — impossível misturar os dois em uma mesma lista por engano.

---

## 4. "Fatos aprendidos" por área

### 4.1 Onde ficam

`backend/src/db/schema.ts:167-189` — tabela `user_memory_facts`:

| Coluna | Tipo | Notas |
|---|---|---|
| `user_id` | uuid NOT NULL | FK CASCADE |
| `id` | uuid NOT NULL | |
| `categoria` | text NOT NULL | uma das 10 (ver §2.6) |
| `chave` | text NOT NULL | snake_case curto, max 80 chars — não aparece pro usuário, é só dedupe |
| `valor` | text NOT NULL | frase legível |
| `confianca` | text NOT NULL | `baixa` / `media` / `alta`. Default `media`. |
| `origem_event_id` | uuid | aponta pro daily-note que originou |
| `first_seen_at` | timestamptz | default now |
| `last_confirmed_at` | timestamptz | atualizado a cada reconfirmação |
| `active` | boolean | default true. Soft delete via PATCH/DELETE. |
| `updated_at` | timestamptz | default now |

- PK composta: `(user_id, id)`.
- **UNIQUE `(user_id, categoria, chave)`** — força dedupe.
- Índice `(user_id, categoria, active)`.

### 4.2 Como são marcados por área

A "categoria" do fato é semântica (rotina, família, trabalho, etc.) e **não** corresponde 1:1 ao `slug` das 10 áreas do app. Há sobreposição grande mas não total: `rotina`, `crescimento`, `sabedoria` são categorias da IA que mapeiam pra áreas; `saude_fisica`, `saude_emocional`, `familia`, `trabalho`, `financas`, `espiritual`, `amizades` batem direto com slugs de área.

Não há tabela de mapeamento explícito categoria→área. O agrupamento na tela "O que o 1% aprendeu" (`app/ajustar/memoria.tsx:109-112`) usa `CATEGORIA_LABEL` (rótulo amigável) e organiza por categoria, não por área.

### 4.3 Endpoints `/memory/facts`

`backend/src/routes/memory.ts`:

- `GET /memory/facts?all=1` (auth obrigatória) — lista os fatos do `c.get('userId')`. Sem `all=1` filtra `active=true`. Ordena por `updatedAt DESC`.
- `PATCH /memory/facts/:id` — edita `valor`, `confianca` ou `active`. Validação Zod. Grava evento `memory_fact_edited` na trilha com `payload = { factId, mudancas }`.
- `DELETE /memory/facts/:id` — soft delete (`active = false`). Grava `memory_fact_deleted`.

Todas as queries do route filtram por `userId` do JWT.

### 4.4 UI

`app/ajustar/memoria.tsx`:
- Lista carregada via `api.get('/memory/facts')` (sem `?all=1`, só ativos).
- Agrupa por categoria, com pílula de confiança em cada fato.
- Toque no lápis edita inline → `PATCH /memory/facts/:id { valor }`.
- Toque na lixeira → `DELETE /memory/facts/:id`.
- Pull-to-refresh recarrega.

### 4.5 Como fatos influenciam a IA

- O endpoint `/ai/weekly-plan` carrega até **40 fatos ativos** do usuário e injeta no prompt (`backend/src/routes/ai.ts:401-411`).
- A IA do daily-note **não** lê fatos antigos — só gera novos. A reconfirmação de fato existente acontece quando a IA propõe o mesmo `(categoria, chave)` que já estava no banco; aí o backend sobe a confiança (`backend/src/routes/ai.ts:122-150` — função `subirConfianca`).

---

## 5. Plano semanal (`/ai/weekly-plan`)

`backend/src/routes/ai.ts:380` + `backend/src/ai/weeklyPlan.ts`.

### 5.1 Sequência

1. Auth + rate-limit (mesmos 10/h, 30/d).
2. Coleta no banco (todos filtrados por `userId`):
   - 40 fatos ativos
   - 15 últimas `suggestion_accepted` / `suggestion_rejected` da trilha
   - 5 últimos `daily_note_submitted` (resumo = primeiros 200 chars do relato)
3. Retrieval: query = `intencaoDeclarada + últimos relatos`. k=6, minSim=0.28.
4. LLM `gpt-4o-mini`, `temperature: 0.4`, `max_tokens: 2500`, `PROMPT_WEEKLY_PLAN` (definido em `weeklyPlan.ts:199`), JSON schema strict.
5. Output: `resumo7d, leituraDosDados (intensidade, áreas fortes/negligenciadas, tarefas mais falhadas, dias mais fracos), causaProvavel, intencaoSemana, ajustes[≤5], inegociaveisDaSemana[≤3], mensagemFinal`.
6. Filtro banlist em `descricao + justificativa + criarTarefa.nome + mudarTarefa.nome` de cada ajuste.
7. Grava 1 `weekly_plan_generated` + N `suggestion_presented` na trilha.
8. Resposta inclui `episodiosLembrados` pra mesma seção "Eu lembrei disso" na tela do plano.

### 5.2 Ajustes que o plano pode propor (`weeklyPlan.ts:43-57`)

7 tipos: `pausar_tarefa, criar_tarefa, mudar_horario, reduzir_frequencia, aumentar_frequencia, priorizar_area, plano_minimo`.

Cada ajuste pode preencher `pausarTarefa`, `criarTarefa`, ou `mudarTarefa` (esse último tem `novoHorario` e `novoAlvoCount`).

### 5.3 UI

`app/ajustar/plano.tsx`. Usuário pode declarar uma intenção opcional, clica "Gerar plano". Vê resumo, leitura, causa provável, episódios lembrados, intenção da semana (card em destaque), lista de ajustes (cada um com botão Recusar/Aceitar), inegociáveis (chips), mensagem final (card com borda perigo).

Aceitar um ajuste: aplica `pausar/mudar/criar` localmente (similar ao daily-note), reagenda notificações, grava `suggestion_accepted` na trilha com `payload.origem = 'weekly_plan'`.

---

## 6. Trilha longitudinal (append-only)

### 6.1 Tabela `user_trail_events`

**Backend** (`backend/src/db/schema.ts:139-163`):

| Coluna | Tipo |
|---|---|
| `user_id` | uuid NOT NULL FK CASCADE |
| `id` | uuid NOT NULL |
| `tipo` | text NOT NULL |
| `occurred_at` | timestamptz NOT NULL |
| `ingested_at` | timestamptz default now |
| `source` | text NOT NULL (app / ai / sync / system) |
| `area_id` | integer nullable |
| `tarefa_id` | integer nullable |
| `session_id` | text nullable |
| `device_id` | text nullable |
| `payload_json` | jsonb default `{}` |
| `privacy_level` | text default `'private'` |
| `schema_version` | integer default 1 |

PK `(user_id, id)`. Índices em `(user_id, occurred_at DESC)` e `(user_id, tipo, occurred_at DESC)`.

**App SQLite** (`app/src/db/schema.ts:102-115`): mesma forma, sem `user_id` (single-user local) e com `synced_at` em vez de `ingested_at`. **Não** está em `TABELAS_SYNC` — sync segue por rota dedicada (`/trail/batch`) e é idempotente por `id` (sem `updated_at`, eventos não são editáveis).

### 6.2 Tipos de evento já vistos no código

| Tipo | Origem | Quando |
|---|---|---|
| `daily_note_submitted` | backend? (não achei origem clara — pode ser o app gerando) | quando o user envia relato |
| `weekly_plan_generated` | backend | em `/ai/weekly-plan` |
| `suggestion_presented` | backend | uma por recomendação válida do daily-note ou ajuste do plano |
| `suggestion_accepted` | app | em `aceitarRec` / `aceitarAjuste` |
| `suggestion_rejected` | app | em `recusarRec` / `recusarAjuste` |
| `task_status_changed` | app | em mudanças de execução (visto consumo em `trilha.tsx`) |
| `memory_fact_edited` | backend | em `PATCH /memory/facts/:id` |
| `memory_fact_deleted` | backend | em `DELETE /memory/facts/:id` |
| `voice_note_transcribed` | backend | em `/ai/transcribe` |
| `area_pausada` | app | em pausar área (visto em `db/queries/areas.ts`) — esse vai pra tabela `eventos` legado, não `user_trail_events`, **ver divergência** |

### 6.3 Sync da trilha

App → backend: `POST /trail/batch` (idempotente por `(userId, id)` via `onConflictDoNothing`). `app/src/sync/sync.ts:338-360` (`enviarTrilha`). Batch de até 200 eventos por vez.

Backend → app: **não há pull de trilha**. O app só usa `GET /trail` pra exibir na tela "Sua trilha" (`app/ajustar/trilha.tsx`), paginada por cursor.

### 6.4 Tela "Sua trilha" (`app/ajustar/trilha.tsx`)

- `GET /trail?cursor=ISO&limit=80`
- Agrupa eventos brutos em blocos narrativos por dia:
  - **CardConversa** (de `daily_note_submitted`): mostra relato truncado, episódio (se houver), pílulas com contagem de sugestões apresentadas/aceitas/recusadas, fatos criados/reconfirmados.
  - **CardTarefas** (agregando `task_status_changed`): "X concluídas · Y parcial · Z não feitas"
  - **CardPlano** (`weekly_plan_generated`): destaque com intenção da semana, intensidade, número de ajustes.
  - **CardMemoria** (agregando `memory_fact_edited` + `_deleted`): "X editados · Y apagados"
- Scroll infinito (carrega próxima página em distância < 200px do fundo).

---

## 7. Configuração "Horário de trabalho"

### 7.1 Persistência

**Local apenas, SQLite users** (`app/src/db/schema.ts:29-30` + migração `156-161`):

```sql
ALTER TABLE users ADD COLUMN horario_trabalho_inicio TEXT  -- HH:MM
ALTER TABLE users ADD COLUMN horario_trabalho_fim    TEXT  -- HH:MM
```

**Não sincroniza com Postgres** — a tabela `users` no backend não tem essas colunas. Trocar de device = perder o horário declarado.

### 7.2 UI

`app/configuracoes/horario-trabalho.tsx`: tela dedicada, dois `TextInput` (início e fim no formato HH:MM), botão Salvar + botão "Limpar (deixar IA inferir)". Validação por regex `^([01]\d|2[0-3]):[0-5]\d$`.

Acesso: Configurações → "Horário de trabalho" (`app/(tabs)/config.tsx:134-143`). Mostra "09:00–18:00" ou "não definido".

### 7.3 Como a IA usa

App envia em `contextoDados.horarioTrabalho = { inicio, fim }` (ou `null`) tanto no daily-note quanto no weekly-plan.

O prompt instrui (`backend/src/ai/prompt.ts:92`):
> "Se `horarioTrabalho` está declarado: NÃO proponha horário dentro dessa janela em dias úteis. Se o relato envolve algo no trabalho, foque em organização interna (não adiciona tarefa concorrente)."

Mesma regra repete no `PROMPT_WEEKLY_PLAN` (`backend/src/ai/weeklyPlan.ts:228`).

---

## 8. Modelos de IA por passo

| Passo | Modelo | Configuração | Onde |
|---|---|---|---|
| Embedding (relato + episódio + query de retrieval) | `text-embedding-3-small` (1536d) | env `AI_EMBEDDING_MODEL` | `cliente.ts:7-8`, `gerarEmbedding` |
| Daily-note extração | `gpt-4o-mini` (env `AI_MODEL`) | temp 0.3, max 1500, JSON schema strict | `dailyNote.ts:288-299` |
| Weekly-plan | `gpt-4o-mini` | temp 0.4, max 2500, JSON schema strict | `weeklyPlan.ts:388-400` |
| Transcrição de voz | `whisper-1` | `language: 'pt'`, `response_format: 'verbose_json'` | `ai.ts:633-638` |

**Provider único**: OpenAI. Constante `PROVIDER = 'openai'` em `cliente.ts:9`.

**Custos** declarados em `cliente.ts:30-47` (USD por 1M tokens, sem markup):
- `gpt-4o-mini`: 0.15 in / 0.60 out
- `gpt-4o` (sem mini): 2.5 in / 10.0 out
- `gpt-4.1-mini`: 0.4 in / 1.6 out
- Whisper: ~$0.006/min (~0.6 centavo/min). Salvo no payload de `voice_note_transcribed`.
- Embedding: ~$0.02/1M tokens (desprezível na escala atual).

### Como a chave é gerenciada

- Variável de ambiente `OPENAI_API_KEY` no Railway (env do serviço backend).
- Carregada em `cliente.ts:3`. Se ausente, há `console.warn` no boot e chamadas IA falham com `401 invalid_api_key` da OpenAI.
- **Nunca chega ao client**. App fala só com o backend.

### Onde os prompts moram

| Constante | Arquivo |
|---|---|
| `PROMPT_BASE` | `backend/src/ai/prompt.ts:4` |
| `PROMPT_DAILY_NOTE` | `backend/src/ai/prompt.ts:53` |
| `PROMPT_WEEKLY_PLAN` | `backend/src/ai/weeklyPlan.ts:199` |
| `BANLIST_RAIZES` + `BANLIST_FRASES` | `backend/src/ai/banlist.ts:9-38` |

---

## 9. Integração de IA — visão geral

**Serviços externos chamados pelo backend:**

| Serviço | Endpoint | Finalidade |
|---|---|---|
| OpenAI Chat Completions | `https://api.openai.com/v1/chat/completions` | `gpt-4o-mini` no daily-note e weekly-plan |
| OpenAI Embeddings | `https://api.openai.com/v1/embeddings` | `text-embedding-3-small` em todo relato e episódio |
| OpenAI Audio | `https://api.openai.com/v1/audio/transcriptions` | `whisper-1` para voz |

**Serviços externos chamados pelo app:** somente o **próprio backend** (`https://1percent-production.up.railway.app`). App não fala com OpenAI direto.

**Outros externos não-IA** (pra contexto):
- Google OAuth (`accounts.google.com`) — só no fluxo de login Apple/Google (`expo-auth-session`).
- JWKS da Google (`https://www.googleapis.com/oauth2/v3/certs`) — backend valida `idToken` no `/auth/login`.

---

## 10. Rate-limit das chamadas de IA

`backend/src/ai/rateLimit.ts`:
- Bucket **hora**: 10 chamadas, janela rolante de 1h.
- Bucket **dia**: 30 chamadas, janela rolante de 24h.
- Aplicado em `/ai/daily-note`, `/ai/weekly-plan`, `/ai/transcribe`.
- Estouro: response `429 { error: 'rate_limited', bucket, max, resetEm }`. App mostra Alert com horário do reset.
- Tabela `rate_limits` (PK `(user_id, bucket, janela_inicio)`), contagem incrementada via `INSERT ... ON CONFLICT DO UPDATE SET contagem = contagem + 1`.

---

## 11. Validação local de sugestões da IA

Antes de criar tarefa de uma sugestão aceita, o app passa pela `validarSugestaoTarefaIA` (`app/src/domain/sugestoes.ts`, não detalhada aqui). Casos vistos:
- valida que `areaSlug` existe entre as 10 áreas do device
- normaliza payload pro shape de `criarTarefa()` local
- pode rejeitar com `motivoRecusa` — nesse caso a sugestão é considerada "aceita em intenção" mas a tarefa não é criada, e um alert avisa o usuário.

---

## Perguntas em aberto

1. **Origem do evento `daily_note_submitted` na trilha**: o backend grava `suggestion_presented` mas **não vi código gravando `daily_note_submitted` no backend** em `routes/ai.ts`. A tela `trilha.tsx` consome esse evento (`payload.relato`, `payload.episodio`, `payload.fatosCriados`, etc.) — então alguém precisa criar. Hipóteses: ou (a) o app grava localmente após `POST /ai/daily-note` e sincroniza (não vi essa chamada em `dia.tsx`), ou (b) há código no backend que perdi. Vale grep em `daily_note_submitted` no commit history pra confirmar.

2. **`/transcribe` consome rate-limit junto com daily-note e weekly-plan**. Isso significa que se o usuário gravou várias tentativas curtas de voz, ele queima o limite e não consegue mandar o daily-note pra IA. É intencional? Não há flag separada.

3. **Backend retorna `episodiosLembrados` no `/daily-note`** ANTES do episódio do dia atual ser persistido. Está correto — não queremos auto-similaridade com o próprio relato. Vale confirmar se o `excluirIds` é usado em algum lugar; vi o parâmetro existir mas não vi sendo passado por nenhum caller.

4. **`shared_knowledge` não tem helper de ingestão** — só leitura. Quem alimenta a tabela quando ela for usada? Manual via SQL? Endpoint admin? Não há rota nem script.

5. **`area_pausada` vai pra `eventos` (legado, sincronizada)** enquanto os eventos de IA vão pra `user_trail_events`. Duas tabelas de evento coexistem. Há `TABELAS_OBSOLETAS` no migrador que dropa `sugestoes_rotina`, `area_diagnosticos`, `interacoes_ia` — mas `eventos` não é obsoleta. Pode ser intencional (eventos legado pra cobrança de mediocridade vs trilha v3 pra IA), mas vale documentar a fronteira ou unificar.

6. **`importanceScore` do episódio é persistido mas não é usado em nenhum WHERE/ORDER do retrieval**. Só similaridade e `active=true` entram. Score pra quê?

7. **`exigeConfirmacao: z.literal(true)`** em `recomendacaoImediataSchema` — sempre `true`, nunca `false`. Aparentemente um placeholder pra futura UX de auto-aceite. Vale confirmar.

8. **`AI_MODEL` e `AI_EMBEDDING_MODEL` configuráveis por env** mas o `custoCentavos` só conhece três modelos (`gpt-4o-mini`, `gpt-4o`, `gpt-4.1-mini`). Trocar pra outro modelo gera custo subreportado.

9. **`tarefasMaisFalhadas` no contexto**: o app **nunca preenche esse campo** (`ajustar/dia.tsx:194-215`). O Zod aceita `optional`, então passa, mas a IA recebe sempre vazio. Vale ou implementar no app ou tirar do prompt pra não enganar.
