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
import { resetDb } from '../../src/db/schema';
import { getUser } from '../../src/db/queries/users';
import { listarAreas } from '../../src/db/queries/areas';
import { listarTarefasAtivas } from '../../src/db/queries/tarefas';
import { popularUltimos30Dias, limparExecucoes } from '../../src/db/queries/seed';
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

function iniciais(nome?: string | null): string {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return (partes[0]![0]! + partes[partes.length - 1]![0]!).toUpperCase();
}

export default function Config() {
  const router = useRouter();
  const setLogado = useAppStore(s => s.setLogado);
  const setOnboarded = useAppStore(s => s.setOnboarded);
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
      'Isso apaga TODOS os seus dados — na nuvem e neste aparelho. Sem volta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar mesmo',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del('/me');
              await limparSessao();
              // Apaga o SQLite local. Sem isso, re-logar com a mesma conta
              // Google reabre direto na Home com os dados do user antigo
              // (bootstrap lê users.onboarded_at local e marca onboarded=true).
              await resetDb();
              setOnboarded(false);
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

        <View style={{ height: 14 }} />

        <View style={styles.perfilCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{iniciais(user?.nome)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.perfilNome} numberOfLines={1}>{user?.nome ?? '—'}</Text>
            <Text style={styles.perfilEmail} numberOfLines={1}>
              Conta sincronizada
            </Text>
          </View>
        </View>

        <ConfigGroup label="Conta">
          <ConfigRow icon="create-outline" title="Editar cadastro" onPress={() => router.push({ pathname: '/onboarding/cadastro', params: { modo: 'editar' } })} />
          <ConfigRow
            icon="briefcase-outline"
            title="Horário de trabalho"
            value={
              user?.horario_trabalho_inicio && user?.horario_trabalho_fim
                ? `${user.horario_trabalho_inicio}–${user.horario_trabalho_fim}`
                : 'não definido'
            }
            onPress={() => router.push('/configuracoes/horario-trabalho')}
          />
          <ConfigRow icon="log-out-outline" title="Sair" danger onPress={sair} />
          <ConfigRow icon="trash-outline" title="Apagar conta" danger isLast onPress={apagarConta} />
        </ConfigGroup>

        <ConfigGroup label="Áreas e tarefas">
          {areas.map((a, i) => (
            <ConfigRow
              key={a.id}
              paletaSlug={a.slug}
              title={a.nome}
              value={`${tarefasCount(a.id)} ${tarefasCount(a.id) === 1 ? 'tarefa' : 'tarefas'}`}
              isLast={i === areas.length - 1}
              onPress={() => router.push(`/area/${a.id}`)}
            />
          ))}
        </ConfigGroup>

        <ConfigGroup label="Notificações">
          <ConfigRow
            icon="sunny-outline"
            title="Lembrete 07:00 (manhã)"
            toggle={notif.manha}
            onToggle={v => setNotif({ ...notif, manha: v })}
          />
          <ConfigRow
            icon="moon-outline"
            title="Cobrança 21:30 (noite)"
            toggle={notif.noite}
            onToggle={v => setNotif({ ...notif, noite: v })}
          />
          <ConfigRow
            icon="alarm-outline"
            title="Tarefas atrasadas"
            toggle={notif.atrasadas}
            onToggle={v => setNotif({ ...notif, atrasadas: v })}
          />
          <ConfigRow
            icon="warning-outline"
            title="Subida de mediocridade"
            toggle={notif.mediocridade}
            onToggle={v => setNotif({ ...notif, mediocridade: v })}
            isLast
          />
        </ConfigGroup>

        <ConfigGroup label="Sincronização">
          <ConfigRow icon="cloud-done-outline" title="Última sync" value={formatarUltimaSync(lastPull)} />
          <ConfigRow
            icon="sync-outline"
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
          <ConfigRow icon="information-circle-outline" title="Versão" value={APP_VERSION} />
          <ConfigRow icon="logo-github" title="Repositório" value="DeyvidLucas-DEV/1percent" isLast />
        </ConfigGroup>

        <ConfigGroup label="Dev (debug)">
          <ConfigRow
            icon="flask-outline"
            title="Popular últimos 30 dias"
            onPress={async () => {
              try {
                const r = await popularUltimos30Dias();
                Alert.alert(
                  'Pronto',
                  `${r.inseridos} execuções inseridas em ${r.dias} dias × ${r.tarefas} tarefas.`
                );
              } catch (e: any) {
                Alert.alert('Erro', String(e?.message ?? e));
              }
            }}
          />
          <ConfigRow
            icon="trash-bin-outline"
            title="Limpar todas as execuções"
            danger
            isLast
            onPress={() => {
              Alert.alert(
                'Confirma',
                'Apaga todo histórico de execuções no device. Sem volta.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Apagar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const n = await limparExecucoes();
                        Alert.alert('OK', `${n} registros apagados.`);
                      } catch (e: any) {
                        Alert.alert('Erro', String(e?.message ?? e));
                      }
                    },
                  },
                ]
              );
            }}
          />
        </ConfigGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: tema.bg },
  container: { paddingBottom: 130 },
  perfilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: tema.card,
    borderRadius: 22,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: tema.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    fontFamily: tema.fontFamily.display,
    fontSize: 18,
    color: tema.bg,
    letterSpacing: -0.4,
  },
  perfilNome: {
    fontFamily: tema.fontFamily.display,
    fontSize: 18,
    color: tema.ink,
    letterSpacing: -0.3,
  },
  perfilEmail: {
    fontSize: 13,
    color: tema.weak,
    marginTop: 2,
    fontFamily: tema.fontFamily.text,
  },
});
