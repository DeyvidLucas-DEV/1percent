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

CREATE TABLE IF NOT EXISTS sync_state (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  last_pull_at    TEXT
);
INSERT OR IGNORE INTO sync_state (id, last_pull_at) VALUES (1, NULL);
`;

const TABELAS_SYNC = ['areas', 'tarefas', 'execucoes', 'reflexoes_diarias', 'autoavaliacao_inicial', 'eventos'] as const;

async function colunaExiste(db: Db, tabela: string, coluna: string): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tabela})`);
  return rows.some(r => r.name === coluna);
}

async function rodarMigracoes(db: Db): Promise<void> {
  for (const t of TABELAS_SYNC) {
    if (!(await colunaExiste(db, t, 'updated_at'))) {
      await db.execAsync(`ALTER TABLE ${t} ADD COLUMN updated_at TEXT`);
      await db.execAsync(`UPDATE ${t} SET updated_at = COALESCE(created_at, datetime('now')) WHERE updated_at IS NULL`);
    }
    if (!(await colunaExiste(db, t, 'synced_at'))) {
      await db.execAsync(`ALTER TABLE ${t} ADD COLUMN synced_at TEXT`);
    }
  }

  // Triggers que mantêm updated_at em dia automaticamente.
  // - INSERT: se a linha entrou sem updated_at, preenche agora.
  // - UPDATE: se ninguém mudou updated_at na operação, preenche.
  // O `IS` lida com NULL corretamente (= não compara NULL).
  for (const t of TABELAS_SYNC) {
    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS ${t}_updated_at_ins
      AFTER INSERT ON ${t}
      FOR EACH ROW
      WHEN NEW.updated_at IS NULL
      BEGIN
        UPDATE ${t} SET updated_at = datetime('now') WHERE rowid = NEW.rowid;
      END;
    `);
    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS ${t}_updated_at_upd
      AFTER UPDATE ON ${t}
      FOR EACH ROW
      WHEN OLD.updated_at IS NEW.updated_at
      BEGIN
        UPDATE ${t} SET updated_at = datetime('now') WHERE rowid = NEW.rowid;
      END;
    `);
  }
}

export async function initSchema(): Promise<void> {
  const db = await getDb();
  await db.execAsync(SCHEMA_SQL);
  await rodarMigracoes(db);
}
