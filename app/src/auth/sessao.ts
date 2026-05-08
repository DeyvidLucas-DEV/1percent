import * as SecureStore from 'expo-secure-store';

const KEY_JWT = 'auth_jwt';
const KEY_USER_UUID = 'auth_user_uuid';

export async function salvarSessao(jwt: string, userUuid: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_JWT, jwt);
  await SecureStore.setItemAsync(KEY_USER_UUID, userUuid);
}

export async function lerSessao(): Promise<{ jwt: string; userUuid: string } | null> {
  const [jwt, userUuid] = await Promise.all([
    SecureStore.getItemAsync(KEY_JWT),
    SecureStore.getItemAsync(KEY_USER_UUID),
  ]);
  if (!jwt || !userUuid) return null;
  return { jwt, userUuid };
}

export async function limparSessao(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_JWT),
    SecureStore.deleteItemAsync(KEY_USER_UUID),
  ]);
}
