// Apple Sign-In desabilitado até comprar Apple Developer Program (USD 99/ano).
// Pra reativar:
//   1. npm install expo-apple-authentication
//   2. app.json: adicionar "usesAppleSignIn": true em ios e "expo-apple-authentication" em plugins
//   3. restaurar este arquivo da versão git anterior

export async function disponivelApple(): Promise<boolean> {
  return false;
}

export async function loginApple(): Promise<{ userUuid: string; nome?: string; email?: string }> {
  throw new Error('Apple Sign-In ainda não disponível. Use Google.');
}
