import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { tema } from '../../lib/tema';

const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const CELL_SIZE = 36;
const ALTURA_LINHA = CELL_SIZE + 4; // padding vertical 2*2 = 4

type Props = {
  selecionado: Date;
  onSelect: (date: Date) => void;
};

const MOLA = { damping: 22, stiffness: 180, mass: 0.9 } as const;

export function CalendarioSemanal({ selecionado, onSelect }: Props) {
  const [expandido, setExpandido] = useState(false);
  const [mesAtual, setMesAtual] = useState(() => startOfMonth(selecionado));

  // Sempre calcula o mês COMPLETO. Quando colapsado, mascaramos via overflow.
  const semanas = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 });
    const fim = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 });
    const dias = eachDayOfInterval({ start: inicio, end: fim });
    const out: { chave: string; dias: Date[] }[] = [];
    for (let i = 0; i < dias.length; i += 7) {
      const bloco = dias.slice(i, i + 7);
      out.push({ chave: format(bloco[0]!, 'yyyy-MM-dd'), dias: bloco });
    }
    return out;
  }, [mesAtual]);

  // Índice da semana que contém o dia selecionado dentro do mês atual.
  // -1 se o selecionado não está no mês atual (caso edge).
  const indexSemanaBase = useMemo(() => {
    const idx = semanas.findIndex((s) => s.dias.some((d) => isSameDay(d, selecionado)));
    return idx >= 0 ? idx : 0;
  }, [semanas, selecionado]);

  const alturaExpandida = semanas.length * ALTURA_LINHA;
  const offsetColapsado = -indexSemanaBase * ALTURA_LINHA;

  const altura = useSharedValue(expandido ? alturaExpandida : ALTURA_LINHA);
  const offsetY = useSharedValue(expandido ? 0 : offsetColapsado);

  useEffect(() => {
    altura.value = withSpring(expandido ? alturaExpandida : ALTURA_LINHA, MOLA);
    offsetY.value = withSpring(expandido ? 0 : offsetColapsado, MOLA);
  }, [expandido, alturaExpandida, offsetColapsado, altura, offsetY]);

  const estiloWrapper = useAnimatedStyle(() => ({
    height: altura.value,
  }));

  const estiloConteudo = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetY.value }],
  }));

  const tituloBruto = format(expandido ? mesAtual : selecionado, 'MMMM yyyy', { locale: ptBR });
  const titulo = tituloBruto.charAt(0).toUpperCase() + tituloBruto.slice(1);

  return (
    <View style={styles.bloco}>
      <View style={styles.header}>
        <Text style={styles.tituloMes}>{titulo}</Text>
        {expandido && (
          <View style={styles.navMes}>
            <Pressable
              onPress={() => setMesAtual(addMonths(mesAtual, -1))}
              style={({ pressed }) => [styles.btnNav, pressed && { opacity: 0.5 }]}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={16} color={tema.weak} />
            </Pressable>
            <Pressable
              onPress={() => setMesAtual(addMonths(mesAtual, 1))}
              style={({ pressed }) => [styles.btnNav, pressed && { opacity: 0.5 }]}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={16} color={tema.weak} />
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.linhaDow}>
        {DOW.map((d, i) => (
          <Text key={i} style={styles.dow}>
            {d}
          </Text>
        ))}
      </View>

      <Animated.View style={[styles.mascara, estiloWrapper]}>
        <Animated.View style={estiloConteudo}>
          {semanas.map((semana) => (
            <View key={semana.chave} style={styles.linhaDias}>
              {semana.dias.map((dia, j) => {
                const ehSelecionado = isSameDay(dia, selecionado);
                const ehHoje = isToday(dia);
                const ehMesAtual = isSameMonth(dia, mesAtual);
                return (
                  <Pressable
                    key={j}
                    onPress={() => onSelect(dia)}
                    style={({ pressed }) => [styles.cellWrap, pressed && { opacity: 0.55 }]}
                  >
                    <Text
                      style={[
                        styles.cellTxt,
                        ehSelecionado && styles.cellTxtSel,
                        !ehSelecionado && ehHoje && styles.cellTxtHoje,
                        !ehMesAtual && styles.cellTxtFora,
                      ]}
                    >
                      {dia.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Animated.View>
      </Animated.View>

      <Pressable
        onPress={() => setExpandido((e) => !e)}
        style={({ pressed }) => [styles.expandirBtn, pressed && { opacity: 0.5 }]}
        hitSlop={6}
      >
        <Ionicons name={expandido ? 'chevron-up' : 'chevron-down'} size={16} color={tema.weak} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  tituloMes: {
    fontSize: 18,
    fontFamily: tema.fontFamily.display,
    color: tema.ink,
    letterSpacing: -0.3,
  },
  navMes: {
    flexDirection: 'row',
    gap: 4,
  },
  btnNav: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaDow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  dow: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: tema.fontFamily.textSemi,
    color: tema.weak,
    letterSpacing: 0.6,
  },
  mascara: {
    overflow: 'hidden',
  },
  linhaDias: {
    flexDirection: 'row',
    height: ALTURA_LINHA,
    alignItems: 'center',
  },
  cellWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: CELL_SIZE,
  },
  cellTxt: {
    fontSize: 14,
    fontFamily: tema.fontFamily.textMedium,
    color: tema.ink,
    width: CELL_SIZE,
    height: CELL_SIZE,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: CELL_SIZE,
  },
  cellTxtFora: {
    color: tema.weak,
    opacity: 0.4,
  },
  cellTxtSel: {
    backgroundColor: tema.acento,
    color: tema.acentoTexto,
    borderRadius: CELL_SIZE / 2,
    overflow: 'hidden',
    fontFamily: tema.fontFamily.textBold,
  },
  cellTxtHoje: {
    color: tema.acento,
    fontFamily: tema.fontFamily.textBold,
  },
  expandirBtn: {
    alignSelf: 'center',
    marginTop: 6,
    padding: 4,
  },
});
