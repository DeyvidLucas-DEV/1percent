import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrap } from '../src/db/bootstrap';
import { useAppStore } from '../src/store/appStore';
import { tema } from '../src/lib/tema';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { inicializado, onboarded, setInicializado, setOnboarded } = useAppStore();

  useEffect(() => {
    (async () => {
      const r = await bootstrap();
      setOnboarded(r.onboarded);
      setInicializado(true);
    })();
  }, []);

  useEffect(() => {
    if (!inicializado) return;
    const emOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !emOnboarding) {
      router.replace('/onboarding/cadastro');
    } else if (onboarded && emOnboarding) {
      router.replace('/');
    }
  }, [inicializado, onboarded, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: tema.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: tema.bg },
            headerTintColor: tema.texto,
            contentStyle: { backgroundColor: tema.bg },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Hoje' }} />
          <Stack.Screen name="onboarding/cadastro" options={{ title: 'Cadastro', headerBackVisible: false }} />
          <Stack.Screen name="onboarding/areas" options={{ title: 'Suas áreas' }} />
          <Stack.Screen name="onboarding/autoavaliacao" options={{ title: 'Onde você está' }} />
          <Stack.Screen name="checklist" options={{ title: 'Checklist do dia' }} />
          <Stack.Screen name="alvo" options={{ title: 'Alvo de Vida' }} />
          <Stack.Screen name="reflexao" options={{ title: 'Reflexão' }} />
          <Stack.Screen name="reativacao" options={{ title: 'Reativação', headerBackVisible: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
