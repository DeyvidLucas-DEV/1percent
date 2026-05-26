import { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { tema } from '../../src/lib/tema';
import { Botao } from '../../src/components/Botao';
import { listarTodasAreas, pausarArea, reativarArea } from '../../src/db/queries/areas';
import { alertaPausa } from '../../src/domain/alertasPausa';
import { format, addMonths } from 'date-fns';
import type { Area } from '../../src/db/types';

export default function Areas() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    setAreas(await listarTodasAreas());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  function tentarPausar(area: Area) {
    if (area.obrigatoria) {
      Alert.alert('Área obrigatória', 'Essa área é fundamental e não pode ser pausada.');
      return;
    }
    Alert.alert(
      `Pausar ${area.nome}?`,
      alertaPausa(area.slug),
      [
        { text: 'Não, manter', style: 'cancel' },
        {
          text: 'Mesmo assim, pausar',
          style: 'destructive',
          onPress: () => confirmarPausa(area),
        },
      ]
    );
  }

  function confirmarPausa(area: Area) {
    Alert.alert(
      'Confirmação final',
      `Última chance. Pausar ${area.nome} por 6 meses significa que ela não vai contar no seu Alvo de Vida nesse período. Confirma?`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Pausar',
          style: 'destructive',
          onPress: async () => {
            const ate = format(addMonths(new Date(), 6), 'yyyy-MM-dd');
            await pausarArea(area.id, ate, 'Pausada no onboarding');
            await carregar();
          },
        },
      ]
    );
  }

  function reativar(area: Area) {
    Alert.alert(
      `Reativar ${area.nome}?`,
      'A área volta a contar no seu Alvo de Vida e nas métricas do dia.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reativar',
          onPress: async () => {
            await reativarArea(area.id);
            await carregar();
          },
        },
      ]
    );
  }

  function avancar() {
    router.push('/onboarding/autoavaliacao');
  }

  if (loading) return <View style={styles.bg} />;

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Suas 10 áreas</Text>
      <Text style={styles.sub}>
        6 são obrigatórias. As outras 4 você pode pausar por até 6 meses, mas o app vai te avisar do impacto.
      </Text>

      {areas.map(a => {
        const pausada = a.ativa === 0;
        return (
          <View key={a.id} style={[styles.card, { borderLeftColor: a.cor_base }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nome}>{a.nome}</Text>
              <Text style={styles.tag}>
                {a.obrigatoria ? 'Obrigatória' : pausada ? 'Pausada' : 'Opcional'}
              </Text>
            </View>
            {!a.obrigatoria && (
              pausada ? (
                <Pressable onPress={() => reativar(a)}>
                  <Text style={[styles.acao, { color: tema.sucesso }]}>Reativar</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => tentarPausar(a)}>
                  <Text style={styles.acao}>Pausar</Text>
                </Pressable>
              )
            )}
          </View>
        );
      })}

      <View style={{ height: tema.espacamento.lg }} />
      <Botao titulo="Continuar" onPress={avancar} />
      <View style={{ height: tema.espacamento.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: tema.espacamento.lg },
  titulo: {
    color: tema.texto, fontSize: tema.fonte.titulo, fontWeight: '700',
    marginBottom: tema.espacamento.xs,
  },
  sub: {
    color: tema.textoFraco, fontSize: tema.fonte.corpo, marginBottom: tema.espacamento.lg,
  },
  card: {
    backgroundColor: tema.bgCard,
    borderLeftWidth: 4,
    padding: tema.espacamento.md,
    borderRadius: tema.raio,
    marginBottom: tema.espacamento.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nome: { color: tema.texto, fontSize: tema.fonte.corpo, fontWeight: '600' },
  tag: { color: tema.textoFraco, fontSize: tema.fonte.pequeno, marginTop: 2 },
  acao: { color: tema.alerta, fontSize: tema.fonte.corpo, fontWeight: '600' },
});
