// Insights.jsx — Aba Insights + Detalhe do Dia

// Mock: 30 dias de %
const MONTH_GOOD = [42,55,38,62,71,68,72,80,75,82,78,65,72,82,88,75,80,72,68,75,82,88,80,75,82,88,72,80,85,78];
const MONTH_BAD  = [55,42,38,30,28,22,18,12,8,15,22,18,12,5,8,12,18,22,15,8,5,0,0,8,12,5,0,12,8,12];

function MonthLineChart({ data, height = 180 }) {
  const w = 326;
  const max = 100;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i*step},${height - (v/max)*(height-20) - 10}`).join(' ');
  return (
    <svg width={w} height={height} style={{ display: 'block' }}>
      {/* Faixas coloridas no fundo (marrom→azul) */}
      {[0,20,40,60,80,100].map((th, i) => {
        if (i === 0) return null;
        const colors = ['#6B4F2A', '#B5391C', '#C7A52E', '#2E8B57', '#1F6FB2'];
        const prev = [0,20,40,60,80][i-1];
        return <rect key={i} x="0" y={height - (th/max)*(height-20) - 10}
          width={w} height={(th-prev)/max*(height-20)}
          fill={colors[i-1]} opacity="0.08"/>;
      })}
      {/* linha 50% guia */}
      <line x1="0" y1={height/2 - 5} x2={w} y2={height/2 - 5}
        stroke={T.border} strokeWidth="0.5" strokeDasharray="3 3"/>
      {/* linha de dados */}
      <polyline points={pts} fill="none" stroke={T.text} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
      {/* ponto final */}
      {data.length > 0 && (() => {
        const i = data.length - 1;
        const v = data[i];
        const cx = i*step;
        const cy = height - (v/max)*(height-20) - 10;
        return <circle cx={cx} cy={cy} r="3.5" fill={faixaFor(v).color}/>;
      })()}
    </svg>
  );
}

// Calendário 7×N com cor da faixa por dia
function CalendarGrid({ data }) {
  // padding pra começar na sexta (offset 5)
  const offset = 2;
  const cells = [...Array(offset).fill(null), ...data];
  const dows = ['D','S','T','Q','Q','S','S'];
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 6, marginBottom: 8,
      }}>
        {dows.map((d, i) => (
          <div key={i} style={{ fontSize: 10, fontWeight: 600,
            color: T.weak, textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {cells.map((v, i) => {
          if (v === null) return <div key={i}/>;
          const c = faixaFor(v).color;
          return (
            <div key={i} style={{
              aspectRatio: '1/1',
              background: c, opacity: 0.85,
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#0E0F12',
              fontVariantNumeric: 'tabular-nums',
            }}>{v}</div>
          );
        })}
      </div>
    </div>
  );
}

function ScreenInsights({ state = 'good' }) {
  const data = state === 'good' ? MONTH_GOOD : MONTH_BAD;

  const top3 = state === 'good'
    ? [
        { area: AREAS.fisica,    pct: 88 },
        { area: AREAS.financas,  pct: 82 },
        { area: AREAS.espiritual, pct: 75 },
      ]
    : [
        { area: AREAS.familia,   pct: 35 },
        { area: AREAS.financas,  pct: 28 },
        { area: AREAS.trabalho,  pct: 22 },
      ];
  const bottom3 = state === 'good'
    ? [
        { area: AREAS.amizades,  pct: 42 },
        { area: AREAS.sabedoria, pct: 50 },
        { area: AREAS.emocional, pct: 55 },
      ]
    : [
        { area: AREAS.espiritual, pct: 8 },
        { area: AREAS.amizades,   pct: 5 },
        { area: AREAS.intelectual, pct: 12 },
      ];

  const pattern = state === 'good'
    ? 'Você falha mais às terças. Domingo, ritmo cai 18%.'
    : 'Você falha mais às terças. Domingo, ritmo cai 40%.';

  const reflexoes = [
    { date: '7 mai', q: 'O que você evitou hoje?', body: state === 'good'
      ? 'Adiei o follow-up com cliente difícil. Vou colocar como primeira tarefa amanhã.'
      : 'Tudo. Não consigo nem identificar uma coisa específica.' },
    { date: '6 mai', q: 'Onde você mediu, mas não agiu?', body: state === 'good'
      ? 'Sei que estou comendo açúcar demais e travei a balança 4 dias. Agir hoje.'
      : 'Vi a balança subir 1.2kg e ignorei.' },
    { date: '5 mai', q: 'Quem você está deixando para trás?', body: state === 'good'
      ? 'Marcos. Faz 3 semanas que não respondo mensagens. Ligar amanhã às 10h.'
      : '' },
  ];

  const monthAvg = Math.round(data.reduce((a,b)=>a+b,0)/data.length);
  const faixaMonth = faixaFor(monthAvg);

  return (
    <Screen tab="insights">
      <PageHeader kicker="últimos 30 dias" title="Insights"/>

      {/* Card 1 — Mês */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ background: T.card, borderRadius: 16,
          border: `0.5px solid ${T.border}`, padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
                letterSpacing: 1.2, textTransform: 'uppercase' }}>Média do mês</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: faixaMonth.color,
                fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                {monthAvg}<span style={{ fontSize: 16 }}>%</span>
                <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 8,
                  letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  {faixaMonth.label}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['7d','30d','90d'].map((p, i) => (
                <div key={p} style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '4px 10px', borderRadius: 6,
                  background: i === 1 ? T.input : 'transparent',
                  color: i === 1 ? T.text : T.weak,
                }}>{p}</div>
              ))}
            </div>
          </div>
          <MonthLineChart data={data}/>
        </div>
      </div>

      {/* Card 2 — Calendário */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ background: T.card, borderRadius: 16,
          border: `0.5px solid ${T.border}`, padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
            letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
            Calendário · maio
          </div>
          <CalendarGrid data={data}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 14, fontSize: 10, color: T.weak }}>
            {FAIXAS.map(f => (
              <React.Fragment key={f.max}>
                <div style={{ width: 10, height: 10, borderRadius: 2,
                  background: f.color, opacity: 0.85 }}/>
                <span style={{ marginRight: 4 }}>{f.max}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3 — Top/Bottom */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ background: T.card, borderRadius: 16,
          border: `0.5px solid ${T.border}`, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
            letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
            Áreas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.success,
                letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                Top 3
              </div>
              {top3.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 6 }}>
                  <div style={{ width: 6, height: 18, background: d.area.color, borderRadius: 1 }}/>
                  <div style={{ flex: 1, fontSize: 12, color: T.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.area.name}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: faixaFor(d.pct).color,
                    fontVariantNumeric: 'tabular-nums' }}>{d.pct}%</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.danger,
                letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
                Bottom 3
              </div>
              {bottom3.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 6 }}>
                  <div style={{ width: 6, height: 18, background: d.area.color, borderRadius: 1 }}/>
                  <div style={{ flex: 1, fontSize: 12, color: T.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.area.name}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: faixaFor(d.pct).color,
                    fontVariantNumeric: 'tabular-nums' }}>{d.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card 4 — Padrões */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ background: T.card, borderRadius: 16,
          border: `0.5px solid ${T.border}`, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
            letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
            Padrões
          </div>
          <div style={{ fontSize: 14, color: T.text, lineHeight: 1.45 }}>
            {pattern}
          </div>
        </div>
      </div>

      {/* Card 5 — Reflexões anteriores */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ background: T.card, borderRadius: 16,
          border: `0.5px solid ${T.border}`, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
            letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
            Reflexões anteriores
          </div>
          {reflexoes.map((r, i) => (
            <div key={i} style={{
              paddingBottom: 12, marginBottom: 12,
              borderBottom: i < reflexoes.length-1 ? `0.5px solid ${T.border}` : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.weak,
                  letterSpacing: 0.6, textTransform: 'uppercase' }}>{r.date}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                {r.q}
              </div>
              <div style={{ fontSize: 13, color: r.body ? T.weak : '#5a5e6a',
                lineHeight: 1.45, fontStyle: r.body ? 'normal' : 'italic' }}>
                {r.body || '— sem resposta'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

// ─── Detalhe do Dia (filha de Insights) ───
function ScreenDayDetail({ state = 'good' }) {
  const isGood = state === 'good';
  const pct = isGood ? 78 : 12;
  const date = isGood ? 'qua, 6 mai' : 'qui, 7 mai';
  const tasks = isGood ? [
    { time: '05:30', title: 'Oração + leitura',    area: AREAS.espiritual.color, status: 'done' },
    { time: '06:30', title: 'Treino · força',      area: AREAS.fisica.color,     status: 'done' },
    { time: '09:00', title: 'Bloco profundo',      area: AREAS.trabalho.color,   status: 'done' },
    { time: '12:30', title: 'Almoço com Ana',      area: AREAS.familia.color,    status: 'done' },
    { time: '14:30', title: 'Reunião 1:1',         area: AREAS.trabalho.color,   status: 'done' },
    { time: '18:00', title: 'Devocional família',  area: AREAS.familia.color,    status: 'half' },
    { time: '21:00', title: 'Leitura · 30min',     area: AREAS.intelectual.color, status: 'fail' },
  ] : [
    { time: '06:00', title: 'Oração + leitura',    area: AREAS.espiritual.color, status: 'fail' },
    { time: '07:00', title: 'Treino',              area: AREAS.fisica.color,     status: 'fail' },
    { time: '09:00', title: 'Bloco profundo',      area: AREAS.trabalho.color,   status: 'fail' },
    { time: '12:30', title: 'Almoço com Ana',      area: AREAS.familia.color,    status: 'done' },
    { time: '18:00', title: 'Devocional família',  area: AREAS.familia.color,    status: 'fail' },
    { time: '21:00', title: 'Leitura · 30min',     area: AREAS.intelectual.color, status: 'fail' },
  ];

  return (
    <Screen tab="insights">
      <BackBar action="Insights"/>
      <PageHeader kicker={date} title="Detalhe do dia"/>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 16px' }}>
        <BigRing pct={pct} size={196}/>
      </div>

      <div style={{
        margin: '0 16px 16px', background: T.card,
        borderRadius: 16, border: `0.5px solid ${T.border}`, overflow: 'hidden',
      }}>
        {tasks.map((t, i) => (
          <TaskRow key={i} {...t} isLast={i === tasks.length-1}/>
        ))}
      </div>

      {/* Reflexão do dia */}
      <div style={{ padding: '0 20px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.weak,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Reflexão
        </div>
      </div>
      <div style={{ margin: '0 16px 16px', background: T.card,
        borderRadius: 14, border: `0.5px solid ${T.border}`, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
          Onde você mediu, mas não agiu?
        </div>
        <div style={{ fontSize: 14, color: T.weak, lineHeight: 1.5 }}>
          {isGood
            ? 'Sei que estou comendo açúcar demais e travei a balança 4 dias. Agir hoje.'
            : 'Sem resposta.'}
        </div>
      </div>

      {/* Botão editar (até 48h) */}
      <div style={{ margin: '0 16px 8px' }}>
        <div style={{
          background: 'transparent', border: `0.5px solid ${T.border}`,
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 12 L11 3 L13 5 L4 14 L2 14 Z" fill="none" stroke={T.text}
              strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
            Editar status retroativamente
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.weak, textAlign: 'center', marginTop: 8 }}>
          Disponível por mais 23h
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { ScreenInsights, ScreenDayDetail });
