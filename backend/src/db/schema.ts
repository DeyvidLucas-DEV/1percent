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
