import { initSchema } from './schema';
import { seedIfEmpty } from './seed';
import { getUser } from './queries/users';
import { pedirPermissao, agendarLembretesDiarios } from '../lib/notificacoes';

export type BootstrapResult = {
  onboarded: boolean;
};

export async function bootstrap(): Promise<BootstrapResult> {
  await initSchema();
  await seedIfEmpty();
  const user = await getUser();
  const onboarded = !!user?.onboarded_at;

  if (onboarded) {
    try {
      const ok = await pedirPermissao();
      if (ok) await agendarLembretesDiarios();
    } catch {
      // Em ambiente Expo Go com SDK 53+ as notificações remotas são limitadas,
      // mas locais agendadas funcionam. Seguimos sem travar o boot se falhar.
    }
  }
  return { onboarded };
}
