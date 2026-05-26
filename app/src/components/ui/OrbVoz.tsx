import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Ellipse } from 'react-native-svg';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { tema } from '../../lib/tema';

export type EstadoOrb = 'idle' | 'gravando' | 'processando';

type Props = {
  size?: number;
  estado?: EstadoOrb;
  /**
   * Amplitude normalizada 0-1 do áudio do mic. Usada quando estado === 'gravando'
   * pra fazer o orb reagir em tempo real ao volume. Em outros estados é ignorada.
   */
  amplitude?: SharedValue<number>;
};

export function OrbVoz({ size = 160, estado = 'idle', amplitude }: Props) {
  // Camadas SEM amplitude — oscilação idle muito sutil + rotação contínua.
  // Quando entra em gravando, essas paramaram visualmente sob o efeito da amplitude.
  const halo1 = useSharedValue(1);
  const halo2 = useSharedValue(1);
  const rotate = useSharedValue(0);
  const breathe = useSharedValue(1);

  // Fallback amplitude quando não vier do parent (idle sempre 0).
  const ampInterna = useSharedValue(0);
  const amp = amplitude ?? ampInterna;

  useEffect(() => {
    if (estado === 'idle') {
      // Respiração quase imperceptível
      halo1.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      halo2.value = withDelay(
        1400,
        withRepeat(
          withSequence(
            withTiming(1.025, { duration: 3600, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.ease) })
          ),
          -1
        )
      );
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.99, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      // Rotação muito lenta
      rotate.value = withRepeat(
        withTiming(360, { duration: 26000, easing: Easing.linear }),
        -1
      );
    } else if (estado === 'gravando') {
      // Para a respiração cíclica — quem manda agora é a amplitude do mic.
      halo1.value = withTiming(1, { duration: 200 });
      halo2.value = withTiming(1, { duration: 200 });
      breathe.value = withTiming(1, { duration: 200 });
      // Rotação um pouco mais ativa
      rotate.value = withRepeat(
        withTiming(360, { duration: 14000, easing: Easing.linear }),
        -1
      );
    } else if (estado === 'processando') {
      // Para a respiração; rotação muito rápida = "pensando"
      halo1.value = withTiming(1.06, { duration: 300 });
      halo2.value = withTiming(1.04, { duration: 300 });
      breathe.value = withTiming(1.02, { duration: 300 });
      rotate.value = withRepeat(
        withTiming(360, { duration: 2200, easing: Easing.linear }),
        -1
      );
    }
  }, [estado, halo1, halo2, breathe, rotate]);

  // Quando NÃO está gravando, garante que amplitude interna fica em 0.
  useEffect(() => {
    if (estado !== 'gravando') {
      ampInterna.value = withTiming(0, { duration: 200 });
    }
  }, [estado, ampInterna]);

  const estiloHalo1 = useAnimatedStyle(() => {
    const gravando = estado === 'gravando';
    const ampBoost = gravando ? amp.value * 0.35 : 0;
    return {
      transform: [{ scale: halo1.value + ampBoost }],
      opacity: gravando ? 0.18 + amp.value * 0.22 : 0.14,
    };
  });

  const estiloHalo2 = useAnimatedStyle(() => {
    const gravando = estado === 'gravando';
    const ampBoost = gravando ? amp.value * 0.28 : 0;
    return {
      transform: [{ scale: halo2.value + ampBoost }],
      opacity: gravando ? 0.28 + amp.value * 0.18 : 0.22,
    };
  });

  const estiloRotador = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const estiloNucleo = useAnimatedStyle(() => {
    const gravando = estado === 'gravando';
    const ampBoost = gravando ? amp.value * 0.18 : 0;
    // Deformação assimétrica baseada na amp pra "pulso" não ficar circular óbvio
    const sx = gravando ? 1 + ampBoost * 0.7 : 1;
    const sy = gravando ? 1 + ampBoost : 1;
    return {
      transform: [{ scale: breathe.value }, { scaleX: sx }, { scaleY: sy }],
    };
  });

  const bound = size * 1.5;

  return (
    <View style={{ width: bound, height: bound, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          styles.halo,
          { width: bound, height: bound, borderRadius: bound / 2, backgroundColor: tema.acento },
          estiloHalo1,
        ]}
      />
      <Animated.View
        style={[
          styles.halo,
          { width: size * 1.2, height: size * 1.2, borderRadius: (size * 1.2) / 2, backgroundColor: tema.acento },
          estiloHalo2,
        ]}
      />
      <Animated.View style={[styles.absCenter, estiloRotador]}>
        <Animated.View style={estiloNucleo}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="orbGrad" cx="35%" cy="35%" r="80%" fx="30%" fy="30%">
                <Stop offset="0%" stopColor="#FFDBFD" stopOpacity={1} />
                <Stop offset="35%" stopColor="#C9BEFF" stopOpacity={1} />
                <Stop offset="75%" stopColor="#8494FF" stopOpacity={1} />
                <Stop offset="100%" stopColor="#6367FF" stopOpacity={1} />
              </RadialGradient>
              <RadialGradient id="orbHighlight" cx="35%" cy="25%" r="35%" fx="35%" fy="25%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="orbShade" cx="65%" cy="75%" r="45%" fx="65%" fy="75%">
                <Stop offset="0%" stopColor="#13133B" stopOpacity={0} />
                <Stop offset="100%" stopColor="#13133B" stopOpacity={0.18} />
              </RadialGradient>
            </Defs>
            <Circle cx={50} cy={50} r={48} fill="url(#orbGrad)" />
            <Circle cx={50} cy={50} r={48} fill="url(#orbShade)" />
            <Ellipse cx={35} cy={32} rx={22} ry={14} fill="url(#orbHighlight)" />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute' },
  absCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
