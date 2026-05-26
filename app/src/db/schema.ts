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
  onboarded_at    TEXT,
  horario_trabalho_inicio TEXT,
  horario_trabalho_fim    TEXT
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

-- Trilha longitudinal do usuário (v3 §4.1). Append-only, UUID gerado no app.
-- NÃO entra em TABELAS_SYNC porque o sync é distinto (idempotente, sem
-- updated_at — eventos não são editáveis). Push via rota dedicada /trail/batch.
CREATE TABLE IF NOT EXISTS user_trail_events (
  id              TEXT    PRIMARY KEY,
  tipo            TEXT    NOT NULL,
  occurred_at     TEXT    NOT NULL,
  source          TEXT    NOT NULL,
  area_id         INTEGER REFERENCES areas(id),
  tarefa_id       INTEGER REFERENCES tarefas(id),
  session_id      TEXT,
  device_id       TEXT,
  payload_json    TEXT    NOT NULL DEFAULT '{}',
  privacy_level   TEXT    NOT NULL DEFAULT 'private',
  synced_at       TEXT,
  created_at      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trail_sync       ON user_trail_events(synced_at, occurred_at);
CREATE INDEX IF NOT EXISTS idx_trail_tipo_data  ON user_trail_events(tipo, occurred_at);

-- Cache local da análise semanal (gerada determinística, sem IA).
-- Só uma linha; regenerada quando passou 3+ dias desde a última.
CREATE TABLE IF NOT EXISTS analise_semanal_cache (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  gerada_em        TEXT    NOT NULL,
  destaque         TEXT,
  observacoes_json TEXT    NOT NULL
);

-- Cache local do clima (Open-Meteo + reverse geocoding). Uma linha,
-- regenerada a cada ~30min ou se mudou de cidade.
CREATE TABLE IF NOT EXISTS clima_cache (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  lat            REAL    NOT NULL,
  lon            REAL    NOT NULL,
  temperatura    REAL    NOT NULL,
  codigo         INTEGER NOT NULL,
  cidade         TEXT    NOT NULL,
  capturado_em   TEXT    NOT NULL
);
`;

const TABELAS_SYNC = ['areas', 'tarefas', 'execucoes', 'reflexoes_diarias', 'autoavaliacao_inicial', 'eventos'] as const;

// Tabelas obsoletas (do MVP v1 abandonado). Apagar idempotente em devices que
// já criaram. Não dependem de FKs externas; ordem só importa se houver REFERENCES.
const TABELAS_OBSOLETAS = ['sugestoes_rotina', 'area_diagnosticos', 'interacoes_ia'] as const;

async function colunaExiste(db: Db, tabela: string, coluna: string): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tabela})`);
  return rows.some(r => r.name === coluna);
}

async function rodarMigracoes(db: Db): Promise<void> {
  // Limpa tabelas do MVP v1 que foi abandonado em favor da arquitetura v3
  // (trilha longitudinal). Idempotente: se a tabela não existe, é no-op.
  for (const t of TABELAS_OBSOLETAS) {
    await db.execAsync(`DROP TABLE IF EXISTS ${t}`);
  }

  for (const t of TABELAS_SYNC) {
    if (!(await colunaExiste(db, t, 'updated_at'))) {
      await db.execAsync(`ALTER TABLE ${t} ADD COLUMN updated_at TEXT`);
      await db.execAsync(`UPDATE ${t} SET updated_at = COALESCE(created_at, datetime('now')) WHERE updated_at IS NULL`);
    }
    if (!(await colunaExiste(db, t, 'synced_at'))) {
      await db.execAsync(`ALTER TABLE ${t} ADD COLUMN synced_at TEXT`);
    }
  }

  // Horario por tarefa (HH:MM). NULL = sem horario fixo.
  if (!(await colunaExiste(db, 'tarefas', 'horario'))) {
    await db.execAsync(`ALTER TABLE tarefas ADD COLUMN horario TEXT`);
  }

  // Horario de trabalho do usuario. Quando preenchido, IA evita propor
  // tarefas dentro dessa janela em dias uteis.
  if (!(await colunaExiste(db, 'users', 'horario_trabalho_inicio'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN horario_trabalho_inicio TEXT`);
  }
  if (!(await colunaExiste(db, 'users', 'horario_trabalho_fim'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN horario_trabalho_fim TEXT`);
  }

  // Contexto de vida — preenchido no onboarding conversacional.
  // Determina quais áreas ativar e quais tarefas sugerir.
  if (!(await colunaExiste(db, 'users', 'trabalha'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN trabalha INTEGER`); // 0|1|null
  }
  if (!(await colunaExiste(db, 'users', 'tipo_trabalho'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN tipo_trabalho TEXT`); // clt|autonomo|empresario|servidor|freelancer
  }
  if (!(await colunaExiste(db, 'users', 'pratica_fe'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN pratica_fe INTEGER`); // 0|1|null
  }
  if (!(await colunaExiste(db, 'users', 'fe_denominacao'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN fe_denominacao TEXT`);
  }
  if (!(await colunaExiste(db, 'users', 'frequenta_comunidade'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN frequenta_comunidade INTEGER`); // 0|1|null
  }
  if (!(await colunaExiste(db, 'users', 'estuda'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN estuda INTEGER`); // 0|1|null
  }
  if (!(await colunaExiste(db, 'users', 'faz_terapia'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN faz_terapia INTEGER`); // 0|1|null
  }

  // Integração com Apple Calendar (Fase 3). Quando preenchido, o app cria
  // eventos nesse calendário ao marcar tarefa com horário.
  if (!(await colunaExiste(db, 'users', 'apple_calendar_conectado_em'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN apple_calendar_conectado_em TEXT`);
  }
  if (!(await colunaExiste(db, 'users', 'apple_calendar_id'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN apple_calendar_id TEXT`);
  }
  if (!(await colunaExiste(db, 'users', 'apple_calendar_titulo'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN apple_calendar_titulo TEXT`);
  }

  // Integração com Google Calendar (Fase 2 — backend ainda não implementado).
  // Marca só "conectado" por enquanto, ID/scope vem na próxima fase.
  if (!(await colunaExiste(db, 'users', 'google_calendar_conectado_em'))) {
    await db.execAsync(`ALTER TABLE users ADD COLUMN google_calendar_conectado_em TEXT`);
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

/**
 * Fecha a conexão atual e apaga o arquivo do SQLite local.
 * Usado em "Apagar conta" pra garantir que o próximo bootstrap começa do zero
 * (sem dados do user anterior contaminando a próxima conta).
 *
 * Após chamar, próximo `getDb()` recria o arquivo. Quem chamar é responsável
 * por chamar `initSchema()` antes de usar.
 */
export async function resetDb(): Promise<void> {
  if (_db) {
    try {
      await _db.closeAsync();
    } catch {
      // se já estiver fechado, segue
    }
    _db = null;
  }
  try {
    await SQLite.deleteDatabaseAsync(DB_NAME);
  } catch {
    // se o arquivo não existir, segue
  }
}
