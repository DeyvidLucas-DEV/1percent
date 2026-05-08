import { getDb } from './schema';
import { agoraIso } from '../lib/datas';

type AreaSeed = {
  id: number;
  slug: string;
  nome: string;
  cor_base: string;
  obrigatoria: 0 | 1;
  ordem: number;
};

type TarefaSeed = {
  area_slug: string;
  nome: string;
  peso: 1 | 2 | 3;
  frequencia: 'diaria' | 'semanal' | 'mensal';
  alvo_count: number;
};

const AREAS: AreaSeed[] = [
  { id: 1,  slug: 'espiritual',         nome: 'Espiritual',             cor_base: '#6B4F8A', obrigatoria: 1, ordem: 1  },
  { id: 2,  slug: 'saude_fisica',       nome: 'Saúde Física',           cor_base: '#2E8B57', obrigatoria: 1, ordem: 2  },
  { id: 3,  slug: 'familia',            nome: 'Família',                cor_base: '#C45A4F', obrigatoria: 1, ordem: 3  },
  { id: 4,  slug: 'trabalho',           nome: 'Trabalho/Carreira',      cor_base: '#1F6FB2', obrigatoria: 1, ordem: 4  },
  { id: 5,  slug: 'saude_emocional',    nome: 'Saúde Emocional',        cor_base: '#D9A441', obrigatoria: 1, ordem: 5  },
  { id: 6,  slug: 'financas',           nome: 'Finanças',               cor_base: '#4A7C59', obrigatoria: 1, ordem: 6  },
  { id: 7,  slug: 'ministerio',         nome: 'Ministério',             cor_base: '#8E44AD', obrigatoria: 0, ordem: 7  },
  { id: 8,  slug: 'amizades',           nome: 'Amizades',               cor_base: '#16A085', obrigatoria: 0, ordem: 8  },
  { id: 9,  slug: 'crescimento',        nome: 'Crescimento Intelectual', cor_base: '#2980B9', obrigatoria: 0, ordem: 9 },
  { id: 10, slug: 'sabedoria',          nome: 'Sabedoria',              cor_base: '#34495E', obrigatoria: 0, ordem: 10 },
];

const TAREFAS: TarefaSeed[] = [
  // Espiritual
  { area_slug: 'espiritual', nome: 'Devocional matinal',    peso: 3, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'espiritual', nome: 'Oração intencional',    peso: 2, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'espiritual', nome: 'Leitura bíblica',       peso: 2, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'espiritual', nome: 'Jejum',                 peso: 1, frequencia: 'semanal', alvo_count: 1 },
  { area_slug: 'espiritual', nome: 'Culto',                 peso: 2, frequencia: 'semanal', alvo_count: 1 },

  // Saúde Física
  { area_slug: 'saude_fisica', nome: 'Treino',              peso: 3, frequencia: 'semanal', alvo_count: 4 },
  { area_slug: 'saude_fisica', nome: 'Beber 2L de água',    peso: 2, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'saude_fisica', nome: 'Dormir 7h+',          peso: 3, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'saude_fisica', nome: 'Caminhada',           peso: 1, frequencia: 'semanal', alvo_count: 3 },
  { area_slug: 'saude_fisica', nome: 'Pesar-se',            peso: 1, frequencia: 'semanal', alvo_count: 1 },
  { area_slug: 'saude_fisica', nome: 'Exames de rotina',    peso: 2, frequencia: 'mensal',  alvo_count: 1 },

  // Família
  { area_slug: 'familia', nome: 'Tempo com esposa',         peso: 3, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'familia', nome: 'Tempo com filhos',         peso: 3, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'familia', nome: 'Oração em família',        peso: 2, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'familia', nome: 'Passeio em família',       peso: 2, frequencia: 'semanal', alvo_count: 1 },

  // Trabalho
  { area_slug: 'trabalho', nome: 'Bloco de foco profundo',  peso: 3, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'trabalho', nome: 'Reuniões/prospecções',    peso: 2, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'trabalho', nome: 'Revisão de pipeline',     peso: 2, frequencia: 'semanal', alvo_count: 1 },
  { area_slug: 'trabalho', nome: 'Estudo da área',          peso: 1, frequencia: 'semanal', alvo_count: 3 },

  // Saúde Emocional
  { area_slug: 'saude_emocional', nome: 'Terapia',                  peso: 3, frequencia: 'semanal', alvo_count: 1 },
  { area_slug: 'saude_emocional', nome: '10min de silêncio',        peso: 2, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'saude_emocional', nome: 'Anotar 3 gratidões',       peso: 1, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'saude_emocional', nome: 'Pausa real (sem tela)',    peso: 2, frequencia: 'diaria',  alvo_count: 1 },

  // Finanças
  { area_slug: 'financas', nome: 'Lançar gastos do dia',    peso: 2, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'financas', nome: 'Conferir saldo/contas',   peso: 1, frequencia: 'semanal', alvo_count: 1 },
  { area_slug: 'financas', nome: 'Aporte/investimento',     peso: 3, frequencia: 'mensal',  alvo_count: 1 },
  { area_slug: 'financas', nome: 'Revisão de dívidas',      peso: 2, frequencia: 'mensal',  alvo_count: 1 },

  // Ministério
  { area_slug: 'ministerio', nome: 'Discipulado',           peso: 3, frequencia: 'semanal', alvo_count: 1 },
  { area_slug: 'ministerio', nome: 'Pregação preparada',    peso: 2, frequencia: 'semanal', alvo_count: 1 },
  { area_slug: 'ministerio', nome: 'Acompanhamento de células', peso: 2, frequencia: 'semanal', alvo_count: 1 },

  // Amizades
  { area_slug: 'amizades', nome: 'Mensagem intencional',    peso: 1, frequencia: 'semanal', alvo_count: 2 },
  { area_slug: 'amizades', nome: 'Encontro presencial',     peso: 2, frequencia: 'semanal', alvo_count: 1 },
  { area_slug: 'amizades', nome: 'Networking estratégico',  peso: 1, frequencia: 'mensal',  alvo_count: 2 },

  // Crescimento
  { area_slug: 'crescimento', nome: 'Ler 20 páginas',       peso: 2, frequencia: 'diaria',  alvo_count: 1 },
  { area_slug: 'crescimento', nome: 'Curso/treinamento',    peso: 2, frequencia: 'semanal', alvo_count: 3 },
  { area_slug: 'crescimento', nome: 'Anotações/fichamento', peso: 1, frequencia: 'semanal', alvo_count: 2 },

  // Sabedoria
  { area_slug: 'sabedoria', nome: 'Conversa com mentor',    peso: 3, frequencia: 'mensal',  alvo_count: 1 },
  { area_slug: 'sabedoria', nome: 'Sessão de aconselhamento', peso: 2, frequencia: 'mensal', alvo_count: 1 },
  { area_slug: 'sabedoria', nome: 'Aprender com mais experiente', peso: 1, frequencia: 'semanal', alvo_count: 1 },
];

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

    for (const t of TAREFAS) {
      const area = AREAS.find(a => a.slug === t.area_slug)!;
      await db.runAsync(
        `INSERT INTO tarefas (area_id, nome, peso, frequencia, alvo_count, ativa, created_at)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [area.id, t.nome, t.peso, t.frequencia, t.alvo_count, now]
      );
    }
  });
}
