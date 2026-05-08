import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../lib/api';
import { salvarSessao } from './sessao';
import { GOOGLE_IOS_CLIENT_ID } from '../lib/config';

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

export async function loginGoogle(): Promise<{ userUuid: string; nome?: string; email?: string }> {
  const redirectUri = AuthSession.makeRedirectUri({
    native: `${reversedClientId(GOOGLE_IOS_CLIENT_ID)}:/oauthredirect`,
  });

  // Fluxo "authorization code + PKCE" (única opção pra iOS OAuth Client)
  const requisicao = new AuthSession.AuthRequest({
    clientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const resposta = await requisicao.promptAsync(DISCOVERY);
  if (resposta.type !== 'success') {
    throw new Error(`Login Google cancelado/falhou: ${resposta.type}`);
  }

  const code = (resposta.params as Record<string, string>)?.code;
  if (!code) throw new Error('Google não retornou code');

  // Troca o code pelo id_token
  const tokenResp = await AuthSession.exchangeCodeAsync(
    {
      clientId: GOOGLE_IOS_CLIENT_ID,
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
  return { userUuid: r.user.id, nome: r.user.nome, email: r.user.email };
}
