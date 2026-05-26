// Insights.jsx — Analytics + Calendário + Detalhe do Dia (light/pastel)

const MONTH_GOOD = [42,55,38,62,71,68,72,80,75,82,78,65,72,82,88,75,80,72,68,75,82,88,80,75,82,88,72,80,85,78];
const MONTH_BAD  = [55,42,38,30,28,22,18,12,8,15,22,18,12,5,8,12,18,22,15,8,5,0,0,8,12,5,0,12,8,12];

function MonthLineChart({ data, height = 180, color = '#1B1A17' }) {
  const w = 326;
  const max = 100;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i*step, height - (v/max)*(height-20) - 10]);

  // Smooth path
  let line = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i-1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    line += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  // Area
  const area = line + ` L ${w} ${height} L 0 ${height} Z`;

  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="grad-month" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18"/>
          <stop offset="1" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad-month)"/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x,y], i) => i === pts.length - 1 && (
        <circle key={i} cx={x} cy={y} r="4.5" fill={color}/>
      ))}
    </svg>
  );
}

// Score Ring multi-coloridos (estilo "9.0 your goal's score")
function GoalScoreRing({ data, score, size = 240 }) {
  const cx = size/2, cy = size/2;
  const outerR = size/2 - 18;
  const innerR = outerR - 36;
  const slices = data.length;
  return (
    <svg width={size} height={size}>
      {data.map((d, i) => {
        const a0 = (i / slices) * 2 * Math.PI - Math.PI/2 + 0.04;
        const a1 = ((i + 1) / slices) * 2 * Math.PI - Math.PI/2 - 0.04;

        const x0o = cx + Math.cos(a0)*outerR, y0o = cy + Math.sin(a0)*outerR;
        const x1o = cx + Math.cos(a1)*outerR, y1o = cy + Math.sin(a1)*outerR;
        const x0i = cx + Math.cos(a0)*innerR, y0i = cy + Math.sin(a0)*innerR;
        const x1i = cx + Math.cos(a1)*innerR, y1i = cy + Math.sin(a1)*innerR;
        const path = `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${outerR} ${outerR} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 0 0 ${x0i} ${y0i} Z`;
        return <path key={i} d={path} fill={d.color} opacity="0.85"/>;
      })}
      <text x={cx} y={cy-2} textAnchor="middle"
        style={{ fontFamily: T.fontDisplay, fontSize: 38, fontWeight: 700, fill: T.ink }}>
        {score}
      </text>
      <text x={cx} y={cy+18} textAnchor="middle"
        style={{ fontSize: 11, fill: T.weak, fontWeight: 600 }}>
        Seu score do mês
      </text>
    </svg>
  );
}

function CalendarGrid({ data, color = '#3D6FA3' }) {
  const offset = 2;
  const cells = [...Array(offset).fill(null), ...data];
  const dows = ['M','T','W','T','F','S','S'];
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 6, marginBottom: 8,
      }}>
        {dows.map((d, i) => (
          <div key={i} style={{ fontSize: 10, fontWeight: 700,
            color: T.weak, textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((v, i) => {
          if (v === null) return <div key={i}/>;
          const intensity = v/100;
          return (
            <div key={i} style={{
              aspectRatio: '1/1',
              background: color,
              opacity: 0.15 + intensity * 0.75,
              borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: intensity > 0.5 ? '#fff' : T.ink,
              fontVariantNumeric: 'tabular-nums',
            }}>{i + 1 - offset}</div>
          );
        })}
      </div>
    </div>
  );
}

function ScreenInsights({ state = 'good' }) {
  const data = state === 'good' ? MONTH_GOOD : MONTH_BAD;
  const monthAvg = Math.round(data.reduce((a,b)=>a+b,0)/data.length);
  const f = faixaFor(monthAvg);
  const score = (monthAvg / 10).toFixed(1);

  const scoreData = AREA_LIST.filter(a => a.id !== 'sabedoria').map(a => ({
    color: a.ink,
  }));

  return (
    <Screen tab="insights">
      <PageHeader greeting="Seu" name="progresso" right={
        <div style={{
          display: 'flex', background: T.card,
          border: `1px solid ${T.border}`, borderRadius: 999, padding: 4,
          gap: 2,
        }}>
          {['Hoje','Semana','Mês'].map((p, i) => (
            <div key={p} style={{
              padding: '6px 12px', borderRadius: 999,
              fontSize: 11, fontWeight: 700,
              background: i === 2 ? T.ink : 'transparent',
              color: i === 2 ? T.bg : T.weak,
            }}>{p}</div>
          ))}
        </div>
      }/>

      {/* Score ring multicolor */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 16px' }}>
        <GoalScoreRing data={scoreData} score={score}/>
      </div>

      {/* Mês line chart */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: T.card, borderRadius: 24,
          border: `1px solid ${T.border}`, padding: '16px 16px 10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
                textTransform: 'uppercase', letterSpacing: 1 }}>Média do mês</div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700,
                color: T.ink, marginTop: 2,
                fontVariantNumeric: 'tabular-nums' }}>
                {monthAvg}<span style={{ fontSize: 14, color: T.weak }}>%</span>
              </div>
            </div>
            <div style={{
              background: f.soft, color: f.ink,
              fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
              textTransform: 'uppercase',
              padding: '5px 10px', borderRadius: 12,
            }}>{f.label}</div>
          </div>
          <MonthLineChart data={data} color={f.ink}/>
        </div>
      </div>

      {/* Calendário */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: T.card, borderRadius: 24,
          border: `1px solid ${T.border}`, padding: '16px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Maio 2026
          </div>
          <CalendarGrid data={data} color={T.ink}/>
        </div>
      </div>

      {/* Áreas top/bottom */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: T.card, borderRadius: 24,
          border: `1px solid ${T.border}`, padding: '16px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Áreas
          </div>
          {AREA_LIST.slice(0, 6).map((a, i) => {
            const v = state === 'good' ? [88,82,75,72,65,55][i] : [35,28,22,18,12,8][i];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: i < 5 ? 12 : 0,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: a.ink }}/>
                <div style={{ flex: 1, fontSize: 13, color: T.ink, fontWeight: 600 }}>
                  {a.name}
                </div>
                <div style={{ width: 120, height: 6, background: 'rgba(0,0,0,0.06)',
                  borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${v}%`, height: '100%',
                    background: a.ink, borderRadius: 3 }}/>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.ink,
                  fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
                  {v}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Padrão */}
      <div style={{ padding: '0 16px 12px' }}>
        <WaveCard bg={'#F2DFA0'} style={{ padding: '0 0 16px' }}>
          <div style={{ padding: '14px 18px 4px',
            fontSize: 11, fontWeight: 700, color: '#8A6638',
            textTransform: 'uppercase', letterSpacing: 1 }}>
            Padrão detectado
          </div>
          <div style={{ padding: '4px 18px',
            fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 700, color: T.ink,
            lineHeight: 1.3 }}>
            {state === 'good'
              ? 'Você falha mais às terças. Domingo, ritmo cai 18%.'
              : 'Você falha mais às terças. Domingo, ritmo cai 40%.'}
          </div>
        </WaveCard>
      </div>
    </Screen>
  );
}

function ScreenDayDetail({ state = 'good' }) {
  const isGood = state === 'good';
  const pct = isGood ? 78 : 12;
  const date = isGood ? 'qua, 6 mai' : 'qui, 7 mai';
  const habits = isGood ? [
    { area: AREAS.espiritual, title: 'Oração matinal',     done: true,  time: '05:30' },
    { area: AREAS.fisica,     title: 'Treino · força',     done: true,  time: '06:30' },
    { area: AREAS.trabalho,   title: 'Bloco profundo',     done: true,  time: '09:00' },
    { area: AREAS.familia,    title: 'Almoço com Ana',     done: true,  time: '12:30' },
    { area: AREAS.familia,    title: 'Devocional família', done: false, time: '18:00' },
    { area: AREAS.intelectual, title: 'Leitura · 30min',   done: false, time: '21:00' },
  ] : [
    { area: AREAS.espiritual, title: 'Oração matinal',     done: false, time: '06:00' },
    { area: AREAS.fisica,     title: 'Treino',             done: false, time: '07:00' },
    { area: AREAS.trabalho,   title: 'Bloco profundo',     done: false, time: '09:00' },
    { area: AREAS.familia,    title: 'Almoço com Ana',     done: true,  time: '12:30' },
    { area: AREAS.familia,    title: 'Devocional família', done: false, time: '18:00' },
  ];

  return (
    <Screen tab="insights">
      <BackBar/>
      <div style={{ padding: '4px 24px 0' }}>
        <div style={{ fontSize: 12, color: T.weak, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 1 }}>{date}</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700,
          color: T.ink, marginTop: 4 }}>Detalhe do dia</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <BigRing pct={pct} size={196} stroke={20}/>
      </div>

      <div style={{ padding: '0 16px',
        display: 'flex', flexDirection: 'column', gap: 8 }}>
        {habits.map((h, i) => (
          <div key={i} style={{
            background: h.done ? h.area.soft : T.card,
            borderRadius: 18, padding: '12px 16px',
            border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 12,
              background: h.done ? h.area.ink : 'transparent',
              border: h.done ? 'none' : `1.5px solid ${T.borderD}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {h.done && (
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M3 7.5 L6 10 L11 4" fill="none" stroke="#fff"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink,
                textDecoration: h.done ? 'line-through' : 'none',
                textDecorationColor: 'rgba(0,0,0,0.3)' }}>
                {h.title}
              </div>
              <div style={{ fontSize: 11, color: T.weak, marginTop: 2 }}>
                {h.area.name} · {h.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

Object.assign(window, { ScreenInsights, ScreenDayDetail });
