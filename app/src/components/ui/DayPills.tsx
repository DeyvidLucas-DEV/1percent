import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tema } from '../../lib/tema';
import { acentos } from '../../lib/paleta';

export type DiaPill = { dow: string; num: string; iso?: string };

type Props = {
  days: DiaPill[];
  selected: number;
  onSelect?: (idx: number) => void;
};

export function DayPills({ days, selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {days.map((d, i) => {
        const sel = i === selected;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect?.(i)}
            style={[styles.pill, sel && styles.pillAtivo]}
          >
            <Text style={[styles.dow, sel && styles.dowAtivo]}>{d.dow}</Text>
            <View style={[styles.numWrap, sel && styles.numWrapAtivo]}>
              <Text style={[styles.num, sel && styles.numAtivo]}>{d.num}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const DOW_FRACO = acentos.textoFracoSobreInk;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 10,
    borderRadius: 28,
    gap: 6,
  },
  pillAtivo: {
    backgroundColor: tema.ink,
  },
  dow: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textSemi,
    color: tema.weak,
    letterSpacing: 0.4,
  },
  dowAtivo: {
    color: DOW_FRACO,
  },
  numWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numWrapAtivo: {
    backgroundColor: acentos.glowSobreInkSoft,
  },
  num: {
    fontSize: 13,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
  },
  numAtivo: {
    color: tema.bg,
  },
});
