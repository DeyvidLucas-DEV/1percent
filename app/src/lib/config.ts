// URL pública do backend no Railway.
export const BACKEND_URL = 'https://1percent-production.up.railway.app';

// Client ID Google OAuth (iOS)
export const GOOGLE_IOS_CLIENT_ID =
  '863364734205-pauis7u6qhm56rqtq76uv6d24vc94lac.apps.googleusercontent.com';

// Client ID Google OAuth (Android). Tipo "Web Application" — necessário
// porque expo-auth-session usa Chrome Custom Tabs (fluxo via navegador).
export const GOOGLE_ANDROID_CLIENT_ID =
  '863364734205-bvs2k3ukp1rb6b47jmgepnbkk4poghe6.apps.googleusercontent.com';

// Bundle ID iOS — usado como audience nos tokens Apple
export const APPLE_BUNDLE_ID = 'com.umporcento.app';
