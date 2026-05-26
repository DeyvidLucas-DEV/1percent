// Analytics.jsx — 3 abas (Today / Weekly / Monthly) inspirado na ref

function TabPills({ active }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 999, margin: '0 16px',
    }}>
      {['Hoje', 'Semana', 'Mês'].map((p, i) => {
        const on = i === active;
        return (
          <div key={p} style={{
            flex: 1, textAlign: 'center',
            padding: '10px 8px', borderRadius: 999,
            background: on ? AREAS.intelectual.ink : 'transparent',
            color: on ? '#fff' : T.weak,
            fontFamily: T.fontDisplay,
            fontSize: 14, fontWeight: 700,
          }}>{p}</div>
        );
      })}
    </div>
  );
}

// Anel circular com segmentos coloridos (estilo "9.0 Your goal's score")
function HabitGoalRing({ data, score, size = 280 }) {
  const cx = size/2, cy = size/2;
  const ringW = 36;
  const r = size/2 - ringW/2 - 14;
  const slices = data.length;
  const gap = 0.06; // gap em radianos
  return (
    <svg width={size} height={size}>
      {data.map((d, i) => {
        const a0 = (i / slices) * 2 * Math.PI - Math.PI/2 + gap/2;
        const a1 = ((i + 1) / slices) * 2 * Math.PI - Math.PI/2 - gap/2;
        const x0 = cx + Math.cos(a0)*r, y0 = cy + Math.sin(a0)*r;
        const x1 = cx + Math.cos(a1)*r, y1 = cy + Math.sin(a1)*r;
        const largeArc = (a1 - a0) > Math.PI ? 1 : 0;
        return (
          <path key={i}
            d={`M ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1}`}
            fill="none" stroke={d.area.ink} strokeWidth={ringW}
            strokeLinecap="round" opacity="0.92"/>
        );
      })}
      {/* Ícones nos segmentos */}
      {data.map((d, i) => {
        const am = ((i + 0.5) / slices) * 2 * Math.PI - Math.PI/2;
        const x = cx + Math.cos(am)*r;
        const y = cy + Math.sin(am)*r;
        return (
          <g key={`i-${i}`}>
            <circle cx={x} cy={y} r="11" fill={T.bg} opacity="0.85"/>
            <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: 12, fontWeight: 700, fill: d.area.ink,
                fontFamily: T.fontDisplay }}>
              {d.glyph}
            </text>
          </g>
        );
      })}
      <text x={cx} y={cy-2} textAnchor="middle"
        style={{ fontFamily: T.fontDisplay, fontSize: 56, fontWeight: 700, fill: T.ink,
          letterSpacing: -2 }}>
        {score}
      </text>
      <text x={cx} y={cy+24} textAnchor="middle"
        style={{ fontSize: 12, fill: T.weak, fontWeight: 600 }}>
        Score do dia
      </text>
    </svg>
  );
}

// Bar chart "Summary" — barras coloridas por área
function SummaryBars({ data, height = 130 }) {
  const w = 326;
  const max = Math.max(...data.map(d => d.value), 1);
  const gap = 8;
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const h = Math.max(8, (d.value / max) * (height - 12));
        const x = i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={4} width={bw} height={height - 8}
              rx={bw/2} fill={d.area.ink} opacity="0.18"/>
            <rect x={x} y={height - h - 4} width={bw} height={h}
              rx={bw/2} fill={d.area.ink}/>
          </g>
        );
      })}
    </svg>
  );
}

function ScreenAnalyticsToday({ state = 'good' }) {
  const isGood = state === 'good';
  const habits = [
    { area: AREAS.fisica,      glyph: '◆', value: isGood ? 88 : 12 },
    { area: AREAS.espiritual,  glyph: '✚', value: isGood ? 75 : 18 },
    { area: AREAS.familia,     glyph: '♥', value: isGood ? 68 : 22 },
    { area: AREAS.intelectual, glyph: '★', value: isGood ? 80 : 8 },
    { area: AREAS.emocional,   glyph: '◐', value: isGood ? 62 : 25 },
    { area: AREAS.financas,    glyph: '$',  value: isGood ? 72 : 30 },
    { area: AREAS.trabalho,    glyph: '▲', value: isGood ? 85 : 15 },
  ];
  const score = (habits.reduce((s,h)=>s+h.value,0) / habits.length / 10).toFixed(1);

  return (
    <Screen tab="insights">
      <div style={{ padding: '4px 24px 16px' }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6 }}>Analytics</div>
      </div>
      <TabPills active={0}/>

      <div style={{ display: 'flex', justifyContent: 'center',
        padding: '20px 0 8px' }}>
        <HabitGoalRing data={habits} score={score}/>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: T.card, borderRadius: 24,
          border: `1px solid ${T.border}`, padding: '16px 18px',
        }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700,
            color: T.ink, marginBottom: 12, letterSpacing: -0.3 }}>
            Resumo
          </div>
          <SummaryBars data={habits}/>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 10,
            fontSize: 9, color: T.weak, fontWeight: 600,
          }}>
            {habits.map((h, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                color: h.area.ink }}>
                {h.glyph}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

// Card semanal com 7 checkmarks
function WeeklyHabitCard({ area, title, glyph, days }) {
  const dows = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  return (
    <WaveCard bg={area.soft} style={{ padding: '0 0 16px' }}>
      <div style={{ padding: '14px 18px 12px',
        display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 13,
          background: 'rgba(255,255,255,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: area.ink,
          fontFamily: T.fontDisplay,
        }}>{glyph}</div>
        <div style={{ flex: 1, fontFamily: T.fontDisplay,
          fontSize: 15, fontWeight: 700, color: T.ink }}>{title}</div>
        <svg width="10" height="14" viewBox="0 0 10 14">
          <path d="M2 2 L8 7 L2 12" fill="none" stroke={T.ink}
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4, padding: '0 12px',
      }}>
        {dows.map((d, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.weak,
              marginBottom: 6 }}>{d}</div>
            <div style={{
              margin: '0 auto', width: 30, height: 30, borderRadius: 15,
              background: days[i] ? area.ink : 'rgba(255,255,255,0.5)',
              border: days[i] ? 'none' : `1.5px solid rgba(0,0,0,0.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: days[i] === 'future' ? 0.35 : 1,
            }}>
              {days[i] === true && (
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M3 7.5 L6 10 L11 4" fill="none" stroke="#fff"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </WaveCard>
  );
}

function ScreenAnalyticsWeekly({ state = 'good' }) {
  const isGood = state === 'good';
  const habits = isGood ? [
    { area: AREAS.fisica,     glyph: '◆', title: 'Treino', days: [1,1,0,1,1,1,1] },
    { area: AREAS.espiritual, glyph: '✚', title: 'Oração matinal', days: [1,1,1,1,1,0,1] },
    { area: AREAS.familia,    glyph: '♥', title: 'Tempo com família', days: [1,0,1,1,1,1,1] },
    { area: AREAS.intelectual,glyph: '★', title: 'Ler 30min', days: [1,1,1,0,1,1,'future'] },
    { area: AREAS.emocional,  glyph: '◐', title: 'Meditar',  days: [1,1,1,1,0,'future','future'] },
  ] : [
    { area: AREAS.fisica,     glyph: '◆', title: 'Treino', days: [1,0,0,0,0,0,0] },
    { area: AREAS.espiritual, glyph: '✚', title: 'Oração matinal', days: [1,1,0,0,0,0,0] },
    { area: AREAS.familia,    glyph: '♥', title: 'Tempo com família', days: [0,0,0,1,0,0,0] },
    { area: AREAS.intelectual,glyph: '★', title: 'Ler 30min', days: [0,0,0,0,0,0,'future'] },
    { area: AREAS.emocional,  glyph: '◐', title: 'Meditar',  days: [1,0,0,0,0,'future','future'] },
  ];

  return (
    <Screen tab="insights">
      <div style={{ padding: '4px 24px 16px' }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6 }}>Analytics</div>
      </div>
      <TabPills active={1}/>

      <div style={{ padding: '20px 16px 0',
        display: 'flex', flexDirection: 'column', gap: 10 }}>
        {habits.map((h, i) => (
          <WeeklyHabitCard key={i} {...h}/>
        ))}
      </div>
    </Screen>
  );
}

function ScreenAnalyticsMonthly({ state = 'good' }) {
  const isGood = state === 'good';
  const area = AREAS.fisica;
  const dows = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  // 35 cells: prev month (3) + 30 cur + future
  const cells = [];
  for (let i = 0; i < 3; i++) cells.push({ d: 28+i, prev: true });
  const today = 16;
  for (let i = 1; i <= 30; i++) {
    const done = isGood ? Math.random() > 0.25 : Math.random() > 0.85;
    const future = i > today;
    cells.push({ d: i, done: done && !future, future, today: i === today });
  }
  while (cells.length < 35) cells.push({ d: cells.length - 32, next: true });

  // line chart
  const lineData = isGood
    ? [320,380,420,350,410,460,380,420,440,400,380,460,420,440,460,420,300,200,150,100,80,60,40,20,10,0,0,0,0,0]
    : [200,180,150,120,100,80,60,40,20,30,20,10,5,8,12,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

  const w = 326, h = 130;
  const max = Math.max(...lineData, 100);
  const step = w / (lineData.length - 1);
  const pts = lineData.map((v, i) => [i*step, h - 8 - (v/max)*(h-16)]);
  let line = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0,y0] = pts[i-1], [x1,y1] = pts[i];
    const cxv = (x0+x1)/2;
    line += ` C ${cxv} ${y0}, ${cxv} ${y1}, ${x1} ${y1}`;
  }

  return (
    <Screen tab="insights">
      <div style={{ padding: '4px 24px 16px' }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 700,
          color: T.ink, letterSpacing: -0.6 }}>Analytics</div>
      </div>
      <TabPills active={2}/>

      {/* Habit selector */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: area.soft, borderRadius: 18,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 13,
            background: 'rgba(255,255,255,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: area.ink,
            fontFamily: T.fontDisplay,
          }}>◆</div>
          <div style={{ flex: 1, fontFamily: T.fontDisplay,
            fontSize: 15, fontWeight: 700, color: T.ink }}>Treino · força</div>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3 5 L7 9 L11 5" fill="none" stroke={T.ink}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Calendário */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: T.card, borderRadius: 24,
          border: `1px solid ${T.border}`, padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: 14 }}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M9 2 L4 7 L9 12" fill="none" stroke={T.ink}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 15,
              fontWeight: 700, color: T.ink }}>Maio 2026</div>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M5 2 L10 7 L5 12" fill="none" stroke={T.ink}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 6, marginBottom: 8,
          }}>
            {dows.map((d, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700,
                color: T.weak, textAlign: 'center' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {cells.map((c, i) => {
              const muted = c.prev || c.next || c.future;
              return (
                <div key={i} style={{
                  aspectRatio: '1/1',
                  background: c.today ? area.ink : c.done ? area.soft : 'transparent',
                  border: c.today ? 'none' : c.done ? 'none' : `1px solid ${muted ? 'transparent' : 'rgba(0,0,0,0.06)'}`,
                  borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: c.today ? '#fff' : muted ? 'rgba(0,0,0,0.25)' : T.ink,
                  fontVariantNumeric: 'tabular-nums',
                }}>{c.d}</div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Line chart */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: area.ink, borderRadius: 24, padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
              letterSpacing: 1, textTransform: 'uppercase' }}>Volume diário</div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 18,
              fontWeight: 700, color: '#fff',
              fontVariantNumeric: 'tabular-nums' }}>
              {isGood ? '460' : '12'}<span style={{ fontSize: 11, opacity: 0.6, marginLeft: 4 }}>kg</span>
            </div>
          </div>
          <svg width={w} height={h}>
            {[0,100,200,300,400,500].map((v, i) => (
              <g key={i}>
                <line x1="0" y1={h-8-(v/max)*(h-16)} x2={w} y2={h-8-(v/max)*(h-16)}
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
                <text x="0" y={h-8-(v/max)*(h-16)-2} fontSize="8"
                  fill="rgba(255,255,255,0.5)" fontWeight="600">{v}</text>
              </g>
            ))}
            <path d={line} fill="none" stroke="#fff" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
            {pts.map(([x,y], i) => i % 2 === 0 && (
              <circle key={i} cx={x} cy={y} r="2" fill="#fff"/>
            ))}
          </svg>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, {
  ScreenAnalyticsToday, ScreenAnalyticsWeekly, ScreenAnalyticsMonthly,
});
