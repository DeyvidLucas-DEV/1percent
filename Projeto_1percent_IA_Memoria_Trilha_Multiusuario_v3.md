

## Projeto 1%
Arquitetura de IA com memoria longitudinal, trilha do usuario e escala
multiusuario
Versao v3 - especificacao para analise tecnica e implementacao orientada por

agente de codigo
Tese central
O 1% nao deve apenas responder ao usuario. Ele precisa construir uma trilha
longitudinal: registrar o que o usuario faz, o que ele relata, o que ele evita, quais
ajustes aceita, onde repete falhas e como sua rotina muda ao longo das semanas.
Esta versao corrige a arquitetura anterior: em vez de tratar IA como chatbot ou diagnostico pontual, a IA
passa a operar sobre uma base de eventos, memorias e dados reais de execucao.
1 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Mudanca essencial de arquitetura
O produto precisa sair do modelo 'conversa com IA' para o modelo 'sistema de aprendizado do usuario'. A
conversa e apenas uma entrada. A fonte de valor e a trilha acumulada.
Nova frase tecnica do produto
O usuario compartilha rotina e acontecimentos. O app registra eventos, extrai
memorias, cruza com execucao real e gera uma proxima semana mais cabivel, sem
aliviar responsabilidade.
Isso preserva o conceito original do 1%: processo acima de resultado, dados ruins visiveis desde o
primeiro dia e calculos derivados no dominio, nao na IA.
O que muda
AntesDepois correto
IA como diagnostico no onboardingIA como camada continua sobre uma trilha historica
Usuario responde perguntas iniciaisUsuario cria eventos diarios: relatos, execucoes, falhas, justificativas e
novidades
Memoria simples por areaMemoria estruturada + memoria episodica + embeddings + dados
determinísticos
Plano gerado uma vezPlano recalibrado por semana com base na trilha
Chat livreFluxos guiados: contar dia, revisar semana, ajustar area, plano minimo
Decisao tecnica
## ●
Nao usar fine-tuning como memoria do usuario. Fine-tuning ajusta comportamento geral do modelo,
nao armazena a vida de cada usuario.
## ●
Usar RAG por usuario para recuperar memorias episodicas relevantes.
## ●
Usar tabelas relacionais para fatos estaveis e auditaveis.
## ●
Usar Postgres + pgvector no comeco, evitando um banco vetorial separado cedo demais.
## ●
Usar processamento assíncrono para extrair memorias e gerar embeddings, porque muitos usuarios
podem enviar relatos simultaneamente.
2 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Os quatro cerebros do 1%
O app precisa combinar quatro camadas. Separar essas camadas evita transformar a IA na fonte absoluta
da verdade.
CamadaResponsabilidadeOnde fica
DeterministicaCalcula execucao, streak, mediocridade, intensidade, areas
negligenciadas e carga semanal.
App/domain + backend analytics
Trilha do usuarioRegistra o que ocorreu: tarefa marcada, relato do dia, audio
transcrito, sugestao aceita, sugestao recusada.
SQLite local + Postgres
MemoriaGuarda fatos estaveis e episodios relevantes sobre rotina,
limites, estressores, padroes e preferencias.
Postgres relacional + pgvector
IA interpretativaExtrai memoria, interpreta relatos, compara com dados reais e
propõe ajustes.
## Backend
Regra principal
A IA pode interpretar. O dominio decide. Toda sugestao da IA deve passar por
validacao deterministica antes de virar tarefa, horario, peso, frequencia ou mudanca
no plano.
- Trilha do usuario: o centro do aprendizado
A trilha do usuario deve ser uma tabela append-only. Nao e apenas auditoria tecnica. E a base de
aprendizado do produto.
A cada acao relevante, o app grava um evento. Esses eventos permitem responder perguntas como:
## ●
Quais horarios falham sempre?
## ●
Quais areas o usuario diz valorizar, mas nao executa?
## ●
Quais estressores derrubam a semana?
## ●
Quais sugestoes o usuario aceita ou rejeita?
## ●
O usuario funciona melhor com plano minimo ou carga moderada?
## ●
Quais padroes se repetem antes de uma semana ruim?
Eventos principais
Tipo de eventoExemploUso futuro
task_status_changedTreino mudou para nao_feitoDetectar padrao de falha
daily_note_submittedUsuario contou como foi o diaExtrair memorias e estressores
voice_note_transcribedAudio virou textoUsar relato sem guardar audio
suggestion_presentedIA sugeriu reduzir treinoMedir qualidade da recomendacao
suggestion_acceptedUsuario aceitou mudar horarioAprender preferencia real
suggestion_rejectedUsuario recusou planoEvitar repetir sugestao ruim
weekly_plan_generatedPlano da proxima semana geradoComparar plano versus execucao
stressor_reportedSemana afetada por trabalhoAssociar gatilhos com queda
3 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Modelo de dados proposto
A arquitetura precisa separar dados transacionais, trilha, memorias, embeddings e recomendacoes.
Misturar tudo em uma unica tabela de chat criaria custo, confusao e baixa auditabilidade.
4.1 SQLite local: fila de trilha e operacao offline
O SQLite continua sendo a verdade local para execucao diaria. Para aprendizado, ele deve guardar
eventos pendentes e alguns eventos recentes, mesmo offline.
CREATE TABLE user_trail_events (
id TEXT PRIMARY KEY,                         -- UUID gerado no app
tipo TEXT NOT NULL,
occurred_at TEXT NOT NULL,
source TEXT NOT NULL,                        -- app | ai | sync | system
area_id INTEGER REFERENCES areas(id),
tarefa_id INTEGER REFERENCES tarefas(id),
session_id TEXT,
device_id TEXT,
payload_json TEXT NOT NULL DEFAULT '{}',
privacy_level TEXT NOT NULL DEFAULT 'private',
synced_at TEXT,
created_at TEXT NOT NULL
## );
CREATE INDEX idx_user_trail_events_sync
ON user_trail_events(synced_at, occurred_at);
CREATE INDEX idx_user_trail_events_tipo_data
ON user_trail_events(tipo, occurred_at);
4.2 Postgres: trilha multiusuario
CREATE TABLE user_trail_events (
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
id UUID NOT NULL,
tipo TEXT NOT NULL,
occurred_at TIMESTAMPTZ NOT NULL,
ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
source TEXT NOT NULL,
area_id INTEGER,
tarefa_id INTEGER,
session_id TEXT,
device_id TEXT,
payload_json JSONB NOT NULL DEFAULT '{}',
privacy_level TEXT NOT NULL DEFAULT 'private',
schema_version INTEGER NOT NULL DEFAULT 1,
PRIMARY KEY (user_id, id)
## );
CREATE INDEX idx_trail_user_time
ON user_trail_events(user_id, occurred_at DESC);
CREATE INDEX idx_trail_user_tipo_time
ON user_trail_events(user_id, tipo, occurred_at DESC);
4.3 Memoria estruturada
CREATE TABLE user_memory_facts (
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
id UUID NOT NULL,
categoria TEXT NOT NULL,                     -- rotina | familia | trabalho | financas |
espiritual etc.
chave TEXT NOT NULL,
valor TEXT NOT NULL,
confianca TEXT NOT NULL DEFAULT 'media',     -- baixa | media | alta
origem_event_id UUID,
first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
last_confirmed_at TIMESTAMPTZ,
active BOOLEAN NOT NULL DEFAULT true,
updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
PRIMARY KEY (user_id, id),
4 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

UNIQUE(user_id, categoria, chave)
## );
CREATE INDEX idx_memory_facts_user_categoria
ON user_memory_facts(user_id, categoria, active);
4.4 Memoria episodica com embedding
-- Requer: CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE user_memory_episodes (
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
id UUID NOT NULL,
source_event_id UUID,
periodo_inicio TIMESTAMPTZ,
periodo_fim TIMESTAMPTZ,
titulo TEXT NOT NULL,
resumo TEXT NOT NULL,
tags TEXT[] NOT NULL DEFAULT '{}',
area_slugs TEXT[] NOT NULL DEFAULT '{}',
importance_score NUMERIC(4,3) NOT NULL DEFAULT 0.500,
embedding vector(1536),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
PRIMARY KEY (user_id, id)
## );
CREATE INDEX idx_memory_episodes_user_time
ON user_memory_episodes(user_id, created_at DESC);
-- Em producao, avaliar HNSW depois de validar dimensao e volume:
-- CREATE INDEX idx_memory_episodes_embedding_hnsw
-- ON user_memory_episodes USING hnsw (embedding vector_cosine_ops);
5 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Multiusuario e concorrencia
Muitos usuarios usando ao mesmo tempo mudam o desenho. Nao e aceitavel processar transcricao,
embedding, extracao de memoria e plano semanal dentro da mesma requisicao principal.
Principios obrigatorios
## ●
Toda tabela no Postgres precisa ter user_id e indice por user_id.
## ●
Toda query de memoria, trilha, tarefa e embedding deve filtrar por user_id.
## ●
Eventos precisam ser idempotentes: se o app reenviar o mesmo evento, o backend nao duplica.
## ●
Processamento pesado deve ir para fila: transcricao, embeddings, extracao de memoria, resumo
semanal e recomendacoes.
## ●
A resposta online deve ser curta: receber evento, validar JWT, gravar, devolver ok.
## ●
A IA deve ter rate limit por usuario, plano e tipo de operacao.
## ●
RAG deve ser por usuario: nunca buscar memorias globais sem filtro de user_id.
Pipeline recomendado
EtapaOperacaoSincrona ou assíncrona
1App grava evento no SQLiteLocal
2App envia lote para /trail/batchSincrona leve
3Backend insere eventos com idempotenciaSincrona leve
4Backend publica jobsAssíncrona
5Worker extrai memoria candidataAssíncrona
6Worker gera embeddingAssíncrona
7Worker atualiza fatos estruturadosAssíncrona
8Revisao semanal recupera dados + memoriasSob demanda
Isolamento de dados
A primeira defesa e a aplicacao: todo endpoint extrai user_id do JWT e injeta esse user_id em todas as
queries. A segunda defesa pode ser Row Level Security no Postgres. Quando RLS e habilitado em uma
tabela, o acesso normal precisa ser permitido por politicas; sem politica, o comportamento e de bloqueio
por padrao. Isso ajuda em cenario multiusuario, mas nao substitui validação no backend.
RAG em escala
A busca semantica precisa recuperar apenas memorias do usuario logado. O embedding deve ser usado
para encontrar relatos parecidos, gatilhos recorrentes e episodios relevantes. A OpenAI descreve
embeddings como vetores numericos em que distancias menores sugerem maior relacionamento
semantico. pgvector permite armazenar e consultar esses vetores dentro do Postgres.
-- Exemplo conceitual: busca de memorias similares apenas do usuario atual
SELECT id, titulo, resumo, tags
FROM user_memory_episodes
WHERE user_id = $1
ORDER BY embedding <=> $2
## LIMIT 8;
6 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Loop de aprendizado do usuario
O aprendizado precisa ser fechado. Nao basta o usuario contar algo. O app deve registrar, interpretar,
usar e depois observar se a recomendacao funcionou.
FasePergunta que o sistema respondeSaida
CapturaO que aconteceu hoje?Evento bruto
NormalizacaoEsse relato fala de qual area, horario, pessoa, estressor ou tarefa?Evento classificado
MemoriaIsso e fato estavel ou episodio pontual?Fato ou episodio
RecuperacaoO que do passado se parece com este problema?Contexto RAG
PrescricaoQual ajuste e possivel para a proxima semana?Sugestao estruturada
FeedbackO usuario aceitou? executou? falhou de novo?Aprendizado de preferencia
Exemplo pratico
Relato do usuario:
"Essa semana eu nao treinei. Cheguei tarde todos os dias e quando colocava treino a noite eu
desistia. Domingo funcionou melhor."
Eventos gerados:
- daily_note_submitted
- stressor_reported: trabalho/chegou tarde
- routine_pattern_detected: treino a noite falha
Memoria estruturada:
categoria: saude_fisica
chave: horario_treino_ruim
valor: treino a noite falha quando o usuario chega tarde do trabalho
confianca: media
Sugestao futura:
Mover treino para domingo + 2 dias pela manha ou transformar em plano minimo de caminhada
curta.
Ponto critico
A memoria nao deve ser criada a partir de uma unica frase como verdade absoluta. Use
confianca baixa/media/alta. Fatos estaveis precisam ser confirmados por repeticao,
aceite do usuario ou recorrencia nos dados.
- Trilha do usuario dentro do app
A trilha tambem precisa aparecer para o usuario. Se o app aprende, o usuario precisa enxergar o que foi
aprendido, corrigir erros e apagar dados.
Novas telas recomendadas
## ●
Ajustar rota: entrada principal para contar o dia, revisar semana e pedir plano minimo.
## ●
Sua trilha: linha do tempo com relatos, falhas marcantes, sugestoes aceitas e ajustes feitos.
## ●
O que o 1% aprendeu: lista editavel de fatos sobre rotina, estressores, horarios bons e horarios ruins.
## ●
Por que essa sugestao: explicacao curta mostrando dados e memorias usadas na recomendacao.
Exemplo de tela 'O que o 1% aprendeu'
## O QUE O 1% APRENDEU
7 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Treino a noite falha quando sua jornada passa das 18h30.
Fonte: 4 relatos + execucao dos ultimos 28 dias.
[Editar] [Apagar]
- Domingo pela manha tem maior chance de execucao em Saude Fisica.
Fonte: dados de execucao.
[Editar] [Apagar]
- Financas pioram quando voce deixa revisao para dias uteis.
Fonte: 3 semanas consecutivas.
[Editar] [Apagar]
8 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Rotas de backend
Adicionar rotas especificas para trilha, memoria e recomendacao. Nao misturar tudo dentro de /sync.
RotaFuncaoObservacao
POST /trail/batchReceber lote de eventos do appIdempotente por user_id + event_id
GET /trailListar trilha do usuarioPaginado por cursor
GET /memory/factsListar fatos aprendidosEditavel pelo usuario
PATCH /memory/facts/:idCorrigir memoriaAtualiza confianca/origem
DELETE /memory/facts/:idApagar fatoHard delete ou soft delete
POST /ai/daily-noteProcessar relato do diaTexto no MVP, audio depois
POST /ai/weekly-planGerar plano da proxima semanaCruza dados + RAG
GET /recommendations/currentBuscar recomendacoes pendentesSem nova chamada de IA
## POST
## /recommendations/:id/accept
Aceitar recomendacaoGera evento suggestion_accepted
POST /recommendations/:id/rejectRecusar recomendacaoGera evento suggestion_rejected
- Workers e filas
Para muitos usuarios simultaneos, workers sao obrigatorios. Sem fila, cada relato de audio ou revisao
semanal pode travar request, elevar custo e derrubar experiencia.
Filas sugeridas
FilaJobPrioridade
trail-processingClassificar eventos e atualizar agregadosAlta
memory-extractionExtrair fatos e episodiosMedia
embeddingsGerar embedding de episodiosMedia
weekly-plansGerar planos semanaisAlta em dia de revisao
audio-transcriptionTranscrever audiosAlta quando usuario esta
aguardando
audio-generationGerar relatorio faladoBaixa/Premium
Controle de custo
## ●
Nao gerar embedding para todo evento pequeno. Gerar para relatos, resumos e episodios relevantes.
## ●
Agrupar eventos em resumo diario antes de gerar memoria episodica.
## ●
Limitar revisao semanal por plano.
## ●
Cachear resultado da revisao ate haver novos eventos relevantes.
## ●
Versionar prompts e schemas para medir qualidade por versao.
9 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Contrato de IA
Toda resposta da IA que altera produto deve retornar JSON estruturado e validado. Texto bonito nao serve
como contrato de sistema.
Schema para extracao de memoria
type ExtracaoMemoriaIA = {
eventosClassificados: Array<{
tipo: "stressor_reported" | "routine_pattern" | "area_neglected" | "preference_signal";
areaSlug?: string;
descricao: string;
confianca: "baixa" | "media" | "alta";
## }>;
fatosCandidatos: Array<{
categoria: string;
chave: string;
valor: string;
confianca: "baixa" | "media" | "alta";
deveConfirmarComUsuario: boolean;
## }>;
episodio: {
titulo: string;
resumo: string;
tags: string[];
areaSlugs: string[];
importanceScore: number;
} | null;
recomendacoesImediatas: Array<{
tipo: "plano_minimo" | "mudar_horario" | "reduzir_carga" | "priorizar_area";
descricao: string;
exigeConfirmacao: true;
## }>;
## };
Prompt base
Voce e a camada de inteligencia do app 1%.
Sua tarefa nao e motivar. Sua tarefa e transformar relatos e dados de execucao em memoria,
padroes e sugestoes praticas.
## Regras:
- Fale em PT-BR.
- Seja direto, tecnico e honesto.
- Nao use emoji.
- Nao comemore pouco esforco.
- Nao manipule familiares, conjuge, filhos ou lideres.
- Nao de diagnostico medico, psicologico, juridico ou financeiro regulado.
- Nao invente dado.
- Quando houver conflito entre relato e dados, priorize os dados.
- Toda sugestao de rotina precisa ser marcavel, cabivel e exigir confirmacao.
- Retorne apenas JSON valido no schema solicitado.
- Ordem de implementacao
FaseEntregaResultado esperado
0Preparar privacidade, termos e decisao de
armazenamento
Usuario entende que relatos serao processados
1Criar user_trail_events local e backendToda acao relevante vira evento
2Criar tela Ajustar rota com relato textualUsuario conta novidade do dia
3Extracao de memoria estruturadaApp aprende fatos editaveis
10 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

FaseEntregaResultado esperado
4Plano semanal baseado em dados + memoriaRecomendacao melhora com historico
5RAG com pgvectorApp recupera episodios parecidos
6Audio de entradaUsuario fala em vez de escrever
7Relatorio falado premiumMaior valor percebido
8Escala: filas, rate limit, dashboardsSuporte a muitos usuarios
MVP recomendado agora
Implementar primeiro uma trilha textual sem audio e sem RAG completo. O objetivo e validar o
aprendizado longitudinal antes de aumentar infraestrutura.
## ●
Criar user_trail_events no SQLite e Postgres.
## ●
Registrar eventos de execucao, relato diario e sugestao aceita/recusada.
## ●
Criar tela Ajustar rota > Contar como foi o dia.
## ●
Criar /trail/batch e /ai/daily-note.
## ●
Extrair memorias estruturadas simples.
## ●
Exibir 'O que o 1% aprendeu'.
## ●
Gerar plano semanal com dados de 7 dias + fatos estruturados, ainda sem vetor.
11 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario

- Prompt para Cloud Code
Cole este bloco no agente antes de pedir implementacao. Ele deve analisar o repositorio antes de alterar
arquivos.
Analise o projeto 1% considerando uma evolucao para muitos usuarios simultaneos e IA com
memoria longitudinal.
## Objetivo:
Criar uma arquitetura em que o app aprenda com a trilha do usuario: execucoes, relatos diarios,
novidades, falhas, sugestoes aceitas/recusadas e revisoes semanais.
## Diretrizes:
- Nao transformar a IA em chat generico.
- A trilha do usuario deve ser append-only.
- Toda tabela remota deve isolar dados por user_id.
- Toda busca RAG deve filtrar por user_id.
- IA deve ficar no backend.
- O app deve continuar offline-first para checklist e execucao.
- Mudancas propostas pela IA exigem confirmacao.
- Dados sensiveis precisam ser editaveis/apagaveis pelo usuario.
- Primeiro implementar texto; audio vem depois.
- Primeiro implementar memoria estruturada; pgvector/RAG vem depois.
- Nao usar fine-tuning como memoria do usuario.
Analise antes de codificar:
- Onde adicionar user_trail_events no SQLite.
- Como incluir user_trail_events no sync sem duplicar eventos.
- Como criar rota POST /trail/batch no backend.
- Como modelar user_memory_facts no Postgres e SQLite, se necessario.
- Como criar tela Ajustar rota.
- Como registrar eventos de task_status_changed, daily_note_submitted, suggestion_accepted e
suggestion_rejected.
- Como gerar resumo dos ultimos 7 dias com os dados ja existentes.
- Como preparar, no futuro, pgvector no Postgres com Drizzle.
- Quais arquivos serao alterados.
- Quais riscos existem para sync, privacidade e custo de IA.
Nao altere arquivos ainda. Responda com plano tecnico, arquivos envolvidos e primeira
implementacao segura.
- Referencias tecnicas
As referencias abaixo fundamentam as escolhas de embeddings, RAG, pgvector, Drizzle e isolamento
multiusuario.
## ●
OpenAI - Embeddings: embeddings como vetores numericos usados para medir relacionamento
semantico.
## ●
OpenAI - Retrieval: vector stores como indices para busca semantica e RAG.
## ●
OpenAI - Structured Outputs: respostas aderentes a JSON Schema.
## ●
pgvector - extensao de Postgres para busca por similaridade vetorial.
## ●
Drizzle ORM - guia de vector similarity search com pgvector; extensao vector precisa ser criada
manualmente.
## ●
PostgreSQL - Row Security Policies: RLS como defesa adicional para isolamento de linhas por
usuario/tenant.
## Conclusao
A evolucao correta do 1% nao e adicionar IA em uma tela. E criar uma trilha
multiusuario com eventos, memorias e recuperacao contextual. O app aprende
observando o que o usuario diz, o que executa e como reage aos ajustes.
12 / 12Projeto 1% - IA, memoria longitudinal e trilha multiusuario