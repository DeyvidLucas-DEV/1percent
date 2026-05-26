import { useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StatusGlyph, type StatusVisual } from './StatusGlyph';

type Props = { status: StatusVisual; size?: number };

// Tom: punch curto, sem comemoração. Comprime levemente, volta com spring rígido.
// Não é confetti — é um "click" físico de algo que mudou de estado.
export function StatusGlyphAnimated({ status, size = 22 }: Props) {
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
  }, [status, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <StatusGlyph status={status} size={size} />
    </Animated.View>
  );
}
