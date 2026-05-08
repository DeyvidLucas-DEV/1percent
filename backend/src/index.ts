import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.ts';
import { syncRoutes } from './routes/sync.ts';
import { exigirAuth } from './auth/middleware.ts';
import { db } from './db/client.ts';
import { users } from './db/schema.ts';
import { eq } from 'drizzle-orm';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'] }));

app.get('/', (c) => c.json({ name: 'app-1-percent backend', ok: true }));
app.get('/health', (c) => c.json({ ok: true }));

app.route('/auth', authRoutes);
app.route('/sync', syncRoutes);

app.get('/me', exigirAuth, async (c) => {
  const userId = c.get('userId');
  const row = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row[0]) return c.json({ error: 'not_found' }, 404);
  const { id, provider, email, nome, createdAt } = row[0];
  return c.json({ id, provider, email, nome, createdAt });
});

app.delete('/me', exigirAuth, async (c) => {
  const userId = c.get('userId');
  await db.delete(users).where(eq(users.id, userId));
  return c.body(null, 204);
});

const port = Number(process.env.PORT) || 3000;
console.log(`[backend] listening on :${port}`);

export default { fetch: app.fetch, port };
