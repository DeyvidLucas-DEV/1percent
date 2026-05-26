import { getDb } from './schema';
import { agoraIso } from '../lib/datas';
import { areas as AREAS_PALETA } from '../lib/paleta';

type AreaSeed = {
  id: number;
  slug: string;
  nome: string;
  cor_base: string;
  obrigatoria: 0 | 1;
  ordem: number;
};

// cor_base é vestígio do design antigo — o app renderiza a partir da PALETA_AREAS
// (src/domain/areasPaleta.ts). Mantemos sincronizado por higiene: o ink da paleta
// vira o cor_base seed. Devices já populados não re-rodam o seed.
const AREAS: AreaSeed[] = [
  { id: 1,  slug: 'espiritual',         nome: 'Espiritual',             cor_base: AREAS_PALETA.espiritual.ink,      obrigatoria: 1, ordem: 1  },
  { id: 2,  slug: 'saude_fisica',       nome: 'Saúde Física',           cor_base: AREAS_PALETA.saude_fisica.ink,    obrigatoria: 1, ordem: 2  },
  { id: 3,  slug: 'familia',            nome: 'Família',                cor_base: AREAS_PALETA.familia.ink,         obrigatoria: 1, ordem: 3  },
  { id: 4,  slug: 'trabalho',           nome: 'Trabalho/Carreira',      cor_base: AREAS_PALETA.trabalho.ink,        obrigatoria: 1, ordem: 4  },
  { id: 5,  slug: 'saude_emocional',    nome: 'Saúde Emocional',        cor_base: AREAS_PALETA.saude_emocional.ink, obrigatoria: 1, ordem: 5  },
  { id: 6,  slug: 'financas',           nome: 'Finanças',               cor_base: AREAS_PALETA.financas.ink,        obrigatoria: 1, ordem: 6  },
  { id: 7,  slug: 'ministerio',         nome: 'Ministério',             cor_base: AREAS_PALETA.ministerio.ink,      obrigatoria: 0, ordem: 7  },
  { id: 8,  slug: 'amizades',           nome: 'Amizades',               cor_base: AREAS_PALETA.amizades.ink,        obrigatoria: 0, ordem: 8  },
  { id: 9,  slug: 'crescimento',        nome: 'Crescimento Intelectual', cor_base: AREAS_PALETA.crescimento.ink,    obrigatoria: 0, ordem: 9 },
  { id: 10, slug: 'sabedoria',          nome: 'Sabedoria',              cor_base: AREAS_PALETA.sabedoria.ink,       obrigatoria: 0, ordem: 10 },
];

// Tarefas NÃO são mais seedadas. Eram 39 tarefas genéricas hardcoded que
// ignoravam perfil do usuário (ex: "Tempo com esposa" pra solteiro).
// Agora tarefas são sugeridas durante o onboarding baseadas no contexto
// de vida informado, e o usuário aceita/rejeita cada uma.

export async function seedIfEmpty(): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM areas');
  if (row && row.c > 0) return;

  const now = agoraIso();

  await db.withTransactionAsync(async () => {
    for (const a of AREAS) {
      await db.runAsync(
        `INSERT INTO areas (id, slug, nome, cor_base, obrigatoria, ordem, ativa, peso_global)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
        [a.id, a.slug, a.nome, a.cor_base, a.obrigatoria, a.ordem]
      );
    }
  });
}
