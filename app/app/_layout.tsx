import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts as useBricolage,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { bootstrap } from '../src/db/bootstrap';
import { useAppStore } from '../src/store/appStore';
import { tema } from '../src/lib/tema';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { inicializado, logado, onboarded, setInicializado, setLogado, setOnboarded } = useAppStore();

  const [bricolageOk] = useBricolage({ BricolageGrotesque_500Medium, BricolageGrotesque_700Bold });
  const [interOk] = useInter({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });
  const fontesProntas = bricolageOk && interOk;

  useEffect(() => {
    (async () => {
      const r = await bootstrap();
      setLogado(r.userUuid);
      setOnboarded(r.onboarded);
      setInicializado(true);
    })();
  }, []);

  useEffect(() => {
    if (!inicializado) return;
    const rota = segments[0];
    const emLogin = rota === 'login';
    const emOnboarding = rota === 'onboarding';

    if (!logado && !emLogin) {
      router.replace('/login');
    } else if (logado && !onboarded && !emOnboarding) {
      router.replace('/onboarding/cadastro');
    } else if (logado && onboarded && (emLogin || emOnboarding)) {
      router.replace('/');
    }
  }, [inicializado, logado, onboarded, segments]);

  if (!fontesProntas) {
    return <GestureHandlerRootView style={{ flex: 1, backgroundColor: tema.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: tema.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: tema.bg },
            headerTintColor: tema.texto,
            contentStyle: { backgroundColor: tema.bg },
            headerShadowVisible: false,
            headerBackTitle: 'Voltar',
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/cadastro" options={{ title: 'Cadastro', headerBackVisible: false }} />
          <Stack.Screen name="onboarding/areas" options={{ title: 'Suas áreas' }} />
          <Stack.Screen name="onboarding/autoavaliacao" options={{ title: 'Onde você está' }} />
          <Stack.Screen name="checklist" options={{ title: 'Checklist do dia' }} />
          <Stack.Screen name="alvo" options={{ title: 'Alvo de Vida' }} />
          <Stack.Screen name="area/[id]" options={{ title: '' }} />
          <Stack.Screen name="tarefa/[id]" options={{ title: '' }} />
          <Stack.Screen name="dia/[iso]" options={{ title: '' }} />
          <Stack.Screen name="reflexao" options={{ title: 'Reflexão' }} />
          <Stack.Screen name="ajustar" options={{ title: '' }} />
          <Stack.Screen name="ajustar/dia" options={{ title: '' }} />
          <Stack.Screen name="ajustar/memoria" options={{ title: '' }} />
          <Stack.Screen name="reativacao" options={{ title: 'Reativação', headerBackVisible: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
