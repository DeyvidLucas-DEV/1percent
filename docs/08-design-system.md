# Design system

> Componentes, tokens e padrões visuais do app.
> Atualizado em 2026-05-08.

Inspiração estrutural: Apple Fitness/Health (anel central, cards arredondados, generosidade de espaço). Sem o vício de Fitness de comemorar pouco esforço — o app diz a verdade direto.

---

## Tokens (`src/lib/tema.ts`)

```ts
export const tema = {
  bg:        '#0E0F12',
  bgCard:    '#1A1C21',
  bgInput:   '#23262E',
  borda:     '#2C2F38',
  texto:     '#ECECEC',
  textoFraco:'#9095A0',
  acento:    '#1F6FB2',
  perigo:    '#C0392B',
  sucesso:   '#2E8B57',
  alerta:    '#E1A93B',
  espacamento: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  raio: 12,
  fonte: { titulo: 28, subtitulo: 20, corpo: 16, pequeno: 13 },
};
```

## Faixas de performance (`src/domain/cores.ts`)

```
0–20%   marrom    #6B4F2A   "Estagnação"
21–40%  vermelho  #B5391C   "Reação"
41–60%  amarelo   #C7A52E   "Movimento"
61–80%  verde     #2E8B57   "Construção"
81–100% azul      #1F6FB2   "Excelência"
```

Funções públicas: `corPorPercentual(p)`, `rotuloPorPercentual(p)`, `faixaPorPercentual(p)`.

## Cores-base das áreas (`src/db/seed.ts`)

| # | Área | Cor | Tipo |
|---|---|---|---|
| 1 | Espiritual | #6B4F8A | obrigatória |
| 2 | Saúde Física | #2E8B57 | obrigatória |
| 3 | Família | #C45A4F | obrigatória |
| 4 | Trabalho/Carreira | #1F6FB2 | obrigatória |
| 5 | Saúde Emocional | #D9A441 | obrigatória |
| 6 | Finanças | #4A7C59 | obrigatória |
| 7 | Ministério | #8E44AD | opcional |
| 8 | Amizades | #16A085 | opcional |
| 9 | Crescimento Intelectual | #2980B9 | opcional |
| 10 | Sabedoria | #34495E | opcional |

Cor-base = identidade da área (faixa lateral, ponto colorido). Cor-de-faixa = avaliação (preenche anel/pílula).

---

## Estrutura de navegação

```
não logado
  └─ /login

logado, não onboarded
  └─ /onboarding/cadastro
     └─ /onboarding/areas
        └─ /onboarding/autoavaliacao

logado + onboarded
  └─ (tabs)
       ├─ /          (Hoje)
       ├─ /areas     (Áreas)
       ├─ /insights  (Insights)
       └─ /config    (Configurações)

  Sub-rotas (modais com header de stack):
  ├─ /area/[id]              (detalhe da área)
  ├─ /tarefa/[id]            (editor; id=novo cria, número edita)
  ├─ /dia/[iso]              (detalhe de um dia específico)
  ├─ /alvo                   (Alvo de Vida)
  ├─ /checklist              (checklist diário, versão antiga)
  ├─ /reflexao               (reflexão diária)
  └─ /reativacao             (modal bloqueante)
```

---

## Componentes UI (`src/components/ui/`)

### `BigRing.tsx`
Anel grande central. Usa SVG com `strokeDasharray` pra arco de progresso.

```tsx
<BigRing pct={data.percentualHoje} size={232} />
```

- `size` default 232; usado também em 196 (detalhe de área e dia)
- Mostra número grande + % + label da faixa em uppercase
- Cor sai automática de `corPorPercentual(pct)`

### `MiniRing.tsx`
Versão menor (56px) usada em cards de área, com número no centro.

### `StatCard.tsx`
Card horizontal pequeno (label uppercase + valor grande + sub).

```tsx
<StatCard label="7d %" value={`${data.percentualGeral}%`} sub="média" />
```

Usado em linhas de 3 (Hoje, Detalhe da Área).

### `StatusGlyph.tsx`
Ícone de status da tarefa: open (○), done (✓ verde), half (◐ amarelo), fail (✗ vermelho).

### `TaskRow.tsx`
Linha de tarefa: status + horário + nome + (atrasada?) + peso + dot da área.

```tsx
<TaskRow
  status="done"
  title="Treino"
  time="06:30"
  areaColor="#2E8B57"
  weight={3}
  late={false}
  onPress={() => router.push('/checklist')}
  isLast={i === tarefas.length - 1}
/>
```

### `AreaCard.tsx`
Card grande com faixa lateral colorida, nome, % do dia + 7d, e mini-anel à direita.

### `CobrancaBanner.tsx`
Banner vermelho-escuro com tag em uppercase + mensagem direta. Aparece quando `mediocridade.faixa !== 'limpo'`.

### `PageHeader.tsx`
Cabeçalho padrão das telas: kicker uppercase fraco + título 32pt 800.

```tsx
<PageHeader kicker="suas dimensões" title="Áreas" />
```

### `TabIcon.tsx`
Ionicons mapeados:
- `ring` → `radio-button-on-outline`
- `grid` → `grid-outline`
- `chart` → `analytics-outline`
- `gear` → `settings-outline`

### `ConfigGroup.tsx` + `ConfigRow.tsx`
Padrão das listas em Configurações. Cada `ConfigGroup` tem label uppercase no topo, card arredondado embaixo. Cada `ConfigRow` aceita:
- `icon` (Ionicons name) ou `colorBox` (cor sólida)
- `value` (texto à direita) **ou** `toggle` (Switch) **ou** `onPress` (vira chevron)
- `danger` (texto vermelho)

---

## Padrões de layout

| Elemento | Valor |
|---|---|
| Padding lateral de seção | 16-20px (cards), 24px (headers/labels) |
| Raio de cards/anéis | 12-16px |
| Border de cards | `StyleSheet.hairlineWidth` (linha fina) |
| Tipografia título | 28-32pt, weight 800, letterSpacing -0.4 a -0.6 |
| Tipografia hero (% do dia) | size * 0.31, weight 800, letterSpacing -2 |
| Tipografia kicker | 11pt, weight 600-700, letterSpacing 1.2, uppercase, cor `textoFraco` |
| Tipografia label de seção | 11pt, weight 700, letterSpacing 1.2, uppercase |

---

## Anti-patterns (NÃO fazer)

- Sem palavras motivacionais vazias ("Você consegue!", "Acredite!").
- Sem comemoração de pouco esforço (sem ribbon, badge, troféu, fogos).
- Sem esconder dados ruins. Marrom no dia 1 sem desculpa.
- Sem emoji nas labels. Ionicons quando substituem texto.
- Sem gradientes açucarados. Cor sólida sempre.
- Sem onboarding fofinho. Funcional e direto.
- Sem perguntar feedback emocional ("como você se sente?").

---

## Referências

- Mockups web React originais que orientaram esse design: `screens/*.jsx` (não fazem parte do app — foram só guias visuais gerados pelo Claude Design).
- Brief do prompt de design: histórico em `docs/06-sync-e-auth.md` e na conversa do Claude.
