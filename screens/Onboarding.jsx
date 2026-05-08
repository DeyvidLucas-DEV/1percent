// Onboarding.jsx — Login + Onboarding 5 passos (3 blocos cadastro + áreas opc + autoavaliação)

// ─── Login ───
function ScreenLogin() {
  const AppleBtn = () => (
    <div style={{
      background: '#fff', color: '#000', borderRadius: 12, padding: '14px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontSize: 16, fontWeight: 600,
    }}>
      <svg width="14" height="18" viewBox="0 0 14 18">
        <path fill="#000" d="M11.4 9.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.7 0-1.7-.7-2.8-.7-1.4 0-2.7.8-3.5 2.1-1.5 2.6-.4 6.4 1 8.5.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7 1.3 0 1.7.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.5-.9-2.5-3.3zM9.4 3.4c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.5.6-1 1.6-.9 2.6 1 .1 2 -.5 2.6-1.2z"/>
      </svg>
      Continuar com Apple
    </div>
  );
  const GoogleBtn = () => (
    <div style={{
      background: T.input, color: T.text, border: `0.5px solid ${T.border}`,
      borderRadius: 12, padding: '14px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontSize: 16, fontWeight: 600,
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M17.6 9.2L17.5 8.6 9 8.6l0 3.4 4.9 0c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.1z"/>
        <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-3.1-2.4c-.9.6-2 .9-2.9.9-2.2 0-4.1-1.5-4.8-3.5L1 13.3C2.5 16.1 5.5 18 9 18z"/>
        <path fill="#FBBC05" d="M4.2 10.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L1 4.7C.4 6 0 7.4 0 9c0 1.6.4 3 1 4.3l3.2-2.5z"/>
        <path fill="#EA4335" d="M9 3.6c1.3 0 2.4.4 3.3 1.3L15 2.2C13.5.8 11.4 0 9 0 5.5 0 2.5 1.9 1 4.7l3.2 2.5C5 5.1 6.8 3.6 9 3.6z"/>
      </svg>
      Continuar com Google
    </div>
  );

  return (
    <Screen tab="hoje" noTabBar hideStatus>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        padding: '120px 32px 0', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 110, fontWeight: 800, color: T.text,
            letterSpacing: -6, lineHeight: 0.9,
            display: 'flex', alignItems: 'baseline' }}>
            1<span style={{ fontSize: 70, fontWeight: 700,
              color: T.weak, letterSpacing: -3, marginLeft: 2 }}>%</span>
          </div>
          <div style={{ marginTop: 20, fontSize: 17, fontWeight: 500,
            color: T.text, lineHeight: 1.4, maxWidth: 280 }}>
            Resultado é consequência. Processo é decisão.
          </div>
        </div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AppleBtn/><GoogleBtn/>
          </div>
          <div style={{ marginTop: 22, fontSize: 12, color: T.weak,
            textAlign: 'center', lineHeight: 1.5 }}>
            Seus dados são seus. Login serve só pra<br/>
            manter sincronizado entre seus aparelhos.
          </div>
        </div>
      </div>
    </Screen>
  );
}

// ─── Helpers ───
function FormField({ label, value, placeholder, suffix }) {
  return (
    <div>
      {label && <div style={{
        fontSize: 11, fontWeight: 700, color: T.weak,
        letterSpacing: 1.2, textTransform: 'uppercase',
        marginBottom: 6, padding: '0 4px',
      }}>{label}</div>}
      <div style={{
        background: T.input, border: `0.5px solid ${T.border}`,
        borderRadius: 12, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 17, color: value ? T.text : '#5a5e6a', fontWeight: 500,
      }}>
        <div style={{ flex: 1 }}>{value || placeholder}</div>
        {suffix && <div style={{ color: T.weak, fontSize: 14 }}>{suffix}</div>}
      </div>
    </div>
  );
}

function StepDots({ step, total = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[...Array(total)].map((_, i) => (
        <div key={i} style={{
          width: i === step ? 22 : 6, height: 6, borderRadius: 3,
          background: i === step ? T.text : T.input,
        }}/>
      ))}
    </div>
  );
}

function OnbHeader({ kicker, title, sub, step, of }) {
  return (
    <>
      <div style={{ padding: '4px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StepDots step={step} total={of}/>
        <div style={{ fontSize: 13, color: T.weak, fontWeight: 600 }}>{step+1} de {of}</div>
      </div>
      <div style={{ padding: '28px 28px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>{kicker}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: T.text,
          letterSpacing: -0.4, lineHeight: 1.15, marginTop: 6 }}>{title}</div>
        {sub && <div style={{ fontSize: 14, color: T.weak, marginTop: 8, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    </>
  );
}

function OnbPrimary({ children, intense }) {
  return (
    <div style={{
      background: intense ? T.danger : T.text,
      color: intense ? '#fff' : T.bg,
      borderRadius: 14, padding: '16px',
      textAlign: 'center', fontSize: 16, fontWeight: 700,
      letterSpacing: intense ? 0.6 : 0,
      textTransform: intense ? 'uppercase' : 'none',
    }}>{children}</div>
  );
}

function RadioRow({ label, on, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderBottom: isLast ? 'none' : `0.5px solid ${T.border}`,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 11,
        border: `1.5px solid ${on ? T.text : T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <div style={{ width: 12, height: 12, borderRadius: 6, background: T.text }}/>}
      </div>
      <div style={{ flex: 1, fontSize: 15, color: on ? T.text : T.weak,
        fontWeight: on ? 600 : 500 }}>{label}</div>
    </div>
  );
}

// ─── Bloco 1: Quem é você ───
function ScreenOnbCadastro() {
  return (
    <Screen tab="hoje" noTabBar>
      <OnbHeader step={0} of={5} kicker="Bloco 1 · Cadastro"
        title="Quem é você?"
        sub="Dado bruto. Sem isso, o app não calcula."/>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Nome completo" value="Lucas Andrade da Silva"/>
        <FormField label="Apelido · como o coach vai te chamar" value="Lucas"/>
        <FormField label="Data de nascimento" value="14 / 03 / 1991"/>
        <FormField label="Sexo" value="Masculino"/>
        <FormField label="Estado civil" value="Casado"/>
        <FormField label="Cidade atual" value="Belo Horizonte / MG"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Filhos" value="Sim"/>
          <FormField label="Quantos" value="2"/>
        </div>
      </div>
      <div style={{ padding: '24px 16px 36px' }}>
        <OnbPrimary>Continuar</OnbPrimary>
      </div>
    </Screen>
  );
}

// ─── Bloco 2: Sua vida hoje ───
function ScreenOnbVida() {
  const top3 = ['fisica', 'familia', 'financas'];
  const Chip = ({ a, on }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 999,
      background: on ? T.input : 'transparent',
      border: `0.5px solid ${on ? a.color : T.border}`,
      fontSize: 13, fontWeight: 600, color: on ? T.text : T.weak,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: 4,
        background: a.color, opacity: on ? 1 : 0.45 }}/>
      {a.name}
    </div>
  );

  const Section = ({ label, children }) => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
        letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>
        {label}
      </div>
      {children}
    </div>
  );

  return (
    <Screen tab="hoje" noTabBar>
      <OnbHeader step={1} of={5} kicker="Bloco 2 · Diagnóstico"
        title="Sua vida hoje"
        sub="Sem suavização. O coach precisa do retrato real."/>
      <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <Section label="Suas 3 áreas mais importantes agora">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AREA_LIST.map((a, i) => <Chip key={i} a={a} on={top3.includes(a.id)}/>)}
          </div>
          <div style={{ fontSize: 11, color: T.weak, marginTop: 8, padding: '0 4px' }}>
            3 de 3 selecionadas
          </div>
        </Section>

        <Section label="Maus hábitos a eliminar">
          <div style={{ background: T.input, border: `0.5px solid ${T.border}`,
            borderRadius: 12, padding: '14px 16px', minHeight: 76,
            fontSize: 15, color: T.text, lineHeight: 1.5 }}>
            Açúcar refinado · scroll noturno no celular · adiar conversas difíceis
          </div>
        </Section>

        <Section label="Hábitos que ainda não tem e quer construir">
          <div style={{ background: T.input, border: `0.5px solid ${T.border}`,
            borderRadius: 12, padding: '14px 16px', minHeight: 76,
            fontSize: 15, color: T.text, lineHeight: 1.5 }}>
            Acordar 5h · escrever 30min/dia · 2 jejuns por semana · oração antes do celular
          </div>
        </Section>

        <Section label="Área onde você está mais travado">
          <FormField value="Saúde Emocional"/>
        </Section>

        <Section label="Quão longe está de quem sabe que pode ser">
          <div style={{ background: T.card, border: `0.5px solid ${T.border}`,
            borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: T.weak }}>1 = muito longe · 10 = sou ele</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: T.text,
                fontVariantNumeric: 'tabular-nums' }}>4</div>
            </div>
            <div style={{ position: 'relative', height: 24, marginTop: 8 }}>
              <div style={{ position: 'absolute', top: 10, left: 0, right: 0,
                height: 4, background: T.input, borderRadius: 2 }}/>
              <div style={{ position: 'absolute', top: 10, left: 0,
                width: '40%', height: 4, background: T.warn, borderRadius: 2 }}/>
              <div style={{ position: 'absolute', top: 0, left: 'calc(40% - 12px)',
                width: 24, height: 24, borderRadius: 12, background: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}/>
            </div>
          </div>
        </Section>

        <Section label="Maior obstáculo para manter constância">
          <div style={{ background: T.card, borderRadius: 14,
            border: `0.5px solid ${T.border}`, overflow: 'hidden' }}>
            <RadioRow label="Falta de tempo"/>
            <RadioRow label="Falta de disciplina" on/>
            <RadioRow label="Excesso de demandas"/>
            <RadioRow label="Falta de clareza"/>
            <RadioRow label="Desânimo"/>
            <RadioRow label="Outro" isLast/>
          </div>
        </Section>

        <Section label="Quantas vezes tentou mudar e não sustentou">
          <div style={{ background: T.card, borderRadius: 14,
            border: `0.5px solid ${T.border}`, overflow: 'hidden' }}>
            <RadioRow label="Nunca tentei"/>
            <RadioRow label="Tentei uma vez"/>
            <RadioRow label="Algumas vezes"/>
            <RadioRow label="Muitas vezes" on/>
            <RadioRow label="Perdi as contas" isLast/>
          </div>
        </Section>
      </div>
      <div style={{ padding: '0 16px 36px' }}>
        <OnbPrimary>Continuar</OnbPrimary>
      </div>
    </Screen>
  );
}

// ─── Bloco 3: Compromisso ───
function ScreenOnbCompromisso() {
  const P = ({ children }) => (
    <div style={{ fontSize: 15, color: T.text, opacity: 0.85,
      lineHeight: 1.55, marginTop: 14 }}>{children}</div>
  );
  return (
    <Screen tab="hoje" noTabBar>
      <OnbHeader step={2} of={5} kicker="Bloco 3 · Compromisso"
        title="Antes de começar."/>

      <div style={{ padding: '4px 28px 20px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text,
          lineHeight: 1.25, letterSpacing: -0.3, marginBottom: 14 }}>
          O App 1% não vai mudar sua vida.<br/>
          <span style={{ color: T.danger }}>Você vai.</span>
        </div>
        <div style={{ fontSize: 15, color: T.text, opacity: 0.85, lineHeight: 1.55 }}>
          Este app existe para um único propósito: ajudar você a organizar, visualizar
          e manter o processo de evolução constante que já está dentro de você.
        </div>
        <P>
          Resultados permanentes não vêm de decisões momentâneas. Vêm de pequenas
          ações repetidas todos os dias, com honestidade, consistência e propósito.
        </P>
        <P>
          Melhorar 1% por dia parece pouco. Mas em um ano, você será
          <span style={{ color: T.text, fontWeight: 700 }}> 37 vezes melhor</span> do que é hoje.
        </P>
        <P>
          O tempo vai passar de qualquer forma.<br/>
          A única pergunta é:
          <span style={{ color: T.text, fontWeight: 700 }}> o que você vai fazer com ele?</span>
        </P>
        <P>
          O app vai te acompanhar. Vai te lembrar. Vai te mostrar onde você está e para onde está indo.
        </P>
        <P>
          Mas a decisão —
          <span style={{ color: T.text, fontWeight: 700 }}> essa é sua. Sempre foi.</span>
        </P>
      </div>

      {/* Versículo */}
      <div style={{
        margin: '4px 16px 22px',
        background: T.card,
        borderLeft: `3px solid ${AREAS.espiritual.color}`,
        borderTop: `0.5px solid ${T.border}`,
        borderRight: `0.5px solid ${T.border}`,
        borderBottom: `0.5px solid ${T.border}`,
        borderRadius: '4px 14px 14px 4px',
        padding: '16px 20px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: AREAS.espiritual.color,
          letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Gálatas 6:9
        </div>
        <div style={{ fontSize: 15, color: T.text, lineHeight: 1.5, fontStyle: 'italic' }}>
          “Não nos cansemos de fazer o bem, pois a seu tempo colheremos,
          se não desanimarmos.”
        </div>
      </div>

      {/* Compromisso */}
      <div style={{ margin: '0 16px 16px', background: T.input,
        border: `0.5px solid ${T.border}`,
        borderRadius: 14, padding: '18px 20px',
        display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, marginTop: 2,
          background: T.success, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3 7.5 L6 10 L11 4" fill="none" stroke="#fff" strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ flex: 1, fontSize: 14, color: T.text, lineHeight: 1.5 }}>
          Eu me comprometo a ser <span style={{ fontWeight: 700 }}>honesto</span> comigo mesmo,
          <span style={{ fontWeight: 700 }}> consistente</span> no processo e
          <span style={{ fontWeight: 700 }}> aberto à mudança</span>.
        </div>
      </div>

      <div style={{ padding: '8px 16px 36px' }}>
        <OnbPrimary intense>Assumo esse compromisso</OnbPrimary>
      </div>
    </Screen>
  );
}

// ─── Onboarding 4: Áreas opcionais ───
function ScreenOnbAreas() {
  const opcionais = AREA_LIST.filter(a => a.opt);
  const states = { ministerio: true, amizades: true, intelectual: true, sabedoria: false };
  return (
    <Screen tab="hoje" noTabBar>
      <OnbHeader step={3} of={5} kicker="Bloco 4 · Áreas opcionais"
        title="Em quais você quer se medir?"
        sub="As 6 obrigatórias estão sempre ligadas. Pausar uma opcional libera depois — com confirmação."/>
      <div style={{ margin: '8px 16px', background: T.card, borderRadius: 14,
        border: `0.5px solid ${T.border}`, overflow: 'hidden' }}>
        {opcionais.map((a, i) => {
          const on = states[a.id];
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              borderBottom: i === opcionais.length-1 ? 'none' : `0.5px solid ${T.border}`,
            }}>
              <div style={{ width: 6, height: 28, background: a.color, borderRadius: 1 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{a.name}</div>
              </div>
              <div style={{
                width: 42, height: 26, borderRadius: 13,
                background: on ? T.success : T.input, position: 'relative',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11, background: '#fff',
                  position: 'absolute', top: 2, left: on ? 18 : 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ margin: '14px 16px 0', background: '#3A2811',
        border: `0.5px solid ${T.warn}`, borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.warn,
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          Sabedoria pausada
        </div>
        <div style={{ fontSize: 13, color: T.text, opacity: 0.85, lineHeight: 1.5 }}>
          <span style={{ fontStyle: 'italic' }}>“Wait, Naval Ravikant”</span> —
          quem não cultiva sabedoria toma decisões tributadas pelo presente urgente;
          cada ano sem reflexão composta vira uma decisão pior.
        </div>
      </div>
      <div style={{ padding: '24px 16px 36px' }}>
        <OnbPrimary>Continuar</OnbPrimary>
      </div>
    </Screen>
  );
}

// ─── Onboarding 5: Autoavaliação ───
function ScreenOnbAvaliacao() {
  const scores = {
    espiritual: 5, fisica: 4, familia: 7, trabalho: 6,
    emocional: 4, financas: 8, ministerio: 3, amizades: 4,
    intelectual: 6, sabedoria: 0,
  };
  const list = AREA_LIST.filter(a => a.id !== 'sabedoria');
  return (
    <Screen tab="hoje" noTabBar>
      <OnbHeader step={4} of={5} kicker="Bloco 5 · Autoavaliação"
        title="Onde você está hoje?"
        sub="0 = não existe. 10 = não dá pra melhorar. Seja honesto."/>
      <div style={{ padding: '8px 16px 24px',
        display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((a, i) => {
          const v = scores[a.id];
          return (
            <div key={i} style={{
              background: T.card, borderRadius: 14,
              border: `0.5px solid ${T.border}`, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 4, height: 18, background: a.color, borderRadius: 1 }}/>
                <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: T.text }}>
                  {a.name}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text,
                  fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
              <div style={{ position: 'relative', height: 24 }}>
                <div style={{ position: 'absolute', top: 10, left: 0, right: 0,
                  height: 4, background: T.input, borderRadius: 2 }}/>
                <div style={{ position: 'absolute', top: 10, left: 0,
                  width: `${v*10}%`, height: 4, background: a.color, borderRadius: 2 }}/>
                <div style={{ position: 'absolute', top: 0, left: `calc(${v*10}% - 12px)`,
                  width: 24, height: 24, borderRadius: 12, background: '#fff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '0 16px 36px' }}>
        <OnbPrimary>Começar</OnbPrimary>
      </div>
    </Screen>
  );
}

Object.assign(window, {
  ScreenLogin,
  ScreenOnbCadastro, ScreenOnbVida, ScreenOnbCompromisso,
  ScreenOnbAreas, ScreenOnbAvaliacao,
});
