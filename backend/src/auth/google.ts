import { jwtVerify, createRemoteJWKSet } from 'jose';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

// Aceita múltiplos client IDs (iOS + Android) via GOOGLE_CLIENT_IDS (CSV).
// Fallback pra GOOGLE_CLIENT_ID legado pra não quebrar deploy antigo.
const audience = (() => {
  const csv = process.env.GOOGLE_CLIENT_IDS;
  if (csv) {
    const lista = csv.split(',').map((s) => s.trim()).filter(Boolean);
    if (lista.length) return lista;
  }
  const legado = process.env.GOOGLE_CLIENT_ID;
  return legado ? [legado] : [];
})();

if (audience.length === 0) {
  console.warn(
    '[auth/google] nenhum GOOGLE_CLIENT_IDS/GOOGLE_CLIENT_ID definido — login Google vai falhar'
  );
}

export type GoogleClaims = {
  sub: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
};

function decodeUnsafePayload(token: string): Record<string, unknown> | null {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const json = Buffer.from(partes[1]!, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function validarTokenGoogle(idToken: string): Promise<GoogleClaims> {
  if (audience.length === 0) throw new Error('GOOGLE_CLIENT_IDS ausente no servidor');

  // Debug: log claims antes da verificação
  const peek = decodeUnsafePayload(idToken);
  console.log('[auth/google] expected aud =', JSON.stringify(audience));
  console.log('[auth/google] token aud    =', JSON.stringify(peek?.aud));
  console.log('[auth/google] token iss    =', JSON.stringify(peek?.iss));

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience,
  });
  if (typeof payload.sub !== 'string') throw new Error('Google token sem sub');
  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    email_verified: typeof payload.email_verified === 'boolean' ? payload.email_verified : undefined,
  };
}
