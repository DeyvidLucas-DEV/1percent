import { jwtVerify, createRemoteJWKSet } from 'jose';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

const audience = process.env.GOOGLE_CLIENT_ID;
if (!audience) {
  console.warn('[auth/google] GOOGLE_CLIENT_ID não definida — login Google vai falhar');
}

export type GoogleClaims = {
  sub: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
};

export async function validarTokenGoogle(idToken: string): Promise<GoogleClaims> {
  if (!audience) throw new Error('GOOGLE_CLIENT_ID ausente no servidor');
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
