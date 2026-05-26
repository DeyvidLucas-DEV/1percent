import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';
import { and, eq } from 'drizzle-orm';
import { validarTokenApple } from '../auth/apple.ts';
import { validarTokenGoogle } from '../auth/google.ts';
import { emitirJwt } from '../auth/jwt.ts';

const loginBody = z.object({
  provider: z.enum(['apple', 'google']),
  idToken: z.string().min(1),
});

const registerEmailBody = z.object({
  email: z.string().email(),
  senha: z.string().min(8),
  nome: z.string().min(1).optional(),
});

const loginEmailBody = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const authRoutes = new Hono();

// Login via OAuth (Google/Apple)
authRoutes.post('/login', async (c) => {
  const parsed = loginBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);

  const { provider, idToken } = parsed.data;
  let sub: string;
  let email: string | undefined;
  let nome: string | undefined;

  try {
    if (provider === 'apple') {
      const claims = await validarTokenApple(idToken);
      sub = claims.sub;
      email = claims.email;
    } else {
      const claims = await validarTokenGoogle(idToken);
      sub = claims.sub;
      email = claims.email;
      nome = claims.name;
    }
  } catch (e) {
    return c.json({ error: 'invalid_provider_token', detail: String(e) }, 401);
  }

  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, provider), eq(users.providerSub, sub)))
    .limit(1);

  let userId: string;
  if (existing[0]) {
    userId = existing[0].id;
    await db
      .update(users)
      .set({ email: email ?? existing[0].email, nome: nome ?? existing[0].nome, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } else {
    const inserted = await db
      .insert(users)
      .values({ provider, providerSub: sub, email, nome })
      .returning({ id: users.id });
    userId = inserted[0]!.id;
  }

  const jwt = await emitirJwt(userId);
  return c.json({ jwt, user: { id: userId, email, nome } });
});

// Registro por email + senha
authRoutes.post('/register', async (c) => {
  const parsed = registerEmailBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);

  const { email, senha, nome } = parsed.data;

  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, 'email'), eq(users.providerSub, email)))
    .limit(1);

  if (existing[0]) {
    return c.json({ error: 'email_em_uso', detail: 'Já existe uma conta com esse email.' }, 409);
  }

  const passwordHash = await Bun.password.hash(senha, { algorithm: 'argon2id' });

  const inserted = await db
    .insert(users)
    .values({ provider: 'email', providerSub: email, email, nome, passwordHash })
    .returning({ id: users.id });

  const userId = inserted[0]!.id;
  const jwt = await emitirJwt(userId);
  return c.json({ jwt, user: { id: userId, email, nome } });
});

// Login por email + senha
authRoutes.post('/login-email', async (c) => {
  const parsed = loginEmailBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);

  const { email, senha } = parsed.data;

  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, 'email'), eq(users.providerSub, email)))
    .limit(1);

  if (!existing[0]) {
    return c.json({ error: 'credenciais_invalidas', detail: 'Email ou senha incorretos.' }, 401);
  }

  const user = existing[0];
  if (!user.passwordHash) {
    return c.json({ error: 'credenciais_invalidas', detail: 'Email ou senha incorretos.' }, 401);
  }

  const senhaCorreta = await Bun.password.verify(senha, user.passwordHash);
  if (!senhaCorreta) {
    return c.json({ error: 'credenciais_invalidas', detail: 'Email ou senha incorretos.' }, 401);
  }

  const jwt = await emitirJwt(user.id);
  return c.json({ jwt, user: { id: user.id, email: user.email, nome: user.nome } });
});
