# 1% — App pessoal de evolução contínua

> "Resultado é consequência. Processo é decisão."

App pessoal, single-user, offline. Mede o que você faz, não pergunta como você se sente.

## Documentação

A documentação completa está em [`../docs/`](../docs):

- [`00-leia-primeiro.md`](../docs/00-leia-primeiro.md) — orientação geral
- [`01-arquitetura.md`](../docs/01-arquitetura.md) — stack, estrutura, decisões
- [`02-schema-de-dados.md`](../docs/02-schema-de-dados.md) — tabelas SQLite
- [`03-areas-e-tarefas.md`](../docs/03-areas-e-tarefas.md) — 10 áreas + tarefas semeadas
- [`04-regras-de-negocio.md`](../docs/04-regras-de-negocio.md) — cores, intensidade, mediocridade, streaks
- [`05-roadmap-mvp.md`](../docs/05-roadmap-mvp.md) — plano de 4 semanas

## Como rodar

```bash
npm install
npx expo start
```

Aí:
- `i` → abre no iOS Simulator (precisa Xcode)
- `a` → abre no Android Emulator (precisa Android Studio)
- Lê o QR code com **Expo Go** no celular pra testar no device real

## Estrutura

```
app/                    # rotas (expo-router)
  _layout.tsx           # layout raiz, faz bootstrap e roteamento condicional
  index.tsx             # dashboard
  onboarding/           # cadastro, áreas, autoavaliação
  checklist.tsx         # marcar tarefas do dia
  alvo.tsx              # gráfico Alvo de Vida
  reflexao.tsx          # 1 pergunta diária
  reativacao.tsx        # tela bloqueante após 2+ dias pulados

src/
  db/
    schema.ts           # DDL SQLite + abertura do banco
    seed.ts             # 10 áreas + tarefas padrão
    bootstrap.ts        # init schema + seed + permissões + notificações
    queries/            # acesso ao banco (areas, tarefas, users, execucoes)
    types.ts
  domain/               # regras de negócio puras
    cores.ts            # faixa marrom→azul por %
    percentual.ts       # cálculo de % por área e geral
    intensidade.ts      # leve / moderada / intensa / desorganizada
    mediocridade.ts     # score 0-1, faixas, mensagens de cobrança
    streak.ts           # streak atual, dias pulados, milestones
    reflexoes.ts        # pool de perguntas
    alertasPausa.ts     # mensagens ao pausar área opcional
    agregados.ts        # carrega todos os dados do dashboard
  components/           # UI reutilizável (Botao, Campo, Seletor, AlvoDeVida)
  lib/
    datas.ts            # helpers de data (date-fns)
    notificacoes.ts     # expo-notifications
    tema.ts             # cores, espaçamentos, tipografia
  store/
    appStore.ts         # zustand: inicializado, onboarded
```

## Comandos úteis

```bash
npm start              # inicia Metro
npm run ios            # inicia no iOS
npm run android        # inicia no Android
npx tsc --noEmit       # type-check
npx expo export --platform ios       # bundle iOS (validação)
npx expo export --platform android   # bundle Android (validação)
```

## Resetar dados

O banco vive no SQLite local do device. Pra resetar:
- iOS Simulator: Device → Erase All Content and Settings
- Android: limpar dados do app
- Expo Go: `expo-sqlite` salva em `documentDirectory` — apagar o app limpa
