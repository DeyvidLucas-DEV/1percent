import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { tema } from '../../lib/tema';

type Props = {
  hora: string; // HH:MM
};

const TIMELINE_COL_WIDTH = 44;
const DOT_SIZE = 10;

export function MarcadorAgora({ hora }: Props) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [pulse]);

  const estiloHalo = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  return (
    <View style={styles.linha}>
      <View style={styles.horaCol}>
        <Text style={styles.hora}>{hora}</Text>
      </View>
      <View style={styles.timelineCol}>
        <Animated.View style={[styles.halo, estiloHalo]} />
        <View style={styles.dot} />
      </View>
      <View style={styles.linhaCol}>
        <View style={styles.linhaHorizontal} />
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>AGORA</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    marginVertical: 6,
  },
  horaCol: {
    width: 52,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  hora: {
    fontSize: 12,
    fontFamily: tema.fontFamily.textBold,
    color: tema.acento,
  },
  timelineCol: {
    width: TIMELINE_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: DOT_SIZE * 2.4,
    height: DOT_SIZE * 2.4,
    borderRadius: DOT_SIZE * 1.2,
    backgroundColor: tema.acento,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: tema.acento,
  },
  linhaCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  linhaHorizontal: {
    flex: 1,
    height: 1.5,
    backgroundColor: tema.acento,
    opacity: 0.4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: tema.acento,
  },
  badgeTxt: {
    fontSize: 10,
    fontFamily: tema.fontFamily.textBold,
    color: tema.acentoTexto,
    letterSpacing: 1,
  },
});
