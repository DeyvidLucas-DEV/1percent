# Bundle de conhecimento — Chat do 1%

Esta pasta agrupa todos os arquivos necessários pra criar o **Claude Project** treinado nas funcionalidades do app 1%. Veja [`CHAT-SETUP.md`](CHAT-SETUP.md) pra o passo-a-passo de como subir tudo.

## Como usar

1. Abre [claude.ai](https://claude.ai) → **Projects** → **Create project**.
2. Arrasta esta pasta inteira na aba **Project knowledge**.
3. Na aba **Custom instructions**, cola o system prompt que está em `CHAT-SETUP.md`.
4. Pronto.

## O que tem aqui

### Documentação (13 arquivos)

| Arquivo | Origem no repo | O que tem |
|---|---|---|
| `README.md` | `/README.md` | Pitch público + o que o usuário faz no app |
| `CLAUDE.md` | `/CLAUDE.md` | Convenções e gotchas pra quem mexe no código |
| `app 1 percent.md` | `/app 1 percent.md` | Documento de visão original (longo, narrativo) |
| `CHAT-SETUP.md` | `/docs/CHAT-SETUP.md` | Setup do próprio Project (este guia) |
| `00-leia-primeiro.md` | `/docs/00-leia-primeiro.md` | Orientação técnica geral |
| `01-arquitetura.md` | `/docs/01-arquitetura.md` | Stack e decisões técnicas |
| `02-schema-de-dados.md` | `/docs/02-schema-de-dados.md` | Tabelas SQLite + DDL |
| `03-areas-e-tarefas.md` | `/docs/03-areas-e-tarefas.md` | 10 áreas e tarefas-padrão |
| `04-regras-de-negocio.md` | `/docs/04-regras-de-negocio.md` | Cores, intensidade, mediocridade, streaks |
| `05-roadmap-mvp.md` | `/docs/05-roadmap-mvp.md` | Plano original do MVP |
| `06-sync-e-auth.md` | `/docs/06-sync-e-auth.md` | Backend Bun + Hono + sync |
| `07-estado-atual.md` | `/docs/07-estado-atual.md` | Snapshot do que existe hoje |
| `08-design-system.md` | `/docs/08-design-system.md` | Componentes UI, tokens |

### Código de referência (13 arquivos)

| Arquivo | Origem no repo | O que é |
|---|---|---|
| `code-tema.ts` | `app/src/lib/tema.ts` | Tokens de design (cores, fontes, espaçamento) |
| `code-cores.ts` | `app/src/domain/cores.ts` | Faixas de cor + label por percentual |
| `code-areasPaleta.ts` | `app/src/domain/areasPaleta.ts` | Paleta `ink`+`soft` por slug de área |
| `code-db-schema.ts` | `app/src/db/schema.ts` | DDL + migrations + triggers do SQLite |
| `code-db-types.ts` | `app/src/db/types.ts` | Tipos TS de todas as tabelas |
| `code-db-tarefas.ts` | `app/src/db/queries/tarefas.ts` | CRUD e queries de tarefa/execução |
| `code-db-areas.ts` | `app/src/db/queries/areas.ts` | CRUD e queries de área |
| `code-ui-HabitCard.tsx` | `app/src/components/ui/HabitCard.tsx` | Card destaque do dashboard |
| `code-ui-BigRing.tsx` | `app/src/components/ui/BigRing.tsx` | Anel grande animado |
| `code-ui-TabBarPill.tsx` | `app/src/components/ui/TabBarPill.tsx` | Tab bar pílula com FAB |
| `code-route-hoje.tsx` | `app/app/(tabs)/index.tsx` | Tela Hoje (raiz da experiência) |
| `code-route-config.tsx` | `app/app/(tabs)/config.tsx` | Tela Configurações |
| `code-route-checklist.tsx` | `app/app/checklist.tsx` | Checklist diário |

## Manutenção

Esta pasta é uma **cópia** dos arquivos originais — fonte da verdade é sempre o caminho original. Quando atualizar uma regra, doc ou componente:

1. Edita no caminho original do repo.
2. Re-roda o script de bundle (ou copia o arquivo manualmente pra esta pasta).
3. Re-uploada no Project (ou substitui o arquivo lá direto).

Não automatizei o re-bundle ainda — quando o ritmo de mudança aumentar, vale fazer um script `bin/build-chat-bundle.sh`.
