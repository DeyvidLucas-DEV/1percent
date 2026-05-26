import { getDb } from '../schema';
import type { User } from '../types';
import { agoraIso } from '../../lib/datas';

export async function getUser(): Promise<User | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<User>('SELECT * FROM users WHERE id = 1');
  return row ?? null;
}

export async function salvarCadastro(dados: {
  nome: string;
  idade: number;
  sexo: 'M' | 'F' | 'O';
  peso_kg: number;
  altura_cm: number;
  estado_civil: string;
  filhos: number;
}): Promise<void> {
  const db = await getDb();
  const now = agoraIso();
  await db.runAsync(
    `INSERT INTO users (id, nome, idade, sexo, peso_kg, altura_cm, estado_civil, filhos, created_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nome = excluded.nome,
       idade = excluded.idade,
       sexo = excluded.sexo,
       peso_kg = excluded.peso_kg,
       altura_cm = excluded.altura_cm,
       estado_civil = excluded.estado_civil,
       filhos = excluded.filhos`,
    [
      dados.nome,
      dados.idade,
      dados.sexo,
      dados.peso_kg,
      dados.altura_cm,
      dados.estado_civil,
      dados.filhos,
      now,
    ]
  );
}

export async function marcarOnboardingCompleto(): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE users SET onboarded_at = ? WHERE id = 1`, [agoraIso()]);
}

// Horário de trabalho. Quando preenchido, IA evita propor tarefas dentro
// dessa janela em dias úteis. UI pra editar entra em fase futura — por
// ora pode ser setado manualmente em SQLite ou via tela de config.
export async function salvarHorarioTrabalho(
  inicio: string | null,
  fim: string | null
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE users SET horario_trabalho_inicio = ?, horario_trabalho_fim = ? WHERE id = 1`,
    [inicio, fim]
  );
}

// Contexto de vida — preenchido no onboarding conversacional.
export async function salvarContextoVida(dados: {
  trabalha: boolean | null;
  tipoTrabalho: string | null;
  praticaFe: boolean | null;
  feDenominacao: string | null;
  frequentaComunidade: boolean | null;
  estuda: boolean | null;
  fazTerapia: boolean | null;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE users SET
       trabalha = ?,
       tipo_trabalho = ?,
       pratica_fe = ?,
       fe_denominacao = ?,
       frequenta_comunidade = ?,
       estuda = ?,
       faz_terapia = ?
     WHERE id = 1`,
    [
      dados.trabalha === null ? null : dados.trabalha ? 1 : 0,
      dados.tipoTrabalho,
      dados.praticaFe === null ? null : dados.praticaFe ? 1 : 0,
      dados.feDenominacao,
      dados.frequentaComunidade === null ? null : dados.frequentaComunidade ? 1 : 0,
      dados.estuda === null ? null : dados.estuda ? 1 : 0,
      dados.fazTerapia === null ? null : dados.fazTerapia ? 1 : 0,
    ]
  );
}

// Marca conexão com Apple Calendar e qual calendário usar como default.
// Quando desconectar (futuro), passar null nos três.
export async function marcarAppleCalendarConectado(
  calendarId: string,
  calendarTitulo: string
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE users SET
       apple_calendar_conectado_em = ?,
       apple_calendar_id = ?,
       apple_calendar_titulo = ?
     WHERE id = 1`,
    [agoraIso(), calendarId, calendarTitulo]
  );
}

export async function desmarcarAppleCalendar(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE users SET
       apple_calendar_conectado_em = NULL,
       apple_calendar_id = NULL,
       apple_calendar_titulo = NULL
     WHERE id = 1`
  );
}

// Marca conexão com Google Calendar (Fase 2 — só flag por enquanto).
export async function marcarGoogleCalendarConectado(): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE users SET google_calendar_conectado_em = ? WHERE id = 1`,
    [agoraIso()]
  );
}

export async function salvarAutoavaliacao(
  notas: { area_id: number; nota: number }[]
): Promise<void> {
  const db = await getDb();
  const now = agoraIso();
  await db.withTransactionAsync(async () => {
    for (const n of notas) {
      await db.runAsync(
        `INSERT INTO autoavaliacao_inicial (area_id, nota, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT(area_id) DO UPDATE SET nota = excluded.nota`,
        [n.area_id, n.nota, now]
      );
    }
  });
}
