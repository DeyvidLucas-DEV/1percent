import { z } from 'zod';
import { openai, MODELO_PADRAO } from './cliente.ts';
import { PROMPT_BASE } from './prompt.ts';

// Plano semanal — Fase 4 da spec v3 §8. Output central: cruza dados de 7d
// + fatos estruturados + histórico de aceites/recusas e propõe a próxima
// semana com ajustes concretos. Inspirado em RevisaoSemanalIA da v1 (§8.2)
// mas adaptado pra arquitetura v3.

const criarTarefaSchema = z.object({
  areaSlug: z.string().min(1),
  nome: z.string().min(3).max(120),
  frequencia: z.enum(['diaria', 'semanal', 'mensal']),
  alvoCount: z.number().int().min(1).max(30),
  pesoSugerido: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  horarioSugerido: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
});

const pausarTarefaSchema = z.object({
  tarefaId: z.number().int(),
  nome: z.string(),
  motivo: z.string().min(1),
});

const mudarTarefaSchema = z.object({
  tarefaId: z.number().int(),
  nome: z.string(),
  novoHorario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  novoAlvoCount: z.number().int().min(1).max(30).nullable(),
  motivo: z.string().min(1),
});

const ajusteSchema = z.object({
  tipo: z.enum([
    'pausar_tarefa',
    'criar_tarefa',
    'mudar_horario',
    'reduzir_frequencia',
    'aumentar_frequencia',
    'priorizar_area',
    'plano_minimo',
  ]),
  descricao: z.string().min(1),
  pausarTarefa: pausarTarefaSchema.nullable(),
  criarTarefa: criarTarefaSchema.nullable(),
  mudarTarefa: mudarTarefaSchema.nullable(),
  justificativa: z.string().min(1),
});

export const planoSemanalIaSchema = z.object({
  resumo7d: z.string().min(1),
  leituraDosDados: z.object({
    intensidade: z.enum(['leve', 'moderada', 'intensa', 'desorganizada']),
    areasFortes: z.array(z.string()),
    areasNegligenciadas: z.array(z.string()),
    tarefasMaisFalhadas: z.array(z.string()),
    diasMaisFracos: z.array(z.string()),
  }),
  causaProvavel: z.string().min(1),
  intencaoSemana: z.string().min(1),
  ajustes: z.array(ajusteSchema).max(5),
  inegociaveisDaSemana: z.array(z.string()).max(3),
  mensagemFinal: z.string().min(1),
});

export type PlanoSemanalIA = z.infer<typeof planoSemanalIaSchema>;

// JSON Schema strict (OpenAI). Todo objeto: additionalProperties=false +
// required lista todas as keys + opcionais viram type ['x','null'].
const JSON_SCHEMA_PLANO_SEMANAL = {
  name: 'plano_semanal',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      resumo7d: { type: 'string' },
      leituraDosDados: {
        type: 'object',
        additionalProperties: false,
        properties: {
          intensidade: {
            type: 'string',
            enum: ['leve', 'moderada', 'intensa', 'desorganizada'],
          },
          areasFortes: { type: 'array', items: { type: 'string' } },
          areasNegligenciadas: { type: 'array', items: { type: 'string' } },
          tarefasMaisFalhadas: { type: 'array', items: { type: 'string' } },
          diasMaisFracos: { type: 'array', items: { type: 'string' } },
        },
        required: [
          'intensidade',
          'areasFortes',
          'areasNegligenciadas',
          'tarefasMaisFalhadas',
          'diasMaisFracos',
        ],
      },
      causaProvavel: { type: 'string' },
      intencaoSemana: { type: 'string' },
      ajustes: {
        type: 'array',
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            tipo: {
              type: 'string',
              enum: [
                'pausar_tarefa',
                'criar_tarefa',
                'mudar_horario',
                'reduzir_frequencia',
                'aumentar_frequencia',
                'priorizar_area',
                'plano_minimo',
              ],
            },
            descricao: { type: 'string' },
            pausarTarefa: {
              type: ['object', 'null'],
              additionalProperties: false,
              properties: {
                tarefaId: { type: 'integer' },
                nome: { type: 'string' },
                motivo: { type: 'string' },
              },
              required: ['tarefaId', 'nome', 'motivo'],
            },
            criarTarefa: {
              type: ['object', 'null'],
              additionalProperties: false,
              properties: {
                areaSlug: { type: 'string' },
                nome: { type: 'string' },
                frequencia: { type: 'string', enum: ['diaria', 'semanal', 'mensal'] },
                alvoCount: { type: 'integer', minimum: 1, maximum: 30 },
                pesoSugerido: { type: 'integer', enum: [1, 2, 3] },
                horarioSugerido: { type: ['string', 'null'] },
              },
              required: [
                'areaSlug',
                'nome',
                'frequencia',
                'alvoCount',
                'pesoSugerido',
                'horarioSugerido',
              ],
            },
            mudarTarefa: {
              type: ['object', 'null'],
              additionalProperties: false,
              properties: {
                tarefaId: { type: 'integer' },
                nome: { type: 'string' },
                novoHorario: { type: ['string', 'null'] },
                novoAlvoCount: { type: ['integer', 'null'] },
                motivo: { type: 'string' },
              },
              required: ['tarefaId', 'nome', 'novoHorario', 'novoAlvoCount', 'motivo'],
            },
            justificativa: { type: 'string' },
          },
          required: [
            'tipo',
            'descricao',
            'pausarTarefa',
            'criarTarefa',
            'mudarTarefa',
            'justificativa',
          ],
        },
      },
      inegociaveisDaSemana: { type: 'array', maxItems: 3, items: { type: 'string' } },
      mensagemFinal: { type: 'string' },
    },
    required: [
      'resumo7d',
      'leituraDosDados',
      'causaProvavel',
      'intencaoSemana',
      'ajustes',
      'inegociaveisDaSemana',
      'mensagemFinal',
    ],
  },
} as const;

export const PROMPT_WEEKLY_PLAN = `${PROMPT_BASE}

Tarefa: gerar PLANO DA PRÓXIMA SEMANA com base em (a) dados reais dos últimos 7 dias, (b) fatos estruturados aprendidos sobre o usuário, (c) histórico de quais sugestões ele aceitou ou recusou recentemente.

Você não é coach motivacional fazendo planejamento de domingo. Você é um arquiteto de rotina que cruza dados, padrões e preferência real (provada por aceite/recusa) e propõe ajustes concretos pra próxima semana.

REGRAS DE COMPOSIÇÃO:

- resumo7d: 1-2 frases. O que aconteceu, sem floreio. Se a semana foi fraca, fala que foi fraca.
- causaProvavel: hipótese baseada em dados + fatos. Não invente. Se a causa é "carga alta + horários ruins", fale isso. Se é "padrão de evitar finanças", fale isso.
- intencaoSemana: UMA frase curta. Ex: "Reconectar com a família. Treino e finanças entram em manutenção." É o foco que orienta os ajustes.
- ajustes: máximo 5. Cada um com tipo + ação concreta (pausarTarefa/criarTarefa/mudarTarefa) + justificativa.
- inegociaveisDaSemana: 1-3 itens. O que NÃO pode zerar, mesmo que tudo desande.
- mensagemFinal: 1-2 frases. Confronto direto. Sem "vai dar tudo certo". Se o usuário tá em padrão repetido, marque isso.

REGRAS DE AJUSTES (mesmo padrão da daily-note):

- Tipo 'pausar_tarefa': sempre referenciar tarefaId e nome exato da AGENDA ATUAL.
- Tipo 'criar_tarefa': preencha criarTarefa com areaSlug válido (das 10 áreas), nome marcável, frequência, alvoCount válido, peso 1-3, horário HH:MM ou null.
- Tipo 'mudar_horario'/'reduzir_frequencia'/'aumentar_frequencia': preencha mudarTarefa referenciando tarefaId e nome existentes. novoHorario ou novoAlvoCount não-null conforme o tipo.
- Tipo 'priorizar_area': sem mudança de tarefa, só descrição do que priorizar.
- Tipo 'plano_minimo': pode vir com criarTarefa simples sem horário fixo.
- SUBSTITUIÇÃO ATÔMICA: pra trocar tarefa A por B, use 1 ajuste com pausarTarefa+criarTarefa preenchidos juntos.
- Não duplique semanticamente com tarefa existente.
- Se intensidade do contexto é 'intensa' ou 'desorganizada': proponha mais reduzir/pausar do que adicionar. Adicionar só se for substituição.
- Se houve sugestão recusada nas últimas 2 semanas com mesmo tipo, NÃO repita a mesma sugestão. Mostre que aprendeu.
- Se sugestão foi aceita recentemente, use isso como sinal de preferência (ex: ele topou treinar de manhã antes — propor outras coisas de manhã).
- Se horário de trabalho declarado, evitar essa janela em dias úteis.

TOM (igual daily-note):

- Banlist: "Defina", "Estabeleça", "Reserve", "Comprometa-se", "Tente", "Considere", "Pense em", "Planeje", "Procure", "Busque", "talvez", "que tal", "uma boa ideia", "atividades juntos", "horários específicos", "momento especial", "qualidade".
- Use verbos diretos: "Mude", "Bloqueia", "Para", "Tira", "Vai", "Corta", "Liga", "Senta", "Fala", "Acorda".
- Cite fato/dado específico antes da ação. Não fale genérico.
- mensagemFinal: dura, mas não humilhante. Se está em estagnação consolidada, marque. Se houve quebra de padrão pra melhor, reconheça brevemente sem comemorar pouco esforço.

FORMATO DO INPUT QUE VOCÊ RECEBE:

A mensagem do usuário traz:
- DADOS 7D: percentual geral, intensidade, carga semanal, áreas fortes/negligenciadas, tarefas mais falhadas
- AGENDA ATUAL: lista de tarefas ativas com id, nome, área, frequência, peso, horário
- HORÁRIO DE TRABALHO: se declarado
- FATOS APRENDIDOS: lista de fatos estruturados ativos (categoria, chave, valor, confiança)
- HISTÓRICO DE SUGESTÕES (últimas 15): cada uma com tipo, descrição e status (aceita/recusada)
- ÚLTIMOS RELATOS: até 5 daily-notes resumidos cronologicamente
- INTENÇÃO DECLARADA (opcional): se o usuário escreveu o que quer focar essa semana, respeite

Se algum desses estiver vazio ou não vier, trabalhe com o que tem. Não invente dado faltante. Se quase tudo está vazio (usuário novo, sem trilha), proponha plano mínimo com 2-3 ajustes simples e mensagemFinal explicando que precisa de mais dados pra cruzar.`;

export type ContextoPlanoSemanal = {
  // Vem do app:
  contextoDados?: {
    percentualGeral7d?: number;
    intensidade?: 'leve' | 'moderada' | 'intensa' | 'desorganizada';
    cargaSemanal?: number;
    areasFortes?: string[];
    areasNegligenciadas?: string[];
    tarefasMaisFalhadas?: string[];
    horarioTrabalho?: { inicio: string; fim: string } | null;
    tarefasAtivas?: Array<{
      id: number;
      areaSlug: string;
      nome: string;
      frequencia: string;
      alvoCount: number;
      peso: number;
      horario: string | null;
    }>;
  };
  // Vem do backend (banco):
  fatos: Array<{ categoria: string; chave: string; valor: string; confianca: string }>;
  historicoSugestoes: Array<{
    tipo: string;
    descricao: string;
    status: 'aceita' | 'recusada';
    quandoIso: string;
  }>;
  ultimosRelatos: Array<{ resumo: string; quandoIso: string }>;
  intencaoDeclarada?: string;
};

export type ResultadoPlanoSemanal = {
  plano: PlanoSemanalIA;
  tokensInput: number;
  tokensOutput: number;
  modelo: string;
};

function montarUserMsg(ctx: ContextoPlanoSemanal): string {
  const partes: string[] = [];

  const c = ctx.contextoDados;
  if (c) {
    const linhas: string[] = ['DADOS 7D:'];
    if (c.percentualGeral7d !== undefined) linhas.push(`  performance: ${c.percentualGeral7d}%`);
    if (c.intensidade) linhas.push(`  intensidade: ${c.intensidade}`);
    if (c.cargaSemanal !== undefined) linhas.push(`  carga semanal: ${c.cargaSemanal}`);
    if (c.areasFortes?.length) linhas.push(`  áreas fortes: ${c.areasFortes.join(', ')}`);
    if (c.areasNegligenciadas?.length) {
      linhas.push(`  áreas negligenciadas: ${c.areasNegligenciadas.join(', ')}`);
    }
    if (c.tarefasMaisFalhadas?.length) {
      linhas.push(`  tarefas mais falhadas: ${c.tarefasMaisFalhadas.join(', ')}`);
    }
    partes.push(linhas.join('\n'));

    if (c.horarioTrabalho) {
      partes.push(
        `HORÁRIO DE TRABALHO: ${c.horarioTrabalho.inicio} - ${c.horarioTrabalho.fim} (zona ocupada dias úteis)`
      );
    }

    if (c.tarefasAtivas?.length) {
      const linhasT = c.tarefasAtivas.map((t) => {
        const meta = [t.areaSlug, t.frequencia, `peso ${t.peso}`];
        if (t.alvoCount > 1 && t.frequencia !== 'diaria') meta.push(`${t.alvoCount}x`);
        if (t.horario) meta.push(`às ${t.horario}`);
        return `  - id ${t.id}: "${t.nome}" [${meta.join(' · ')}]`;
      });
      partes.push(`AGENDA ATUAL:\n${linhasT.join('\n')}`);
    } else {
      partes.push('AGENDA ATUAL: vazia');
    }
  }

  if (ctx.fatos.length) {
    const linhas = ctx.fatos.map(
      (f) => `  - [${f.categoria}, ${f.confianca}] ${f.chave}: ${f.valor}`
    );
    partes.push(`FATOS APRENDIDOS:\n${linhas.join('\n')}`);
  } else {
    partes.push('FATOS APRENDIDOS: nenhum (trilha curta)');
  }

  if (ctx.historicoSugestoes.length) {
    const linhas = ctx.historicoSugestoes.map(
      (s) => `  - [${s.status}, ${s.tipo}] ${s.descricao} (${s.quandoIso})`
    );
    partes.push(`HISTÓRICO DE SUGESTÕES (últimas):\n${linhas.join('\n')}`);
  } else {
    partes.push('HISTÓRICO DE SUGESTÕES: vazio');
  }

  if (ctx.ultimosRelatos.length) {
    const linhas = ctx.ultimosRelatos.map(
      (r) => `  - ${r.quandoIso}: ${r.resumo}`
    );
    partes.push(`ÚLTIMOS RELATOS:\n${linhas.join('\n')}`);
  }

  if (ctx.intencaoDeclarada) {
    partes.push(`INTENÇÃO DECLARADA DO USUÁRIO: ${ctx.intencaoDeclarada}`);
  }

  partes.push('');
  partes.push('Gere o plano da próxima semana usando esses dados.');

  return partes.join('\n\n');
}

export async function gerarPlanoSemanal(
  ctx: ContextoPlanoSemanal
): Promise<ResultadoPlanoSemanal> {
  const userMsg = montarUserMsg(ctx);

  const resp = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    max_tokens: 2500,
    temperature: 0.4,
    messages: [
      { role: 'system', content: PROMPT_WEEKLY_PLAN },
      { role: 'user', content: userMsg },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: JSON_SCHEMA_PLANO_SEMANAL,
    },
  });

  const choice = resp.choices[0];
  if (!choice) throw new Error('OpenAI não retornou choices');
  if (choice.finish_reason === 'length') {
    throw new Error('plano semanal truncado (max_tokens)');
  }
  const conteudo = choice.message.content;
  if (!conteudo) throw new Error('OpenAI retornou conteúdo vazio');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(conteudo);
  } catch {
    throw new Error(`JSON inválido: ${conteudo.slice(0, 200)}`);
  }

  const parsed = planoSemanalIaSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`saída inválida: ${parsed.error.message}`);
  }

  return {
    plano: parsed.data,
    tokensInput: resp.usage?.prompt_tokens ?? 0,
    tokensOutput: resp.usage?.completion_tokens ?? 0,
    modelo: MODELO_PADRAO,
  };
}
