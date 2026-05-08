import { jwtVerify, createRemoteJWKSet } from 'jose';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

const audience = process.env.APPLE_CLIENT_ID || 'com.umporcento.app';

export type AppleClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
};

export async function validarTokenApple(idToken: string): Promise<AppleClaims> {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience,
  });
  if (typeof payload.sub !== 'string') throw new Error('Apple token sem sub');
  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    email_verified:
      typeof payload.email_verified === 'boolean' || typeof payload.email_verified === 'string'
        ? payload.email_verified
        : undefined,
  };
}
