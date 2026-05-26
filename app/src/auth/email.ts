import { api } from '../lib/api';
import { salvarSessao } from './sessao';

type RespostaAuth = { jwt: string; user: { id: string; email?: string; nome?: string } };

export type ResultadoLoginEmail =
  | { tipo: 'ok'; userUuid: string; nome?: string; email?: string }
  | { tipo: 'erro'; mensagem: string };

export async function registrarEmail(
  email: string,
  senha: string,
  nome?: string
): Promise<ResultadoLoginEmail> {
  try {
    const r = await api.post<RespostaAuth>(
      '/auth/register',
      { email, senha, nome },
      false
    );
    await salvarSessao(r.jwt, r.user.id);
    return { tipo: 'ok', userUuid: r.user.id, nome: r.user.nome, email: r.user.email };
  } catch (e: any) {
    const detail = e?.payload?.detail ?? e?.message ?? String(e);
    if (e?.status === 409) return { tipo: 'erro', mensagem: 'Ja existe uma conta com esse email.' };
    return { tipo: 'erro', mensagem: detail };
  }
}

export async function loginEmail(
  email: string,
  senha: string
): Promise<ResultadoLoginEmail> {
  try {
    const r = await api.post<RespostaAuth>(
      '/auth/login-email',
      { email, senha },
      false
    );
    await salvarSessao(r.jwt, r.user.id);
    return { tipo: 'ok', userUuid: r.user.id, nome: r.user.nome, email: r.user.email };
  } catch (e: any) {
    const detail = e?.payload?.detail ?? e?.message ?? String(e);
    if (e?.status === 401) return { tipo: 'erro', mensagem: 'Email ou senha incorretos.' };
    return { tipo: 'erro', mensagem: detail };
  }
}
