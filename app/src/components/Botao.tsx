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
  const fundo =
    variante === 'primario' ? tema.acento :
    variante === 'perigo'   ? tema.perigo :
                              tema.bgInput;
  // No light, tema.acento === tema.texto (#1A1916). Sem inverter, texto somia.
  const corTxt =
    variante === 'primario' ? tema.acentoTexto :
    variante === 'perigo'   ? tema.perigoTexto :
                              tema.texto;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || carregando}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: fundo, opacity: (disabled || carregando) ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {carregando
        ? <ActivityIndicator color={corTxt} />
        : <Text style={[styles.txt, { color: corTxt }]}>{titulo}</Text>
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
    fontSize: tema.fonte.corpo,
    fontWeight: '600',
  },
});
