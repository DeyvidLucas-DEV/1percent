import type { MiddlewareHandler } from 'hono';
import { verificarJwt } from './jwt.ts';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
  }
}

export const exigirAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const token = header.slice(7);
  try {
    const { userId } = await verificarJwt(token);
    c.set('userId', userId);
    await next();
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }
};
