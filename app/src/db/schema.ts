import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'app1percent.db';

export type Db = SQLite.SQLiteDatabase;

let _db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');
  return _db;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  nome            TEXT    NOT NULL,
  idade           INTEGER NOT NULL,
  sexo            TEXT    NOT NULL CHECK (sexo IN ('M','F','O')),
  peso_kg         REAL    NOT NULL,
  altura_cm       INTEGER NOT NULL,
  estado_civil    TEXT    NOT NULL,
  filhos          INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL,
  onboarded_at    TEXT
);

CREATE TABLE IF NOT EXISTS areas (
  id              INTEGER PRIMARY KEY,
  slug            TEXT    NOT NULL UNIQUE,
  nome            TEXT    NOT NULL,
  cor_base        TEXT    NOT NULL,
  obrigatoria     INTEGER NOT NULL DEFAULT 0,
  ordem           INTEGER NOT NULL,
  ativa           INTEGER NOT NULL DEFAULT 1,
  paused_until    TEXT,
  pause_reason    TEXT,
  peso_global     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tarefas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id         INTEGER NOT NULL REFERENCES areas(id),
  nome            TEXT    NOT NULL,
  peso            INTEGER NOT NULL DEFAULT 1 CHECK (peso BETWEEN 1 AND 3),
  frequencia      TEXT    NOT NULL CHECK (frequencia IN ('diaria','semanal','mensal')),
  alvo_count      INTEGER NOT NULL DEFAULT 1,
  ativa           INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS execucoes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tarefa_id       INTEGER NOT NULL REFERENCES tarefas(id),
  data            TEXT    NOT NULL,
  status          TEXT    NOT NULL CHECK (status IN ('concluido','parcial','nao_feito')),
  created_at      TEXT    NOT NULL,
  UNIQUE(tarefa_id, data)
);

CREATE INDEX IF NOT EXISTS idx_execucoes_data    ON execucoes(data);
CREATE INDEX IF NOT EXISTS idx_execucoes_tarefa  ON execucoes(tarefa_id);

CREATE TABLE IF NOT EXISTS reflexoes_diarias (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  data            TEXT    NOT NULL UNIQUE,
  pergunta        TEXT    NOT NULL,
  resposta        TEXT,
  created_at      TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS autoavaliacao_inicial (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id         INTEGER NOT NULL REFERENCES areas(id),
  nota            INTEGER NOT NULL CHECK (nota BETWEEN 0 AND 10),
  created_at      TEXT    NOT NULL,
  UNIQUE(area_id)
);

CREATE TABLE IF NOT EXISTS eventos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  data            TEXT    NOT NULL,
  tipo            TEXT    NOT NULL,
  payload_json    TEXT,
  created_at      TEXT    NOT NULL
);
`;

export async function initSchema(): Promise<void> {
  const db = await getDb();
  await db.execAsync(SCHEMA_SQL);
}
