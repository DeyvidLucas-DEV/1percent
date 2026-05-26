import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { api } from '../lib/api';
import { salvarSessao } from './sessao';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../lib/config';

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

// 12345-abc.apps.googleusercontent.com → com.googleusercontent.apps.12345-abc
function reversedClientId(clientId: string): string {
  const semDominio = clientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${semDominio}`;
}

function clientIdDaPlataforma(): string {
  if (Platform.OS === 'android') {
    if (!GOOGLE_ANDROID_CLIENT_ID) {
      throw new Error(
        'GOOGLE_ANDROID_CLIENT_ID não configurado. Crie um OAuth Client tipo Android no Google Cloud e preencha em src/lib/config.ts'
      );
    }
    return GOOGLE_ANDROID_CLIENT_ID;
  }
  return GOOGLE_IOS_CLIENT_ID;
}

export type ResultadoLoginGoogle =
  | { tipo: 'ok'; userUuid: string; nome?: string; email?: string }
  | { tipo: 'cancelado' };

export async function loginGoogle(): Promise<ResultadoLoginGoogle> {
  const clientId = clientIdDaPlataforma();
  const redirectUri = AuthSession.makeRedirectUri({
    native: `${reversedClientId(clientId)}:/oauthredirect`,
  });

  // Fluxo "authorization code + PKCE" (única opção pra iOS OAuth Client)
  const requisicao = new AuthSession.AuthRequest({
    clientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const resposta = await requisicao.promptAsync(DISCOVERY);
  // Usuário fechou o sheet/voltou — não é erro, é decisão dele.
  if (resposta.type === 'cancel' || resposta.type === 'dismiss') {
    return { tipo: 'cancelado' };
  }
  if (resposta.type !== 'success') {
    // 'error' / 'locked' / 'opened' etc — aqui sim é falha real
    const erroParam = (resposta as { params?: Record<string, string> }).params?.error;
    throw new Error(
      erroParam
        ? `Falha no login Google: ${erroParam}`
        : `Falha no login Google (${resposta.type})`
    );
  }

  const code = (resposta.params as Record<string, string>)?.code;
  if (!code) throw new Error('Google não retornou code');

  // Troca o code pelo id_token
  const tokenResp = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: requisicao.codeVerifier ? { code_verifier: requisicao.codeVerifier } : undefined,
    },
    DISCOVERY
  );

  const idToken = tokenResp.idToken;
  if (!idToken) throw new Error('Token endpoint não retornou id_token');

  const r = await api.post<{ jwt: string; user: { id: string; email?: string; nome?: string } }>(
    '/auth/login',
    { provider: 'google', idToken },
    false
  );

  await salvarSessao(r.jwt, r.user.id);
  return { tipo: 'ok', userUuid: r.user.id, nome: r.user.nome, email: r.user.email };
}
