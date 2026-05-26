import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { tema } from '../../lib/tema';
import { light } from '../../lib/paleta';
import { paletaArea } from '../../domain/areasPaleta';

type Props = {
  /** Nome do Ionicon (ex: 'log-out-outline'). */
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  /** Slug de área (ex: 'espiritual'). Renderiza dot estilo HabitCard com a paleta. */
  paletaSlug?: string;
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
  paletaSlug,
  title,
  value,
  danger,
  toggle,
  onToggle,
  onPress,
  isLast,
}: Props) {
  const Wrapper = onPress ? Pressable : View;
  const paleta = paletaSlug ? paletaArea(paletaSlug) : null;
  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean } = {}) => [
        styles.linha,
        !isLast && styles.divisor,
        pressed && { opacity: 0.55 },
      ]}
    >
      {paleta && (
        <View style={styles.dotWrap}>
          <View style={[styles.dotInner, { backgroundColor: paleta.ink }]} />
        </View>
      )}
      {icon && !paleta && (
        <View style={styles.iconWrap}>
          <Ionicons
            name={icon}
            size={20}
            color={danger ? tema.perigo : (iconColor ?? tema.weak)}
          />
        </View>
      )}
      <Text
        style={[styles.titulo, danger && { color: tema.perigo }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {value !== undefined && <Text style={styles.value}>{value}</Text>}
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ false: light.borda12, true: tema.ink }}
          thumbColor={tema.bg}
          ios_backgroundColor={light.borda12}
        />
      ) : null}
      {toggle === undefined && !danger && onPress ? (
        <Svg width={8} height={14} viewBox="0 0 8 14" style={{ marginLeft: 6 }}>
          <Path
            d="M1 1 L7 7 L1 13"
            fill="none"
            stroke={tema.weak}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.55}
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
    paddingHorizontal: 18,
    minHeight: 54,
    paddingVertical: 12,
  },
  divisor: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: light.borda8,
  },
  dotWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: light.borda5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  iconWrap: { width: 22, alignItems: 'center', justifyContent: 'center' },
  titulo: {
    flex: 1,
    color: tema.ink,
    fontSize: 15,
    fontFamily: tema.fontFamily.textSemi,
  },
  value: {
    color: tema.weak,
    fontSize: 13,
    fontFamily: tema.fontFamily.text,
  },
});
