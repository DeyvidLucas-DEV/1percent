import { BACKEND_URL } from './config';
import { lerSessao } from '../auth/sessao';

export class ApiError extends Error {
  constructor(public status: number, public payload: unknown, message: string) {
    super(message);
  }
}

async function request<T>(
  metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  rota: string,
  body?: unknown,
  exigeAuth = true
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (exigeAuth) {
    const sessao = await lerSessao();
    if (!sessao) throw new ApiError(401, null, 'sem_sessao');
    headers.Authorization = `Bearer ${sessao.jwt}`;
  }
  const r = await fetch(`${BACKEND_URL}${rota}`, {
    method: metodo,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!r.ok) throw new ApiError(r.status, payload, `${metodo} ${rota} → ${r.status}`);
  return payload as T;
}

export const api = {
  get: <T>(rota: string) => request<T>('GET', rota),
  post: <T>(rota: string, body?: unknown, exigeAuth = true) =>
    request<T>('POST', rota, body, exigeAuth),
  patch: <T>(rota: string, body?: unknown) => request<T>('PATCH', rota, body),
  del: <T>(rota: string) => request<T>('DELETE', rota),
};
