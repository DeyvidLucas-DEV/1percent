# Schema de Dados — SQLite

Todas as datas são armazenadas como `TEXT` no formato ISO `YYYY-MM-DD` (data) ou `YYYY-MM-DDTHH:mm:ss` (timestamp). Isso simplifica comparação e ordenação sem `DATETIME` do SQLite.

## Tabelas

### `users` (sempre 1 linha)

```sql
CREATE TABLE users (
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
```

Restrição `CHECK (id = 1)` garante que só existe 1 usuário (app pessoal).

### `areas` (10 linhas, semeadas no setup)

```sql
CREATE TABLE areas (
  id              INTEGER PRIMARY KEY,
  slug            TEXT    NOT NULL UNIQUE,         -- 'espiritual', 'saude_fisica', etc.
  nome            TEXT    NOT NULL,
  cor_base        TEXT    NOT NULL,                 -- hex pra fatia da pizza
  obrigatoria     INTEGER NOT NULL DEFAULT 0,       -- 0/1
  ordem           INTEGER NOT NULL,
  ativa           INTEGER NOT NULL DEFAULT 1,       -- 0/1 — usuário pode pausar
  paused_until    TEXT,                             -- data até quando está pausada
  pause_reason    TEXT,
  peso_global     INTEGER NOT NULL DEFAULT 1        -- 1=normal, 2=foco, 3=prioridade máx
);
```

### `tarefas` (templates de hábitos do usuário)

```sql
CREATE TABLE tarefas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id         INTEGER NOT NULL REFERENCES areas(id),
  nome            TEXT    NOT NULL,
  peso            INTEGER NOT NULL DEFAULT 1 CHECK (peso BETWEEN 1 AND 3),
  frequencia      TEXT    NOT NULL CHECK (frequencia IN ('diaria','semanal','mensal')),
  alvo_count      INTEGER NOT NULL DEFAULT 1,       -- ex: 3 para "3x na semana"
  ativa           INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL
);
```

### `execucoes` (log diário — uma linha por tarefa por dia)

```sql
CREATE TABLE execucoes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tarefa_id       INTEGER NOT NULL REFERENCES tarefas(id),
  data            TEXT    NOT NULL,                  -- 'YYYY-MM-DD'
  status          TEXT    NOT NULL CHECK (status IN ('concluido','parcial','nao_feito')),
  created_at      TEXT    NOT NULL,
  UNIQUE(tarefa_id, data)
);

CREATE INDEX idx_execucoes_data ON execucoes(data);
CREATE INDEX idx_execucoes_tarefa ON execucoes(tarefa_id);
```

### `reflexoes_diarias`

```sql
CREATE TABLE reflexoes_diarias (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  data            TEXT    NOT NULL UNIQUE,
  pergunta        TEXT    NOT NULL,
  resposta        TEXT,
  created_at      TEXT    NOT NULL
);
```

### `autoavaliacao_inicial` (snapshot do onboarding, 1 nota por área)

```sql
CREATE TABLE autoavaliacao_inicial (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id         INTEGER NOT NULL REFERENCES areas(id),
  nota            INTEGER NOT NULL CHECK (nota BETWEEN 0 AND 10),
  created_at      TEXT    NOT NULL,
  UNIQUE(area_id)
);
```

### `eventos` (auditoria leve — pulos, reativações, alertas mostrados)

```sql
CREATE TABLE eventos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  data            TEXT    NOT NULL,
  tipo            TEXT    NOT NULL,                  -- 'dia_pulado','reativacao','alerta_mediocridade','area_pausada'
  payload_json    TEXT,
  created_at      TEXT    NOT NULL
);
```

Útil pra reconstruir o histórico de cobrança, justificar tom do app, debugar.

## O que NÃO está em tabela

Cálculos como `% por área`, `intensidade detectada hoje`, `streak atual` são **derivados** das `execucoes`. Calculamos sob demanda em `src/domain/`. Se virar gargalo, adicionamos `snapshots_diarios` como cache. No MVP, dispensamos.

## Relacionamentos (resumo)

```
users (1)
  ↓
areas (10) ←── tarefas (N) ←── execucoes (N)
                                       ↑
                       reflexoes_diarias (independente)
                       autoavaliacao_inicial (FK area)
                       eventos (timeline)
```
