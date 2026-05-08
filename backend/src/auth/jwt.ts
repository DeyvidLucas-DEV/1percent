import { SignJWT, jwtVerify } from 'jose';

const secret = process.env.APP_JWT_SECRET;
if (!secret) throw new Error('APP_JWT_SECRET não definida');
const key = new TextEncoder().encode(secret);

const TTL_DIAS = 30;

export async function emitirJwt(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_DIAS}d`)
    .setIssuer('app-1-percent')
    .sign(key);
}

export async function verificarJwt(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, key, { issuer: 'app-1-percent' });
  if (typeof payload.uid !== 'string') throw new Error('JWT sem uid');
  return { userId: payload.uid };
}
