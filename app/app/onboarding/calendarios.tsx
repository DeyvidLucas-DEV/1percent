import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';
import { tema } from '../../src/lib/tema';
import {
  pedirPermissao as pedirPermissaoApple,
  escolherCalendarioDefault,
} from '../../src/lib/calendarioApple';
import {
  marcarAppleCalendarConectado,
  marcarGoogleCalendarConectado,
} from '../../src/db/queries/users';
import { initSchema } from '../../src/db/schema';

type Conexao = 'desconectado' | 'conectando' | 'conectado';

export default function OnboardingCalendarios() {
  const router = useRouter();
  const [google, setGoogle] = useState<Conexao>('desconectado');
  const [apple, setApple] = useState<Conexao>('desconectado');

  // Google ainda mock — Fase 2 vai expandir OAuth scope e validar via backend.
  async function conectarGoogle() {
    if (google !== 'desconectado') return;
    setGoogle('conectando');
    await new Promise((r) => setTimeout(r, 1200));
    await marcarGoogleCalendarConectado().catch(() => {});
    setGoogle('conectado');
  }

  // Apple via expo-calendar: pede permissão, escolhe calendário default,
  // persiste no SQLite local.
  async function conectarApple() {
    if (apple !== 'desconectado') return;
    setApple('conectando');
    try {
      const ok = await pedirPermissaoApple();
      if (!ok) {
        Alert.alert(
          'Permissão negada',
          'Pra conectar a agenda do iPhone, libere o acesso ao calendário em Ajustes do iOS → 1%.'
        );
        setApple('desconectado');
        return;
      }
      const cal = await escolherCalendarioDefault();
      if (!cal) {
        Alert.alert(
          'Nenhum calendário disponível',
          'Não encontrei nenhum calendário editável no seu iPhone. Configure um em Ajustes → Calendário e tente de novo.'
        );
        setApple('desconectado');
        return;
      }
      try {
        await marcarAppleCalendarConectado(cal.id, cal.titulo);
      } catch {
        // Coluna pode não existir se migração não rodou — tenta rodar de novo
        await initSchema().catch(() => {});
        await marcarAppleCalendarConectado(cal.id, cal.titulo);
      }
      setApple('conectado');
    } catch (e: any) {
      Alert.alert('Erro', String(e?.message ?? e));
      setApple('desconectado');
    }
  }

  const podeProsseguir = google === 'conectado' || apple === 'conectado';

  function continuar() {
    if (!podeProsseguir) return;
    router.push('/onboarding/areas');
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.bg}>
        {/* Atmosfera (continuidade visual com login) */}
        <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
          <Defs>
            <LinearGradient id="atmosfera" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#3B3FCC" stopOpacity={1} />
              <Stop offset="0.4" stopColor="#6367FF" stopOpacity={1} />
              <Stop offset="0.85" stopColor="#A89EFF" stopOpacity={1} />
              <Stop offset="1" stopColor="#FFDBFD" stopOpacity={1} />
            </LinearGradient>
            <RadialGradient id="nuvem" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#atmosfera)" />
          <Ellipse cx="50%" cy="20%" rx="55%" ry="12%" fill="url(#nuvem)" />
        </Svg>

        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          {/* Cabeçalho */}
          <View style={styles.cabecalho}>
            <Text style={styles.kicker}>PASSO 2 DE 4</Text>
            <Text style={styles.titulo}>Conecte sua agenda</Text>
            <Text style={styles.sub}>
              Toda tarefa com horário vai entrar na sua agenda do Google ou Apple.
              Sua rotina num lugar só.
            </Text>
          </View>

          {/* Cards de conexão */}
          <View style={styles.cards}>
            <CardConexao
              titulo="Google Calendar"
              icone="logo-google"
              estado={google}
              onPress={conectarGoogle}
              cor="#4285F4"
            />
            <CardConexao
              titulo="Apple Calendar"
              icone="logo-apple"
              estado={apple}
              onPress={conectarApple}
              cor="#000000"
            />
          </View>

          {/* Continuar */}
          <View style={styles.rodapeWrap}>
            <Pressable
              onPress={continuar}
              disabled={!podeProsseguir}
              style={({ pressed }) => [
                styles.btnContinuar,
                !podeProsseguir && styles.btnContinuarDesab,
                pressed && podeProsseguir && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text
                style={[
                  styles.btnContinuarTxt,
                  !podeProsseguir && styles.btnContinuarTxtDesab,
                ]}
              >
                {podeProsseguir ? 'Continuar' : 'Conecte ao menos uma'}
              </Text>
            </Pressable>
            <Text style={styles.rodape}>
              Você pode adicionar ou desconectar agendas depois nas Configurações.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

type CardProps = {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  estado: Conexao;
  onPress: () => void;
  cor: string;
};

function CardConexao({ titulo, icone, estado, onPress, cor }: CardProps) {
  const conectado = estado === 'conectado';
  const conectando = estado === 'conectando';
  return (
    <Pressable
      onPress={onPress}
      disabled={conectado || conectando}
      style={({ pressed }) => [
        styles.card,
        conectado && styles.cardConectado,
        pressed && !conectado && !conectando && { opacity: 0.88 },
      ]}
    >
      <View style={[styles.cardIcone, { backgroundColor: cor }]}>
        <Ionicons name={icone} size={22} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitulo}>{titulo}</Text>
        <Text style={styles.cardSub}>
          {conectado
            ? 'Conectado'
            : conectando
            ? 'Conectando…'
            : 'Toque pra conectar'}
        </Text>
      </View>
      <View style={styles.cardStatus}>
        {conectando ? (
          <ActivityIndicator color={tema.weak} />
        ) : conectado ? (
          <Ionicons name="checkmark-circle" size={22} color={tema.sucesso} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={tema.weak} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#6367FF' },
  safe: { flex: 1, paddingHorizontal: 24 },

  cabecalho: {
    paddingTop: 28,
    alignItems: 'center',
  },
  kicker: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: tema.fontFamily.display,
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  sub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    fontFamily: tema.fontFamily.text,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  cards: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  cardConectado: {
    borderWidth: 2,
    borderColor: tema.sucesso,
  },
  cardIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulo: {
    fontSize: 15,
    fontFamily: tema.fontFamily.textBold,
    color: tema.ink,
  },
  cardSub: {
    fontSize: 12,
    color: tema.weak,
    marginTop: 2,
    fontFamily: tema.fontFamily.textMedium,
  },
  cardStatus: {
    width: 28,
    alignItems: 'center',
  },

  rodapeWrap: {
    paddingBottom: 8,
    gap: 14,
  },
  btnContinuar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  btnContinuarDesab: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    shadowOpacity: 0,
  },
  btnContinuarTxt: {
    color: tema.ink,
    fontSize: 16,
    fontFamily: tema.fontFamily.textBold,
  },
  btnContinuarTxtDesab: {
    color: 'rgba(255,255,255,0.85)',
  },
  rodape: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
});
