import { TextInput, Text, View, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { tema } from '../lib/tema';

type Props = {
  label: string;
  valor: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function Campo({ label, valor, onChangeText, placeholder, keyboardType, autoCapitalize }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tema.textoFraco}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
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
  input: {
    backgroundColor: tema.bgInput,
    color: tema.texto,
    fontSize: tema.fonte.corpo,
    paddingHorizontal: tema.espacamento.md,
    paddingVertical: 12,
    borderRadius: tema.raio,
    borderWidth: 1,
    borderColor: tema.borda,
  },
});
