// Hoje.jsx — Aba Hoje do app "1%"
// Três estados: base (mid-day), bom (78% Construção), ruim (12% Estagnação + cobrança)

const T = {
  bg:      '#0E0F12',
  card:    '#1A1C21',
  input:   '#23262E',
  border:  '#2C2F38',
  text:    '#ECECEC',
  weak:    '#9095A0',
  accent:  '#1F6FB2',
  danger:  '#C0392B',
  success: '#2E8B57',
  warn:    '#E1A93B',
};

// Faixas de performance
const FAIXAS = [
  { max: 20,  color: '#6B4F2A', label: 'Estagnação' },
  { max: 40,  color: '#B5391C', label: 'Reação' },
  { max: 60,  color: '#C7A52E', label: 'Movimento' },
  { max: 80,  color: '#2E8B57', label: 'Construção' },
  { max: 100, color: '#1F6FB2', label: 'Excelência' },
];

const faixaFor = (pct) => FAIXAS.find(f => pct <= f.max) || FAIXAS[0];

// Cores-base de áreas
const AREAS = {
  espiritual:   '#6B4F8A',
  fisica:       '#2E8B57',
  familia:      '#C45A4F',
  trabalho:     '#1F6FB2',
  emocional:    '#D9A441',
  financas:     '#4A7C59',
  ministerio:   '#8E44AD',
  amizades:     '#16A085',
  intelectual:  '#2980B9',
  sabedoria:    '#34495E',
};

// ─────────────────────────────────────────
// Anel grande central (Apple Fitness-ish)
// ─────────────────────────────────────────
function BigRing({ pct, size = 232, stroke = 18 }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);
  const faixa = faixaFor(pct);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* trilha */}
        <circle cx={cx} cy={cx} r={r} fill="none"
          stroke="#23262E" strokeWidth={stroke} />
        {/* progresso */}
        <circle cx={cx} cy={cx} r={r} fill="none"
          stroke={faixa.color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 72, fontWeight: 800, lineHeight: 1,
          color: faixa.color, letterSpacing: -2,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pct}<span style={{ fontSize: 32, fontWeight: 700, marginLeft: 2 }}>%</span>
        </div>
        <div style={{
          marginTop: 8,
          fontSize: 15, fontWeight: 600, letterSpacing: 0.4,
          textTransform: 'uppercase', color: faixa.color,
        }}>
          {faixa.label}
        </div>
      </div>
    </div>
  );
}

// Mini stats card
function StatCard({ label, value, sub }) {
  return (
    <div style={{
      flex: 1, background: T.card, borderRadius: 14,
      padding: '14px 14px 12px',
      border: `0.5px solid ${T.border}`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: 0.6,
        textTransform: 'uppercase', color: T.weak,
      }}>{label}</div>
      <div style={{
        marginTop: 6,
        fontSize: 22, fontWeight: 700, color: T.text,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      {sub && (
        <div style={{ marginTop: 2, fontSize: 12, color: T.weak, fontWeight: 500 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// Status icon for tasks: '○' '◐' '✓' '✗'
function StatusGlyph({ status }) {
  const size = 22;
  const stroke = 1.6;
  if (status === 'done') {
    return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill={T.success} />
        <path d="M6 11.5 L9.5 15 L16 7.5" fill="none"
          stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if (status === 'fail') {
    return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="none" stroke={T.danger} strokeWidth={stroke}/>
        <path d="M7 7 L15 15 M15 7 L7 15" stroke={T.danger}
          strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    );
  }
  if (status === 'half') {
    return (
      <svg width={size} height={size} viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="none" stroke={T.warn} strokeWidth={stroke}/>
        <path d="M11 1 A10 10 0 0 1 11 21 Z" fill={T.warn}/>
      </svg>
    );
  }
  // open
  return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="none" stroke={T.weak} strokeWidth={stroke} opacity="0.55"/>
    </svg>
  );
}

// Linha de tarefa
function TaskRow({ time, title, area, status, late, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 20px',
      borderBottom: isLast ? 'none' : `0.5px solid ${T.border}`,
    }}>
      <StatusGlyph status={status} />
      <div style={{
        width: 48,
        fontSize: 14, fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        color: late ? T.danger : (status === 'done' ? T.weak : T.text),
      }}>{time}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 500,
          color: status === 'done' ? T.weak : T.text,
          textDecoration: status === 'done' ? 'line-through' : 'none',
          textDecorationColor: 'rgba(144,149,160,0.4)',
        }}>{title}</div>
        {late && (
          <div style={{ fontSize: 11, fontWeight: 600, color: T.danger,
            textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
            Atrasada
          </div>
        )}
      </div>
      <div style={{
        width: 8, height: 8, borderRadius: 4, background: area, flexShrink: 0,
      }} />
    </div>
  );
}

// Tab bar
function TabBar({ active = 'hoje' }) {
  const items = [
    { id: 'hoje',     label: 'Hoje',           icon: 'ring' },
    { id: 'areas',    label: 'Áreas',          icon: 'grid' },
    { id: 'insights', label: 'Insights',       icon: 'chart' },
    { id: 'config',   label: 'Configurações',  icon: 'gear' },
  ];
  const Icon = ({ name, color }) => {
    const s = 22;
    if (name === 'ring') return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.8"/>
        <circle cx="11" cy="11" r="3" stroke={color} strokeWidth="1.8"/>
      </svg>
    );
    if (name === 'grid') return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3"  width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8"/>
        <rect x="12" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8"/>
        <rect x="3" y="12" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8"/>
        <rect x="12" y="12" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8"/>
      </svg>
    );
    if (name === 'chart') return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <path d="M3 17 L8 11 L12 14 L19 5" stroke={color} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 5 H19 V10" stroke={color} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
    if (name === 'gear') return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" stroke={color} strokeWidth="1.8"/>
        <path d="M11 2 V4 M11 18 V20 M2 11 H4 M18 11 H20 M4.6 4.6 L6 6 M16 16 L17.4 17.4 M4.6 17.4 L6 16 M16 6 L17.4 4.6"
          stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    );
  };

  return (
    <div style={{
      display: 'flex',
      paddingTop: 10, paddingBottom: 26,
      background: T.bg,
      borderTop: `0.5px solid ${T.border}`,
    }}>
      {items.map(item => {
        const isActive = item.id === active;
        const color = isActive ? T.text : T.weak;
        return (
          <div key={item.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
          }}>
            <Icon name={item.icon} color={color} />
            <div style={{
              fontSize: 10, fontWeight: 600, color,
              letterSpacing: 0.1,
            }}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// FAB Reflexão
function ReflexaoFab() {
  return (
    <div style={{
      position: 'absolute', right: 20, bottom: 92,
      display: 'flex', alignItems: 'center', gap: 8,
      background: T.input,
      border: `0.5px solid ${T.border}`,
      borderRadius: 999,
      padding: '12px 18px 12px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 4 H15 M3 9 H15 M3 14 H10" stroke={T.text}
          strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
        Reflexão
      </div>
    </div>
  );
}

// Banner de cobrança (mediocridade)
function CobrancaBanner({ days }) {
  return (
    <div style={{
      margin: '0 20px 18px',
      background: '#3A1411',
      border: `0.5px solid ${T.danger}`,
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
        color: T.danger, textTransform: 'uppercase',
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M6 1 L11 10 H1 Z" fill="none" stroke={T.danger} strokeWidth="1.4"/>
          <path d="M6 4.5 V7" stroke={T.danger} strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="6" cy="8.5" r="0.7" fill={T.danger}/>
        </svg>
        Mediocridade subindo
      </div>
      <div style={{
        marginTop: 6,
        fontSize: 14, fontWeight: 500, color: T.text, lineHeight: 1.4,
      }}>
        {days} dias seguidos abaixo de 30%. A cobrança aumenta a partir de amanhã.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Tela Hoje completa
// ─────────────────────────────────────────
function ScreenHoje({ state = 'base' }) {
  const config = {
    base: {
      pct: 47,
      streak: 4,
      sevenDay: 52,
      ritmo: '−6%',
      ritmoSub: 'vs 7d',
      tasks: [
        { time: '06:00', title: 'Oração + leitura',    area: AREAS.espiritual, status: 'done' },
        { time: '07:00', title: 'Treino',              area: AREAS.fisica,     status: 'done' },
        { time: '12:30', title: 'Almoço com Ana',      area: AREAS.familia,    status: 'half' },
        { time: '14:00', title: 'Bloco profundo · projeto X', area: AREAS.trabalho, status: 'open' },
        { time: '18:00', title: 'Devocional família',  area: AREAS.familia,    status: 'open' },
        { time: '21:00', title: 'Leitura · 30min',     area: AREAS.intelectual, status: 'open' },
      ],
      banner: false,
      fab: true,
    },
    bom: {
      pct: 78,
      streak: 21,
      sevenDay: 73,
      ritmo: '+8%',
      ritmoSub: 'vs 7d',
      tasks: [
        { time: '05:30', title: 'Oração + leitura',    area: AREAS.espiritual, status: 'done' },
        { time: '06:30', title: 'Treino',              area: AREAS.fisica,     status: 'done' },
        { time: '09:00', title: 'Bloco profundo · projeto X', area: AREAS.trabalho, status: 'done' },
        { time: '12:30', title: 'Almoço com Ana',      area: AREAS.familia,    status: 'done' },
        { time: '14:30', title: 'Reunião 1:1',         area: AREAS.trabalho,   status: 'done' },
        { time: '18:00', title: 'Devocional família',  area: AREAS.familia,    status: 'open' },
        { time: '21:00', title: 'Leitura · 30min',     area: AREAS.intelectual, status: 'open' },
      ],
      banner: false,
      fab: true,
    },
    ruim: {
      pct: 12,
      streak: 0,
      sevenDay: 24,
      ritmo: '−18%',
      ritmoSub: 'vs 7d',
      tasks: [
        { time: '06:00', title: 'Oração + leitura',    area: AREAS.espiritual, status: 'fail' },
        { time: '07:00', title: 'Treino',              area: AREAS.fisica,     status: 'fail', late: false },
        { time: '09:00', title: 'Bloco profundo · projeto X', area: AREAS.trabalho, status: 'open', late: true },
        { time: '12:30', title: 'Almoço com Ana',      area: AREAS.familia,    status: 'done' },
        { time: '18:00', title: 'Devocional família',  area: AREAS.familia,    status: 'open' },
        { time: '21:00', title: 'Leitura · 30min',     area: AREAS.intelectual, status: 'open' },
      ],
      banner: true,
      bannerDays: 3,
      fab: true,
    },
  }[state];

  const dataStr = state === 'bom' ? 'sex, 8 mai' : state === 'ruim' ? 'sex, 8 mai' : 'sex, 8 mai';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: T.bg, color: T.text,
      fontFamily: '-apple-system, "SF Pro Text", "SF Pro", "Inter", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* área scrollável */}
      <div style={{ flex: 1, overflow: 'auto', paddingTop: 60 }}>
        {/* Header */}
        <div style={{ padding: '8px 24px 4px' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 1.2,
            textTransform: 'uppercase', color: T.weak,
          }}>
            {dataStr}
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800, color: T.text,
            letterSpacing: -0.6, marginTop: 4, lineHeight: 1.05,
          }}>
            Hoje
          </div>
        </div>

        {/* Anel central */}
        <div style={{ display: 'flex', justifyContent: 'center',
          marginTop: 22, marginBottom: 22 }}>
          <BigRing pct={config.pct} />
        </div>

        {/* 3 stats */}
        <div style={{ display: 'flex', gap: 10, padding: '0 20px', marginBottom: 22 }}>
          <StatCard label="7d %"    value={`${config.sevenDay}%`} sub="média" />
          <StatCard label="Streak"  value={config.streak}          sub={config.streak === 1 ? 'dia' : 'dias'} />
          <StatCard label="Ritmo"   value={config.ritmo}           sub={config.ritmoSub} />
        </div>

        {/* Banner cobrança */}
        {config.banner && <CobrancaBanner days={config.bannerDays} />}

        {/* PRÓXIMAS */}
        <div style={{ padding: '0 24px', marginBottom: 10 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
            color: T.weak, textTransform: 'uppercase',
          }}>
            Próximas
          </div>
        </div>
        <div style={{
          margin: '0 16px 20px',
          background: T.card,
          borderRadius: 16,
          border: `0.5px solid ${T.border}`,
          overflow: 'hidden',
        }}>
          {config.tasks.map((t, i) => (
            <TaskRow key={i} {...t} isLast={i === config.tasks.length - 1} />
          ))}
        </div>

        {/* spacer for tab bar + fab */}
        <div style={{ height: 30 }} />
      </div>

      {/* FAB */}
      {config.fab && <ReflexaoFab />}

      {/* Tab bar */}
      <TabBar active="hoje" />
    </div>
  );
}

Object.assign(window, { ScreenHoje });
