// shared.jsx — Tokens + componentes reutilizáveis para "1%"

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
  fontStack: '-apple-system, "SF Pro Text", "SF Pro", "Inter", system-ui, sans-serif',
};

// Faixas de performance (% → cor + label)
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
  espiritual:   { id: 'espiritual',  name: 'Espiritual',           color: '#6B4F8A', opt: false },
  fisica:       { id: 'fisica',      name: 'Saúde Física',         color: '#2E8B57', opt: false },
  familia:      { id: 'familia',     name: 'Família',              color: '#C45A4F', opt: false },
  trabalho:     { id: 'trabalho',    name: 'Trabalho/Carreira',    color: '#1F6FB2', opt: false },
  emocional:    { id: 'emocional',   name: 'Saúde Emocional',      color: '#D9A441', opt: false },
  financas:     { id: 'financas',    name: 'Finanças',             color: '#4A7C59', opt: false },
  ministerio:   { id: 'ministerio',  name: 'Ministério',           color: '#8E44AD', opt: true  },
  amizades:     { id: 'amizades',    name: 'Amizades',             color: '#16A085', opt: true  },
  intelectual:  { id: 'intelectual', name: 'Crescimento Intelectual', color: '#2980B9', opt: true },
  sabedoria:    { id: 'sabedoria',   name: 'Sabedoria',            color: '#34495E', opt: true  },
};
const AREA_LIST = Object.values(AREAS);

// ─── Anel grande ───
function BigRing({ pct, size = 232, stroke = 18, sublabel = true }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);
  const faixa = faixaFor(pct);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#23262E" strokeWidth={stroke}/>
        <circle cx={cx} cy={cx} r={r} fill="none"
          stroke={faixa.color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: size * 0.31, fontWeight: 800, lineHeight: 1, color: faixa.color,
          letterSpacing: -2, fontVariantNumeric: 'tabular-nums',
        }}>
          {pct}<span style={{ fontSize: size * 0.14, fontWeight: 700, marginLeft: 2 }}>%</span>
        </div>
        {sublabel && (
          <div style={{
            marginTop: 8, fontSize: size * 0.065, fontWeight: 600, letterSpacing: 0.4,
            textTransform: 'uppercase', color: faixa.color,
          }}>{faixa.label}</div>
        )}
      </div>
    </div>
  );
}

// Mini ring (lateral em cards de área)
function MiniRing({ pct, size = 56, stroke = 5, baseColor }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);
  const faixa = faixaFor(pct);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#23262E" strokeWidth={stroke}/>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={faixa.color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: T.text,
        fontVariantNumeric: 'tabular-nums',
      }}>{pct}</div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      flex: 1, background: T.card, borderRadius: 14,
      padding: '14px 14px 12px', border: `0.5px solid ${T.border}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6,
        textTransform: 'uppercase', color: T.weak }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, color: T.text,
        fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ marginTop: 2, fontSize: 12, color: T.weak, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function StatusGlyph({ status, size = 22 }) {
  const stroke = 1.6;
  if (status === 'done') return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill={T.success}/>
      <path d="M6 11.5 L9.5 15 L16 7.5" fill="none" stroke="#fff" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (status === 'fail') return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="none" stroke={T.danger} strokeWidth={stroke}/>
      <path d="M7 7 L15 15 M15 7 L7 15" stroke={T.danger} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  if (status === 'half') return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="none" stroke={T.warn} strokeWidth={stroke}/>
      <path d="M11 1 A10 10 0 0 1 11 21 Z" fill={T.warn}/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="10" fill="none" stroke={T.weak} strokeWidth={stroke} opacity="0.55"/>
    </svg>
  );
}

function TaskRow({ time, title, area, status, late, isLast, weight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
      borderBottom: isLast ? 'none' : `0.5px solid ${T.border}`,
    }}>
      <StatusGlyph status={status}/>
      {time && <div style={{
        width: 48, fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
        color: late ? T.danger : (status === 'done' ? T.weak : T.text),
      }}>{time}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 500, color: status === 'done' ? T.weak : T.text,
          textDecoration: status === 'done' ? 'line-through' : 'none',
          textDecorationColor: 'rgba(144,149,160,0.4)',
        }}>{title}</div>
        {late && <div style={{ fontSize: 11, fontWeight: 600, color: T.danger,
          textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Atrasada</div>}
      </div>
      {weight && <div style={{
        fontSize: 11, fontWeight: 700, color: T.weak,
        background: T.input, padding: '2px 6px', borderRadius: 4,
        fontVariantNumeric: 'tabular-nums',
      }}>×{weight}</div>}
      {area && <div style={{ width: 8, height: 8, borderRadius: 4, background: area, flexShrink: 0 }}/>}
    </div>
  );
}

function TabBar({ active = 'hoje' }) {
  const items = [
    { id: 'hoje',     label: 'Hoje',          icon: 'ring' },
    { id: 'areas',    label: 'Áreas',         icon: 'grid' },
    { id: 'insights', label: 'Insights',      icon: 'chart' },
    { id: 'config',   label: 'Configurações', icon: 'gear' },
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
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8"/>
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
      display: 'flex', paddingTop: 10, paddingBottom: 26,
      background: T.bg, borderTop: `0.5px solid ${T.border}`,
    }}>
      {items.map(it => {
        const isActive = it.id === active;
        const color = isActive ? T.text : T.weak;
        return (
          <div key={it.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
          }}>
            <Icon name={it.icon} color={color}/>
            <div style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: 0.1 }}>
              {it.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CobrancaBanner({ days, msg }) {
  return (
    <div style={{
      margin: '0 20px 18px', background: '#3A1411',
      border: `0.5px solid ${T.danger}`, borderRadius: 14, padding: '14px 16px',
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
      <div style={{ marginTop: 6, fontSize: 14, fontWeight: 500, color: T.text, lineHeight: 1.4 }}>
        {msg || `${days} dias seguidos abaixo de 30%. A cobrança aumenta a partir de amanhã.`}
      </div>
    </div>
  );
}

// Header padrão (data + título grande)
function PageHeader({ kicker, title, right }) {
  return (
    <div style={{ padding: '8px 24px 4px', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        {kicker && <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 1.2,
          textTransform: 'uppercase', color: T.weak,
        }}>{kicker}</div>}
        <div style={{
          fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: -0.6,
          marginTop: 4, lineHeight: 1.05,
        }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

// Wrapper com scroll + tab bar
function Screen({ children, tab = 'hoje', noTabBar, fab, hideStatus }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg, color: T.text,
      fontFamily: T.fontStack, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'auto', paddingTop: hideStatus ? 0 : 60 }}>
        {children}
        <div style={{ height: 30 }}/>
      </div>
      {fab}
      {!noTabBar && <TabBar active={tab}/>}
    </div>
  );
}

// Botão back simples
function BackBar({ title, action = 'Áreas' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 16px 4px',
    }}>
      <svg width="11" height="18" viewBox="0 0 11 18">
        <path d="M9 1 L2 9 L9 17" fill="none" stroke={T.accent} strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ fontSize: 16, fontWeight: 500, color: T.accent }}>{action}</div>
    </div>
  );
}

Object.assign(window, {
  T, FAIXAS, faixaFor, AREAS, AREA_LIST,
  BigRing, MiniRing, StatCard, StatusGlyph, TaskRow,
  TabBar, CobrancaBanner, PageHeader, Screen, BackBar,
});
