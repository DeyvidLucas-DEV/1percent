import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tema } from '../src/lib/tema';
import { PageHeader } from '../src/components/ui/PageHeader';

type Card = {
  titulo: string;
  subtitulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  rota: string;
  destaque?: boolean;
};

const CARDS: Card[] = [
  {
    titulo: 'Contar como foi o dia',
    subtitulo: 'Relate sem floreio. O app extrai padrões e sugere ajustes.',
    icone: 'mic-outline',
    rota: '/ajustar/dia',
    destaque: true,
  },
  {
    titulo: 'Plano da semana',
    subtitulo: 'IA cruza 7 dias, fatos e o que você aceitou. Propõe a próxima semana.',
    icone: 'calendar-outline',
    rota: '/ajustar/plano',
  },
  {
    titulo: 'Sua trilha',
    subtitulo: 'Linha do tempo do que você fez e do que a IA viu.',
    icone: 'time-outline',
    rota: '/ajustar/trilha',
  },
  {
    titulo: 'O que o 1% aprendeu',
    subtitulo: 'Padrões e fatos sobre sua rotina. Edite ou apague o que não bate.',
    icone: 'library-outline',
    rota: '/ajustar/memoria',
  },
  {
    titulo: 'Reflexão do dia',
    subtitulo: 'Pergunta rotativa pra parar e pensar antes de fechar o dia.',
    icone: 'create-outline',
    rota: '/reflexao',
  },
];

export default function Ajustar() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <SafeAreaView style={styles.bg} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <PageHeader kicker="AJUSTAR ROTA" title="Fale a verdade" />
          <Text style={styles.sub}>
            Sem desculpa, sem excesso. O app cruza o que você diz com o que você executa.
          </Text>

          <View style={styles.lista}>
            {CARDS.map((c, i) => (
              <Pressable
                key={c.rota}
                onPress={() => router.push(c.rota as any)}
                style={({ pressed }) => [
                  styles.card,
                  c.destaque && styles.cardDestaque,
                  pressed && { opacity: 0.85 },
                  i === CARDS.length - 1 && { marginBottom: 0 },
                ]}
              >
                <View style={[styles.icone, c.destaque && styles.iconeDestaque]}>
                  <Ionicons
                    name={c.icone}
                    size={22}
                    color={c.destaque ? tema.bg : tema.texto}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.titulo, c.destaque && styles.tituloDestaque]}>
                    {c.titulo}
                  </Text>
                  <Text style={[styles.subt, c.destaque && styles.subtDestaque]}>
                    {c.subtitulo}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={c.destaque ? 'rgba(245,241,229,0.7)' : tema.textoFraco}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.aviso}>
            A IA não cria nem altera tarefa sem sua confirmação.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 100 },
  sub: {
    paddingHorizontal: 24,
    fontSize: 14,
    lineHeight: 20,
    color: tema.textoFraco,
    marginTop: -4,
    marginBottom: 8,
  },
  lista: { marginTop: 12, paddingHorizontal: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tema.bgCard,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tema.borda,
    gap: 14,
  },
  cardDestaque: {
    backgroundColor: tema.acento,
    borderColor: tema.acento,
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tema.bgInput,
  },
  iconeDestaque: { backgroundColor: 'rgba(245,241,229,0.12)' },
  titulo: {
    color: tema.texto,
    fontSize: 15,
    fontFamily: tema.fontFamily.textBold,
  },
  tituloDestaque: { color: '#F5F1E5' },
  subt: {
    color: tema.textoFraco,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  subtDestaque: { color: 'rgba(245,241,229,0.75)' },
  aviso: {
    paddingHorizontal: 24,
    marginTop: 18,
    fontSize: 12,
    color: tema.textoFraco,
    textAlign: 'center',
  },
});
