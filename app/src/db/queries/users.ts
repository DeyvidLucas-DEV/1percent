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
