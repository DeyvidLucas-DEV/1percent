-- Migração: camada global de conhecimento compartilhado.
-- Aplicar no Postgres da Railway antes do primeiro uso de retrieveSharedKnowledge.
--
-- Alternativa: `bun run db:push` (drizzle-kit). Este arquivo existe pra caso
-- db:push falhe com 42P16 em projeto com dado real (já vimos isso antes).

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS shared_knowledge (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte       text NOT NULL,
  trecho      text NOT NULL,
  tags        text[] NOT NULL DEFAULT '{}',
  embedding   vector(1536) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Índice ANN só vale quando passar de alguns milhares de linhas. Por ora,
-- KNN exato (sequential scan) é mais barato e exato. Quando >5k, descomentar:
-- CREATE INDEX IF NOT EXISTS shared_knowledge_embedding_idx
--   ON shared_knowledge USING hnsw (embedding vector_cosine_ops);
