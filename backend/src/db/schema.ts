import {
  pgTable,
  uuid,
  text,
  integer,
  smallint,
  real,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
  boolean,
  jsonb,
  vector,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: text('provider', { enum: ['apple', 'google', 'email'] }).notNull(),
    providerSub: text('provider_sub').notNull(),
    email: text('email'),
    nome: text('nome'),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerSubUnique: uniqueIndex('users_provider_sub_unique').on(t.provider, t.providerSub),
  })
);

export const areas = pgTable(
  'areas',
  {
    id: integer('id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    nome: text('nome').notNull(),
    corBase: text('cor_base').notNull(),
    obrigatoria: smallint('obrigatoria').notNull(),
    ordem: integer('ordem').notNull(),
    ativa: smallint('ativa').notNull(),
    pausedUntil: text('paused_until'),
    pauseReason: text('pause_reason'),
    pesoGlobal: real('peso_global').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.id] }) })
);

export const tarefas = pgTable(
  'tarefas',
  {
    id: integer('id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    areaId: integer('area_id').notNull(),
    nome: text('nome').notNull(),
    peso: smallint('peso').notNull(),
    frequencia: text('frequencia').notNull(),
    alvoCount: integer('alvo_count').notNull(),
    ativa: smallint('ativa').notNull(),
    horario: text('horario'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.id] }) })
);

export const execucoes = pgTable(
  'execucoes',
  {
    id: integer('id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tarefaId: integer('tarefa_id').notNull(),
    data: text('data').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.id] }) })
);

export const reflexoesDiarias = pgTable(
  'reflexoes_diarias',
  {
    id: integer('id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    data: text('data').notNull(),
    pergunta: text('pergunta').notNull(),
    resposta: text('resposta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.id] }) })
);

export const autoavaliacaoInicial = pgTable(
  'autoavaliacao_inicial',
  {
    areaId: integer('area_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nota: integer('nota').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.areaId] }) })
);

export const eventos = pgTable(
  'eventos',
  {
    id: integer('id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    data: text('data').notNull(),
    tipo: text('tipo').notNull(),
    payloadJson: text('payload_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.id] }) })
);

// Trilha longitudinal do usuário (v3 §4.2). Append-only e idempotente por
// (user_id, id UUID). NÃO usar last-write-wins — eventos não são editáveis.
export const userTrailEvents = pgTable(
  'user_trail_events',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    id: uuid('id').notNull(),
    tipo: text('tipo').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
    source: text('source').notNull(),
    areaId: integer('area_id'),
    tarefaId: integer('tarefa_id'),
    sessionId: text('session_id'),
    deviceId: text('device_id'),
    payloadJson: jsonb('payload_json').notNull().default(sql`'{}'::jsonb`),
    privacyLevel: text('privacy_level').notNull().default('private'),
    schemaVersion: integer('schema_version').notNull().default(1),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.id] }),
    idxUserTime: index('idx_trail_user_time').on(t.userId, t.occurredAt.desc()),
    idxUserTipoTime: index('idx_trail_user_tipo_time').on(t.userId, t.tipo, t.occurredAt.desc()),
  })
);

// Memória estruturada do usuário (v3 §4.3). Fatos estáveis e auditáveis.
// Usuário pode editar/apagar (rota PATCH/DELETE /memory/facts/:id).
export const userMemoryFacts = pgTable(
  'user_memory_facts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    id: uuid('id').notNull(),
    categoria: text('categoria').notNull(),
    chave: text('chave').notNull(),
    valor: text('valor').notNull(),
    confianca: text('confianca').notNull().default('media'),
    origemEventId: uuid('origem_event_id'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastConfirmedAt: timestamp('last_confirmed_at', { withTimezone: true }),
    active: boolean('active').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.id] }),
    uniqCategoriaChave: uniqueIndex('uniq_facts_user_categoria_chave').on(t.userId, t.categoria, t.chave),
    idxUserCategoria: index('idx_facts_user_categoria').on(t.userId, t.categoria, t.active),
  })
);

// Episódios de memória — narrativas curtas geradas pela IA com embedding
// (text-embedding-3-small, 1536d) pra retrieval por similaridade. Cada
// daily_note_submitted que produz episódio (importanceScore > 0) gera uma
// linha aqui. O retrieval é exato (KNN com WHERE user_id) — escala fina
// pra dezenas/centenas de episódios por usuário; ANN só vira necessário
// quando passar de ~10k.
export const userMemoryEpisodes = pgTable(
  'user_memory_episodes',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    id: uuid('id').notNull(),
    sourceEventId: uuid('source_event_id').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    titulo: text('titulo').notNull(),
    resumo: text('resumo').notNull(),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    areaSlugs: text('area_slugs').array().notNull().default(sql`'{}'::text[]`),
    importanceScore: real('importance_score').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.id] }),
    idxUserTime: index('idx_episodes_user_time').on(t.userId, t.occurredAt.desc()),
  })
);

// Leitura emocional do dia. Uma linha por usuário por dia (UNIQUE user_id+data),
// last-write-wins: o último daily-note sobrescreve a leitura anterior daquele dia.
// data é YYYY-MM-DD na TZ LOCAL do usuário (enviada pelo app) — servidor não
// calcula o dia a partir de timestamp UTC pra não desalinhar relato perto da
// meia-noite. Alimenta o gráfico de tendência em Insights.
export const userDailyReadings = pgTable(
  'user_daily_readings',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    id: uuid('id').notNull(),
    data: text('data').notNull(),
    humorScore: real('humor_score').notNull(),
    humorRotulo: text('humor_rotulo').notNull(),
    sinalAlerta: boolean('sinal_alerta').notNull().default(false),
    sourceEventId: uuid('source_event_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.id] }),
    uniqUserData: uniqueIndex('uniq_daily_readings_user_data').on(t.userId, t.data),
    idxUserData: index('idx_daily_readings_user_data').on(t.userId, t.data),
  })
);

// ─── CAMADA GLOBAL ────────────────────────────────────────────────────
// Conhecimento compartilhado: livros, princípios, frameworks. SEM user_id —
// é o ÚNICO escopo que pode ser buscado vetorialmente sem filtro de pessoa.
// Helper de retrieval correspondente: retrieveSharedKnowledge em ai/retrieval.ts.
// JAMAIS misturar com user_memory_episodes em uma mesma query.
export const sharedKnowledge = pgTable(
  'shared_knowledge',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fonte: text('fonte').notNull(),           // ex: "Eclesiastes 11:6", "Atomic Habits — cap 3"
    trecho: text('trecho').notNull(),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

// Não sincronizada — controle de custo/abuso só faz sentido server-side.
export const rateLimits = pgTable(
  'rate_limits',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    bucket: text('bucket').notNull(),
    janelaInicio: timestamp('janela_inicio', { withTimezone: true }).notNull(),
    contagem: integer('contagem').notNull().default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.bucket, t.janelaInicio] }) })
);
