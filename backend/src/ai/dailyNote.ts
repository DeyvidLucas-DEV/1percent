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

export const recomendacaoImediataSchema = z.object({
  tipo: z.enum(['plano_minimo', 'mudar_horario', 'reduzir_carga', 'priorizar_area']),
  descricao: z.string().min(1),
  exigeConfirmacao: z.literal(true),
});

export const extracaoMemoriaIaSchema = z.object({
  eventosClassificados: z.array(eventoClassificadoSchema),
  fatosCandidatos: z.array(fatoCandidatoSchema),
  episodio: episodioSchema,
  recomendacoesImediatas: z.array(recomendacaoImediataSchema).max(2),
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
        maxItems: 2,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            tipo: {
              type: 'string',
              enum: ['plano_minimo', 'mudar_horario', 'reduzir_carga', 'priorizar_area'],
            },
            descricao: { type: 'string' },
            exigeConfirmacao: { type: 'boolean', enum: [true] },
          },
          required: ['tipo', 'descricao', 'exigeConfirmacao'],
        },
      },
    },
    required: ['eventosClassificados', 'fatosCandidatos', 'episodio', 'recomendacoesImediatas'],
  },
} as const;

export type ContextoDadosUsuario = {
  percentualGeral7d?: number;
  areasFortes?: string[];
  areasNegligenciadas?: string[];
  tarefasMaisFalhadas?: string[];
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
  const userMsg = [
    input.contextoUsuario ? `Sobre o usuário: ${JSON.stringify(input.contextoUsuario)}` : null,
    input.contextoDados
      ? `Dados reais dos últimos 7 dias: ${JSON.stringify(input.contextoDados)}`
      : null,
    '',
    'Relato do usuário sobre o dia:',
    input.relatoUsuario,
  ]
    .filter(Boolean)
    .join('\n');

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
