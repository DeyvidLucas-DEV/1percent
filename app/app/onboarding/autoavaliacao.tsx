import { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { tema } from '../../src/lib/tema';
import { Botao } from '../../src/components/Botao';
import { listarAreas } from '../../src/db/queries/areas';
import { salvarAutoavaliacao, marcarOnboardingCompleto } from '../../src/db/queries/users';
import { useAppStore } from '../../src/store/appStore';
import type { Area } from '../../src/db/types';

export default function Autoavaliacao() {
  const router = useRouter();
  const setOnboarded = useAppStore(s => s.setOnboarded);
  const [areas, setAreas] = useState<Area[]>([]);
  const [notas, setNotas] = useState<Record<number, number>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await listarAreas(false);
      setAreas(a);
      const n: Record<number, number> = {};
      a.forEach(x => (n[x.id] = 5));
      setNotas(n);
    })();
  }, []);

  async function finalizar() {
    setSalvando(true);
    try {
      await salvarAutoavaliacao(
        Object.entries(notas).map(([area_id, nota]) => ({
          area_id: Number(area_id),
          nota,
        }))
      );
      await marcarOnboardingCompleto();
      setOnboarded(true);
      router.replace('/');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Onde você está hoje</Text>
      <Text style={styles.sub}>Sem auto-engano. Avalia cada área de 0 a 10. Isso é só o ponto de partida.</Text>

      {areas.map(a => (
        <View key={a.id} style={[styles.card, { borderLeftColor: a.cor_base }]}>
          <Text style={styles.nome}>{a.nome}</Text>
          <View style={styles.notas}>
            {Array.from({ length: 11 }).map((_, n) => {
              const ativo = notas[a.id] === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => setNotas({ ...notas, [a.id]: n })}
                  style={[styles.bola, ativo && { backgroundColor: a.cor_base, borderColor: a.cor_base }]}
                >
                  <Text style={[styles.bolaTxt, ativo && { color: '#fff', fontWeight: '700' }]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <View style={{ height: tema.espacamento.lg }} />
      <Botao titulo="Finalizar e entrar" onPress={finalizar} carregando={salvando} />
      <View style={{ height: tema.espacamento.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: tema.espacamento.lg },
  titulo: { color: tema.texto, fontSize: tema.fonte.titulo, fontWeight: '700', marginBottom: tema.espacamento.xs },
  sub: { color: tema.textoFraco, fontSize: tema.fonte.corpo, marginBottom: tema.espacamento.lg },
  card: {
    backgroundColor: tema.bgCard,
    borderLeftWidth: 4,
    padding: tema.espacamento.md,
    borderRadius: tema.raio,
    marginBottom: tema.espacamento.sm,
  },
  nome: { color: tema.texto, fontSize: tema.fonte.corpo, fontWeight: '600', marginBottom: tema.espacamento.sm },
  notas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bola: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: tema.borda,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: tema.bgInput,
  },
  bolaTxt: { color: tema.textoFraco, fontSize: 13 },
});
