import { useEffect, useRef, type ReactNode } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

type Props = {
  trigger: unknown;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Wrapper que dispara um "punch" (encolhe e volta) toda vez que `trigger` muda.
// Não anima no primeiro render. Usar pra registrar mudança de estado, não pra celebrar.
export function PunchOnChange({ trigger, children, style }: Props) {
  const scale = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.value = withSequence(
      withTiming(0.7, { duration: 90 }),
      withSpring(1, { damping: 9, stiffness: 220, mass: 0.6 }),
    );
  }, [trigger, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
