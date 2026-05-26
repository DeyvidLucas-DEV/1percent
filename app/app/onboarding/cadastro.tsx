import { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Campo } from '../../src/components/Campo';
import { Seletor } from '../../src/components/Seletor';
import { Botao } from '../../src/components/Botao';
import { tema } from '../../src/lib/tema';
import { getUser, salvarCadastro } from '../../src/db/queries/users';

type EstadoCivil = 'solteiro' | 'casado' | 'divorciado' | 'viuvo';

export default function Cadastro() {
  const router = useRouter();
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const editando = modo === 'editar';

  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F' | 'O'>('M');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [civil, setCivil] = useState<EstadoCivil>('casado');
  const [filhos, setFilhos] = useState('0');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    (async () => {
      const u = await getUser();
      if (!u) return;
      if (u.nome) setNome(u.nome);
      if (u.idade) setIdade(String(u.idade));
      if (u.sexo) setSexo(u.sexo as 'M' | 'F' | 'O');
      if (u.peso_kg) setPeso(String(u.peso_kg));
      if (u.altura_cm) setAltura(String(u.altura_cm));
      if (u.estado_civil) setCivil(u.estado_civil as EstadoCivil);
      if (typeof u.filhos === 'number') setFilhos(String(u.filhos));
    })();
  }, [editando]);

  async function avancar() {
    if (!nome.trim()) return Alert.alert('Faltou', 'Coloca seu nome.');
    const idadeN = parseInt(idade, 10);
    const pesoN = parseFloat(peso.replace(',', '.'));
    const alturaN = parseInt(altura, 10);
    const filhosN = parseInt(filhos, 10);
    if (!idadeN || idadeN < 5 || idadeN > 120) return Alert.alert('Idade inválida');
    if (!pesoN || pesoN < 20 || pesoN > 400) return Alert.alert('Peso inválido');
    if (!alturaN || alturaN < 100 || alturaN > 250) return Alert.alert('Altura inválida (em cm)');
    if (isNaN(filhosN) || filhosN < 0) return Alert.alert('Número de filhos inválido');

    try {
      setSalvando(true);
      await salvarCadastro({
        nome: nome.trim(),
        idade: idadeN,
        sexo,
        peso_kg: pesoN,
        altura_cm: alturaN,
        estado_civil: civil,
        filhos: filhosN,
      });
      if (editando) {
        router.back();
      } else {
        router.push('/onboarding/contexto' as any);
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>{editando ? 'Editar cadastro' : 'Antes de começar'}</Text>
      <Text style={styles.sub}>
        {editando
          ? 'Atualize os dados que mudaram. O resto permanece como está.'
          : 'O app vai medir o que você faz. Pra isso, precisa te conhecer.'}
      </Text>

      <Campo label="Nome" valor={nome} onChangeText={setNome} placeholder="Seu nome" autoCapitalize="words" />
      <Campo label="Idade" valor={idade} onChangeText={setIdade} placeholder="35" keyboardType="numeric" />
      <Seletor
        label="Sexo"
        valor={sexo}
        opcoes={[
          { valor: 'M', rotulo: 'Masculino' },
          { valor: 'F', rotulo: 'Feminino' },
          { valor: 'O', rotulo: 'Outro' },
        ]}
        onChange={setSexo}
      />
      <Campo label="Peso (kg)" valor={peso} onChangeText={setPeso} placeholder="78" keyboardType="decimal-pad" />
      <Campo label="Altura (cm)" valor={altura} onChangeText={setAltura} placeholder="178" keyboardType="numeric" />
      <Seletor
        label="Estado civil"
        valor={civil}
        opcoes={[
          { valor: 'solteiro', rotulo: 'Solteiro' },
          { valor: 'casado', rotulo: 'Casado' },
          { valor: 'divorciado', rotulo: 'Divorciado' },
          { valor: 'viuvo', rotulo: 'Viúvo' },
        ]}
        onChange={setCivil}
      />
      <Campo label="Filhos" valor={filhos} onChangeText={setFilhos} keyboardType="numeric" />

      <View style={{ height: tema.espacamento.lg }} />
      <Botao titulo={editando ? 'Salvar' : 'Continuar'} onPress={avancar} carregando={salvando} />
      <View style={{ height: tema.espacamento.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { padding: tema.espacamento.lg },
  titulo: {
    color: tema.texto,
    fontSize: tema.fonte.titulo,
    fontWeight: '700',
    marginBottom: tema.espacamento.xs,
  },
  sub: {
    color: tema.textoFraco,
    fontSize: tema.fonte.corpo,
    marginBottom: tema.espacamento.lg,
  },
});
