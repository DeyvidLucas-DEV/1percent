import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { tema } from '../lib/tema';

type Props = {
  titulo: string;
  onPress: () => void | Promise<void>;
  variante?: 'primario' | 'secundario' | 'perigo';
  disabled?: boolean;
  carregando?: boolean;
};

export function Botao({ titulo, onPress, variante = 'primario', disabled, carregando }: Props) {
  const cor =
    variante === 'primario' ? tema.acento :
    variante === 'perigo'   ? tema.perigo :
                              tema.bgInput;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || carregando}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: cor, opacity: (disabled || carregando) ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {carregando
        ? <ActivityIndicator color={tema.texto} />
        : <Text style={styles.txt}>{titulo}</Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: tema.raio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txt: {
    color: tema.texto,
    fontSize: tema.fonte.corpo,
    fontWeight: '600',
  },
});
