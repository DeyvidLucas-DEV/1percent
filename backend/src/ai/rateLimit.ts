import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { rateLimits } from '../db/schema.ts';

const LIMITES = {
  hora: { janelaMs: 60 * 60 * 1000, max: 10 },
  dia: { janelaMs: 24 * 60 * 60 * 1000, max: 30 },
} as const;

function inicioJanela(agora: Date, janelaMs: number): Date {
  return new Date(Math.floor(agora.getTime() / janelaMs) * janelaMs);
}

export type ResultadoRateLimit =
  | { permitido: true }
  | { permitido: false; bucket: 'hora' | 'dia'; max: number; resetEm: Date };

/**
 * Reserva 1 chamada nos buckets hora e dia. Atômico via INSERT ON CONFLICT.
 * Se algum estourar, NÃO conta nos outros (chamada não cobrada).
 */
export async function reservarChamadaIa(userId: string): Promise<ResultadoRateLimit> {
  const agora = new Date();
  for (const [nome, cfg] of Object.entries(LIMITES) as Array<['hora' | 'dia', typeof LIMITES.hora]>) {
    const janelaInicio = inicioJanela(agora, cfg.janelaMs);
    const linha = await db
      .select({ contagem: rateLimits.contagem })
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.userId, userId),
          eq(rateLimits.bucket, nome),
          eq(rateLimits.janelaInicio, janelaInicio)
        )
      )
      .limit(1);
    const atual = linha[0]?.contagem ?? 0;
    if (atual >= cfg.max) {
      return {
        permitido: false,
        bucket: nome,
        max: cfg.max,
        resetEm: new Date(janelaInicio.getTime() + cfg.janelaMs),
      };
    }
  }

  // Reservadas as duas — incrementa.
  for (const [nome, cfg] of Object.entries(LIMITES) as Array<['hora' | 'dia', typeof LIMITES.hora]>) {
    const janelaInicio = inicioJanela(agora, cfg.janelaMs);
    await db
      .insert(rateLimits)
      .values({ userId, bucket: nome, janelaInicio, contagem: 1 })
      .onConflictDoUpdate({
        target: [rateLimits.userId, rateLimits.bucket, rateLimits.janelaInicio],
        set: { contagem: sql`${rateLimits.contagem} + 1` },
      });
  }

  return { permitido: true };
}
