import { z } from 'zod';
import { openai, MODELO_PADRAO } from './cliente.ts';
import { PROMPT_DAILY_NOTE } from './prompt.ts';

// Schema da spec §9 — ExtracaoMemoriaIA.

export const eventoClassificadoSchema = z.object({
  tipo: z.enum(['stressor_reported', 'routine_pattern', 'area_neglected', 'preference_signal']),
  areaSlug: z.string().nullable(),
  descricao: z.string().min(1),
  confianca: z.enum(['baixa', 'media', 'alta']),
});

export const fatoCandidatoSchema = z.object({
  categoria: z.string().min(1),
  chave: z.string().min(1).max(80),
  valor: z.string().min(1),
  confianca: z.enum(['baixa', 'media', 'alta']),
  deveConfirmarComUsuario: z.boolean(),
});

export const episodioSchema = z
  .object({
    titulo: z.string().min(1),
    resumo: z.string().min(1),
    tags: z.array(z.string()),
    areaSlugs: z.array(z.string()),
    importanceScore: z.number().min(0).max(1),
  })
  .nullable();

// Quando a recomendação tem ação concreta agendável (ex: "conversar com filha
// hoje 20:30 sem celular"), a IA preenche este objeto e o app, ao aceitar,
// cria uma tarefa real via criarTarefa() local. Validação de domínio passa
// pelo validarSugestaoTarefaIA antes de virar tarefa.
export const criarTarefaSchema = z.object({
  areaSlug: z.string().min(1),
  nome: z.string().min(3).max(120),
  frequencia: z.enum(['diaria', 'semanal', 'mensal']),
  alvoCount: z.number().int().min(1).max(30),
  pesoSugerido: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  horarioSugerido: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
});

export const pausarTarefaSchema = z.object({
  tarefaId: z.number().int(),
  nome: z.string(),
  motivo: z.string().min(1),
});

export const recomendacaoImediataSchema = z.object({
  tipo: z.enum([
    'plano_minimo',
    'mudar_horario',
    'reduzir_carga',
    'priorizar_area',
    'acao_reparadora',
    'conversa_dificil',
    'pausar_tarefa',
  ]),
  descricao: z.string().min(1),
  exigeConfirmacao: z.literal(true),
  criarTarefa: criarTarefaSchema.nullable(),
  pausarTarefa: pausarTarefaSchema.nullable(),
});

export const extracaoMemoriaIaSchema = z.object({
  eventosClassificados: z.array(eventoClassificadoSchema),
  fatosCandidatos: z.array(fatoCandidatoSchema),
  episodio: episodioSchema,
  recomendacoesImediatas: z.array(recomendacaoImediataSchema).max(3),
});

export type ExtracaoMemoriaIA = z.infer<typeof extracaoMemoriaIaSchema>;

// JSON Schema strict (OpenAI). Regras:
// - additionalProperties: false em todo objeto
// - required lista TODAS as keys
// - opcionais viram nullable + ficam em required
const JSON_SCHEMA = {
  name: 'extracao_memoria',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      eventosClassificados: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            tipo: {
              type: 'string',
              enum: ['stressor_reported', 'routine_pattern', 'area_neglected', 'preference_signal'],
            },
            areaSlug: { type: ['string', 'null'] },
            descricao: { type: 'string' },
            confianca: { type: 'string', enum: ['baixa', 'media', 'alta'] },
          },
          required: ['tipo', 'areaSlug', 'descricao', 'confianca'],
        },
      },
      fatosCandidatos: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            categoria: { type: 'string' },
            chave: { type: 'string' },
            valor: { type: 'string' },
            confianca: { type: 'string', enum: ['baixa', 'media', 'alta'] },
            deveConfirmarComUsuario: { type: 'boolean' },
          },
          required: ['categoria', 'chave', 'valor', 'confianca', 'deveConfirmarComUsuario'],
        },
      },
      episodio: {
        type: ['object', 'null'],
        additionalProperties: false,
        properties: {
          titulo: { type: 'string' },
          resumo: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          areaSlugs: { type: 'array', items: { type: 'string' } },
          importanceScore: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['titulo', 'resumo', 'tags', 'areaSlugs', 'importanceScore'],
      },
      recomendacoesImediatas: {
        type: 'array',
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            tipo: {
              type: 'string',
              enum: [
                'plano_minimo',
                'mudar_horario',
                'reduzir_carga',
                'priorizar_area',
                'acao_reparadora',
                'conversa_dificil',
                'pausar_tarefa',
              ],
            },
            descricao: { type: 'string' },
            exigeConfirmacao: { type: 'boolean', enum: [true] },
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
          },
          required: ['tipo', 'descricao', 'exigeConfirmacao', 'criarTarefa', 'pausarTarefa'],
        },
      },
    },
    required: ['eventosClassificados', 'fatosCandidatos', 'episodio', 'recomendacoesImediatas'],
  },
} as const;

export type TarefaContexto = {
  id: number;
  areaSlug: string;
  nome: string;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  alvoCount: number;
  peso: 1 | 2 | 3;
  horario: string | null;
};

export type ContextoDadosUsuario = {
  percentualGeral7d?: number;
  areasFortes?: string[];
  areasNegligenciadas?: string[];
  tarefasMaisFalhadas?: string[];
  tarefasAtivas?: TarefaContexto[];
  intensidade?: 'leve' | 'moderada' | 'intensa' | 'desorganizada';
  cargaSemanal?: number;
  horarioTrabalho?: { inicio: string; fim: string } | null;
};

export type ResultadoExtracao = {
  extracao: ExtracaoMemoriaIA;
  tokensInput: number;
  tokensOutput: number;
  modelo: string;
};

export async function gerarExtracaoMemoria(input: {
  relatoUsuario: string;
  contextoDados?: ContextoDadosUsuario;
  contextoUsuario?: { nome?: string; idade?: number; estadoCivil?: string };
}): Promise<ResultadoExtracao> {
  const ctx = input.contextoDados;
  const partes: (string | null)[] = [];

  if (input.contextoUsuario) {
    partes.push(`Sobre o usuário: ${JSON.stringify(input.contextoUsuario)}`);
  }

  if (ctx) {
    if (ctx.percentualGeral7d !== undefined) {
      partes.push(`Performance geral 7d: ${ctx.percentualGeral7d}%`);
    }
    if (ctx.intensidade) {
      partes.push(`Intensidade da semana: ${ctx.intensidade}`);
    }
    if (ctx.cargaSemanal !== undefined) {
      partes.push(`Carga semanal calculada: ${ctx.cargaSemanal}`);
    }
    if (ctx.areasNegligenciadas?.length) {
      partes.push(`Áreas negligenciadas: ${ctx.areasNegligenciadas.join(', ')}`);
    }
    if (ctx.areasFortes?.length) {
      partes.push(`Áreas fortes: ${ctx.areasFortes.join(', ')}`);
    }
    if (ctx.tarefasMaisFalhadas?.length) {
      partes.push(`Tarefas mais falhadas: ${ctx.tarefasMaisFalhadas.join(', ')}`);
    }
    if (ctx.horarioTrabalho) {
      partes.push(
        `Horário de trabalho declarado: ${ctx.horarioTrabalho.inicio} - ${ctx.horarioTrabalho.fim} (zona ocupada todos os dias úteis)`
      );
    }
    if (ctx.tarefasAtivas?.length) {
      const linhas = ctx.tarefasAtivas.map((t) => {
        const meta = [t.areaSlug, t.frequencia, `peso ${t.peso}`];
        if (t.alvoCount > 1 && t.frequencia !== 'diaria') meta.push(`${t.alvoCount}x`);
        if (t.horario) meta.push(`às ${t.horario}`);
        return `  - id ${t.id}: "${t.nome}" [${meta.join(' · ')}]`;
      });
      partes.push(`AGENDA ATUAL (tarefas ativas):\n${linhas.join('\n')}`);
    } else {
      partes.push(`AGENDA ATUAL: vazia (nenhuma tarefa ativa)`);
    }
  }

  partes.push('');
  partes.push('Relato do usuário sobre o dia:');
  partes.push(input.relatoUsuario);

  const userMsg = partes.filter((p) => p !== null).join('\n');

  const resp = await openai.chat.completions.create({
    model: MODELO_PADRAO,
    max_tokens: 1500,
    temperature: 0.3,
    messages: [
      { role: 'system', content: PROMPT_DAILY_NOTE },
      { role: 'user', content: userMsg },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: JSON_SCHEMA,
    },
  });

  const choice = resp.choices[0];
  if (!choice) throw new Error('OpenAI não retornou choices');
  if (choice.finish_reason === 'length') {
    throw new Error('resposta da IA truncada (max_tokens)');
  }
  const conteudo = choice.message.content;
  if (!conteudo) throw new Error('OpenAI retornou conteúdo vazio');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(conteudo);
  } catch {
    throw new Error(`JSON inválido: ${conteudo.slice(0, 200)}`);
  }

  const parsed = extracaoMemoriaIaSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`saída da IA inválida: ${parsed.error.message}`);
  }

  return {
    extracao: parsed.data,
    tokensInput: resp.usage?.prompt_tokens ?? 0,
    tokensOutput: resp.usage?.completion_tokens ?? 0,
    modelo: MODELO_PADRAO,
  };
}
