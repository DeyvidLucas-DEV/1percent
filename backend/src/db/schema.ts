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
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: text('provider', { enum: ['apple', 'google'] }).notNull(),
    providerSub: text('provider_sub').notNull(),
    email: text('email'),
    nome: text('nome'),
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
