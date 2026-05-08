import { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tema } from '../../src/lib/tema';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { ConfigGroup } from '../../src/components/ui/ConfigGroup';
import { ConfigRow } from '../../src/components/ui/ConfigRow';
import { useAppStore } from '../../src/store/appStore';
import { limparSessao } from '../../src/auth/sessao';
import { api } from '../../src/lib/api';
import { getUser } from '../../src/db/queries/users';
import { listarAreas } from '../../src/db/queries/areas';
import { listarTarefasAtivas } from '../../src/db/queries/tarefas';
import { getLastPullAt } from '../../src/db/queries/syncState';
import { sincronizar } from '../../src/sync/sync';
import type { User, Area, Tarefa } from '../../src/db/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const APP_VERSION = '1.0.0';

function formatarUltimaSync(iso: string | null): string {
  if (!iso) return 'nunca';
  try {
    return `há ${formatDistanceToNow(parseISO(iso), { locale: ptBR })}`;
  } catch {
    return iso;
  }
}

export default function Config() {
  const router = useRouter();
  const setLogado = useAppStore(s => s.setLogado);
  const [user, setUser] = useState<User | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [lastPull, setLastPull] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [notif, setNotif] = useState({
    manha: true,
    noite: true,
    atrasadas: true,
    mediocridade: true,
  });

  const carregar = useCallback(async () => {
    const [u, a, t, lp] = await Promise.all([
      getUser(),
      listarAreas(true),
      listarTarefasAtivas(),
      getLastPullAt(),
    ]);
    setUser(u);
    setAreas(a);
    setTarefas(t);
    setLastPull(lp);
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  function tarefasCount(areaId: number): number {
    return tarefas.filter(t => t.area_id === areaId).length;
  }

  function sair() {
    Alert.alert('Sair', 'Você vai precisar logar novamente nesse aparelho. Os dados locais permanecem.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await limparSessao();
          setLogado(null);
          router.replace('/login');
        },
      },
    ]);
  }

  function apagarConta() {
    Alert.alert(
      'Apagar conta',
      'Isso apaga TODOS os seus dados na nuvem. O dado local desse aparelho continua até você reinstalar o app. Sem volta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar mesmo',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del('/me');
              await limparSessao();
              setLogado(null);
              router.replace('/login');
            } catch (e: any) {
              Alert.alert('Erro', String(e?.message ?? e));
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.bg} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <PageHeader title="Configurações" />

        <View style={{ height: 18 }} />

        <ConfigGroup label="Conta">
          <ConfigRow iconColor={tema.bgInput} title={user?.nome ?? '—'} />
          <ConfigRow iconColor={tema.bgInput} title="Editar cadastro" onPress={() => Alert.alert('Em breve', 'Edição de cadastro chegará num próximo passo.')} />
          <ConfigRow iconColor={tema.bgInput} title="Sair" danger onPress={sair} />
          <ConfigRow iconColor={tema.bgInput} title="Apagar conta" danger isLast onPress={apagarConta} />
        </ConfigGroup>

        <ConfigGroup label="Áreas e tarefas">
          {areas.map((a, i) => (
            <ConfigRow
              key={a.id}
              iconColor={a.cor_base}
              title={a.nome}
              value={`${tarefasCount(a.id)} ${tarefasCount(a.id) === 1 ? 'tarefa' : 'tarefas'}`}
              isLast={i === areas.length - 1}
              onPress={() => router.push(`/area/${a.id}`)}
            />
          ))}
        </ConfigGroup>

        <ConfigGroup label="Notificações">
          <ConfigRow
            title="Lembrete 07:00 (manhã)"
            toggle={notif.manha}
            onToggle={v => setNotif({ ...notif, manha: v })}
          />
          <ConfigRow
            title="Cobrança 21:30 (noite)"
            toggle={notif.noite}
            onToggle={v => setNotif({ ...notif, noite: v })}
          />
          <ConfigRow
            title="Tarefas atrasadas"
            toggle={notif.atrasadas}
            onToggle={v => setNotif({ ...notif, atrasadas: v })}
          />
          <ConfigRow
            title="Subida de mediocridade"
            toggle={notif.mediocridade}
            onToggle={v => setNotif({ ...notif, mediocridade: v })}
            isLast
          />
        </ConfigGroup>

        <ConfigGroup label="Sincronização">
          <ConfigRow title="Última sync" value={formatarUltimaSync(lastPull)} />
          <ConfigRow
            title={sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
            onPress={async () => {
              if (sincronizando) return;
              setSincronizando(true);
              try {
                const r = await sincronizar();
                await carregar();
                Alert.alert('Sync OK', `${r.enviados} enviados · ${r.puxados} puxados`);
              } catch (e: any) {
                Alert.alert('Erro de sync', String(e?.message ?? e));
              } finally {
                setSincronizando(false);
              }
            }}
            isLast
          />
        </ConfigGroup>

        <ConfigGroup label="Sobre">
          <ConfigRow title="Versão" value={APP_VERSION} />
          <ConfigRow title="Repositório" value="github.com/DeyvidLucas-DEV/1percent" isLast />
        </ConfigGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 30 },
});
