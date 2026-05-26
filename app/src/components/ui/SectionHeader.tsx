import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tema } from '../../lib/tema';

type Props = {
  title: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, action, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}>
          <Text style={styles.actionTxt}>{action}</Text>
          <Svg width={12} height={12} viewBox="0 0 12 12">
            <Path
              d="M3 2 L8 6 L3 10"
              stroke={tema.ink}
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    flex: 1,
    fontFamily: tema.fontFamily.display,
    fontSize: 30,
    color: tema.ink,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
  },
  actionTxt: {
    fontSize: 13,
    fontFamily: tema.fontFamily.textSemi,
    color: tema.ink,
    textDecorationLine: 'underline',
  },
});
