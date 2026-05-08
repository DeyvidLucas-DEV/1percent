import { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Campo } from '../../src/components/Campo';
import { Seletor } from '../../src/components/Seletor';
import { Botao } from '../../src/components/Botao';
import { tema } from '../../src/lib/tema';
import { salvarCadastro } from '../../src/db/queries/users';

export default function Cadastro() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F' | 'O'>('M');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [civil, setCivil] = useState<'solteiro' | 'casado' | 'divorciado' | 'viuvo'>('casado');
  const [filhos, setFilhos] = useState('0');
  const [salvando, setSalvando] = useState(false);

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
      router.push('/onboarding/areas');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Antes de começar</Text>
      <Text style={styles.sub}>O app vai medir o que você faz. Pra isso, precisa te conhecer.</Text>

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
      <Botao titulo="Continuar" onPress={avancar} carregando={salvando} />
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
