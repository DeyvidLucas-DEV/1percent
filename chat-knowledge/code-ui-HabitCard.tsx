import { View, Text, StyleSheet } from 'react-native';
import { tema } from '../../lib/tema';
import { paletaArea } from '../../domain/areasPaleta';
import { WaveCard } from './WaveCard';
import { MiniBars, MiniWave } from './MiniCharts';
import { MiniSemiRing } from './MiniSemiRing';
import { TapScale } from './TapScale';

export type HabitChartType = 'bars' | 'wave' | 'semi';

export type HabitCardData = {
  title: string;
  areaSlug: string;
  type: HabitChartType;
  value?: string | number;
  unit?: string;
  data?: number[]; // pra bars/wave
  pct?: number;    // pra semi
};

type Props = {
  habit: HabitCardData;
  onPress?: () => void;
};

export function HabitCard({ habit, onPress }: Props) {
  const paleta = paletaArea(habit.areaSlug);
  return (
    <TapScale onPress={onPress} style={styles.wrap}>
      <WaveCard bg={paleta.soft}>
        <View style={styles.cabecalho}>
          <View style={styles.iconWrap}>
            <View style={[styles.iconDot, { backgroundColor: paleta.ink }]} />
          </View>
          <Text style={styles.titulo} numberOfLines={1}>{habit.title}</Text>
        </View>
        <View style={styles.chartWrap}>
          {habit.type === 'bars' && habit.data && <MiniBars data={habit.data} color={paleta.ink} />}
          {habit.type === 'wave' && habit.data && <MiniWave data={habit.data} color={paleta.ink} />}
          {habit.type === 'semi' && (
            <MiniSemiRing
              pct={habit.pct ?? 0}
              color={paleta.ink}
              value={habit.value ?? 0}
              unit={habit.unit ?? ''}
            />
          )}
        </View>
        {habit.value !== undefined && habit.type !== 'semi' && (
          <View style={styles.valorRow}>
            <Text style={styles.valor}>{habit.value}</Text>
            {habit.unit && <Text style={styles.unidade}>{habit.unit}</Text>}
          </View>
        )}
        <View style={{ height: 14 }} />
      </WaveCard>
    </TapScale>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 168 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: { width: 8, height: 8, borderRadius: 4 },
  titulo: {
    flex: 1,
    fontFamily: tema.fontFamily.display,
    fontSize: 14,
    color: tema.ink,
  },
  chartWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 88,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  valorRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  valor: {
    fontFamily: tema.fontFamily.display,
    fontSize: 22,
    color: tema.ink,
  },
  unidade: {
    fontSize: 11,
    color: tema.weak,
    fontFamily: tema.fontFamily.textSemi,
  },
});
