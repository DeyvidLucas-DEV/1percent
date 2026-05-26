import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../../lib/tema';
import { corPorPercentual, faixaPorPercentual } from '../../domain/cores';

type Props = {
  pct: number;
  label?: string;
};

// Pílula horizontal: label esquerda · barra de progresso colorida · ícone+número direita.
// Cor da barra segue a faixa de performance (verde/âmbar/vermelho/violeta).
export function BarraProgressoHoje({ pct, label = 'Hoje' }: Props) {
  const cor = corPorPercentual(pct);
  const faixa = faixaPorPercentual(pct);
  const icone: keyof typeof import('@expo/vector-icons/build/Ionicons').default.glyphMap =
    faixa === 'azul' || faixa === 'verde'
      ? 'trending-up'
      : faixa === 'amarelo'
      ? 'pulse'
      : 'trending-down';

  // Largura percentual da barra preenchida. Mínimo 4% pra ficar visível mesmo zerado.
  const larguraFill = Math.max(4, Math.min(100, pct));

  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barraWrap}>
        <View style={styles.barraBg} />
        <View style={[styles.barraFill, { width: `${larguraFill}%`, backgroundColor: cor }]} />
        {pct > 0 && pct < 100 && (
          <View
            style={[
              styles.bolinhaIndicador,
              { left: `${larguraFill}%`, backgroundColor: cor },
            ]}
          />
        )}
      </View>
      <View style={styles.direita}>
        <Ionicons name={icone} size={14} color={cor} />
        <Text style={[styles.num, { color: tema.ink }]}>{pct}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: tema.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tema.borda,
  },
  label: {
    fontSize: 13,
    fontFamily: tema.fontFamily.textSemi,
    color: tema.weak,
  },
  barraWrap: {
    flex: 1,
    height: 8,
    justifyContent: 'center',
  },
  barraBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: tema.bgSoft,
    borderWidth: 1,
    borderColor: tema.borda,
  },
  barraFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
  },
  bolinhaIndicador: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    top: '50%',
    marginTop: -4,
  },
  direita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  num: {
    fontSize: 18,
    fontFamily: tema.fontFamily.display,
    letterSpacing: -0.4,
  },
});
