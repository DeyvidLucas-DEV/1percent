import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle, type GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { feedbackToque } from '../../lib/haptics';

type Props = {
  children: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  disabled?: boolean;
  hitSlop?: number;
};

// Press feedback estilo iOS: encolhe levemente no touch-in, volta com spring no touch-out.
// Substitui o `pressed && { opacity: 0.6 }` espalhado pelos componentes.
export function TapScale({
  children,
  onPress,
  onLongPress,
  style,
  scaleTo = 0.96,
  haptic = false,
  disabled = false,
  hitSlop,
}: Props) {
  const scale = useSharedValue(1);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIn = () => {
    scale.value = withTiming(scaleTo, { duration: 90 });
  };
  const handleOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 240, mass: 0.5 });
  };
  const handlePress = (e: GestureResponderEvent) => {
    if (haptic) feedbackToque();
    onPress?.(e);
  };

  return (
    <Animated.View style={[style, aStyle]}>
      <Pressable
        disabled={disabled}
        onPressIn={handleIn}
        onPressOut={handleOut}
        onPress={handlePress}
        onLongPress={onLongPress}
        hitSlop={hitSlop}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
