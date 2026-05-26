import { initSchema } from './schema';
import { seedIfEmpty } from './seed';
import { getUser } from './queries/users';
import { pedirPermissao } from '../lib/notificacoes';
import { reagendarTudo } from '../lib/agendarNotificacoesTarefas';
import { lerSessao } from '../auth/sessao';
import { sincronizar } from '../sync/sync';

export type BootstrapResult = {
  logado: boolean;
  userUuid: string | null;
  onboarded: boolean;
};

export async function bootstrap(): Promise<BootstrapResult> {
  // Schema + seed SEMPRE rodam — nunca retorna early se falharem.
  // As migrações em rodarMigracoes() são idempotentes: se o schema já existir
  // parcialmente (de um boot anterior), as novas colunas são adicionadas.
  try {
    await initSchema();
  } catch (e) {
    console.error('[bootstrap] initSchema falhou, tentando continuar:', e);
  }

  try {
    await seedIfEmpty();
  } catch (e) {
    console.error('[bootstrap] seedIfEmpty falhou:', e);
  }

  let sessao: { jwt: string; userUuid: string } | null = null;
  try {
    sessao = await lerSessao();
  } catch {
    // SecureStore falhou — trata como deslogado
  }

  let onboarded = false;
  try {
    const user = await getUser();
    onboarded = !!(user?.onboarded_at && user?.nome && user.nome.trim());
  } catch {
    // DB query falhou — trata como não-onboarded
  }

  if (sessao && onboarded) {
    try {
      const ok = await pedirPermissao();
      if (ok) await reagendarTudo();
    } catch {}
    sincronizar().catch((err) => {
      console.warn('[sync] falhou no boot:', err);
    });
  }
  return { logado: !!sessao, userUuid: sessao?.userUuid ?? null, onboarded };
}
