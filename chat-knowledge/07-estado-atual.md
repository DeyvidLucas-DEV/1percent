# Estado atual do app

> Snapshot do que existe hoje, depois de várias rodadas de implementação.
> Atualizado em 2026-05-08.

Esse doc serve de "onde estamos" pra qualquer um (você, eu daqui a 6 meses, alguém novo) entender o estado real sem ter que ler os commits.

---

## Visão geral

O 1% deixou de ser "single-user, 100% offline, sem login" e virou:

- **Single-user, offline-first**, com backup/sync na nuvem.
- **Login com Google** (Apple Sign-In desativado até a Apple Developer Account ativar).
- **4 abas** no padrão Apple Fitness: Hoje | Áreas | Insights | Configurações.
- **Backend próprio** (Bun + Hono + Drizzle + Postgres) hospedado no Railway.

---

## Repositórios e infra

| Item | Valor |
|---|---|
| Repo GitHub | https://github.com/DeyvidLucas-DEV/1percent |
| Backend (URL pública) | https://1percent-production.up.railway.app |
| Postgres | Railway (interno + público via `turntable.proxy.rlwy.net`) |
| Bundle ID iOS | `com.umporcento.app` |
| Google OAuth Client ID (iOS) | `863364734205-pauis7u6qhm56rqtq76uv6d24vc94lac.apps.googleusercontent.com` |
| URL scheme deep-link | `umporcento` + reversed Google client ID |
| Apple Developer Account | Em processo de ativação (não paga ainda do nosso lado quando esse doc foi escrito) |

### Variáveis de ambiente do backend (Railway)

```
DATABASE_URL      = ${{Postgres.DATABASE_URL}}   # reference syntax
APP_JWT_SECRET    = <segredo de 48 bytes — não cola em chat/Git>
GOOGLE_CLIENT_ID  = 863364734205-pauis7u6qhm56rqtq76uv6d24vc94lac.apps.googleusercontent.com
APPLE_CLIENT_ID   = com.umporcento.app
PORT              = 3000
```

---

## Estrutura do monorepo

```
1%/
├── app/                       # Expo (React Native + TypeScript)
│   ├── app/                   # rotas (expo-router)
│   │   ├── _layout.tsx        # raiz: bootstrap, redirects
│   │   ├── login.tsx          # tela de login (só Google por enquanto)
│   │   ├── (tabs)/            # tab bar inferior
│   │   │   ├── _layout.tsx    # configura as 4 abas
│   │   │   ├── index.tsx      # Hoje
│   │   │   ├── areas.tsx      # Áreas
│   │   │   ├── insights.tsx   # Insights
│   │   │   └── config.tsx     # Configurações
│   │   ├── area/[id].tsx      # detalhe da área
│   │   ├── tarefa/[id].tsx    # editor de tarefa (id="novo" cria, número edita)
│   │   ├── dia/[iso].tsx      # detalhe de um dia específico
│   │   ├── alvo.tsx           # Alvo de Vida (pizza de 10 fatias)
│   │   ├── checklist.tsx      # checklist diário (versão antiga, ainda funciona)
│   │   ├── reflexao.tsx       # reflexão do dia
│   │   ├── reativacao.tsx     # tela bloqueante após 2+ dias pulados
│   │   └── onboarding/        # cadastro, áreas, autoavaliação
│   └── src/
│       ├── auth/              # apple.ts (placeholder), google.ts, sessao.ts
│       ├── components/
│       │   ├── ui/            # design system: BigRing, MiniRing, StatCard,
│       │   │                  #   StatusGlyph, TaskRow, AreaCard, CobrancaBanner,
│       │   │                  #   PageHeader, TabIcon, ConfigGroup, ConfigRow
│       │   ├── AlvoDeVida.tsx # pizza chart
│       │   ├── Botao.tsx      # botão custom
│       │   ├── Campo.tsx
│       │   └── Seletor.tsx
│       ├── db/
│       │   ├── schema.ts      # DDL + migrations idempotentes + triggers
│       │   ├── seed.ts        # 10 áreas + ~38 tarefas padrão
│       │   ├── bootstrap.ts   # init schema + seed + permissões + sync background
│       │   ├── types.ts
│       │   └── queries/       # areas, tarefas, users, execucoes, reflexoes, syncState
│       ├── domain/            # regras puras (cores, percentual, intensidade,
│       │                      #   mediocridade, streak, agregados)
│       ├── lib/
│       │   ├── api.ts         # cliente HTTP com Bearer JWT
│       │   ├── config.ts      # BACKEND_URL + Google Client ID
│       │   ├── notificacoes.ts
│       │   ├── agendarNotificacoesTarefas.ts
│       │   ├── datas.ts
│       │   └── tema.ts        # tokens de cor/spacing/fonte
│       ├── store/appStore.ts  # Zustand: inicializado, logado, userUuid, onboarded
│       └── sync/sync.ts       # pull + push + merge (last-write-wins por updated_at)
│
├── backend/                   # Bun + Hono + Drizzle
│   ├── src/
│   │   ├── auth/              # apple.ts, google.ts (validação JWKS), jwt.ts, middleware
│   │   ├── db/                # client.ts (postgres pool), schema.ts (Drizzle)
│   │   ├── routes/            # auth.ts (POST /auth/login), sync.ts (pull/push)
│   │   └── index.ts           # Hono app + /health + /me + DELETE /me
│   ├── Dockerfile             # imagem oven/bun:1.1.42-alpine
│   ├── drizzle.config.ts
│   └── package.json
│
├── docs/                      # esses documentos
└── screens/                   # mockups React/web do Claude Design (referência)
```

---

## Auth (como funciona hoje)

```
1. App: usuário toca "Continuar com Google"
2. App: AuthRequest com responseType=Code + PKCE → abre Safari → Google
3. Google: redireciona pro app com code via URL scheme reversed-client-id
4. App: troca code por id_token via /oauth2/token
5. App: POST /auth/login { provider: "google", idToken } → backend
6. Backend: valida idToken via JWKS oficial do Google (jose)
7. Backend: INSERT/UPDATE em users (chave: provider + provider_sub)
8. Backend: emite JWT próprio HS256 (ttl 30d)
9. App: salva JWT + user_uuid no SecureStore
10. Próximas requests: Authorization: Bearer <jwt>
```

Apple Sign-In está com placeholder (`src/auth/apple.ts` retorna `disponivelApple() = false`). Reativar:

```bash
cd app && npm install expo-apple-authentication
```

E em `app.json`, adicionar de volta:
- `"usesAppleSignIn": true` em `ios`
- `"expo-apple-authentication"` em `plugins`

Depois `expo prebuild --platform ios --clean && expo run:ios`. Isso só funciona com Apple Developer Program ativo.

---

## Sync (como funciona)

### Schema local (SQLite)

Toda tabela sincronizável tem 2 colunas extras:

- `updated_at TEXT` — preenchida automaticamente por triggers AFTER INSERT/UPDATE.
- `synced_at TEXT` — atualizada manualmente após push bem-sucedido.

Tabelas sincronizadas: `areas`, `tarefas`, `execucoes`, `reflexoes_diarias`, `autoavaliacao_inicial`, `eventos`.

Tabela auxiliar:

```sql
CREATE TABLE sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_pull_at TEXT
);
```

### Fluxo

```
sincronizar()  (em src/sync/sync.ts)
├─ enviarLocal(): pega tudo onde updated_at > synced_at
│                 → POST /sync/push
│                 → marca synced_at = updated_at em todas
└─ aplicarPull(): GET /sync/pull?since=<last_pull_at>
                  → para cada linha remota, INSERT OR REPLACE só se
                    remote.updated_at > local.updated_at (last-write-wins)
                  → setLastPullAt(serverNow)
```

### Quando dispara

- **Bootstrap do app** após login (em background, não bloqueia o boot)
- **Manualmente** em Configurações → Sincronização → "Sincronizar agora"

### O que NÃO sincroniza

- `users` local (cadastro: nome, idade, peso, etc.) — fica só no device. Trocar de device hoje força re-onboarding.
- Status de sincronização das notificações (configuração local).

---

## Notificações

```
src/lib/notificacoes.ts
├─ pedirPermissao()
├─ agendarLembretesDiarios()
│    07:00 — bom dia + checklist
│    21:30 — fechamento do dia
└─ reagendarNotificacoesDeTarefas(tarefas)
     cancela tudo + reagenda lembretes fixos + 1 push diário repetido
     pra cada tarefa ativa com horário definido

src/lib/agendarNotificacoesTarefas.ts
└─ reagendarTudo()
     consulta SQLite, monta a lista, chama reagendarNotificacoesDeTarefas
```

Disparado em:

- Bootstrap (com permissão)
- Após criar/editar/desativar/reativar tarefa no editor

Os toggles de Configurações → Notificações **não persistem** ainda — são visuais. Persistir é uma pendência.

---

## Schema Postgres (backend)

Tabelas em `backend/src/db/schema.ts` (Drizzle):

| Tabela | PK | Notas |
|---|---|---|
| users | id (UUID) | provider + provider_sub UNIQUE |
| areas | (user_id, id) | reflete schema local |
| tarefas | (user_id, id) | inclui `horario TEXT` |
| execucoes | (user_id, id) | |
| reflexoes_diarias | (user_id, id) | |
| autoavaliacao_inicial | (user_id, area_id) | |
| eventos | (user_id, id) | |

Migrações via `bun run db:push` no diretório `backend/`. ON DELETE CASCADE em tudo, então `DELETE /me` apaga toda a conta.

---

## Coisas que JÁ funcionam

- ✅ Login com Google
- ✅ Onboarding em 3 passos (cadastro, áreas opcionais com alertas, autoavaliação)
- ✅ Aba Hoje: anel grande + 3 stat cards (7d %, streak, ritmo) + lista de tarefas com horário/atrasada/peso
- ✅ Aba Áreas: lista das 10 com mini-anel + card "Alvo de Vida" no topo
- ✅ Detalhe de área: anel + stats + lista de tarefas + tap edita
- ✅ Editor de tarefa (CRUD): nome, peso, frequência, alvo_count, horário
- ✅ Aba Insights: gráfico do mês com bandas coloridas + calendário 7×N + Top/Bottom 3 áreas + reflexões anteriores
- ✅ Detalhe do dia (tap no calendário): anel + tarefas + reflexão. Edição retroativa (cicla status) em hoje e ontem
- ✅ Aba Configurações: conta + áreas + toggles de notificação + sync + sobre, com Ionicons
- ✅ Alvo de Vida: pizza de 10 fatias com total no centro + legenda em 2 colunas
- ✅ Reflexão diária com pergunta rotativa
- ✅ Reativação bloqueante após 2+ dias pulados
- ✅ Banner de cobrança quando mediocridade ≥ 0.2
- ✅ Sync app ↔ backend (pull + push + last-write-wins)
- ✅ Notificações locais nos horários das tarefas
- ✅ % do mês e % 7d **adaptam** quando o usuário tem menos de 7 / 28 dias de uso (não penaliza pelos dias antes do onboarding)
- ✅ Apagar conta: `DELETE /me` na nuvem + limpa sessão local

## Coisas que NÃO funcionam ainda (pendências)

- ⏳ Apple Sign-In (depende da Apple Developer Account ativar)
- ⏳ Editar cadastro (botão tem placeholder "Em breve")
- ⏳ Toggles de notificação não persistem (são visuais, sem efeito real)
- ⏳ CRUD de áreas (só tarefas dá pra criar/editar — área é fixa do seed)
- ⏳ Padrões em Insights (texto tipo "você falha mais às terças") — placeholder
- ⏳ Splash screen e ícone do app personalizados
- ⏳ Cadastro local não sincroniza com a nuvem (perde se trocar de device)
- ⏳ Justificativa opcional ao marcar tarefa como "não feito"

---

## Como rodar localmente

### App

```bash
cd app
npm install
# Primeira vez precisa do Xcode + Simulator + iOS runtime instalados
npx expo prebuild --platform ios --clean
npx expo run:ios
```

Em sessões seguintes, sem mudar deps nativas, basta:

```bash
cd app
npx expo start --dev-client
# iOS Simulator abre, Cmd+R recarrega
```

### Backend (testar local)

```bash
cd backend
bun install
cp .env.example .env   # preencha com seus valores
bun run db:push        # cria/atualiza tabelas no Postgres apontado pela DATABASE_URL
bun run dev            # http://localhost:3000
```

### Aplicar migração no Postgres do Railway

```bash
cd backend
DATABASE_URL='postgresql://...' bun run db:push
```

Drizzle às vezes erra com `42P16` em projetos com dado real — quando isso acontece, fazer `ALTER TABLE` direto via `psql`/`bun -e` é o fallback (já fizemos isso pra adicionar `horario`).

---

## Operações úteis

### Verificar se sync chegou no Postgres

```bash
cd backend
DATABASE_URL='postgresql://...' bun -e "
  import postgres from 'postgres';
  const sql = postgres(process.env.DATABASE_URL);
  const a = await sql\`SELECT count(*) FROM areas\`;
  const t = await sql\`SELECT count(*) FROM tarefas\`;
  const e = await sql\`SELECT count(*) FROM execucoes\`;
  console.log('areas:', a[0].count, 'tarefas:', t[0].count, 'execucoes:', e[0].count);
  await sql.end();
"
```

### Resetar dados locais no Simulator

iOS Simulator → Device → Erase All Content and Settings. Ou: apagar o app no Simulator.

### Testar deep link

```
xcrun simctl openurl booted umporcento://qualquer/coisa
```

---

## Custos mensais

| Item | Custo |
|---|---|
| Postgres no Railway | ~USD 5/mês |
| Backend service no Railway | ~USD 5/mês |
| Google OAuth | grátis |
| Apple Developer Program | USD 99/ano (pra device real / TestFlight / App Store) |

Total operacional atual: **~USD 10/mês** + Apple Developer quando ativar.

---

## Histórico resumido (se você esquecer o que aconteceu)

Pulamos do "single-user offline" pro estado atual em uma maratona. Em ordem:

1. Schema + componentes domain (cores, percentual, intensidade, mediocridade, streak)
2. Telas de onboarding (cadastro, áreas, autoavaliação)
3. Bootstrap, Zustand, navegação stack inicial
4. Build iOS via `expo run:ios` no Simulator (Xcode 26.4.1)
5. Bug do `diasPulados` que mandava usuário novo direto pra reativação — corrigido com `inicioIso`
6. Decisão de adicionar login + sync. Optamos por backend próprio no Railway (em vez de Supabase managed)
7. Backend Bun + Hono + Drizzle + Postgres deployado
8. Login Google funcionando. Apple Sign-In desativado por requerer Developer Program
9. Reforma visual completa via mockups gerados pelo Claude Design (estilo Apple Fitness)
10. Tab bar inferior com 4 abas, novo design system de componentes
11. Telas Hoje / Áreas / Detalhe de Área / Insights / Configurações refeitas
12. Alvo de Vida refeito com total no centro
13. CRUD de tarefa + horário por tarefa (campo, sort, badge "atrasada")
14. Sync pull/push completo entre SQLite e Postgres
15. Notificações locais nos horários das tarefas
16. Detalhe do dia + edição retroativa (até 48h)
17. Polish com Ionicons em tab bar e configurações
