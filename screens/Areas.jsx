// Areas.jsx — Aba Áreas + Detalhe + Alvo de Vida (light/pastel)

const AREAS_DATA = [
  { area: AREAS.espiritual,  pct: 72, habits: 3 },
  { area: AREAS.fisica,      pct: 88, habits: 4 },
  { area: AREAS.familia,     pct: 65, habits: 3 },
  { area: AREAS.trabalho,    pct: 80, habits: 5 },
  { area: AREAS.emocional,   pct: 55, habits: 2 },
  { area: AREAS.financas,    pct: 70, habits: 2 },
  { area: AREAS.ministerio,  pct: 60, habits: 2 },
  { area: AREAS.amizades,    pct: 45, habits: 2 },
  { area: AREAS.intelectual, pct: 62, habits: 3 },
  { area: AREAS.sabedoria,   paused: true },
];

// Card linha grande, estilo "Drink water" com chevron à direita
function AreaRow({ area, pct, habits, paused }) {
  return (
    <WaveCard bg={paused ? '#E5E0D2' : area.soft} style={{
      padding: '0 0 18px', opacity: paused ? 0.55 : 1,
    }}>
      <div style={{
        padding: '18px 20px 0',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 19,
          background: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: area.ink }}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 700,
            color: T.ink, letterSpacing: -0.2,
          }}>{area.name}</div>
          <div style={{ fontSize: 12, color: T.weak, marginTop: 2,
            fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {paused ? 'Pausada' : `${habits} hábitos · ${pct}% essa semana`}
          </div>
        </div>
        {!paused && <MiniRing pct={pct} color={area.ink} size={42} stroke={5}/>}
        <svg width="10" height="16" viewBox="0 0 10 16">
          <path d="M2 2 L8 8 L2 14" fill="none" stroke={T.ink} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
        </svg>
      </div>
    </WaveCard>
  );
}

function ScreenAreas({ state = 'good' }) {
  const data = state === 'bad' ? AREAS_DATA.map(d => ({
    ...d, pct: d.paused ? undefined : Math.max(0, (d.pct||0) - 50),
  })) : AREAS_DATA;
  return (
    <Screen tab="areas">
      <PageHeader greeting="Suas" name="10 áreas" right={
        <IconBtn>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 3 V13 M3 8 H13" stroke={T.ink} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </IconBtn>
      }/>

      {/* Botão Alvo de Vida */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{
          background: T.ink, color: T.bg,
          borderRadius: 22, padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke={T.bg} strokeWidth="1" opacity="0.4"/>
            <circle cx="18" cy="18" r="10" fill="none" stroke={T.bg} strokeWidth="1" opacity="0.5"/>
            <circle cx="18" cy="18" r="5" fill="none" stroke={T.bg} strokeWidth="1" opacity="0.7"/>
            <circle cx="18" cy="18" r="2" fill={T.bg}/>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700 }}>
              Alvo de Vida
            </div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
              Visão geral em 10 fatias
            </div>
          </div>
          <svg width="10" height="16" viewBox="0 0 10 16">
            <path d="M2 2 L8 8 L2 14" fill="none" stroke={T.bg} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div style={{ padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => <AreaRow key={i} {...d}/>)}
      </div>
    </Screen>
  );
}

// ─── Alvo de Vida (pizza 10 fatias, light) ───
function AlvoPizza({ data, size = 320 }) {
  const cx = size/2, cy = size/2;
  const outerR = size/2 - 10;
  const minR = 32;
  const slices = 10;
  return (
    <svg width={size} height={size}>
      {data.map((d, i) => {
        const a0 = (i / slices) * 2 * Math.PI - Math.PI/2;
        const a1 = ((i + 1) / slices) * 2 * Math.PI - Math.PI/2;
        const fillR = d.paused ? minR + 4 : minR + (outerR - minR) * (d.pct||0) / 100;

        const x0o = cx + Math.cos(a0)*fillR, y0o = cy + Math.sin(a0)*fillR;
        const x1o = cx + Math.cos(a1)*fillR, y1o = cy + Math.sin(a1)*fillR;
        const x0i = cx + Math.cos(a0)*minR, y0i = cy + Math.sin(a0)*minR;
        const x1i = cx + Math.cos(a1)*minR, y1i = cy + Math.sin(a1)*minR;
        const path = `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${fillR} ${fillR} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${minR} ${minR} 0 0 0 ${x0i} ${y0i} Z`;

        // Trilha externa
        const xb0 = cx + Math.cos(a0)*outerR, yb0 = cy + Math.sin(a0)*outerR;
        const xb1 = cx + Math.cos(a1)*outerR, yb1 = cy + Math.sin(a1)*outerR;
        const trilha = `M ${cx + Math.cos(a0)*minR} ${cy + Math.sin(a0)*minR}
          L ${xb0} ${yb0} A ${outerR} ${outerR} 0 0 1 ${xb1} ${yb1}
          L ${cx + Math.cos(a1)*minR} ${cy + Math.sin(a1)*minR}
          A ${minR} ${minR} 0 0 0 ${cx + Math.cos(a0)*minR} ${cy + Math.sin(a0)*minR} Z`;

        return (
          <g key={i}>
            <path d={trilha} fill={d.area.soft} opacity="0.5"/>
            <path d={path} fill={d.area.ink} opacity={d.paused ? 0.25 : 0.92}/>
            <line x1={cx + Math.cos(a0)*minR} y1={cy + Math.sin(a0)*minR}
              x2={cx + Math.cos(a0)*outerR} y2={cy + Math.sin(a0)*outerR}
              stroke={T.bg} strokeWidth="2"/>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={minR-2} fill={T.bg}/>
    </svg>
  );
}

function ScreenAlvo({ state = 'good' }) {
  const data = state === 'bad' ? AREAS_DATA.map(d => ({
    ...d, pct: d.paused ? undefined : Math.max(0, (d.pct||0) - 50),
  })) : AREAS_DATA;
  const ativos = data.filter(d => !d.paused);
  const total = Math.round(ativos.reduce((s,d) => s + (d.pct||0), 0) / ativos.length);
  const f = faixaFor(total);

  return (
    <Screen tab="areas">
      <BackBar/>
      <SectionHeader title="Alvo de Vida"/>

      <div style={{ position: 'relative', display: 'flex',
        justifyContent: 'center', margin: '8px 0 16px' }}>
        <AlvoPizza data={data}/>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', textAlign: 'center',
        }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700,
            color: T.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {total}<span style={{ fontSize: 14, color: T.weak }}>%</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: f.ink,
            letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 }}>
            {f.label}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'grid',
        gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{
            background: T.card, borderRadius: 16,
            border: `1px solid ${T.border}`,
            padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: 5,
              background: d.area.ink, flexShrink: 0 }}/>
            <div style={{ flex: 1, fontSize: 12, color: T.ink, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.area.name}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700,
              color: d.paused ? T.weak : T.ink,
              fontVariantNumeric: 'tabular-nums' }}>
              {d.paused ? '—' : `${d.pct}%`}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

// ─── Detalhe da Área ───
function ScreenAreaDetail({ state = 'good' }) {
  const isGood = state === 'good';
  const area = isGood ? AREAS.fisica : AREAS.espiritual;
  const pct = isGood ? 88 : 12;
  const week = isGood ? [70,75,68,82,78,90,88] : [25,18,12,10,5,0,0];
  const habits = isGood ? [
    { title: 'Treino · força',     type: 'bars', value: '5', unit: 'sessões', data: [3,4,2,5,4,5,5] },
    { title: 'Caminhar 20min',     type: 'wave', value: '7',  unit: 'dias',    data: [1,1,1,1,1,1,1] },
    { title: 'Alongamento',        type: 'semi', pct: 60,    value: '4', unit: 'de 7' },
    { title: 'Pesar-se (sem)',     type: 'bars', value: '1',  unit: 'sem',     data: [1,1,1,1,1,1,1] },
  ] : [
    { title: 'Oração matinal',     type: 'bars', value: '0', unit: 'dias',    data: [3,2,1,1,0,0,0] },
    { title: 'Leitura bíblica',    type: 'wave', value: '0',  unit: 'min',     data: [10,8,5,3,2,0,0] },
    { title: 'Devocional',         type: 'semi', pct: 0,     value: '0', unit: 'de 7' },
  ];

  return (
    <Screen tab="areas">
      <BackBar/>

      {/* Header com cor da área */}
      <div style={{ padding: '4px 24px 0' }}>
        <div style={{
          display: 'inline-block',
          background: area.soft, color: area.ink,
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase',
          padding: '5px 10px', borderRadius: 12,
        }}>
          área {area.opt ? 'opcional' : 'obrigatória'}
        </div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6, marginTop: 12, lineHeight: 1.05,
        }}>{area.name}</div>
      </div>

      {/* Anel central */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
        <BigRing pct={pct} size={196} stroke={20} color={area.ink}/>
      </div>

      {/* Resumo semana mini */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{
          background: T.card, borderRadius: 22,
          border: `1px solid ${T.border}`, padding: '14px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
              textTransform: 'uppercase', letterSpacing: 1 }}>
              Esta semana
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: area.ink,
              fontVariantNumeric: 'tabular-nums' }}>
              {isGood ? '+12%' : '−18%'}
            </div>
          </div>
          <MiniBars data={week} color={area.ink} width={326} height={70}/>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            marginTop: 8, fontSize: 10, color: T.weak, fontWeight: 600 }}>
            {['M','T','Q','Q','S','S','D'].map((d,i) => <span key={i}>{d}</span>)}
          </div>
        </div>
      </div>

      {/* Hábitos da área (grid 2 cols) */}
      <div style={{ padding: '0 24px 8px',
        fontSize: 11, fontWeight: 700, color: T.weak,
        textTransform: 'uppercase', letterSpacing: 1 }}>
        Hábitos
      </div>
      <div style={{ padding: '0 16px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {habits.map((h, i) => (
          <HabitCard key={i} habit={h} area={area}/>
        ))}
      </div>

      {/* Meta */}
      <div style={{ padding: '20px 24px 8px',
        fontSize: 11, fontWeight: 700, color: T.weak,
        textTransform: 'uppercase', letterSpacing: 1 }}>
        Meta do ano
      </div>
      <div style={{ padding: '0 16px' }}>
        <div style={{
          background: T.card, borderRadius: 22,
          border: `1px solid ${T.border}`, padding: '16px 18px',
        }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700, color: T.ink }}>
            {isGood ? 'Treinar 150x este ano' : 'Ler a Bíblia em 1 ano'}
          </div>
          <div style={{ fontSize: 12, color: T.weak, marginTop: 4 }}>
            {isGood ? '87 / 150' : '38 / 365'}
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 4,
            marginTop: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: isGood ? '58%' : '10%',
              background: area.ink, borderRadius: 4,
            }}/>
          </div>
          <div style={{
            marginTop: 10, fontSize: 12, color: isGood ? area.ink : '#B5524A',
            fontWeight: 600,
          }}>
            {isGood
              ? 'No ritmo: termina 12 dias antes.'
              : 'No ritmo: termina 142 dias atrasado.'}
          </div>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { ScreenAreas, ScreenAlvo, ScreenAreaDetail, AREAS_DATA });
