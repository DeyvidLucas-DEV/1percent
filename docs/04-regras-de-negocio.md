# Regras de Negócio

Quatro sistemas centrais: **Cores**, **Intensidade**, **Mediocridade/Cobrança Progressiva**, **Streaks e Regra de 2 Dias**. Todos derivam de `execucoes` — sem estado escondido, sem campo "humor".

---

## 1. Sistema de Cores

### Faixas

| Faixa | Cor | Significado |
|---|---|---|
| 0–20% | Marrom `#6B4423` | Crítico. Negligência. |
| 21–40% | Vermelho `#C0392B` | Baixo desempenho. Reação necessária. |
| 41–60% | Amarelo `#E1A93B` | Oscilação. Alertas. |
| 61–80% | Verde `#2E8B57` | Consistência saudável. |
| 81–100% | Azul `#1F6FB2` | Excelência. Alvo. |

### Período de calibração

**Decisão:** o usuário pediu pra mostrar a realidade desde o dia 1, mesmo que desmotive. Mantemos as cores ativas desde o início. **Não há período "neutro".**

A única exceção: se um dia tem 0 tarefas cadastradas pra avaliar, esse dia entra como `null` (não vira marrom por ausência de dados).

### Fórmula de % por área (janela: últimos 7 dias)

```
peso_concluido    = soma(execucao.peso) onde status='concluido'
peso_parcial      = soma(execucao.peso * 0.5) onde status='parcial'
peso_total_alvo   = soma(peso esperado das tarefas ativas da área no período)

percentual = (peso_concluido + peso_parcial) / peso_total_alvo * 100
```

- "Peso esperado" leva em conta `frequencia` e `alvo_count`. Tarefa diária com peso 3 contribui `3 * 7 = 21` pro denominador na semana. Tarefa semanal `alvo_count=3` contribui `3 * peso`.
- Percentual é truncado em 100.

### % do dia (dashboard)

Igual à fórmula, mas janela = só hoje. Mostra o que já foi feito hoje.

### % geral (Alvo de Vida)

Média ponderada dos % de cada área **não pausada**, ponderada por `peso_global`.

---

## 2. Sistema de Intensidade

Detecção automática, sem perguntar ao usuário. Roda em cima dos últimos 28 dias.

### Métricas da rotina

```
tarefas_ativas_dia  = média de tarefas previstas por dia (considerando frequência)
peso_medio          = média de peso das tarefas ativas
carga_semanal       = soma(peso * alvo_semanal) de todas as tarefas ativas
```

### Classificação

| Classificação | Critério |
|---|---|
| **Leve** | `carga_semanal < 30` OU `tarefas_ativas_dia < 4` |
| **Moderada** | `30 ≤ carga_semanal < 70` |
| **Intensa** | `carga_semanal ≥ 70` OU `tarefas_ativas_dia ≥ 10` |
| **Desorganizada** | Coeficiente de variação (desvio padrão / média) das execuções diárias > 0.6 — vida com picos e vales sem padrão |

A "desorganizada" sobrescreve as outras. É um diagnóstico forte: você até faz coisas, mas sem regularidade.

### Janela de comparação

Comparação semana atual vs anterior detecta **picos pontuais**:

> "Sua rotina é normalmente **moderada**, mas esta semana está **intensa**."

---

## 3. Sistema de Mediocridade / Cobrança Progressiva

### O que é "medíocre"

Mediocridade não é "fazer pouco". É **fazer pela metade, com inconsistência, sem regredir mas sem evoluir**. O sinal forte é o `parcial` repetido e o % travado entre 41-60% por muitas semanas.

### Fórmula

Janela: últimos 28 dias.

```
taxa_parcial      = execucoes_parciais / total_execucoes
taxa_nao_feito    = execucoes_nao_feito / total_execucoes
estagnacao       = stddev(% semanal) < 5  AND  média(% semanal) entre 35 e 65
```

```
score_mediocridade = (taxa_parcial * 0.5) + (taxa_nao_feito * 0.3) + (estagnacao ? 0.2 : 0)
```

Range 0.0 – 1.0.

### Faixas e respostas do app

| Score | Estado | Como o app reage |
|---|---|---|
| < 0.20 | Limpo | Tom acolhedor. Mensagens curtas. |
| 0.20–0.40 | Alerta leve | Lembrete extra no fim do dia, com pergunta direta: "O que ficou pela metade hoje?" |
| 0.40–0.65 | Cobrança | Banner persistente no dashboard mostrando o número. App passa a usar tom direto: "Você está há 17 dias preso entre 45% e 55%. Isso não é falha, é hábito." |
| > 0.65 | Cobrança forte | Tela bloqueante 1x por semana exigindo escolha: (a) reduzir tarefas (admitir que o ritmo está irreal); (b) explicar por escrito o que está travando; (c) reativar foco em 1 área (define `peso_global=3`). |

### Cobrança por área

Calcula score por área individualmente. Se uma área específica passa de 0.5, o app foca cobrança nela:

> "Saúde Física está em 38% há 3 semanas. Sono e treino são as tarefas que você mais marca como parcial. Quer reduzir o alvo de treino de 4x pra 3x na semana, ou manter e cobrar?"

A escolha dispara um evento em `eventos`. Reduzir é ok — irreal é pior que pequeno.

---

## 4. Streaks e Regra de 2 Dias

### O que conta como streak

Um dia "válido" é qualquer dia com **% do dia ≥ 50%**. A streak é a sequência atual de dias válidos.

### Lembretes

- A cada milestone (3, 7, 14, 30, 60, 100, 365 dias), notificação reconhecendo.
- Se a streak quebra, app não pune a quebra em si — só ativa a regra de 2 dias.

### Regra "Nunca 2 Dias Seguidos"

Princípio do *Atomic Habits*. Implementação:

1. **1 dia pulado** (% < 50%): notificação extra na manhã seguinte: *"Ontem você pulou. Hoje não pode pular. Faça 1 tarefa de cada área obrigatória — só isso."*
2. **2 dias pulados seguidos**: ao abrir o app no 3º dia, **tela bloqueante de Reativação**:
   - Mostra os 2 dias zerados
   - Pergunta: "O que aconteceu?" (campo livre, salvo em `eventos`)
   - Exige completar uma **tarefa mínima**: marcar 1 execução agora pra desbloquear
   - Sai com mensagem fixa: *"Voltar é a única coisa que importa. Não é sobre intensidade, é sobre presença."*
3. **3+ dias pulados**: tela de reativação fica mais direta, sem palavras de apoio. Exige 1 tarefa concluída de cada área **obrigatória** pra desbloquear.

### Reflexão diária

1 pergunta rotacionada por dia. Pool inicial:
- "O que ficou pela metade hoje? Por quê?"
- "Qual área você ignorou hoje?"
- "Se amanhã você só pudesse fazer 3 coisas, quais seriam?"
- "O que te tirou do foco?"
- "Qual hábito está te levando pro alvo? E qual está te afastando?"
- "Em que você foi 1% melhor hoje?"
- "Qual decisão de hoje seu eu de daqui 1 ano vai agradecer?"

Salva em `reflexoes_diarias`. Não obrigatória, mas conta no engajamento.

---

## Resumo das fórmulas

```
% por área (janela 7d)  = (peso_concluido + 0.5*peso_parcial) / peso_total_alvo
% do dia                 = % por área aplicado a janela de hoje, agregado
% geral (Alvo)           = média ponderada das áreas ativas por peso_global
intensidade              = derivada de carga_semanal e tarefas_ativas_dia
score_mediocridade       = 0.5*taxa_parcial + 0.3*taxa_nao_feito + 0.2*estagnacao
streak                   = dias consecutivos com % do dia ≥ 50%
```
