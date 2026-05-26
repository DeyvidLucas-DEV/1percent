import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';
import { tema } from '../src/lib/tema';
import { loginGoogle } from '../src/auth/google';
import { registrarEmail, loginEmail } from '../src/auth/email';
import { useAppStore } from '../src/store/appStore';

type Modo = 'inicio' | 'entrar' | 'criar';

export default function Login() {
  const router = useRouter();
  const setLogado = useAppStore((s) => s.setLogado);
  const [carregando, setCarregando] = useState(false);
  const [modo, setModo] = useState<Modo>('inicio');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function entrarGoogle() {
    setCarregando(true);
    try {
      const r = await loginGoogle();
      if (r.tipo === 'cancelado') return;
      setLogado(r.userUuid);
      router.replace('/');
    } catch (e: any) {
      const detalhe = e?.payload?.detail ?? e?.payload?.error ?? '';
      const mensagem = e?.message ?? String(e);
      Alert.alert('Falha no login', detalhe ? `${mensagem}\n\n${detalhe}` : mensagem);
    } finally {
      setCarregando(false);
    }
  }

  async function submeterEmail() {
    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo) return Alert.alert('Preencha o email');
    if (senha.length < 8) return Alert.alert('Senha precisa ter no minimo 8 caracteres');
    if (modo === 'criar' && !nome.trim()) return Alert.alert('Preencha seu nome');

    setCarregando(true);
    try {
      const r =
        modo === 'criar'
          ? await registrarEmail(emailLimpo, senha, nome.trim())
          : await loginEmail(emailLimpo, senha);

      if (r.tipo === 'erro') {
        Alert.alert('Falha', r.mensagem);
        return;
      }
      setLogado(r.userUuid);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Erro inesperado', e?.message ?? String(e));
    } finally {
      setCarregando(false);
    }
  }

  function voltar() {
    setModo('inicio');
    setEmail('');
    setSenha('');
    setNome('');
    setMostrarSenha(false);
  }

  return (
    <View style={styles.bg}>
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <LinearGradient id="atmosfera" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3B3FCC" stopOpacity={1} />
            <Stop offset="0.4" stopColor="#6367FF" stopOpacity={1} />
            <Stop offset="0.75" stopColor="#A89EFF" stopOpacity={1} />
            <Stop offset="1" stopColor="#FFDBFD" stopOpacity={1} />
          </LinearGradient>
          <RadialGradient id="nuvem1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
            <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="nuvem2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#FFDBFD" stopOpacity={0.5} />
            <Stop offset="100%" stopColor="#FFDBFD" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="horizonte" cx="50%" cy="100%" r="80%" fx="50%" fy="100%">
            <Stop offset="0%" stopColor="#FFDBFD" stopOpacity={0.6} />
            <Stop offset="100%" stopColor="#FFDBFD" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#atmosfera)" />
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#horizonte)" />
        <Ellipse cx="50%" cy="38%" rx="55%" ry="14%" fill="url(#nuvem2)" />
        <Ellipse cx="50%" cy="38%" rx="42%" ry="10%" fill="url(#nuvem1)" />
        <Ellipse cx="38%" cy="36%" rx="20%" ry="8%" fill="url(#nuvem1)" />
        <Ellipse cx="62%" cy="40%" rx="22%" ry="7%" fill="url(#nuvem1)" />
      </Svg>

      <SafeAreaView style={styles.bgSafe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Logo */}
            <View style={styles.topo}>
              <Text style={styles.logo}>1%</Text>
              <View style={styles.logoUnderline} />
            </View>

            {modo === 'inicio' ? (
              <>
                {/* Tagline */}
                <View style={styles.tagline}>
                  <Text style={styles.taglineTxt}>Resultado e consequencia.</Text>
                  <Text style={styles.taglineTxt}>Processo e decisao.</Text>
                </View>

                {/* Acoes */}
                <View style={styles.acoes}>
                  <Pressable
                    onPress={entrarGoogle}
                    disabled={carregando}
                    style={({ pressed }) => [
                      styles.btnPrincipal,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      carregando && { opacity: 0.6 },
                    ]}
                  >
                    {carregando ? (
                      <ActivityIndicator color={tema.ink} />
                    ) : (
                      <View style={styles.btnRow}>
                        <Ionicons name="logo-google" size={18} color={tema.ink} />
                        <Text style={styles.btnPrincipalTxt}>Continuar com Google</Text>
                      </View>
                    )}
                  </Pressable>

                  <View style={styles.divisor}>
                    <View style={styles.divisorLinha} />
                    <Text style={styles.divisorTxt}>OU</Text>
                    <View style={styles.divisorLinha} />
                  </View>

                  <Pressable
                    onPress={() => setModo('entrar')}
                    style={({ pressed }) => [
                      styles.btnSecundario,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <View style={styles.btnRow}>
                      <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.btnSecundarioTxt}>Entrar com email</Text>
                    </View>
                  </Pressable>

                  <Text style={styles.rodape}>
                    Seus dados sao seus. Login so pra sincronizar entre seus aparelhos.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Formulario de email */}
                <View style={styles.formArea}>
                  <Text style={styles.formTitulo}>
                    {modo === 'criar' ? 'Criar conta' : 'Entrar'}
                  </Text>

                  {modo === 'criar' && (
                    <View style={styles.campo}>
                      <Text style={styles.campoLabel}>Nome</Text>
                      <TextInput
                        style={styles.input}
                        value={nome}
                        onChangeText={setNome}
                        placeholder="Seu nome"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        autoCapitalize="words"
                        autoComplete="name"
                        returnKeyType="next"
                      />
                    </View>
                  )}

                  <View style={styles.campo}>
                    <Text style={styles.campoLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="seu@email.com"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={styles.campo}>
                    <Text style={styles.campoLabel}>Senha</Text>
                    <View style={styles.senhaRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={senha}
                        onChangeText={setSenha}
                        placeholder="Minimo 8 caracteres"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        secureTextEntry={!mostrarSenha}
                        autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                        returnKeyType="done"
                        onSubmitEditing={submeterEmail}
                      />
                      <Pressable
                        onPress={() => setMostrarSenha(!mostrarSenha)}
                        style={styles.olhoBtn}
                        hitSlop={12}
                      >
                        <Ionicons
                          name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="rgba(255,255,255,0.7)"
                        />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    onPress={submeterEmail}
                    disabled={carregando}
                    style={({ pressed }) => [
                      styles.btnPrincipal,
                      { marginTop: 8 },
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      carregando && { opacity: 0.6 },
                    ]}
                  >
                    {carregando ? (
                      <ActivityIndicator color={tema.ink} />
                    ) : (
                      <Text style={styles.btnPrincipalTxt}>
                        {modo === 'criar' ? 'Criar conta' : 'Entrar'}
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => setModo(modo === 'criar' ? 'entrar' : 'criar')}
                    style={styles.alternar}
                    hitSlop={8}
                  >
                    <Text style={styles.alternarTxt}>
                      {modo === 'criar'
                        ? 'Ja tem conta? Entrar'
                        : 'Primeira vez? Criar conta'}
                    </Text>
                  </Pressable>

                  <Pressable onPress={voltar} style={styles.voltar} hitSlop={8}>
                    <Ionicons name="arrow-back" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.voltarTxt}>Voltar</Text>
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#6367FF' },
  bgSafe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'space-between' },

  topo: {
    alignItems: 'center',
    paddingTop: 28,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 56,
    fontFamily: tema.fontFamily.display,
    letterSpacing: -1.5,
    lineHeight: 62,
  },
  logoUnderline: {
    width: 28,
    height: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
    marginTop: -4,
  },

  tagline: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  taglineTxt: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: tema.fontFamily.display,
    letterSpacing: -0.8,
    lineHeight: 38,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  acoes: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    gap: 18,
    alignItems: 'stretch',
  },

  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnPrincipal: {
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
  btnPrincipalTxt: {
    color: tema.ink,
    fontSize: 16,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: -0.2,
  },

  btnSecundario: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  btnSecundarioTxt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: tema.fontFamily.textSemi,
    letterSpacing: -0.2,
  },

  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divisorLinha: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  divisorTxt: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontFamily: tema.fontFamily.textSemi,
    letterSpacing: 1.4,
  },

  rodape: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
    marginTop: 4,
  },

  // Formulario email
  formArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 4,
  },
  formTitulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: tema.fontFamily.display,
    letterSpacing: -0.8,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  campo: {
    marginBottom: 14,
  },
  campoLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: tema.fontFamily.textSemi,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: tema.fontFamily.text,
  },
  senhaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  olhoBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
  },

  alternar: {
    alignSelf: 'center',
    marginTop: 16,
  },
  alternarTxt: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: tema.fontFamily.textSemi,
    textDecorationLine: 'underline',
  },

  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 16,
  },
  voltarTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: tema.fontFamily.text,
  },
});
