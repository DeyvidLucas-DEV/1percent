export type StatusExecucao = 'concluido' | 'parcial' | 'nao_feito';

export type Frequencia = 'diaria' | 'semanal' | 'mensal';

export type Area = {
  id: number;
  slug: string;
  nome: string;
  cor_base: string;
  obrigatoria: 0 | 1;
  ordem: number;
  ativa: 0 | 1;
  paused_until: string | null;
  pause_reason: string | null;
  peso_global: number;
};

export type Tarefa = {
  id: number;
  area_id: number;
  nome: string;
  peso: 1 | 2 | 3;
  frequencia: Frequencia;
  alvo_count: number;
  ativa: 0 | 1;
  created_at: string;
  horario: string | null;
};

export type Execucao = {
  id: number;
  tarefa_id: number;
  data: string;
  status: StatusExecucao;
  created_at: string;
};

export type User = {
  id: 1;
  nome: string;
  idade: number;
  sexo: 'M' | 'F' | 'O';
  peso_kg: number;
  altura_cm: number;
  estado_civil: string;
  filhos: number;
  created_at: string;
  onboarded_at: string | null;
  horario_trabalho_inicio: string | null;
  horario_trabalho_fim: string | null;
  trabalha: number | null;
  tipo_trabalho: string | null;
  pratica_fe: number | null;
  fe_denominacao: string | null;
  frequenta_comunidade: number | null;
  estuda: number | null;
  faz_terapia: number | null;
  apple_calendar_conectado_em: string | null;
  apple_calendar_id: string | null;
  apple_calendar_titulo: string | null;
  google_calendar_conectado_em: string | null;
};

export type Reflexao = {
  id: number;
  data: string;
  pergunta: string;
  resposta: string | null;
  created_at: string;
};

export type Evento = {
  id: number;
  data: string;
  tipo: string;
  payload_json: string | null;
  created_at: string;
};
