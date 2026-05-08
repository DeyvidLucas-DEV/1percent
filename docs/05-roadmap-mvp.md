# Roadmap — MVP de 30 dias

Objetivo: app rodando no celular do usuário, com checklist diário funcional, cores, streaks e cobrança básica. Tudo offline, single-user.

---

## Semana 1 — Fundação

**Meta:** projeto rodando, banco semeado, onboarding navegável.

- [x] Documentação técnica
- [x] Bootstrap Expo + TypeScript + expo-router
- [x] Instalar dependências (expo-sqlite, expo-notifications, react-native-svg, zustand, date-fns)
- [x] `src/db/schema.ts` — DDL
- [x] `src/db/seed.ts` — semear 10 áreas + tarefas padrão
- [x] Tela de cadastro (todos os campos obrigatórios)
- [x] Tela de autoavaliação (escala 0-10 por área)
- [x] Tela de seleção de áreas opcionais (com alertas baseados em livros)
- [x] Persistência do flag `onboarded_at`

---

## Semana 2 — Núcleo do app

**Meta:** o usuário consegue marcar tarefas e ver o dia evoluir.

- [x] `src/db/queries/` — funções pra buscar tarefas do dia, marcar execução, listar histórico
- [x] Tela de checklist diário (lista agrupada por área, ciclo concluído/parcial/não feito)
- [x] `src/domain/cores.ts` — função `corPorPercentual()` + faixas
- [x] `src/domain/percentual.ts` — fórmula de % por área (janela configurável)
- [x] Dashboard com % do dia, streak, áreas com cor, botões pra checklist/alvo/reflexão
- [x] Zustand store

---

## Semana 3 — Visualização e engajamento

**Meta:** o gráfico Alvo de Vida e os ganchos de retenção.

- [x] `src/components/AlvoDeVida.tsx` — pizza com 10 fatias em react-native-svg
- [x] Tela `/alvo` mostrando pizza + legenda
- [x] `src/domain/streak.ts` — cálculo de streak + milestones
- [x] Tela de reflexão diária (1 pergunta + campo de resposta)
- [x] `src/domain/intensidade.ts` — classificação Leve/Moderada/Intensa/Desorganizada
- [x] Banner de intensidade no dashboard
- [x] Notificações locais (manhã, noite, pós-pulo)
- [ ] Tap em fatia da pizza → detalhe da área (próxima iteração)

---

## Semana 4 — Cobrança e regras duras

**Meta:** os sistemas que diferenciam o app de qualquer to-do.

- [x] `src/domain/mediocridade.ts` — score 0–1 + faixas + mensagens
- [x] Banner persistente no dashboard quando score ≥ 0.2
- [x] Tela de Reativação (acionada após 2 dias pulados, bloqueante)
- [x] Pausar áreas opcionais com alertas (modal de dupla confirmação no onboarding)
- [ ] Cobrança por área: detecta área travada e oferece reduzir alvo OU manter
- [ ] Tela de configurações: editar tarefas, mudar pesos, ver eventos
- [ ] Build local no celular (Expo Go ou EAS dev build)
- [ ] Polish: ícones de áreas, transições, micro-interações

---

## Estado real (instantâneo)

Bundles **iOS** e **Android** compilam sem erros. TypeScript limpo. O fluxo completo cadastro → autoavaliação → dashboard → checklist → alvo → reflexão → reativação está navegável.

Falta principalmente: testar no device real, tela de configurações pra editar tarefas, e polimento visual.

---

## Fora do MVP (v2+)

- Backup/exportação dos dados
- Sincronização entre dispositivos
- Integração com WhatsApp
- Coaches digitais com IA
- Análise de padrões via LLM
- Gamificação (badges, conquistas além de streaks)
- Modo casal (tarefas em comum)
- Widget de tela inicial
- Apple Health / Google Fit
- Versão web do dashboard

---

## Checkpoints semanais

A cada sexta:
- O que foi entregue
- O que ficou pendente
- O que mudou no escopo
- Decisão: seguir o plano ou ajustar

Sem cerimônia — você pode até registrar como reflexão dentro do próprio app quando ele estiver rodando.
