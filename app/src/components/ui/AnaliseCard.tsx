import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../../lib/tema';
import type { AnaliseSemanal, DestaqueAnalise } from '../../domain/analiseSemanal';

type Props = {
  analise: AnaliseSemanal;
};

const ICONE_POR_DESTAQUE: Record<NonNullable<DestaqueAnalise>, keyof typeof Ionicons.glyphMap> = {
  queda: 'trending-down-outline',
  sequencia: 'trending-up-outline',
  desequilibrio: 'analytics-outline',
  consistente: 'pulse-outline',
};

const COR_POR_DESTAQUE: Record<NonNullable<DestaqueAnalise>, string> = {
  queda: tema.perigo,
  sequencia: tema.sucesso,
  desequilibrio: tema.alerta,
  consistente: tema.acento,
};

export function AnaliseCard({ analise }: Props) {
  const icone = analise.destaque ? ICONE_POR_DESTAQUE[analise.destaque] : 'sparkles-outline';
  const cor = analise.destaque ? COR_POR_DESTAQUE[analise.destaque] : tema.weak;

  return (
    <View style={styles.card}>
      <View style={styles.cabecalho}>
        <View style={[styles.iconeWrap, { backgroundColor: tema.bgSoft }]}>
          <Ionicons name={icone} size={16} color={cor} />
        </View>
        <Text style={styles.tag}>ANÁLISE DA SEMANA</Text>
      </View>
      {analise.observacoes.map((obs, i) => (
        <Text key={i} style={[styles.observacao, i > 0 && { marginTop: 6 }]}>
          {obs}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: tema.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tema.borda,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconeWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    fontSize: 11,
    fontFamily: tema.fontFamily.textBold,
    color: tema.weak,
    letterSpacing: 1.2,
  },
  observacao: {
    fontSize: 14,
    color: tema.ink,
    fontFamily: tema.fontFamily.text,
    lineHeight: 20,
  },
});
