import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../../lib/tema';
import { acentos, light } from '../../lib/paleta';
import type { Banner } from '../../domain/bannerContextual';

type Props = {
  banner: Banner;
};

const COR_LATERAL: Record<Banner['modo'], string> = {
  cobranca: tema.perigo,
  atraso: tema.alerta,
  acolhimento: light.acento,
  reflexao: tema.acento,
};

const GRADIENT_TOPO: Record<Banner['modo'], string> = {
  cobranca: '#FFFFFF',
  atraso: '#FFFFFF',
  acolhimento: '#FFFFFF',
  reflexao: '#FFFFFF',
};

const GRADIENT_BASE: Record<Banner['modo'], string> = {
  cobranca: '#FFF1F4',  // toque de rosa pálido
  atraso: '#FFF6E5',    // toque de âmbar pálido
  acolhimento: '#EFEFFC', // toque de lavanda
  reflexao: '#F4F2FC',  // toque de lavanda muito pálida
};

function FundoCard({ modo }: { modo: Banner['modo'] }) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="bannerGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={GRADIENT_TOPO[modo]} stopOpacity={1} />
          <Stop offset="1" stopColor={GRADIENT_BASE[modo]} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" rx={20} ry={20} fill="url(#bannerGrad)" />
    </Svg>
  );
}

export function BannerContextual({ banner }: Props) {
  const [expandido, setExpandido] = useState(false);

  // Texto compacto: primeira frase. Resto fica no expandido.
  const partes = banner.texto.split(/(?<=[.!?])\s+/);
  const compacto = partes[0] ?? banner.texto;
  const restante = partes.slice(1).join(' ');
  const temMais = restante.length > 0;

  return (
    <Pressable onPress={() => setExpandido((e) => !e)} style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
      <Animated.View layout={LinearTransition.duration(220)} style={styles.cardWrap}>
        <View style={styles.card}>
          <FundoCard modo={banner.modo} />
          <View style={[styles.borda, { backgroundColor: COR_LATERAL[banner.modo] }]} />
          <View style={styles.conteudo}>
            <View style={styles.cabecalho}>
              <View style={styles.tagRow}>
                <View style={[styles.dot, { backgroundColor: COR_LATERAL[banner.modo] }]} />
                <Text style={styles.tag}>{banner.tag}</Text>
              </View>
              {temMais && (
                <Ionicons
                  name={expandido ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={tema.weak}
                />
              )}
            </View>
            <Text style={styles.texto}>{expandido || !temMais ? banner.texto : compacto}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tema.borda,
    overflow: 'hidden',
    minHeight: 88,
  },
  borda: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  conteudo: {
    paddingVertical: 18,
    paddingLeft: 20,
    paddingRight: 18,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tag: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    color: tema.weak,
    letterSpacing: 1.4,
  },
  texto: {
    fontFamily: tema.fontFamily.displayMedium,
    fontSize: 16,
    color: tema.ink,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
});
