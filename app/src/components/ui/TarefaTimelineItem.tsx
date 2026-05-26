import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { tema } from '../../lib/tema';
import { paletaArea } from '../../domain/areasPaleta';
import { feedbackStatus } from '../../lib/haptics';
import { StatusGlyph } from './StatusGlyph';
import type { StatusVisualTarefa } from '../../db/queries/tarefas';
import type { StatusExecucao } from '../../db/types';

type Props = {
  nome: string;
  horario: string;
  slugArea: string;
  status: StatusVisualTarefa;
  ehPrimeiro?: boolean;
  ehUltimo?: boolean;
  passou?: boolean;
  proxima?: boolean;
  onToggle: () => void;
  onPress?: () => void;
};

export function TarefaTimelineItem({
  nome,
  horario,
  slugArea,
  status,
  ehPrimeiro,
  ehUltimo,
  passou,
  proxima,
  onToggle,
  onPress,
}: Props) {
  const paleta = paletaArea(slugArea);

  const scale = useSharedValue(1);
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    scale.value = withSequence(
      withTiming(0.85, { duration: 60, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 8, stiffness: 220 })
    );
  }, [status, scale]);

  const estiloCirculo = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handleToggle() {
    let prox: StatusExecucao | null = 'concluido';
    if (status === 'done') prox = 'parcial';
    else if (status === 'half') prox = 'nao_feito';
    else if (status === 'fail') prox = null;
    feedbackStatus(prox);
    onToggle();
  }

  const atrasada = passou && status !== 'done' && status !== 'fail';

  return (
    <View style={[styles.linha, passou && status === 'done' && styles.fadeFeito]}>
      {/* Coluna 1: horário */}
      <View style={styles.horarioCol}>
        <Text style={[styles.horario, atrasada && styles.horarioAtrasado]}>{horario}</Text>
      </View>

      {/* Coluna 2: timeline visual (linha + círculo) */}
      <View style={styles.timelineCol}>
        {!ehPrimeiro && <View style={[styles.linhaVertical, styles.linhaAcima]} />}
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Animated.View
            style={[
              styles.circulo,
              { backgroundColor: paleta.soft, borderColor: paleta.ink },
              atrasada && styles.circuloAtrasado,
              estiloCirculo,
            ]}
          >
            <StatusGlyph status={status} size={18} />
          </Animated.View>
        </Pressable>
        {!ehUltimo && <View style={[styles.linhaVertical, styles.linhaAbaixo]} />}
      </View>

      {/* Coluna 3: card */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          proxima && styles.cardProxima,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Text
          style={[styles.nome, status === 'done' && styles.nomeFeito]}
          numberOfLines={1}
        >
          {nome}
        </Text>
        {atrasada && <Text style={styles.atrasadaLabel}>ATRASADA</Text>}
      </Pressable>
    </View>
  );
}

const CIRCULO_SIZE = 36;
const TIMELINE_COL_WIDTH = 44;

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    minHeight: 60,
  },
  fadeFeito: {
    opacity: 0.55,
  },
  // Horário
  horarioCol: {
    width: 52,
    paddingTop: 14,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  horario: {
    fontSize: 12,
    fontFamily: tema.fontFamily.textSemi,
    color: tema.weak,
  },
  horarioAtrasado: {
    color: tema.perigo,
  },
  // Timeline visual
  timelineCol: {
    width: TIMELINE_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    position: 'relative',
  },
  linhaVertical: {
    position: 'absolute',
    width: 2,
    left: TIMELINE_COL_WIDTH / 2 - 1,
    backgroundColor: tema.borda,
  },
  linhaAcima: {
    top: 0,
    height: 8,
  },
  linhaAbaixo: {
    top: 8 + CIRCULO_SIZE,
    bottom: 0,
  },
  circulo: {
    width: CIRCULO_SIZE,
    height: CIRCULO_SIZE,
    borderRadius: CIRCULO_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloAtrasado: {
    borderColor: tema.perigo,
  },
  // Card
  card: {
    flex: 1,
    marginLeft: 8,
    marginVertical: 4,
    backgroundColor: tema.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: tema.borda,
    justifyContent: 'center',
  },
  cardProxima: {
    borderColor: tema.acento,
    borderWidth: 1.5,
    shadowColor: tema.acento,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  nome: {
    fontSize: 15,
    color: tema.ink,
    fontFamily: tema.fontFamily.textMedium,
  },
  nomeFeito: {
    color: tema.weak,
    textDecorationLine: 'line-through',
  },
  atrasadaLabel: {
    marginTop: 3,
    fontSize: 10,
    color: tema.perigo,
    fontFamily: tema.fontFamily.textBold,
    letterSpacing: 1,
  },
});
