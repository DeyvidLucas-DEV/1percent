import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../../src/lib/tema';
import { salvarContextoVida } from '../../src/db/queries/users';
import { salvarHorarioTrabalho } from '../../src/db/queries/users';

type Step =
  | 'trabalho'
  | 'tipo_trabalho'
  | 'horario_trabalho'
  | 'fe'
  | 'fe_qual'
  | 'comunidade'
  | 'estuda'
  | 'terapia';

const STEPS_ORDER: Step[] = [
  'trabalho',
  'tipo_trabalho',
  'horario_trabalho',
  'fe',
  'fe_qual',
  'comunidade',
  'estuda',
  'terapia',
];

export default function OnboardingContexto() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);

  // Respostas
  const [trabalha, setTrabalha] = useState<boolean | null>(null);
  const [tipoTrabalho, setTipoTrabalho] = useState<string | null>(null);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('18:00');
  const [praticaFe, setPraticaFe] = useState<boolean | null>(null);
  const [feDenominacao, setFeDenominacao] = useState<string | null>(null);
  const [frequentaComunidade, setFrequentaComunidade] = useState<boolean | null>(null);
  const [estuda, setEstuda] = useState<boolean | null>(null);
  const [fazTerapia, setFazTerapia] = useState<boolean | null>(null);

  function stepsVisiveis(): Step[] {
    const out: Step[] = ['trabalho'];
    if (trabalha === true) {
      out.push('tipo_trabalho', 'horario_trabalho');
    }
    out.push('fe');
    if (praticaFe === true) {
      out.push('fe_qual', 'comunidade');
    }
    out.push('estuda', 'terapia');
    return out;
  }

  const steps = stepsVisiveis();
  const stepAtual = steps[stepIdx] ?? 'trabalho';
  const ehUltimo = stepIdx >= steps.length - 1;
  const progresso = steps.length > 1 ? (stepIdx + 1) / steps.length : 1;

  function avancar() {
    if (ehUltimo) {
      salvar();
      return;
    }
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  }

  function voltar() {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }

  function responder(valor: any, proxStep?: boolean) {
    if (proxStep !== false) {
      setTimeout(avancar, 180);
    }
  }

  async function salvar() {
    try {
      await salvarContextoVida({
        trabalha,
        tipoTrabalho,
        praticaFe,
        feDenominacao,
        frequentaComunidade,
        estuda,
        fazTerapia,
      });
      if (trabalha) {
        await salvarHorarioTrabalho(horarioInicio, horarioFim);
      }
    } catch {}
    router.push('/onboarding/calendarios');
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.bg} edges={['top', 'bottom']}>
        {/* Barra de progresso */}
        <View style={styles.progressoWrap}>
          {stepIdx > 0 && (
            <Pressable onPress={voltar} hitSlop={12} style={styles.btnVoltar}>
              <Ionicons name="chevron-back" size={22} color={tema.ink} />
            </Pressable>
          )}
          <View style={styles.progressoBarra}>
            <View style={[styles.progressoFill, { width: `${progresso * 100}%` }]} />
          </View>
          <Text style={styles.progressoTxt}>{stepIdx + 1}/{steps.length}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {stepAtual === 'trabalho' && (
            <StepPergunta
              pergunta="Você trabalha atualmente?"
              sub="Isso ajuda a montar sua rotina sem conflito de horário."
            >
              <OpcaoBotao
                label="Sim, trabalho"
                ativo={trabalha === true}
                onPress={() => { setTrabalha(true); responder(true); }}
              />
              <OpcaoBotao
                label="Não no momento"
                ativo={trabalha === false}
                onPress={() => { setTrabalha(false); responder(false); }}
              />
            </StepPergunta>
          )}

          {stepAtual === 'tipo_trabalho' && (
            <StepPergunta pergunta="Que tipo de trabalho?" sub="">
              {['CLT', 'Autônomo', 'Empresário', 'Servidor', 'Freelancer'].map((t) => (
                <OpcaoBotao
                  key={t}
                  label={t}
                  ativo={tipoTrabalho === t.toLowerCase()}
                  onPress={() => { setTipoTrabalho(t.toLowerCase()); responder(t); }}
                />
              ))}
            </StepPergunta>
          )}

          {stepAtual === 'horario_trabalho' && (
            <StepPergunta pergunta="Qual seu horário?" sub="Aproximado tá ok. A IA não vai sugerir tarefas nesse período.">
              <View style={styles.horarioRow}>
                <View style={styles.horarioInput}>
                  <Text style={styles.horarioLabel}>Entrada</Text>
                  <TextInput
                    style={styles.horarioTxt}
                    value={horarioInicio}
                    onChangeText={setHorarioInicio}
                    placeholder="08:00"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
                <Text style={styles.horarioAte}>até</Text>
                <View style={styles.horarioInput}>
                  <Text style={styles.horarioLabel}>Saída</Text>
                  <TextInput
                    style={styles.horarioTxt}
                    value={horarioFim}
                    onChangeText={setHorarioFim}
                    placeholder="18:00"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                </View>
              </View>
              <Pressable
                onPress={avancar}
                style={({ pressed }) => [styles.btnContinuarStep, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.btnContinuarStepTxt}>Continuar</Text>
              </Pressable>
            </StepPergunta>
          )}

          {stepAtual === 'fe' && (
            <StepPergunta
              pergunta="Pratica alguma fé ou religião?"
              sub="Sem julgamento. Só pra saber se faz sentido incluir tarefas espirituais."
            >
              <OpcaoBotao label="Sim" ativo={praticaFe === true} onPress={() => { setPraticaFe(true); responder(true); }} />
              <OpcaoBotao label="Não" ativo={praticaFe === false} onPress={() => { setPraticaFe(false); responder(false); }} />
            </StepPergunta>
          )}

          {stepAtual === 'fe_qual' && (
            <StepPergunta pergunta="Qual?" sub="">
              {['Cristão', 'Católico', 'Espírita', 'Outra'].map((f) => (
                <OpcaoBotao
                  key={f}
                  label={f}
                  ativo={feDenominacao === f.toLowerCase()}
                  onPress={() => { setFeDenominacao(f.toLowerCase()); responder(f); }}
                />
              ))}
            </StepPergunta>
          )}

          {stepAtual === 'comunidade' && (
            <StepPergunta pergunta="Frequenta alguma comunidade ou igreja?" sub="">
              <OpcaoBotao label="Sim" ativo={frequentaComunidade === true} onPress={() => { setFrequentaComunidade(true); responder(true); }} />
              <OpcaoBotao label="Não" ativo={frequentaComunidade === false} onPress={() => { setFrequentaComunidade(false); responder(false); }} />
            </StepPergunta>
          )}

          {stepAtual === 'estuda' && (
            <StepPergunta
              pergunta="Estuda atualmente?"
              sub="Faculdade, curso, pós, autodidata — conta."
            >
              <OpcaoBotao label="Sim" ativo={estuda === true} onPress={() => { setEstuda(true); responder(true); }} />
              <OpcaoBotao label="Não" ativo={estuda === false} onPress={() => { setEstuda(false); responder(false); }} />
            </StepPergunta>
          )}

          {stepAtual === 'terapia' && (
            <StepPergunta
              pergunta="Faz acompanhamento psicológico?"
              sub="Terapia, psiquiatra, coaching — qualquer acompanhamento."
            >
              <OpcaoBotao label="Sim" ativo={fazTerapia === true} onPress={() => { setFazTerapia(true); responder(true); }} />
              <OpcaoBotao label="Não" ativo={fazTerapia === false} onPress={() => { setFazTerapia(false); responder(false); }} />
            </StepPergunta>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function StepPergunta({
  pergunta,
  sub,
  children,
}: {
  pergunta: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.pergunta}>{pergunta}</Text>
      {!!sub && <Text style={styles.perguntaSub}>{sub}</Text>}
      <View style={styles.opcoesWrap}>{children}</View>
    </View>
  );
}

function OpcaoBotao({
  label,
  ativo,
  onPress,
}: {
  label: string;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.opcao,
        ativo && styles.opcaoAtiva,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={[styles.opcaoTxt, ativo && styles.opcaoTxtAtiva]}>{label}</Text>
      {ativo && <Ionicons name="checkmark" size={18} color={tema.acentoTexto} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  progressoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  btnVoltar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressoBarra: {
    flex: 1,
    height: 4,
    backgroundColor: tema.bgSoft,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressoFill: {
    height: 4,
    backgroundColor: tema.acento,
    borderRadius: 2,
  },
  progressoTxt: {
    fontSize: 12,
    color: tema.weak,
    fontFamily: tema.fontFamily.textSemi,
    minWidth: 28,
    textAlign: 'right',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  stepWrap: {},
  pergunta: {
    fontSize: 28,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 10,
  },
  perguntaSub: {
    fontSize: 14,
    fontFamily: tema.fontFamily.text,
    color: tema.weak,
    lineHeight: 20,
    marginBottom: 28,
  },
  opcoesWrap: {
    gap: 10,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: tema.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: tema.borda,
  },
  opcaoAtiva: {
    backgroundColor: tema.acento,
    borderColor: tema.acento,
  },
  opcaoTxt: {
    fontSize: 16,
    fontFamily: tema.fontFamily.textSemi,
    color: tema.ink,
  },
  opcaoTxtAtiva: {
    color: tema.acentoTexto,
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  horarioInput: {
    flex: 1,
    backgroundColor: tema.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tema.borda,
    padding: 14,
    alignItems: 'center',
  },
  horarioLabel: {
    fontSize: 11,
    color: tema.weak,
    fontFamily: tema.fontFamily.textSemi,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  horarioTxt: {
    fontSize: 24,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  horarioAte: {
    fontSize: 14,
    color: tema.weak,
    fontFamily: tema.fontFamily.textMedium,
  },
  btnContinuarStep: {
    backgroundColor: tema.acento,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  btnContinuarStepTxt: {
    color: tema.acentoTexto,
    fontSize: 16,
    fontFamily: tema.fontFamily.textBold,
  },
});
