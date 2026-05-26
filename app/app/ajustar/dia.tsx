import { Redirect } from 'expo-router';

// A funcionalidade de "Como foi seu dia" foi absorvida pela tela /ajustar
// (orb único como interface). Mantemos esta rota viva como redirect pra não
// quebrar links/atalhos antigos.
export default function ContarOdiaRedirect() {
  return <Redirect href="/ajustar" />;
}
