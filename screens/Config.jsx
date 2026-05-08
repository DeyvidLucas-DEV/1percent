// Config.jsx — Aba Configurações + Checklist + Reflexão + Reativação

// ─── Configurações ───
function ConfigRow({ icon, title, value, isLast, danger, toggle, toggleOn }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', minHeight: 52,
      borderBottom: isLast ? 'none' : `0.5px solid ${T.border}`,
    }}>
      {icon && (
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: icon, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}/>
      )}
      <div style={{ flex: 1, fontSize: 15, fontWeight: 500,
        color: danger ? T.danger : T.text }}>{title}</div>
      {value !== undefined && (
        <div style={{ fontSize: 14, color: T.weak,
          fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      )}
      {toggle !== undefined && (
        <div style={{
          width: 42, height: 26, borderRadius: 13,
          background: toggleOn ? T.success : T.input,
          position: 'relative', transition: 'background 0.2s',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11, background: '#fff',
            position: 'absolute', top: 2, left: toggleOn ? 18 : 2,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}/>
        </div>
      )}
      {toggle === undefined && value === undefined && !danger && (
        <svg width="8" height="14" viewBox="0 0 8 14">
          <path d="M1 1 L7 7 L1 13" fill="none" stroke={T.weak}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}

function ConfigGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: T.weak,
        letterSpacing: 1.2, textTransform: 'uppercase',
        padding: '0 28px 8px',
      }}>{label}</div>
      <div style={{
        margin: '0 16px', background: T.card, borderRadius: 14,
        border: `0.5px solid ${T.border}`, overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function ScreenConfig() {
  return (
    <Screen tab="config">
      <PageHeader title="Configurações"/>

      <div style={{ height: 18 }}/>

      <ConfigGroup label="Conta">
        <ConfigRow icon={T.input} title="Lucas Andrade"/>
        <ConfigRow icon={T.input} title="lucas@exemplo.com"/>
        <ConfigRow icon={T.input} title="Foto"/>
        <ConfigRow icon={T.input} title="Sair" danger/>
        <ConfigRow icon={T.input} title="Apagar conta" danger isLast/>
      </ConfigGroup>

      <ConfigGroup label="Áreas e tarefas">
        <ConfigRow icon={AREAS.espiritual.color} title="Espiritual"     value="3 tarefas"/>
        <ConfigRow icon={AREAS.fisica.color}     title="Saúde Física"   value="4 tarefas"/>
        <ConfigRow icon={AREAS.familia.color}    title="Família"        value="3 tarefas"/>
        <ConfigRow icon={AREAS.trabalho.color}   title="Trabalho"       value="5 tarefas"/>
        <ConfigRow icon={AREAS.emocional.color}  title="Saúde Emocional" value="2 tarefas"/>
        <ConfigRow icon={AREAS.financas.color}   title="Finanças"       value="2 tarefas" isLast/>
      </ConfigGroup>

      <ConfigGroup label="Metas">
        <ConfigRow icon={AREAS.fisica.color}     title="Treinar 150x este ano"   value="58%"/>
        <ConfigRow icon={AREAS.intelectual.color} title="Ler 24 livros em 2026"  value="33%"/>
        <ConfigRow icon={AREAS.financas.color}   title="Reserva de 6 meses"      value="71%" isLast/>
      </ConfigGroup>

      <ConfigGroup label="Notificações">
        <ConfigRow title="Lembrete 07:00 (manhã)"          toggle toggleOn={true}/>
        <ConfigRow title="Cobrança 21:30 (noite)"           toggle toggleOn={true}/>
        <ConfigRow title="Tarefas atrasadas"               toggle toggleOn={true}/>
        <ConfigRow title="Subida de mediocridade"          toggle toggleOn={true} isLast/>
      </ConfigGroup>

      <ConfigGroup label="Sincronização">
        <ConfigRow title="Última sync"        value="há 2min"/>
        <ConfigRow title="Sincronizar agora"  value="" />
        <ConfigRow title="Status do backend"  value="OK" isLast/>
      </ConfigGroup>

      <ConfigGroup label="Sobre">
        <ConfigRow title="Versão"      value="1.0.4"/>
        <ConfigRow title="Repositório" value="github.com/…"/>
        <ConfigRow title="Créditos"    isLast/>
      </ConfigGroup>
    </Screen>
  );
}

// ─── Checklist Diário ───
function ChecklistTask({ time, title, status, weight, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderBottom: isLast ? 'none' : `0.5px solid ${T.border}`,
    }}>
      <StatusGlyph status={status} size={26}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16, fontWeight: 500,
          color: status === 'done' ? T.weak : T.text,
          textDecoration: status === 'done' ? 'line-through' : 'none',
          textDecorationColor: 'rgba(144,149,160,0.4)',
        }}>{title}</div>
        {time && (
          <div style={{ fontSize: 12, color: T.weak, marginTop: 2,
            fontVariantNumeric: 'tabular-nums' }}>{time}</div>
        )}
      </div>
      {weight && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: T.weak, background: T.input,
          padding: '3px 7px', borderRadius: 4,
          fontVariantNumeric: 'tabular-nums',
        }}>×{weight}</div>
      )}
    </div>
  );
}

function ChecklistArea({ area, tasks }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 24px 8px',
      }}>
        <div style={{ width: 8, height: 18, background: area.color, borderRadius: 1 }}/>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {area.name}
        </div>
      </div>
      <div style={{
        margin: '0 16px', background: T.card, borderRadius: 14,
        border: `0.5px solid ${T.border}`, overflow: 'hidden',
      }}>
        {tasks.map((t, i) => (
          <ChecklistTask key={i} {...t} isLast={i === tasks.length-1}/>
        ))}
      </div>
    </div>
  );
}

function ScreenChecklist({ state = 'good' }) {
  const G = state === 'good' ? [
    { area: AREAS.espiritual, tasks: [
      { time: '05:30', title: 'Oração matinal',     status: 'done', weight: 3 },
      { time: '06:00', title: 'Leitura bíblica',    status: 'done', weight: 2 },
      { time: '21:00', title: 'Devocional',         status: 'open', weight: 2 },
    ]},
    { area: AREAS.fisica, tasks: [
      { time: '06:30', title: 'Treino · força',     status: 'done', weight: 3 },
      { time: '12:00', title: 'Caminhada 20min',    status: 'done', weight: 1 },
      { time: '21:30', title: 'Alongamento',        status: 'open', weight: 1 },
    ]},
    { area: AREAS.familia, tasks: [
      { time: '07:30', title: 'Café com filhos',    status: 'done', weight: 2 },
      { time: '18:00', title: 'Devocional família', status: 'open', weight: 3 },
      { time: '21:30', title: 'Tempo com Ana',      status: 'open', weight: 2 },
    ]},
    { area: AREAS.trabalho, tasks: [
      { time: '09:00', title: 'Bloco profundo · projeto X', status: 'done', weight: 3 },
      { time: '14:30', title: 'Reunião 1:1',                status: 'done', weight: 1 },
      { time: '17:00', title: 'Inbox zero',                 status: 'half', weight: 1 },
    ]},
  ] : [
    { area: AREAS.espiritual, tasks: [
      { time: '06:00', title: 'Oração matinal',     status: 'fail', weight: 3 },
      { time: '06:30', title: 'Leitura bíblica',    status: 'fail', weight: 2 },
      { time: '21:00', title: 'Devocional',         status: 'open', weight: 2 },
    ]},
    { area: AREAS.fisica, tasks: [
      { time: '07:00', title: 'Treino',             status: 'fail', weight: 3 },
      { time: '12:00', title: 'Caminhada 20min',    status: 'open', weight: 1 },
    ]},
    { area: AREAS.familia, tasks: [
      { time: '07:30', title: 'Café com filhos',    status: 'fail', weight: 2 },
      { time: '12:30', title: 'Almoço com Ana',     status: 'done', weight: 1 },
      { time: '18:00', title: 'Devocional família', status: 'open', weight: 3 },
    ]},
    { area: AREAS.trabalho, tasks: [
      { time: '09:00', title: 'Bloco profundo',     status: 'open', weight: 3 },
      { time: '14:30', title: 'Reunião 1:1',        status: 'fail', weight: 1 },
    ]},
  ];

  return (
    <Screen tab="hoje">
      <BackBar action="Hoje"/>
      <PageHeader kicker="sex, 8 mai" title="Checklist"
        right={
          <div style={{
            background: T.input, border: `0.5px solid ${T.border}`,
            borderRadius: 999, padding: '8px 14px',
            fontSize: 13, fontWeight: 600, color: T.text,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13">
              <path d="M8 2 L4 6.5 L8 11" fill="none" stroke={T.text}
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Ontem
          </div>
        }
      />
      <div style={{ height: 16 }}/>
      {G.map((g, i) => <ChecklistArea key={i} {...g}/>)}
    </Screen>
  );
}

// ─── Reflexão Diária ───
function ScreenReflexao({ filled = false }) {
  const q = 'Onde você mediu, mas não agiu?';
  const body = filled
    ? 'Sei que estou comendo açúcar demais e travei a balança 4 dias. Vi os números subirem e fingi que não vi. Hoje, antes de dormir, jogo a doceria fora do armário.'
    : '';

  return (
    <Screen tab="hoje" noTabBar>
      <BackBar action="Hoje"/>
      <div style={{ padding: '4px 24px 0' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 1.2,
          textTransform: 'uppercase', color: T.weak,
        }}>
          Reflexão · sex, 8 mai
        </div>
      </div>

      {/* Pergunta grande */}
      <div style={{ padding: '32px 28px 28px' }}>
        <div style={{
          fontSize: 30, fontWeight: 800, color: T.text, lineHeight: 1.15,
          letterSpacing: -0.4,
        }}>{q}</div>
      </div>

      {/* Campo */}
      <div style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          flex: 1, minHeight: 240,
          background: T.input, borderRadius: 14,
          border: `0.5px solid ${T.border}`,
          padding: '18px 20px',
          fontSize: 16, lineHeight: 1.5,
          color: body ? T.text : '#5a5e6a',
        }}>
          {body || 'Escreva o que vier. Sem suavização.'}
        </div>
      </div>

      {/* Footer com botão */}
      <div style={{
        padding: '20px 16px 36px',
        borderTop: 'none',
      }}>
        <div style={{
          background: body ? T.accent : T.input,
          color: body ? '#fff' : T.weak,
          borderRadius: 14, padding: '16px',
          textAlign: 'center', fontSize: 16, fontWeight: 700,
        }}>
          Salvar
        </div>
      </div>
    </Screen>
  );
}

// ─── Reativação (modal bloqueante) ───
function ScreenReativacao({ days = 2 }) {
  const harsh = days >= 3;
  const title = `${days} dias sem cumprir o mínimo`;
  const body = harsh
    ? 'Não é desculpa. Não é cansaço. Não é fase. É decisão. Você está construindo a versão de si que abandona.'
    : 'Você decidiu não fazer. Cada dia que passa, voltar fica mais caro. Marque pelo menos uma tarefa de cada área obrigatória pra desbloquear.';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: T.bg, color: T.text,
      fontFamily: T.fontStack,
      display: 'flex', flexDirection: 'column',
      paddingTop: 60,
      overflow: 'auto',
    }}>
      {/* Top: tag REATIVAÇÃO */}
      <div style={{
        margin: '12px 16px 16px',
        background: '#3A1411',
        border: `0.5px solid ${T.danger}`,
        borderRadius: 16,
        padding: '20px 22px',
      }}>
        <div style={{
          display: 'inline-block',
          background: T.danger, color: '#fff',
          fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          padding: '4px 8px', borderRadius: 4, textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          Reativação
        </div>
        <div style={{
          fontSize: 24, fontWeight: 800, color: T.text,
          letterSpacing: -0.4, lineHeight: 1.15, marginBottom: 12,
        }}>{title}</div>
        <div style={{
          fontSize: 15, color: T.text, opacity: 0.85, lineHeight: 1.5,
        }}>{body}</div>
      </div>

      {/* Campo opcional */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
          padding: '0 12px' }}>
          O que aconteceu? <span style={{ opacity: 0.6 }}>(opcional)</span>
        </div>
        <div style={{
          background: T.input, borderRadius: 14,
          border: `0.5px solid ${T.border}`,
          padding: '14px 16px', minHeight: 80,
          fontSize: 14, color: '#5a5e6a',
        }}>
          Escreva uma linha. Vira dado pra padrões.
        </div>
      </div>

      {/* Áreas obrigatórias */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
          padding: '0 12px' }}>
          {harsh
            ? 'Marque ≥1 tarefa de CADA área obrigatória'
            : 'Marque ≥1 tarefa qualquer'}
        </div>
        <div style={{
          background: T.card, borderRadius: 14,
          border: `0.5px solid ${T.border}`, overflow: 'hidden',
        }}>
          {[
            { a: AREAS.espiritual, task: 'Oração + leitura',     done: harsh ? false : false },
            { a: AREAS.fisica,     task: 'Caminhar 10min',       done: harsh ? true  : false },
            { a: AREAS.familia,    task: 'Conversar com família', done: false },
            { a: AREAS.trabalho,   task: '20min de trabalho real', done: false },
            { a: AREAS.emocional,  task: 'Identificar 1 emoção',  done: false },
            { a: AREAS.financas,   task: 'Olhar saldo',           done: false },
          ].map((r, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              borderBottom: i === arr.length-1 ? 'none' : `0.5px solid ${T.border}`,
            }}>
              <StatusGlyph status={r.done ? 'done' : 'open'}/>
              <div style={{ width: 6, height: 24, background: r.a.color, borderRadius: 1 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500,
                  color: r.done ? T.weak : T.text,
                  textDecoration: r.done ? 'line-through' : 'none',
                }}>{r.task}</div>
                <div style={{ fontSize: 11, color: T.weak, marginTop: 2 }}>
                  {r.a.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão desbloquear */}
      <div style={{ padding: '8px 16px 36px' }}>
        <div style={{
          background: T.input, color: T.weak,
          borderRadius: 14, padding: '16px',
          textAlign: 'center', fontSize: 16, fontWeight: 700,
          border: `0.5px solid ${T.border}`,
        }}>
          Desbloquear e voltar
        </div>
        <div style={{ fontSize: 11, color: T.weak, textAlign: 'center', marginTop: 10 }}>
          {harsh ? 'Marque 1 de cada área pra liberar' : 'Marque pelo menos 1 tarefa pra liberar'}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenConfig, ScreenChecklist, ScreenReflexao, ScreenReativacao,
});
