import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../../lib/tema';
import { TapScale } from './TapScale';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
};

export function IconBtn({ icon, onPress, size = 38 }: Props) {
  return (
    <TapScale onPress={onPress} scaleTo={0.92}>
      <View
        style={[
          styles.btn,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Ionicons name={icon} size={size * 0.45} color={tema.ink} />
      </View>
    </TapScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: tema.card,
    borderWidth: 1,
    borderColor: tema.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
