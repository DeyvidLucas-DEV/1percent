# 1% — contexto pra Claude

App pessoal de evolução contínua focado em **processo, não resultado**.

> "Resultado é consequência. Processo é decisão."

**Início rápido:** leia [`docs/07-estado-atual.md`](docs/07-estado-atual.md) — tem o snapshot completo da arquitetura, infra, rotas, sync, notificações, pendências e como rodar.

---

## Stack

- **App** (`app/`): Expo SDK 54 + React Native + TypeScript + expo-router (file-based) + SQLite (expo-sqlite) + Zustand + react-native-svg + @expo/vector-icons (Ionicons) + date-fns
- **Backend** (`backend/`): Bun + Hono + Drizzle + Postgres (Railway). Container via Dockerfile, deploy via Railway conectado ao GitHub.
- **Auth**: Google OAuth iOS (PKCE com authorization code), backend valida via JWKS oficial, emite JWT próprio (HS256, 30d). Apple Sign-In **desativado** até a Developer Account pagar (USD 99/ano).
- **Sync**: pull/push entre SQLite local e Postgres com last-write-wins por `updated_at`. Triggers SQLite mantêm `updated_at` em dia automaticamente.

## Estrutura do repo

```
1%/                          # nome do app (mantém o `%` — é proposital)
├── app/                     # projeto Expo
├── backend/                 # Bun + Hono no Railway
├── docs/                    # 00..08 — comece pelo 07-estado-atual.md
├── screens/                 # mockups web React (referência visual, não rodam)
├── CLAUDE.md                # este arquivo
└── app 1 percent.md         # documento original de visão
```

Repo: https://github.com/DeyvidLucas-DEV/1percent
Backend público: https://1percent-production.up.railway.app

## Rodar local (após primeira instalação completa)

```bash
cd app && npx expo start --dev-client     # Cmd+R no Simulator
```

Build nativo (após mudar deps nativas, app.json, ou plugins):

```bash
cd app && npx expo prebuild --platform ios --clean && npx expo run:ios
```

Backend local:

```bash
cd backend && bun install && bun run dev
```

## Convenções importantes

- **Idioma**: tudo em **PT-BR** (UI, queries, código de domínio, comentários, commits). Identificadores técnicos (export names, types) podem ser PT-BR também — manter consistência.
- **Tom do app**: brutal honesto. Sem palavras motivacionais vazias, sem comemoração de pouco esforço. "Estagnação", "Reação", "Movimento", "Construção", "Excelência" são as 5 faixas — não inventar outras.
- **Componentes UI**: pasta canônica é `app/src/components/ui/`. Use os existentes antes de criar novos. Lista em `docs/08-design-system.md`.
- **Tokens de cor/spacing**: `app/src/lib/tema.ts`. Faixas de performance: `app/src/domain/cores.ts` (5 faixas, hexes fixos, não mudar).
- **Tipografia**: SF Pro nativa. Pesos 600/700/800. Tabular numbers no iOS via `fontVariantNumeric` quando precisar alinhar.
- **Sem emoji** nas labels de UI. Ícones usam Ionicons (`@expo/vector-icons`). Em commits e docs também não — só se o usuário pedir explícito.
- **Código novo deve ser em TypeScript estrito**. `npx tsc --noEmit` precisa passar limpo antes de commitar.

## Modelo de dados — gotchas

- Toda tabela sincronizável tem `updated_at TEXT` (preenchida por triggers AFTER INSERT/UPDATE) e `synced_at TEXT` (atualizada após push bem-sucedido). NUNCA edite `updated_at` manualmente em queries — deixe o trigger.
- `tarefas` tem `horario TEXT` (HH:MM) opcional — quando preenchido, a tarefa aparece ordenada cronologicamente em Hoje, ganha badge "ATRASADA" se passou, e dispara push local diária.
- `users` local não sincroniza ainda (cadastro fica no device). Migrar pra device novo força re-onboarding.
- IDs auto-incrementais podem colidir entre devices em multi-device com edits simultâneos — aceitamos esse risco no MVP. Last-write-wins por `updated_at` resolve a maioria.
- Banco local em SQLite usa snake_case. Backend Drizzle usa camelCase. O módulo `src/sync/sync.ts` faz a tradução.

## Operações que precisam de cuidado

- **Push pro Railway**: qualquer push em `main` redeploya automaticamente o backend. Se quiser evitar, trabalhe em branch.
- **Migração de schema no Postgres**: `bun run db:push` no `backend/`. Drizzle às vezes erra com `42P16` em projetos com dado real — fallback é `ALTER TABLE` direto. Já fizemos isso pra adicionar `horario`.
- **Migração de schema no SQLite**: `app/src/db/schema.ts` tem a função `rodarMigracoes` que checa colunas via PRAGMA e adiciona o que falta. Idempotente.
- **NUNCA** colar no chat: senha do Postgres, JWT secret, OAuth client secret. Client ID público é OK. Se vazar, regenerar no Railway/Google Cloud.
- **Apagar conta** (`DELETE /me`): usa CASCADE. Apaga tudo na nuvem mesmo. Local fica até reinstalar o app.

## Estado de quando esse arquivo foi escrito (2026-05-08)

✅ **Funciona**: login Google, onboarding, 4 abas (Hoje/Áreas/Insights/Configurações), CRUD de tarefa com horário, notificações no horário, sync app↔backend, detalhe do dia com edição retroativa, Alvo de Vida, reflexão, reativação bloqueante, banner de cobrança.

⏳ **Pendente**: Apple Sign-In, editar cadastro, persistir toggles de notificação, sync do cadastro local, splash/ícone customizados, padrões reais em Insights.

Veja `docs/07-estado-atual.md` pra detalhes e histórico.

## Como interagir com o usuário

- Usuário escreve em PT-BR. Responda em PT-BR.
- Estilo direto, técnico, sem rodeio. Tom igual ao do app.
- Antes de qualquer feature grande, mostre plano e peça confirmação. Não empilhe construção sem teste.
- Telas de UI: fazer **uma por vez** com aprovação visual via Simulator. Padrão estabelecido na conversa de 2026-05-08.
- Mockups novos vêm via Claude Design (web) e ficam em `screens/`. São referência — traduzir pra RN com fidelidade visual razoável, não literal.
- Commits: PT-BR no título, body opcional. Co-author do Claude Opus.
