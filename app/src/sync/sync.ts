import { getDb } from '../db/schema';
import { api } from '../lib/api';
import { getLastPullAt, setLastPullAt } from '../db/queries/syncState';
import {
  listarEventosPendentes,
  marcarSincronizados as marcarEventosSincronizados,
} from '../db/queries/trailEvents';

// Backend devolve campos em camelCase (Drizzle ORM); local SQLite usa snake_case.
// Os tipos abaixo refletem o formato remoto.

type AreaRemota = {
  id: number;
  userId: string;
  slug: string;
  nome: string;
  corBase: string;
  obrigatoria: number;
  ordem: number;
  ativa: number;
  pausedUntil: string | null;
  pauseReason: string | null;
  pesoGlobal: number;
  updatedAt: string;
};

type TarefaRemota = {
  id: number;
  userId: string;
  areaId: number;
  nome: string;
  peso: number;
  frequencia: string;
  alvoCount: number;
  ativa: number;
  horario: string | null;
  createdAt: string;
  updatedAt: string;
};

type ExecucaoRemota = {
  id: number;
  userId: string;
  tarefaId: number;
  data: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ReflexaoRemota = {
  id: number;
  userId: string;
  data: string;
  pergunta: string;
  resposta: string | null;
  createdAt: string;
  updatedAt: string;
};

type AutoavRemota = {
  areaId: number;
  userId: string;
  nota: number;
  createdAt: string;
  updatedAt: string;
};

type EventoRemoto = {
  id: number;
  userId: string;
  data: string;
  tipo: string;
  payloadJson: string | null;
  createdAt: string;
  updatedAt: string;
};

type PullResponse = {
  serverNow: string;
  areas: AreaRemota[];
  tarefas: TarefaRemota[];
  execucoes: ExecucaoRemota[];
  reflexoes: ReflexaoRemota[];
  autoavaliacao: AutoavRemota[];
  eventos: EventoRemoto[];
};

export type ResultadoSync = {
  puxados: number;
  enviados: number;
  serverNow: string;
};

// ─── PULL ──────────────────────────────────────────────────────────

type BindValue = string | number | null;

async function aplicarLinhaSeNova(
  tabela: string,
  pkSql: string,
  pkValues: BindValue[],
  remoteUpdatedAt: string,
  insertSql: string,
  insertParams: BindValue[]
): Promise<boolean> {
  const db = await getDb();
  const local = await db.getFirstAsync<{ updated_at: string | null }>(
    `SELECT updated_at FROM ${tabela} WHERE ${pkSql}`,
    pkValues
  );
  if (local && local.updated_at && local.updated_at >= remoteUpdatedAt) return false;
  await db.runAsync(insertSql, insertParams);
  return true;
}

async function aplicarPull(resp: PullResponse): Promise<number> {
  let n = 0;
  const db = await getDb();

  // areas
  for (const a of resp.areas) {
    const ok = await aplicarLinhaSeNova(
      'areas',
      'id = ?',
      [a.id],
      a.updatedAt,
      `INSERT INTO areas (id, slug, nome, cor_base, obrigatoria, ordem, ativa, paused_until, pause_reason, peso_global, updated_at, synced_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         slug = excluded.slug,
         nome = excluded.nome,
         cor_base = excluded.cor_base,
         obrigatoria = excluded.obrigatoria,
         ordem = excluded.ordem,
         ativa = excluded.ativa,
         paused_until = excluded.paused_until,
         pause_reason = excluded.pause_reason,
         peso_global = excluded.peso_global,
         updated_at = excluded.updated_at,
         synced_at = excluded.synced_at`,
      [a.id, a.slug, a.nome, a.corBase, a.obrigatoria, a.ordem, a.ativa, a.pausedUntil, a.pauseReason, a.pesoGlobal, a.updatedAt, a.updatedAt]
    );
    if (ok) n++;
  }

  for (const t of resp.tarefas) {
    const ok = await aplicarLinhaSeNova(
      'tarefas',
      'id = ?',
      [t.id],
      t.updatedAt,
      `INSERT INTO tarefas (id, area_id, nome, peso, frequencia, alvo_count, ativa, horario, created_at, updated_at, synced_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         area_id = excluded.area_id,
         nome = excluded.nome,
         peso = excluded.peso,
         frequencia = excluded.frequencia,
         alvo_count = excluded.alvo_count,
         ativa = excluded.ativa,
         horario = excluded.horario,
         updated_at = excluded.updated_at,
         synced_at = excluded.synced_at`,
      [t.id, t.areaId, t.nome, t.peso, t.frequencia, t.alvoCount, t.ativa, t.horario, t.createdAt, t.updatedAt, t.updatedAt]
    );
    if (ok) n++;
  }

  for (const e of resp.execucoes) {
    const ok = await aplicarLinhaSeNova(
      'execucoes',
      'id = ?',
      [e.id],
      e.updatedAt,
      `INSERT INTO execucoes (id, tarefa_id, data, status, created_at, updated_at, synced_at)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         tarefa_id = excluded.tarefa_id,
         data = excluded.data,
         status = excluded.status,
         updated_at = excluded.updated_at,
         synced_at = excluded.synced_at`,
      [e.id, e.tarefaId, e.data, e.status, e.createdAt, e.updatedAt, e.updatedAt]
    );
    if (ok) n++;
  }

  for (const r of resp.reflexoes) {
    const ok = await aplicarLinhaSeNova(
      'reflexoes_diarias',
      'id = ?',
      [r.id],
      r.updatedAt,
      `INSERT INTO reflexoes_diarias (id, data, pergunta, resposta, created_at, updated_at, synced_at)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         data = excluded.data,
         pergunta = excluded.pergunta,
         resposta = excluded.resposta,
         updated_at = excluded.updated_at,
         synced_at = excluded.synced_at`,
      [r.id, r.data, r.pergunta, r.resposta, r.createdAt, r.updatedAt, r.updatedAt]
    );
    if (ok) n++;
  }

  for (const ai of resp.autoavaliacao) {
    const ok = await aplicarLinhaSeNova(
      'autoavaliacao_inicial',
      'area_id = ?',
      [ai.areaId],
      ai.updatedAt,
      `INSERT INTO autoavaliacao_inicial (area_id, nota, created_at, updated_at, synced_at)
       VALUES (?,?,?,?,?)
       ON CONFLICT(area_id) DO UPDATE SET
         nota = excluded.nota,
         updated_at = excluded.updated_at,
         synced_at = excluded.synced_at`,
      [ai.areaId, ai.nota, ai.createdAt, ai.updatedAt, ai.updatedAt]
    );
    if (ok) n++;
  }

  for (const ev of resp.eventos) {
    const ok = await aplicarLinhaSeNova(
      'eventos',
      'id = ?',
      [ev.id],
      ev.updatedAt,
      `INSERT INTO eventos (id, data, tipo, payload_json, created_at, updated_at, synced_at)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         data = excluded.data,
         tipo = excluded.tipo,
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at,
         synced_at = excluded.synced_at`,
      [ev.id, ev.data, ev.tipo, ev.payloadJson, ev.createdAt, ev.updatedAt, ev.updatedAt]
    );
    if (ok) n++;
  }

  void db;
  return n;
}

// ─── PUSH ──────────────────────────────────────────────────────────

type LinhaLocal = Record<string, unknown>;

async function linhasNaoSincronizadas<T extends LinhaLocal>(tabela: string): Promise<T[]> {
  const db = await getDb();
  return db.getAllAsync<T>(
    `SELECT * FROM ${tabela}
     WHERE updated_at IS NOT NULL
       AND (synced_at IS NULL OR updated_at > synced_at)`
  );
}

async function marcarSincronizadas(tabela: string, ids: BindValue[], pkColuna: string): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE ${tabela} SET synced_at = updated_at WHERE ${pkColuna} IN (${placeholders})`,
    ids
  );
}

async function coletarMudancas(): Promise<{ corpo: any; meta: { tabela: string; pk: string; ids: (number | string)[] }[] }> {
  const areas = await linhasNaoSincronizadas<{
    id: number; slug: string; nome: string; cor_base: string; obrigatoria: number;
    ordem: number; ativa: number; paused_until: string | null; pause_reason: string | null;
    peso_global: number; updated_at: string;
  }>('areas');

  const tarefas = await linhasNaoSincronizadas<{
    id: number; area_id: number; nome: string; peso: number; frequencia: string;
    alvo_count: number; ativa: number; horario: string | null;
    created_at: string; updated_at: string;
  }>('tarefas');

  const execucoes = await linhasNaoSincronizadas<{
    id: number; tarefa_id: number; data: string; status: string; created_at: string; updated_at: string;
  }>('execucoes');

  const reflexoes = await linhasNaoSincronizadas<{
    id: number; data: string; pergunta: string; resposta: string | null; created_at: string; updated_at: string;
  }>('reflexoes_diarias');

  const autoavaliacao = await linhasNaoSincronizadas<{
    area_id: number; nota: number; created_at: string; updated_at: string;
  }>('autoavaliacao_inicial');

  const eventos = await linhasNaoSincronizadas<{
    id: number; data: string; tipo: string; payload_json: string | null; created_at: string; updated_at: string;
  }>('eventos');

  const corpo: any = {};
  if (areas.length) corpo.areas = areas;
  if (tarefas.length) corpo.tarefas = tarefas;
  if (execucoes.length) corpo.execucoes = execucoes;
  if (reflexoes.length) corpo.reflexoes = reflexoes;
  if (autoavaliacao.length) corpo.autoavaliacao = autoavaliacao;
  if (eventos.length) corpo.eventos = eventos;

  const meta = [
    { tabela: 'areas', pk: 'id', ids: areas.map(a => a.id) },
    { tabela: 'tarefas', pk: 'id', ids: tarefas.map(t => t.id) },
    { tabela: 'execucoes', pk: 'id', ids: execucoes.map(e => e.id) },
    { tabela: 'reflexoes_diarias', pk: 'id', ids: reflexoes.map(r => r.id) },
    { tabela: 'autoavaliacao_inicial', pk: 'area_id', ids: autoavaliacao.map(a => a.area_id) },
    { tabela: 'eventos', pk: 'id', ids: eventos.map(e => e.id) },
  ];

  return { corpo, meta };
}

async function enviarLocal(): Promise<number> {
  const { corpo, meta } = await coletarMudancas();
  const total = meta.reduce((s, m) => s + m.ids.length, 0);
  if (total === 0) return 0;

  await api.post('/sync/push', corpo);

  for (const m of meta) {
    await marcarSincronizadas(m.tabela, m.ids, m.pk);
  }
  return total;
}

// ─── TRILHA ────────────────────────────────────────────────────────
// Sync da trilha é separado do /sync/push porque os contratos são distintos:
// - eventos têm UUID, são append-only e idempotentes (não usam updated_at).
// - /sync/push valida com Zod estrito; trilha tem schema próprio.

async function enviarTrilha(): Promise<number> {
  const pendentes = await listarEventosPendentes(200);
  if (pendentes.length === 0) return 0;

  const corpo = {
    eventos: pendentes.map((e) => ({
      id: e.id,
      tipo: e.tipo,
      occurred_at: e.occurred_at,
      source: e.source,
      area_id: e.area_id,
      tarefa_id: e.tarefa_id,
      session_id: e.session_id,
      device_id: e.device_id,
      payload: safeParseJson(e.payload_json),
      privacy_level: e.privacy_level,
    })),
  };

  await api.post('/trail/batch', corpo);
  await marcarEventosSincronizados(pendentes.map((e) => e.id));
  return pendentes.length;
}

function safeParseJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// ─── ORQUESTRADOR ─────────────────────────────────────────────────

export async function sincronizar(): Promise<ResultadoSync> {
  // Primeiro envia local pra cloud (caso a gente perca o pull, não perdemos dado).
  const enviados = await enviarLocal();
  const eventosTrilha = await enviarTrilha().catch((e) => {
    console.warn('[sync] falha ao enviar trilha (segue sync sem bloquear)', e);
    return 0;
  });

  // Depois puxa novidades.
  const since = await getLastPullAt();
  const qs = since ? `?since=${encodeURIComponent(since)}` : '';
  const resp = await api.get<PullResponse>(`/sync/pull${qs}`);
  const puxados = await aplicarPull(resp);
  await setLastPullAt(resp.serverNow);

  return { puxados, enviados: enviados + eventosTrilha, serverNow: resp.serverNow };
}
