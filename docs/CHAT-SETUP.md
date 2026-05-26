# Chat treinado nas funcionalidades do 1%

Setup pra você e seu sócio terem um chat que conhece o app inteiro — regras, telas, decisões, código. Útil durante desenvolvimento e teste.

## Por que Claude Project

- 200K tokens de contexto (cabe todos os docs com folga, sobra pra conversa).
- Aceita arquivos `.md`, `.ts`, `.tsx` direto.
- Cada chat novo dentro do projeto já vem com todo o conhecimento carregado.
- Compartilhável via "Share project" pra seu sócio entrar sem precisar reuploadar.

Alternativa: **Custom GPT** no ChatGPT Plus. Funciona igual mas com 20 arquivos máximo. Use se já paga ChatGPT.

---

## Passo a passo

### 1. Crie o Project

1. Vai em [claude.ai](https://claude.ai) (logado).
2. Sidebar esquerda → **Projects** → **Create project**.
3. Nome: `1% — Assistente do App`
4. Descrição: `Chat treinado nas funcionalidades, regras e código do app 1%`.

### 2. Suba os arquivos de conhecimento

Tudo que o chat precisa já está agrupado em **[`/chat-knowledge/`](../chat-knowledge/)** na raiz do repo. **Arrasta a pasta inteira** na aba **Project knowledge**.

Tem 27 arquivos lá: README + CLAUDE + visão original + 9 docs técnicos + CHAT-SETUP + 13 arquivos de código de referência (tema, cores, schema, queries, componentes UI principais e rotas).

Veja [`chat-knowledge/_LEIA-PRIMEIRO.md`](../chat-knowledge/_LEIA-PRIMEIRO.md) pra o manifesto completo do que tem.

### 3. Cole as instruções customizadas

Na aba **Custom instructions** (ou "Project instructions") do projeto, cola o texto abaixo:

```
Você é o assistente técnico do app "1%" — uma plataforma pessoal de evolução
contínua focada em processo, não em resultado. Os arquivos do projeto contêm:

- README.md: pitch público + o que o usuário faz no app
- CLAUDE.md: instruções de codebase
- docs/00..08: documentação técnica completa
- arquivos .ts/.tsx: código de domínio, componentes UI e queries

Responsabilidades:

1. Responder perguntas sobre funcionalidades, regras e telas do app com
   base nos arquivos. Se a pergunta não está coberta, fale isso direto e
   sugira onde o time deveria documentar.

2. Quando o usuário descrever um problema ou pedir mudança, identifique:
   - qual regra/tela/componente está envolvido (cite arquivo e seção)
   - se a mudança bate com os princípios do app (brutal honesto, processo > resultado, light cream + Bricolage)
   - se há regra de negócio em docs/04 que se aplica

3. Use PT-BR sempre. Tom direto, técnico, sem rodeio. Mesmo tom do app:
   nada de "ótima pergunta!", nada de bullet motivacional, nada de emoji.

4. Não invente funcionalidades que não estão nos docs. Se não sabe, diga
   "isso não está documentado, preciso confirmar com vocês". Os usuários do
   chat são o time interno (dev), não usuários finais — pode ser técnico.

5. Quando responder sobre código, cite o arquivo e o trecho exato (path:
   linha quando possível).

Princípios fundadores do app que você precisa internalizar:

- Pessoal, single-user. Login só pra sync entre aparelhos.
- Mostra a realidade. Marrom desde dia 1. Sem fase neutra.
- Detecta intensidade e mediocridade dos dados, não pergunta.
- 6 áreas obrigatórias + 4 opcionais (pausáveis com motivo).
- Offline-first: SQLite local é a verdade, Postgres é backup.
- Stack: Expo SDK 54 + RN + TS, Bun + Hono + Postgres no Railway.
- Design: light cream #E8E2D2, Bricolage display + Inter texto, sem emoji.
- Animações funcionais, nunca celebratórias. Haptics calibrados.
- Versículo-base: Gálatas 6:9 (constância, semeadura).
```

### 4. Teste com perguntas-âncora

Cria um chat novo dentro do project e roda essas perguntas. Se ele responder bem todas, está pronto:

- "O que acontece se eu pular 2 dias sem marcar nada?"
- "Como o app calcula a faixa de cor de uma área?"
- "Posso pausar a área Espiritual? E a Crescimento Intelectual?"
- "Qual o peso de uma tarefa diária com peso 3 no cálculo semanal?"
- "Que componente uso pra renderizar o anel grande na tela Hoje?"
- "Como é o ciclo de status quando eu toco numa tarefa no checklist?"
- "O que é o banner de mediocridade e quando aparece?"
- "Onde está definida a paleta de cores das áreas?"
- "Quais features ainda estão pendentes pro MVP?"

### 5. Compartilhe com o sócio

No menu do project → **Share project** → manda link pro seu sócio. Ele entra com a conta dele e usa.

---

## Quando atualizar

Sempre que mudar uma regra, funcionalidade ou estrutura grande no app:

1. Atualiza o `.md` correspondente no repo (fonte da verdade).
2. Re-uploada o arquivo atualizado no Project (ou apaga e sobe de novo).
3. Não precisa mexer nas instruções customizadas, a menos que mude o tom ou os princípios.

Não vale a pena automatizar isso até o app ter mais usuários.

---

## Quando promover pra in-app

Quando você decidir que o usuário final precisa do mesmo chat dentro do app:

1. Mantém esse Claude Project como referência (você usa pro dev, dispensável).
2. Cria uma rota `app/app/chat.tsx` com UI de mensagens.
3. Backend faz proxy pro Claude API (segredos não no client).
4. System prompt = mesma estrutura de cima, mas adaptado pro tom do usuário final ("Você é o assistente do 1%, ajude o usuário a entender suas próprias regras…").
5. Knowledge = mesmos docs convertidos em string e injetados no system prompt (cabem em ~30K tokens).

Estimativa: 4-6h de trabalho. Custo por mensagem: $0.003-$0.015 dependendo do modelo (Claude Haiku é o recomendado pra esse volume).
