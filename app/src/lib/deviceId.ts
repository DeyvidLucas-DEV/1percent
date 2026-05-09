import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY = 'device_uuid_v1';

let _cache: string | null = null;
let _sessionId: string | null = null;

// device_id persistente por instalação. Apaga só se o usuário desinstalar o app
// ou der "Erase All Content" no Simulator.
export async function getDeviceId(): Promise<string> {
  if (_cache) return _cache;
  const existente = await SecureStore.getItemAsync(KEY);
  if (existente) {
    _cache = existente;
    return existente;
  }
  const novo = Crypto.randomUUID();
  await SecureStore.setItemAsync(KEY, novo);
  _cache = novo;
  return novo;
}

// session_id reseta a cada cold start. Útil pra agrupar eventos de uma mesma
// sessão de uso (ex: vários task_status_changed no mesmo abrir do app).
export function getSessionId(): string {
  if (_sessionId) return _sessionId;
  _sessionId = Crypto.randomUUID();
  return _sessionId;
}
