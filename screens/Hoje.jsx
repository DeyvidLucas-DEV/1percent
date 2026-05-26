// Hoje.jsx — Tela inicial (light/pastel)

// Card de hábito com topo em onda + mini gráfico
function HabitCard({ habit, area }) {
  const { title, type, value, unit, data, pct } = habit;
  return (
    <WaveCard bg={area.soft} style={{ padding: '0 0 14px', minHeight: 168 }}>
      <div style={{ padding: '14px 16px 8px', display: 'flex',
        alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: area.ink }}/>
        </div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 700, color: T.ink,
        }}>{title}</div>
      </div>
      <div style={{ padding: '8px 16px 0',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        height: 88,
      }}>
        {type === 'bars' && <MiniBars data={data} color={area.ink}/>}
        {type === 'wave' && <MiniWave data={data} color={area.ink}/>}
        {type === 'semi' && <MiniSemiRing pct={pct} color={area.ink} value={value} unit={unit}/>}
      </div>
      {(value && type !== 'semi') && (
        <div style={{ padding: '6px 16px 0',
          display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, color: T.ink,
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>{value}</div>
          <div style={{ fontSize: 11, color: T.weak, fontWeight: 600 }}>{unit}</div>
        </div>
      )}
    </WaveCard>
  );
}

function ScreenHoje({ state = 'base' }) {
  const baseHabits = [
    { area: AREAS.fisica,      title: 'Caminhar',      type: 'wave', value: '5.2',  unit: 'km',     data: [3,4,2,5,4,6,5] },
    { area: AREAS.espiritual,  title: 'Oração',        type: 'semi', value: '15',   unit: 'min',    pct: 75 },
    { area: AREAS.intelectual, title: 'Ler',           type: 'bars', value: '30',   unit: 'pgs',    data: [10,18,22,14,28,16,30] },
    { area: AREAS.financas,    title: 'Sem comprar',   type: 'bars', value: '4',    unit: 'dias',   data: [2,3,1,4,3,5,4] },
    { area: AREAS.familia,     title: 'Tempo família', type: 'semi', value: '1',    unit: 'hora',   pct: 50 },
    { area: AREAS.emocional,   title: 'Meditar',       type: 'wave', value: '12',   unit: 'min',    data: [5,8,4,12,10,15,12] },
  ];
  const goodHabits = baseHabits.map(h => ({ ...h, value: typeof h.value === 'string' ? h.value : h.value }));
  const badHabits = [
    { ...baseHabits[0], value: '0',  data: [3,2,1,1,0,0,0] },
    { ...baseHabits[1], pct: 0, value: '0' },
    { ...baseHabits[2], value: '0', data: [8,6,4,2,0,0,0] },
    { ...baseHabits[3], value: '0', data: [3,2,1,1,0,0,0] },
    { ...baseHabits[4], pct: 0, value: '0' },
    { ...baseHabits[5], value: '0', data: [5,3,2,1,0,0,0] },
  ];
  const habits = state === 'good' ? goodHabits : state === 'bad' ? badHabits : baseHabits;
  const dayPct = state === 'good' ? 78 : state === 'bad' ? 12 : 47;
  const greeting = state === 'bad' ? 'Cadê você' : 'Bom dia';

  const week = [
    { dow: 'Mon', num: '04' },
    { dow: 'Tue', num: '05' },
    { dow: 'Wed', num: '06' },
    { dow: 'Thu', num: '07' },
    { dow: 'Fri', num: '08' },
    { dow: 'Sat', num: '09' },
    { dow: 'Sun', num: '10' },
  ];

  return (
    <Screen tab="home">
      <PageHeader
        greeting={greeting}
        name="Lucas"
        right={
          <>
            <IconBtn>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <circle cx="7" cy="7" r="5" stroke={T.ink} strokeWidth="1.6" fill="none"/>
                <path d="M11 11 L14 14" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </IconBtn>
            <IconBtn>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M3 6 a5 5 0 0 1 10 0 v4 l1.5 2 H1.5 L3 10 Z" stroke={T.ink}
                  strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
                <path d="M6 13 a2 2 0 0 0 4 0" stroke={T.ink} strokeWidth="1.6" fill="none"/>
              </svg>
            </IconBtn>
          </>
        }
      />

      {/* Day pills */}
      <div style={{ padding: '0 16px 22px' }}>
        <DayPills days={week} selected={4}/>
      </div>

      <SectionHeader
        title={'Destaques\nde hoje'}
        action="Todas"
      />

      {/* Grid 2 colunas */}
      <div style={{
        padding: '0 16px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        {habits.map((h, i) => <HabitCard key={i} habit={h} area={h.area}/>)}
      </div>

      {/* Anel resumo do dia */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{
          background: T.card, borderRadius: 28,
          padding: '20px 20px',
          display: 'flex', alignItems: 'center', gap: 18,
          border: `1px solid ${T.border}`,
        }}>
          <BigRing pct={dayPct} size={120} stroke={14} sublabel={false}/>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700,
              color: T.ink, letterSpacing: -0.3,
            }}>
              {state === 'good' ? 'Construção'
                : state === 'bad' ? 'Estagnação'
                : 'Movimento'}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: T.weak,
              lineHeight: 1.4, textWrap: 'pretty', maxWidth: 180 }}>
              {state === 'good' ? '4 de 6 áreas no verde. Streak: 21 dias.'
                : state === 'bad' ? '1 de 6 áreas tocadas. 2 dias sem mínimo.'
                : 'Meio do caminho. 3 áreas ainda zeradas.'}
            </div>
          </div>
        </div>
      </div>

      {state === 'bad' && (
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{
            background: '#F2D8D2', borderRadius: 22,
            padding: '14px 16px',
            border: `1px solid ${T.borderD}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8B3328',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Mediocridade subindo
            </div>
            <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.4 }}>
              2 dias seguidos abaixo de 30%. Marque ao menos 1 tarefa hoje.
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

Object.assign(window, { ScreenHoje, HabitCard });
