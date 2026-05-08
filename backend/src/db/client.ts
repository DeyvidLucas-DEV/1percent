import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL não definida');

const queryClient = postgres(url, { max: 10 });
export const db = drizzle(queryClient, { schema });
export type DB = typeof db;
