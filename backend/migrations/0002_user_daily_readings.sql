-- Migração: leitura emocional diária derivada do daily-note.
-- Aplicar no Postgres da Railway via `bun run db:push` (drizzle-kit).
-- Este arquivo existe como fallback se db:push falhar com 42P16 em
-- projeto com dado real (já vimos isso antes em outras migrações).
--
-- Disciplina: tabela pessoal => PK composta (user_id, id), FK CASCADE,
-- toda query do app filtra por user_id do JWT (ver routes/ai.ts e
-- routes/memory.ts). user_id JAMAIS vem do body.

CREATE TABLE IF NOT EXISTS user_daily_readings (
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id               uuid NOT NULL,
  data             text NOT NULL,
  humor_score      real NOT NULL,
  humor_rotulo     text NOT NULL,
  sinal_alerta     boolean NOT NULL DEFAULT false,
  source_event_id  uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_daily_readings_user_data
  ON user_daily_readings (user_id, data);

CREATE INDEX IF NOT EXISTS idx_daily_readings_user_data
  ON user_daily_readings (user_id, data);
