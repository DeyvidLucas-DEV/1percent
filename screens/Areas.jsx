// Areas.jsx — Aba Áreas + Alvo de Vida + Detalhe da Área

const AREAS_DATA_GOOD = [
  { area: AREAS.espiritual,  pctDay: 80, pct7d: 72 },
  { area: AREAS.fisica,      pctDay: 92, pct7d: 78 },
  { area: AREAS.familia,     pctDay: 70, pct7d: 65 },
  { area: AREAS.trabalho,    pctDay: 75, pct7d: 80 },
  { area: AREAS.emocional,   pctDay: 60, pct7d: 55 },
  { area: AREAS.financas,    pctDay: 88, pct7d: 70 },
  { area: AREAS.ministerio,  pctDay: 50, pct7d: 60 },
  { area: AREAS.amizades,    pctDay: 40, pct7d: 45 },
  { area: AREAS.intelectual, pctDay: 70, pct7d: 62 },
  { area: AREAS.sabedoria,   pctDay: 55, pct7d: 50 },
];

const AREAS_DATA_BAD = [
  { area: AREAS.espiritual,  pctDay: 0,  pct7d: 18 },
  { area: AREAS.fisica,      pctDay: 0,  pct7d: 22 },
  { area: AREAS.familia,     pctDay: 33, pct7d: 30 },
  { area: AREAS.trabalho,    pctDay: 25, pct7d: 35 },
  { area: AREAS.emocional,   pctDay: 0,  pct7d: 12 },
  { area: AREAS.financas,    pctDay: 50, pct7d: 40 },
  { area: AREAS.ministerio,  paused: true },
  { area: AREAS.amizades,    pctDay: 0,  pct7d: 8 },
  { area: AREAS.intelectual, pctDay: 0,  pct7d: 15 },
  { area: AREAS.sabedoria,   pctDay: 0,  pct7d: 20 },
];

function AreaCard({ area, pctDay, pct7d, paused }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: T.card, borderRadius: 14,
      border: `0.5px solid ${T.border}`, overflow: 'hidden',
      opacity: paused ? 0.45 : 1,
    }}>
      <div style={{ width: 4, background: area.color }}/>
      <div style={{
        flex: 1, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>
            {area.name}
          </div>
          <div style={{
            marginTop: 4, fontSize: 12, color: T.weak,
            display: 'flex', gap: 10, fontVariantNumeric: 'tabular-nums',
          }}>
            {paused ? (
              <span style={{ color: T.warn, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                Pausada
              </span>
            ) : (
              <>
                <span>{pctDay}% dia</span>
                <span style={{ color: '#5a5e6a' }}>·</span>
                <span>{pct7d}% 7d</span>
              </>
            )}
          </div>
        </div>
        {!paused && <MiniRing pct={pctDay} baseColor={area.color}/>}
        {!paused && (
          <svg width="8" height="14" viewBox="0 0 8 14" style={{ marginLeft: 4 }}>
            <path d="M1 1 L7 7 L1 13" fill="none" stroke={T.weak} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
          </svg>
        )}
      </div>
    </div>
  );
}

function ScreenAreas({ state = 'good' }) {
  const data = state === 'good' ? AREAS_DATA_GOOD : AREAS_DATA_BAD;
  return (
    <Screen tab="areas">
      <PageHeader kicker="suas dimensões" title="Áreas"/>

      {/* Botão Alvo de Vida */}
      <div style={{ padding: '14px 16px 18px' }}>
        <div style={{
          background: T.card, borderRadius: 14,
          border: `0.5px solid ${T.border}`,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke={T.border} strokeWidth="1"/>
            {[0,1,2,3,4,5,6,7,8,9].map(i => {
              const a = (i * 36 - 90) * Math.PI/180;
              return <line key={i} x1="18" y1="18"
                x2={18 + Math.cos(a)*16} y2={18 + Math.sin(a)*16}
                stroke={T.border} strokeWidth="0.5"/>;
            })}
            <circle cx="18" cy="18" r="2" fill={T.accent}/>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
              Alvo de Vida
            </div>
            <div style={{ fontSize: 12, color: T.weak, marginTop: 2 }}>
              Visão geral em 10 fatias
            </div>
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14">
            <path d="M1 1 L7 7 L1 13" fill="none" stroke={T.weak} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Lista das 10 áreas */}
      <div style={{
        padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {data.map((d, i) => <AreaCard key={i} {...d}/>)}
      </div>
    </Screen>
  );
}

// ─── Alvo de Vida (pizza/donut de 10 fatias) ───
function AlvoPizza({ data, size = 320 }) {
  const cx = size/2, cy = size/2;
  const outerR = size/2 - 8;
  const minR = 30;
  const slices = 10;

  return (
    <svg width={size} height={size}>
      {/* trilha externa marcada por área */}
      {data.map((d, i) => {
        const a0 = (i / slices) * 2 * Math.PI - Math.PI/2;
        const a1 = ((i + 1) / slices) * 2 * Math.PI - Math.PI/2;
        const fillR = d.paused ? minR : minR + (outerR - minR) * (d.pctDay || 0) / 100;
        const faixaC = d.paused ? T.input : faixaFor(d.pctDay).color;

        // arc path (anel preenchido até fillR)
        const x0o = cx + Math.cos(a0)*fillR, y0o = cy + Math.sin(a0)*fillR;
        const x1o = cx + Math.cos(a1)*fillR, y1o = cy + Math.sin(a1)*fillR;
        const x0i = cx + Math.cos(a0)*minR, y0i = cy + Math.sin(a0)*minR;
        const x1i = cx + Math.cos(a1)*minR, y1i = cy + Math.sin(a1)*minR;
        const path = `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${fillR} ${fillR} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${minR} ${minR} 0 0 0 ${x0i} ${y0i} Z`;

        // borda externa (cor base da área)
        const xb0 = cx + Math.cos(a0)*outerR, yb0 = cy + Math.sin(a0)*outerR;
        const xb1 = cx + Math.cos(a1)*outerR, yb1 = cy + Math.sin(a1)*outerR;
        const borderPath = `M ${xb0} ${yb0} A ${outerR} ${outerR} 0 0 1 ${xb1} ${yb1}`;

        return (
          <g key={i}>
            <path d={path} fill={faixaC} opacity={d.paused ? 0.4 : 1}/>
            <path d={borderPath} fill="none" stroke={d.area.color} strokeWidth="3" strokeLinecap="butt"/>
            <line x1={cx + Math.cos(a0)*minR} y1={cy + Math.sin(a0)*minR}
              x2={cx + Math.cos(a0)*outerR} y2={cy + Math.sin(a0)*outerR}
              stroke={T.bg} strokeWidth="1"/>
          </g>
        );
      })}
      {/* círculo central */}
      <circle cx={cx} cy={cy} r={minR-2} fill={T.bg}/>
      <circle cx={cx} cy={cy} r={minR-2} fill="none" stroke={T.border} strokeWidth="0.5"/>
    </svg>
  );
}

function ScreenAlvo({ state = 'good' }) {
  const data = state === 'good' ? AREAS_DATA_GOOD : AREAS_DATA_BAD;
  const total = Math.round(
    data.filter(d => !d.paused).reduce((s,d) => s + (d.pctDay || 0), 0)
    / data.filter(d => !d.paused).length
  );
  const faixa = faixaFor(total);

  return (
    <Screen tab="areas">
      <BackBar action="Áreas"/>
      <PageHeader kicker="visão geral" title="Alvo de Vida"/>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginTop: 8, marginBottom: 16, position: 'relative',
      }}>
        <AlvoPizza data={data} size={320}/>
        {/* total no centro */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', textAlign: 'center',
        }}>
          <div style={{
            fontSize: 30, fontWeight: 800, color: faixa.color, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{total}<span style={{ fontSize: 14 }}>%</span></div>
          <div style={{ fontSize: 9, fontWeight: 700, color: faixa.color,
            letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4 }}>
            {faixa.label}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div style={{
        margin: '0 16px', background: T.card, borderRadius: 14,
        border: `0.5px solid ${T.border}`, padding: '10px 4px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 4,
      }}>
        {data.map((d, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: 2,
              background: d.area.color, flexShrink: 0 }}/>
            <div style={{ flex: 1, fontSize: 12, color: T.text, minWidth: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.area.name}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: d.paused ? T.weak : faixaFor(d.pctDay).color,
              fontVariantNumeric: 'tabular-nums',
            }}>{d.paused ? '—' : `${d.pctDay}%`}</div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

// ─── Detalhe da Área ───
function MiniSparkline({ data, color, height = 110 }) {
  const max = 100;
  const w = 326;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i*step},${height - (v/max)*(height-10) - 5}`).join(' ');
  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      {/* faixas de fundo */}
      {[20, 40, 60, 80, 100].map((th, i) => {
        const colors = ['#6B4F2A', '#B5391C', '#C7A52E', '#2E8B57', '#1F6FB2'];
        const prev = i === 0 ? 0 : [20,40,60,80][i-1];
        return <rect key={i} x="0" y={height - (th/max)*(height-10) - 5}
          width={w} height={(th-prev)/max*(height-10)}
          fill={colors[i]} opacity="0.06"/>;
      })}
      {/* eixos discretos */}
      <line x1="0" y1={height-5} x2={w} y2={height-5} stroke={T.border} strokeWidth="0.5"/>
      {/* linha */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
      {/* últimos pontos */}
      {data.map((v, i) => (
        <circle key={i} cx={i*step} cy={height - (v/max)*(height-10) - 5}
          r={i === data.length-1 ? 3 : 1.5} fill={color}/>
      ))}
    </svg>
  );
}

function ScreenAreaDetail({ state = 'good' }) {
  const isGood = state === 'good';
  const area = isGood ? AREAS.fisica : AREAS.espiritual;
  const pct = isGood ? 92 : 0;
  const seven = isGood
    ? [70, 78, 65, 80, 75, 82, 92]
    : [25, 18, 12, 10, 5, 0, 0];

  // 4 semanas
  const monthData = isGood
    ? [55, 60, 65, 60, 70, 72, 68, 78, 82, 75, 80, 78, 85, 92, 88, 75, 80, 92, 78, 85, 82, 78, 92, 88, 90, 78, 80, 92]
    : [40, 35, 28, 30, 22, 18, 15, 20, 18, 25, 12, 8, 5, 12, 18, 8, 5, 0, 10, 15, 8, 0, 5, 12, 0, 0, 0, 0];

  const tasks = isGood ? [
    { time: '06:30', title: 'Treino · força',         status: 'done',  weight: 3 },
    { time: '12:00', title: 'Caminhada 20min',        status: 'done',  weight: 1 },
    { time: '21:30', title: 'Alongamento',            status: 'open',  weight: 1 },
    { time: null,    title: 'Pesar-se (semanal)',     status: 'done',  weight: 1 },
  ] : [
    { time: '06:00', title: 'Oração matinal',         status: 'fail',  weight: 3 },
    { time: '07:00', title: 'Leitura bíblica',        status: 'fail',  weight: 2 },
    { time: '21:00', title: 'Devocional',             status: 'open',  weight: 2, late: true },
  ];

  return (
    <Screen tab="areas">
      <BackBar action="Áreas"/>

      {/* Header com cor-base como faixa */}
      <div style={{ padding: '0 24px' }}>
        <div style={{
          width: 6, height: 28, background: area.color,
          borderRadius: 3, marginBottom: 10,
        }}/>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>
          área {area.opt ? 'opcional' : 'obrigatória'}
        </div>
        <div style={{
          fontSize: 28, fontWeight: 800, color: T.text,
          letterSpacing: -0.4, marginTop: 4, lineHeight: 1.05,
        }}>{area.name}</div>
      </div>

      {/* Anel da área */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 14px' }}>
        <BigRing pct={pct} size={196}/>
      </div>

      {/* 7d % + média */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px', marginBottom: 22 }}>
        <StatCard label="7d %" value={`${seven[seven.length-1]}%`} sub="hoje"/>
        <StatCard label="Média 4sem" value={`${Math.round(monthData.reduce((a,b)=>a+b,0)/monthData.length)}%`}/>
        <StatCard label="Tendência" value={isGood ? '+12%' : '−18%'} sub="vs anterior"/>
      </div>

      {/* Gráfico 4 semanas */}
      <div style={{ padding: '0 20px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
          Últimas 4 semanas
        </div>
      </div>
      <div style={{ margin: '0 16px 22px', background: T.card,
        borderRadius: 14, border: `0.5px solid ${T.border}`, padding: 16 }}>
        <MiniSparkline data={monthData} color={area.color}/>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          marginTop: 6, fontSize: 10, color: T.weak,
          fontVariantNumeric: 'tabular-nums' }}>
          <span>4sem atrás</span><span>3sem</span><span>2sem</span><span>1sem</span><span>hoje</span>
        </div>
      </div>

      {/* Tarefas */}
      <div style={{ padding: '0 20px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Tarefas
        </div>
      </div>
      <div style={{ margin: '0 16px 22px', background: T.card,
        borderRadius: 16, border: `0.5px solid ${T.border}`, overflow: 'hidden' }}>
        {tasks.map((t, i) => (
          <TaskRow key={i} {...t} area={area.color} isLast={i === tasks.length-1}/>
        ))}
      </div>

      {/* Meta relacionada */}
      <div style={{ padding: '0 20px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Meta
        </div>
      </div>
      <div style={{ margin: '0 16px 22px', background: T.card,
        borderRadius: 14, border: `0.5px solid ${T.border}`, padding: '16px 18px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>
          {isGood ? 'Treinar 150x este ano' : 'Ler a Bíblia em 1 ano'}
        </div>
        <div style={{ fontSize: 12, color: T.weak, marginTop: 4 }}>
          {isGood ? '87 / 150' : '38 / 365'} · prazo {isGood ? '31 dez' : '31 dez'}
        </div>
        {/* barra */}
        <div style={{ height: 6, background: T.input, borderRadius: 3,
          marginTop: 12, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: isGood ? '58%' : '10%',
            background: isGood ? T.success : T.danger,
          }}/>
        </div>
        <div style={{
          marginTop: 10, fontSize: 13, color: isGood ? T.success : T.danger,
          fontWeight: 600,
        }}>
          {isGood
            ? 'No ritmo atual: termina 12 dias antes.'
            : 'No ritmo atual: termina 142 dias atrasado.'}
        </div>
      </div>

      {/* Botão pausar (só opcionais) — área é obrigatória aqui, então omito */}
    </Screen>
  );
}

Object.assign(window, { ScreenAreas, ScreenAlvo, ScreenAreaDetail });
