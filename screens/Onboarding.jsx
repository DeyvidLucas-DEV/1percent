// Onboarding.jsx — Login + 5 passos (light/pastel)

function ScreenLogin() {
  return (
    <Screen tab="home" hideTabBar bg={T.bgSoft}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '60px 32px 32px', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 130, fontWeight: 700,
            color: T.ink, letterSpacing: -8, lineHeight: 0.9,
            display: 'flex', alignItems: 'baseline',
          }}>
            1<span style={{ fontSize: 80, color: T.weak, marginLeft: 4,
              letterSpacing: -4 }}>%</span>
          </div>
          <div style={{ marginTop: 24, fontSize: 17, fontWeight: 500,
            color: T.ink, lineHeight: 1.4, maxWidth: 280, textWrap: 'pretty' }}>
            Resultado é consequência. Processo é decisão.
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              background: T.ink, color: T.bg,
              borderRadius: 16, padding: '15px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700,
            }}>
              <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
                <path d="M11.5 9.5c0-2 1.6-3 1.7-3-1-1.3-2.4-1.5-3-1.5-1.3-.1-2.5.7-3.1.7-.7 0-1.7-.7-2.8-.7-1.4 0-2.7.8-3.5 2.1-1.5 2.6-.4 6.3 1 8.4.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.6.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.1-2.4 0 0-2.2-.8-2.3-3.7zM10 3.5c.6-.7 1-1.7.9-2.5-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.5.9 0 1.9-.5 2.5-1.3z"/>
              </svg>
              Continuar com Apple
            </div>
            <div style={{
              background: T.card, color: T.ink,
              border: `1px solid ${T.border}`,
              borderRadius: 16, padding: '15px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700,
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.6 9.2L17.5 8.6 9 8.6l0 3.4 4.9 0c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.1z"/>
                <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3.1-2.4c-.9.6-2 .9-2.9.9-2.2 0-4.1-1.5-4.8-3.5L1 13.3C2.5 16.1 5.5 18 9 18z"/>
                <path fill="#FBBC05" d="M4.2 10.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L1 4.7C.4 6 0 7.4 0 9c0 1.6.4 3 1 4.3l3.2-2.5z"/>
                <path fill="#EA4335" d="M9 3.6c1.3 0 2.4.4 3.3 1.3L15 2.2C13.5.8 11.4 0 9 0 5.5 0 2.5 1.9 1 4.7l3.2 2.5C5 5.1 6.8 3.6 9 3.6z"/>
              </svg>
              Continuar com Google
            </div>
          </div>
          <div style={{ marginTop: 22, fontSize: 12, color: T.weak,
            textAlign: 'center', lineHeight: 1.5 }}>
            Seus dados são seus.
          </div>
        </div>
      </div>
    </Screen>
  );
}

function StepDots({ step, total = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[...Array(total)].map((_, i) => (
        <div key={i} style={{
          width: i === step ? 22 : 6, height: 6, borderRadius: 3,
          background: i === step ? T.ink : 'rgba(0,0,0,0.1)',
        }}/>
      ))}
    </div>
  );
}

function FormField({ label, value, placeholder, suffix }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
        letterSpacing: 1, textTransform: 'uppercase',
        marginBottom: 6, padding: '0 4px' }}>{label}</div>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 16, color: value ? T.ink : 'rgba(122,118,108,0.6)',
        fontWeight: 500,
      }}>
        <div style={{ flex: 1 }}>{value || placeholder}</div>
        {suffix && <div style={{ color: T.weak, fontSize: 13 }}>{suffix}</div>}
      </div>
    </div>
  );
}

function ContinuarBtn({ label = 'Continuar' }) {
  return (
    <div style={{
      background: T.ink, color: T.bg,
      borderRadius: 16, padding: '16px',
      textAlign: 'center', fontFamily: T.fontDisplay,
      fontSize: 15, fontWeight: 700,
    }}>{label}</div>
  );
}

function ScreenOnbCadastro() {
  return (
    <Screen tab="home" hideTabBar>
      <div style={{ padding: '4px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StepDots step={0}/>
        <div style={{ fontSize: 12, color: T.weak, fontWeight: 600 }}>1 / 5</div>
      </div>
      <div style={{ padding: '28px 24px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1, textTransform: 'uppercase' }}>Bloco 1 · Quem é você</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6, marginTop: 6, lineHeight: 1.1 }}>
          Vamos te conhecer
        </div>
      </div>
      <div style={{ padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FormField label="Nome completo" value="Lucas Andrade"/>
        <FormField label="Apelido" value="Lu" suffix="seu coach"/>
        <FormField label="Data de nascimento" value="14 mar 1992"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Sexo" value="M"/>
          <FormField label="Estado civil" value="Casado"/>
        </div>
        <FormField label="Cidade" value="São Paulo"/>
        <FormField label="Filhos" value="2" suffix="(8 e 5 anos)"/>
      </div>
      <div style={{ padding: '24px 16px 36px' }}><ContinuarBtn/></div>
    </Screen>
  );
}

function ScreenOnbDiagnostico() {
  return (
    <Screen tab="home" hideTabBar>
      <div style={{ padding: '4px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StepDots step={1}/>
        <div style={{ fontSize: 12, color: T.weak, fontWeight: 600 }}>2 / 5</div>
      </div>
      <div style={{ padding: '28px 24px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1, textTransform: 'uppercase' }}>Bloco 2 · Sua vida hoje</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6, marginTop: 6, lineHeight: 1.1 }}>
          Onde você está
        </div>
      </div>

      <div style={{ padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* 3 áreas mais importantes */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 8,
            padding: '0 6px' }}>3 áreas mais importantes agora</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {AREA_LIST.map(a => {
              const sel = ['fisica','familia','trabalho'].includes(a.id);
              return (
                <div key={a.id} style={{
                  padding: '7px 12px', borderRadius: 999,
                  background: sel ? a.ink : T.card,
                  color: sel ? '#fff' : T.ink,
                  border: sel ? 'none' : `1px solid ${T.border}`,
                  fontSize: 12, fontWeight: 600,
                }}>{a.name}</div>
              );
            })}
          </div>
        </div>

        <FormField label="Mau hábito a eliminar"
          value="Rolar Instagram à noite"/>
        <FormField label="Hábito a construir"
          value="Treinar 4× / semana"/>
        <FormField label="Onde está mais travado" value="Saúde Emocional"/>

        {/* slider */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: 8, padding: '0 6px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>
              Você hoje vs. quem pode ser
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700,
              color: T.ink, fontVariantNumeric: 'tabular-nums' }}>4</div>
          </div>
          <div style={{ position: 'relative', height: 24, padding: '0 6px' }}>
            <div style={{ position: 'absolute', top: 10, left: 6, right: 6,
              height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 2 }}/>
            <div style={{ position: 'absolute', top: 10, left: 6,
              width: '40%', height: 4, background: T.ink, borderRadius: 2 }}/>
            <div style={{ position: 'absolute', top: 0, left: 'calc(40% - 6px)',
              width: 24, height: 24, borderRadius: 12, background: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
              border: `2px solid ${T.ink}` }}/>
          </div>
        </div>

        <FormField label="Maior obstáculo histórico"
          value="Falta de disciplina"/>
        <FormField label="Tentativas anteriores" value="Muitas vezes"/>
      </div>

      <div style={{ padding: '24px 16px 36px' }}><ContinuarBtn/></div>
    </Screen>
  );
}

function ScreenOnbCompromisso() {
  return (
    <Screen tab="home" hideTabBar>
      <div style={{ padding: '4px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StepDots step={2}/>
        <div style={{ fontSize: 12, color: T.weak, fontWeight: 600 }}>3 / 5</div>
      </div>
      <div style={{ padding: '28px 24px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1, textTransform: 'uppercase' }}>Bloco 3 · Compromisso</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6, marginTop: 6, lineHeight: 1.05 }}>
          Antes de começar
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{
          background: T.card, borderRadius: 22,
          border: `1px solid ${T.border}`, padding: '20px 22px',
          fontSize: 14, color: T.ink, lineHeight: 1.55,
        }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 18,
            fontWeight: 700, color: T.ink, marginBottom: 10 }}>
            O App 1% não vai mudar sua vida.<br/>Você vai.
          </div>
          <p style={{ margin: '0 0 12px' }}>
            Este app existe para um único propósito: ajudar você a organizar,
            visualizar e manter o processo de evolução constante que já está
            dentro de você.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Resultados permanentes não vêm de decisões momentâneas. Vêm de pequenas
            ações repetidas todos os dias, com honestidade, consistência e propósito.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Melhorar 1% por dia parece pouco. Mas em um ano, você será 37 vezes
            melhor do que é hoje.
          </p>
          <p style={{ margin: '0 0 12px', fontWeight: 600 }}>
            O tempo vai passar de qualquer forma.<br/>
            A única pergunta é: o que você vai fazer com ele?
          </p>
          <p style={{ margin: '0 0 4px' }}>
            O app vai te acompanhar. Vai te lembrar. Vai te mostrar onde você está
            e para onde está indo.
          </p>
          <p style={{ margin: 0, fontWeight: 600 }}>
            Mas a decisão — essa é sua. Sempre foi.
          </p>
        </div>

        {/* Versículo destacado */}
        <div style={{
          marginTop: 14,
          background: AREAS.espiritual.soft, borderRadius: 22,
          padding: '16px 20px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700,
            color: AREAS.espiritual.ink, letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 8 }}>Gálatas 6:9</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 700,
            color: T.ink, fontStyle: 'italic', lineHeight: 1.4, textWrap: 'pretty' }}>
            "Não nos cansemos de fazer o bem, pois a seu tempo colheremos,
            se não desanimarmos."
          </div>
        </div>

        {/* Checkbox compromisso */}
        <div style={{
          marginTop: 14, padding: '14px 18px',
          background: T.card, borderRadius: 18,
          border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11, marginTop: 1,
            background: T.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14">
              <path d="M3 7.5 L6 10 L11 4" fill="none" stroke="#fff"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.5 }}>
            Eu me comprometo a ser honesto comigo mesmo, consistente no processo
            e aberto à mudança.
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 36px' }}>
        <div style={{
          background: '#8B3328', color: '#fff',
          borderRadius: 16, padding: '17px',
          textAlign: 'center', fontFamily: T.fontDisplay,
          fontSize: 15, fontWeight: 700, letterSpacing: 0.4,
        }}>
          ASSUMO ESSE COMPROMISSO
        </div>
      </div>
    </Screen>
  );
}

function ScreenOnbAreas() {
  const opcionais = AREA_LIST.filter(a => a.opt);
  const states = { ministerio: true, amizades: true, intelectual: true, sabedoria: false };
  return (
    <Screen tab="home" hideTabBar>
      <div style={{ padding: '4px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StepDots step={3}/>
        <div style={{ fontSize: 12, color: T.weak, fontWeight: 600 }}>4 / 5</div>
      </div>
      <div style={{ padding: '28px 24px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1, textTransform: 'uppercase' }}>Áreas opcionais</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6, marginTop: 6, lineHeight: 1.1 }}>
          Em quais você quer se medir?
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: T.weak, lineHeight: 1.5 }}>
          As 6 obrigatórias estão sempre ligadas.
        </div>
      </div>

      <div style={{ padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opcionais.map((a, i) => {
          const on = states[a.id];
          return (
            <div key={i} style={{
              background: on ? a.soft : T.card,
              borderRadius: 18, padding: '14px 18px',
              border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 12, height: 12, borderRadius: 6,
                background: a.ink }}/>
              <div style={{ flex: 1, fontFamily: T.fontDisplay, fontSize: 15,
                fontWeight: 700, color: T.ink }}>{a.name}</div>
              <div style={{
                width: 42, height: 26, borderRadius: 13,
                background: on ? T.ink : 'rgba(0,0,0,0.1)', position: 'relative',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11, background: '#fff',
                  position: 'absolute', top: 2, left: on ? 18 : 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                }}/>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ margin: '14px 16px 0',
        background: AREAS.emocional.soft, borderRadius: 18, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: AREAS.emocional.ink,
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          Sabedoria pausada
        </div>
        <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}>
          <span style={{ fontStyle: 'italic' }}>"Wait, Naval Ravikant"</span> —
          quem não cultiva sabedoria toma decisões tributadas pelo presente urgente.
        </div>
      </div>

      <div style={{ padding: '24px 16px 36px' }}><ContinuarBtn/></div>
    </Screen>
  );
}

function ScreenOnbAvaliacao() {
  const scores = {
    espiritual: 5, fisica: 4, familia: 7, trabalho: 6,
    emocional: 4, financas: 8, ministerio: 3, amizades: 4, intelectual: 6,
  };
  const list = AREA_LIST.filter(a => a.id !== 'sabedoria');
  return (
    <Screen tab="home" hideTabBar>
      <div style={{ padding: '4px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StepDots step={4}/>
        <div style={{ fontSize: 12, color: T.weak, fontWeight: 600 }}>5 / 5</div>
      </div>
      <div style={{ padding: '28px 24px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1, textTransform: 'uppercase' }}>Autoavaliação</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6, marginTop: 6, lineHeight: 1.1 }}>
          De 0 a 10, onde você está?
        </div>
      </div>

      <div style={{ padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map((a, i) => {
          const v = scores[a.id];
          return (
            <div key={i} style={{
              background: T.card, borderRadius: 18,
              border: `1px solid ${T.border}`,
              padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4,
                  background: a.ink }}/>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.ink }}>
                  {a.name}
                </div>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 22,
                  fontWeight: 700, color: T.ink,
                  fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
              <div style={{ position: 'relative', height: 20 }}>
                <div style={{ position: 'absolute', top: 8, left: 0, right: 0,
                  height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}/>
                <div style={{ position: 'absolute', top: 8, left: 0,
                  width: `${v*10}%`, height: 4, background: a.ink, borderRadius: 2 }}/>
                <div style={{ position: 'absolute', top: 0, left: `calc(${v*10}% - 10px)`,
                  width: 20, height: 20, borderRadius: 10, background: '#fff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  border: `2px solid ${a.ink}` }}/>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '24px 16px 36px' }}>
        <ContinuarBtn label="Começar"/>
      </div>
    </Screen>
  );
}

Object.assign(window, {
  ScreenLogin, ScreenOnbCadastro, ScreenOnbDiagnostico,
  ScreenOnbCompromisso, ScreenOnbAreas, ScreenOnbAvaliacao,
});
