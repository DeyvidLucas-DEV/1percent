import { Pressable, Text, View, StyleSheet } from 'react-native';
import { tema } from '../lib/tema';

type Opcao<T> = { valor: T; rotulo: string };

type Props<T> = {
  label: string;
  valor: T;
  opcoes: Opcao<T>[];
  onChange: (v: T) => void;
};

export function Seletor<T extends string | number>({ label, valor, opcoes, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {opcoes.map((o) => {
          const ativo = o.valor === valor;
          return (
            <Pressable
              key={String(o.valor)}
              onPress={() => onChange(o.valor)}
              style={[
                styles.chip,
                ativo && { backgroundColor: tema.acento, borderColor: tema.acento },
              ]}
            >
              <Text style={[styles.chipTxt, ativo && { color: tema.texto, fontWeight: '600' }]}>
                {o.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: tema.espacamento.md },
  label: {
    color: tema.textoFraco,
    fontSize: tema.fonte.pequeno,
    marginBottom: tema.espacamento.xs,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: tema.espacamento.sm },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: tema.raio,
    borderWidth: 1,
    borderColor: tema.borda,
    backgroundColor: tema.bgInput,
  },
  chipTxt: { color: tema.textoFraco, fontSize: tema.fonte.corpo },
});
