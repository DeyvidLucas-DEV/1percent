import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { tema } from '../../lib/tema';

type Props = {
  /** Nome do Ionicon (ex: 'log-out-outline'). Mutuamente exclusivo com `colorBox`. */
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string; // cor do icon (default: textoFraco)
  /** Quadradinho colorido usado em listas de áreas (cor da área). */
  colorBox?: string;
  title: string;
  value?: string;
  danger?: boolean;
  toggle?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  isLast?: boolean;
};

export function ConfigRow({
  icon,
  iconColor,
  colorBox,
  title,
  value,
  danger,
  toggle,
  onToggle,
  onPress,
  isLast,
}: Props) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean } = {}) => [
        styles.linha,
        !isLast && styles.divisor,
        pressed && { opacity: 0.55 },
      ]}
    >
      {colorBox && <View style={[styles.colorBox, { backgroundColor: colorBox }]} />}
      {icon && (
        <View style={styles.iconWrap}>
          <Ionicons
            name={icon}
            size={20}
            color={danger ? tema.perigo : (iconColor ?? tema.textoFraco)}
          />
        </View>
      )}
      <Text style={[styles.titulo, danger && { color: tema.perigo }]} numberOfLines={1}>
        {title}
      </Text>
      {value !== undefined && <Text style={styles.value}>{value}</Text>}
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ false: tema.bgInput, true: tema.sucesso }}
          thumbColor="#fff"
          ios_backgroundColor={tema.bgInput}
        />
      ) : null}
      {value === undefined && toggle === undefined && !danger && onPress ? (
        <Svg width={8} height={14} viewBox="0 0 8 14">
          <Path
            d="M1 1 L7 7 L1 13"
            fill="none"
            stroke={tema.textoFraco}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    paddingVertical: 12,
  },
  divisor: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tema.borda,
  },
  colorBox: { width: 24, height: 24, borderRadius: 6 },
  iconWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
  titulo: { flex: 1, color: tema.texto, fontSize: 15, fontWeight: '500' },
  value: { color: tema.textoFraco, fontSize: 14 },
});
