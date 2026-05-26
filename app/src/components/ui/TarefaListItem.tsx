import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
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
  horario?: string | null;
  slugArea: string;
  status: StatusVisualTarefa;
  onToggle: () => void;
  onPress?: () => void;
};

function visualParaExec(s: StatusVisualTarefa): StatusExecucao | null {
  if (s === 'done') return 'concluido';
  if (s === 'half') return 'parcial';
  if (s === 'fail') return 'nao_feito';
  return null;
}

export function TarefaListItem({ nome, horario, slugArea, status, onToggle, onPress }: Props) {
  const paleta = paletaArea(slugArea);

  // Spring no checkbox quando o status muda — pula o primeiro render
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

  const estiloCheckbox = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handleToggle() {
    // Dispara haptic conforme o próximo status (calculado igual ao Hoje)
    let prox: StatusExecucao | null = 'concluido';
    if (status === 'done') prox = 'parcial';
    else if (status === 'half') prox = 'nao_feito';
    else if (status === 'fail') prox = null;
    feedbackStatus(prox);
    onToggle();
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linha, pressed && { opacity: 0.55 }]}
    >
      <View style={styles.horarioBox}>
        <Text style={styles.horario}>{horario ?? ''}</Text>
      </View>
      <View style={[styles.boxArea, { backgroundColor: paleta.soft }]}>
        <View style={[styles.boxAreaDot, { backgroundColor: paleta.ink }]} />
      </View>
      <Text
        style={[styles.nome, status === 'done' && styles.nomeFeito]}
        numberOfLines={1}
      >
        {nome}
      </Text>
      <Pressable
        onPress={handleToggle}
        hitSlop={10}
        style={({ pressed }) => [styles.checkbox, pressed && { opacity: 0.7 }]}
      >
        <Animated.View style={estiloCheckbox}>
          <StatusGlyph status={status} size={26} />
        </Animated.View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  horarioBox: {
    width: 48,
  },
  horario: {
    fontSize: 12,
    color: tema.weak,
    fontFamily: tema.fontFamily.textMedium,
    letterSpacing: 0.2,
  },
  boxArea: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxAreaDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  nome: {
    flex: 1,
    color: tema.ink,
    fontSize: 15,
    fontFamily: tema.fontFamily.textMedium,
  },
  nomeFeito: {
    color: tema.weak,
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
