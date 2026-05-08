import { initSchema } from './schema';
import { seedIfEmpty } from './seed';
import { getUser } from './queries/users';
import { pedirPermissao, agendarLembretesDiarios } from '../lib/notificacoes';
import { lerSessao } from '../auth/sessao';
import { sincronizar } from '../sync/sync';

export type BootstrapResult = {
  logado: boolean;
  userUuid: string | null;
  onboarded: boolean;
};

export async function bootstrap(): Promise<BootstrapResult> {
  await initSchema();
  await seedIfEmpty();
  const sessao = await lerSessao();
  const user = await getUser();
  const onboarded = !!user?.onboarded_at;

  if (sessao && onboarded) {
    try {
      const ok = await pedirPermissao();
      if (ok) await agendarLembretesDiarios();
    } catch {
      // Em ambiente Expo Go com SDK 53+ as notificações remotas são limitadas,
      // mas locais agendadas funcionam. Seguimos sem travar o boot se falhar.
    }
    // Sync best-effort em background — não trava o boot se rede/backend falhar.
    sincronizar().catch(err => {
      console.warn('[sync] falhou no boot:', err);
    });
  }
  return { logado: !!sessao, userUuid: sessao?.userUuid ?? null, onboarded };
}
