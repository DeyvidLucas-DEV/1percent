# 1% — Leia Primeiro

Aplicativo pessoal de evolução contínua focado em **processo, não em resultado**.

> "Resultado é consequência. Processo é decisão."

## Documentação

| # | Documento | Pra quê serve |
|---|---|---|
| 00 | [Este arquivo](00-leia-primeiro.md) | Orientação geral |
| 01 | [Arquitetura](01-arquitetura.md) | Stack, estrutura, decisões técnicas |
| 02 | [Schema de Dados](02-schema-de-dados.md) | Tabelas SQLite + DDL |
| 03 | [Áreas e Tarefas](03-areas-e-tarefas.md) | 10 áreas + tarefas padrão semeadas |
| 04 | [Regras de Negócio](04-regras-de-negocio.md) | Cores, intensidade, mediocridade, streaks |
| 05 | [Roadmap MVP](05-roadmap-mvp.md) | Plano de 4 semanas |

Documento original de visão: [`../app 1 percent.md`](../app%201%20percent.md)

## Resumo das decisões fundadoras

- **Pessoal.** Single-user, sem login, sem nuvem.
- **Mostra a realidade.** Marrom desde o dia 1. Sem suavização.
- **Detecta, não pergunta.** Intensidade e mediocridade vêm dos dados, não de auto-relato.
- **Cobra mais conforme detecta mediocridade.** Não vira app passivo.
- **6 áreas obrigatórias, 4 opcionais.** Pausar opcional dispara alerta justificado.
- **Stack:** Expo (React Native + TS), SQLite local, Zustand, react-native-svg.

## Como navegar este projeto

- Pra entender **o que o app faz**: lê `app 1 percent.md` + `04-regras-de-negocio.md`
- Pra entender **como está construído**: `01-arquitetura.md` + `02-schema-de-dados.md`
- Pra entender **o que está sendo feito**: `05-roadmap-mvp.md`
- O código fica em `app/` (projeto Expo).
