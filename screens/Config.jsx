// Config.jsx — Configurações + Reflexão + Reativação (light/pastel)

function ConfigRow({ icon, title, value, isLast, danger, toggle, toggleOn }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
    }}>
      {icon !== undefined && (
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: icon, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}/>
      )}
      <div style={{ flex: 1, fontFamily: T.fontText, fontSize: 14, fontWeight: 600,
        color: danger ? '#B5524A' : T.ink }}>
        {title}
      </div>
      {value !== undefined && (
        <div style={{ fontSize: 13, color: T.weak,
          fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      )}
      {toggle !== undefined && (
        <div style={{
          width: 42, height: 26, borderRadius: 13,
          background: toggleOn ? AREAS.fisica.ink : 'rgba(0,0,0,0.1)',
          position: 'relative',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11, background: '#fff',
            position: 'absolute', top: 2, left: toggleOn ? 18 : 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          }}/>
        </div>
      )}
      {toggle === undefined && value === undefined && !danger && (
        <svg width="8" height="14" viewBox="0 0 8 14">
          <path d="M1 1 L7 7 L1 13" fill="none" stroke={T.weak}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        </svg>
      )}
    </div>
  );
}

function ConfigGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: T.weak,
        letterSpacing: 1, textTransform: 'uppercase',
        padding: '0 28px 8px',
      }}>{label}</div>
      <div style={{
        margin: '0 16px', background: T.card, borderRadius: 22,
        border: `1px solid ${T.border}`, overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function ScreenConfig() {
  return (
    <Screen tab="profile">
      <PageHeader greeting="Sua" name="conta" right={
        <IconBtn>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M2 11 L10 3 L12 5 L4 13 L2 13 Z" fill="none" stroke={T.ink}
              strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </IconBtn>
      }/>

      {/* Card de perfil */}
      <div style={{ padding: '0 16px 22px' }}>
        <WaveCard bg={AREAS.intelectual.soft} style={{ padding: '0 0 18px' }}>
          <div style={{ padding: '18px 20px 0',
            display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700,
              color: AREAS.intelectual.ink,
            }}>L</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700,
                color: T.ink }}>Lucas Andrade</div>
              <div style={{ fontSize: 12, color: T.weak, marginTop: 2 }}>
                Membro desde mai 2026 · 21d streak
              </div>
            </div>
          </div>
        </WaveCard>
      </div>

      <ConfigGroup label="Conta">
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Informações pessoais"/>
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Notificações"/>
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Idioma" value="Português"/>
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Senha" isLast/>
      </ConfigGroup>

      <ConfigGroup label="Áreas e hábitos">
        <ConfigRow icon={AREAS.espiritual.soft} title="Espiritual"     value="3 hábitos"/>
        <ConfigRow icon={AREAS.fisica.soft}     title="Saúde Física"   value="4 hábitos"/>
        <ConfigRow icon={AREAS.familia.soft}    title="Família"        value="3 hábitos"/>
        <ConfigRow icon={AREAS.trabalho.soft}   title="Trabalho"       value="5 hábitos"/>
        <ConfigRow icon={AREAS.emocional.soft}  title="Emocional"      value="2 hábitos"/>
        <ConfigRow icon={AREAS.financas.soft}   title="Finanças"       value="2 hábitos" isLast/>
      </ConfigGroup>

      <ConfigGroup label="Preferências">
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Modo claro"      toggle toggleOn={true}/>
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Lembrete diário" toggle toggleOn={true}/>
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Reflexão noturna" toggle toggleOn={false} isLast/>
      </ConfigGroup>

      <ConfigGroup label="Sobre">
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Versão" value="1.0.4"/>
        <ConfigRow icon="rgba(0,0,0,0.06)" title="Sair"   danger isLast/>
      </ConfigGroup>
    </Screen>
  );
}

// ─── Reflexão ───
function ScreenReflexao({ filled = false }) {
  return (
    <Screen tab="home" hideTabBar>
      <BackBar/>
      <div style={{ padding: '4px 24px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.weak,
          textTransform: 'uppercase', letterSpacing: 1 }}>
          Reflexão · sex, 8 mai
        </div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700,
          color: T.ink, lineHeight: 1.1, marginTop: 14, letterSpacing: -0.5,
          textWrap: 'pretty',
        }}>
          Onde você mediu, mas não agiu?
        </div>
      </div>

      <div style={{ padding: '24px 16px' }}>
        <div style={{
          background: T.card, borderRadius: 22,
          border: `1px solid ${T.border}`,
          minHeight: 220, padding: '18px 20px',
          fontFamily: T.fontText, fontSize: 15, lineHeight: 1.5,
          color: filled ? T.ink : 'rgba(122,118,108,0.6)',
        }}>
          {filled
            ? 'Sei que estou comendo açúcar demais e travei a balança 4 dias. Vi os números subirem e fingi que não vi. Hoje, antes de dormir, jogo a doceria fora.'
            : 'Escreva o que vier. Sem suavização.'}
        </div>
      </div>

      <div style={{ padding: '8px 16px 20px' }}>
        <div style={{
          background: filled ? T.ink : 'rgba(0,0,0,0.08)',
          color: filled ? T.bg : T.weak,
          borderRadius: 18, padding: '16px',
          textAlign: 'center', fontFamily: T.fontDisplay,
          fontSize: 15, fontWeight: 700,
        }}>
          Salvar reflexão
        </div>
      </div>
    </Screen>
  );
}

function ScreenReativacao({ days = 2 }) {
  const harsh = days >= 3;
  return (
    <Screen tab="home" hideTabBar>
      <div style={{ padding: '8px 24px 0' }}>
        <div style={{
          display: 'inline-block',
          background: '#F2D8D2', color: '#8B3328',
          fontSize: 11, fontWeight: 700, letterSpacing: 1,
          padding: '5px 10px', borderRadius: 12,
          textTransform: 'uppercase',
        }}>
          Reativação
        </div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700,
          color: T.ink, lineHeight: 1.1, marginTop: 14, letterSpacing: -0.5,
        }}>
          {days} dias sem cumprir o mínimo
        </div>
        <div style={{ marginTop: 12, fontSize: 14, color: T.weak,
          lineHeight: 1.5, textWrap: 'pretty' }}>
          {harsh
            ? 'Não é desculpa. Não é cansaço. Você está construindo a versão de si que abandona.'
            : 'Cada dia que passa, voltar fica mais caro. Marque uma tarefa pra desbloquear.'}
        </div>
      </div>

      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          padding: '0 8px' }}>
          Marque ≥1 hábito
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { area: AREAS.espiritual, task: 'Oração + leitura' },
            { area: AREAS.fisica,     task: 'Caminhar 10min', done: harsh },
            { area: AREAS.familia,    task: 'Conversar com família' },
            { area: AREAS.trabalho,   task: '20min de trabalho real' },
            { area: AREAS.emocional,  task: 'Identificar 1 emoção' },
            { area: AREAS.financas,   task: 'Olhar saldo' },
          ].map((r, i) => (
            <div key={i} style={{
              background: r.done ? r.area.soft : T.card,
              borderRadius: 18, padding: '12px 16px',
              border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 12,
                background: r.done ? r.area.ink : 'transparent',
                border: r.done ? 'none' : `1.5px solid ${T.borderD}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {r.done && (
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M3 7.5 L6 10 L11 4" fill="none" stroke="#fff"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{r.task}</div>
                <div style={{ fontSize: 11, color: T.weak, marginTop: 2 }}>{r.area.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 16px' }}>
        <div style={{
          background: 'rgba(0,0,0,0.08)', color: T.weak,
          borderRadius: 18, padding: '16px',
          textAlign: 'center', fontFamily: T.fontDisplay,
          fontSize: 15, fontWeight: 700,
        }}>
          Desbloquear e voltar
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { ScreenConfig, ScreenReflexao, ScreenReativacao });
