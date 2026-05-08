import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tema } from '../../lib/tema';
import { StatusGlyph, type StatusVisual } from './StatusGlyph';

type Props = {
  status: StatusVisual;
  title: string;
  time?: string;
  areaColor?: string;
  late?: boolean;
  weight?: number;
  isLast?: boolean;
  onPress?: () => void;
};

export function TaskRow({
  status,
  title,
  time,
  areaColor,
  late,
  weight,
  isLast,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.linha,
        !isLast && styles.divisor,
        pressed && { opacity: 0.6 },
      ]}
    >
      <StatusGlyph status={status} />
      {time && (
        <Text
          style={[
            styles.hora,
            late ? { color: tema.perigo } : status === 'done' ? { color: tema.textoFraco } : { color: tema.texto },
          ]}
        >
          {time}
        </Text>
      )}
      <View style={styles.miolo}>
        <Text
          numberOfLines={1}
          style={[
            styles.titulo,
            status === 'done' && {
              color: tema.textoFraco,
              textDecorationLine: 'line-through',
            },
          ]}
        >
          {title}
        </Text>
        {late && <Text style={styles.atrasada}>ATRASADA</Text>}
      </View>
      {weight ? (
        <View style={styles.peso}>
          <Text style={styles.pesoTxt}>×{weight}</Text>
        </View>
      ) : null}
      {areaColor ? <View style={[styles.dot, { backgroundColor: areaColor }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  divisor: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tema.borda,
  },
  hora: {
    width: 48,
    fontSize: 14,
    fontWeight: '600',
  },
  miolo: { flex: 1, minWidth: 0 },
  titulo: {
    color: tema.texto,
    fontSize: 15,
    fontWeight: '500',
  },
  atrasada: {
    fontSize: 11,
    fontWeight: '600',
    color: tema.perigo,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  peso: {
    backgroundColor: tema.bgInput,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pesoTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: tema.textoFraco,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
