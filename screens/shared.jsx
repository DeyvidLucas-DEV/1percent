// shared.jsx — Tokens + componentes (v2 light/pastel)

const T = {
  bg:        '#E8E2D2',   // bege/aveia mais frio e neutro
  bgSoft:    '#EEE8D8',
  card:      '#F5F1E5',
  ink:       '#1A1916',
  weak:      '#6F6A5E',
  border:    'rgba(26,25,22,0.10)',
  borderD:   'rgba(26,25,22,0.18)',
  accent:    '#1A1916',
  danger:    '#8C2E22',
  success:   '#3F5F3F',
  warn:      '#8A6B1F',

  fontDisplay: '"Bricolage Grotesque", "Inter", system-ui, sans-serif',
  fontText:    '"Inter", -apple-system, system-ui, sans-serif',
};

// Cores das áreas — paleta terrosa/utilitária (sem rosa, sem lavanda, sem peach)
const AREAS = {
  espiritual:  { id: 'espiritual',  name: 'Espiritual',     ink: '#3D3A52', soft: '#BDB8C2', opt: false },
  fisica:      { id: 'fisica',      name: 'Saúde Física',   ink: '#3F5F3F', soft: '#B8C2A8', opt: false },
  familia:     { id: 'familia',     name: 'Família',        ink: '#8C3A2A', soft: '#D2A892', opt: false },
  trabalho:    { id: 'trabalho',    name: 'Trabalho',       ink: '#1F3F5C', soft: '#A8B5C2', opt: false },
  emocional:   { id: 'emocional',   name: 'Emocional',      ink: '#8A6B1F', soft: '#D4C088', opt: false },
  financas:    { id: 'financas',    name: 'Finanças',       ink: '#2F5547', soft: '#A8BFB0', opt: false },
  ministerio:  { id: 'ministerio',  name: 'Ministério',     ink: '#4A3050', soft: '#B8A8B8', opt: true },
  amizades:    { id: 'amizades',    name: 'Amizades',       ink: '#1F5F58', soft: '#A8C2BC', opt: true },
  intelectual: { id: 'intelectual', name: 'Intelectual',    ink: '#2D4A6B', soft: '#A8BACE', opt: true },
  sabedoria:   { id: 'sabedoria',   name: 'Sabedoria',      ink: '#3A3F45', soft: '#B5B8BC', opt: true },
};
const AREA_LIST = Object.values(AREAS);

// Faixas — terrosas
const FAIXAS = [
  { max: 20,  ink: '#5C4A3A', soft: '#C2B5A0', label: 'Estagnação' },
  { max: 40,  ink: '#8C3A2A', soft: '#D2A892', label: 'Reação' },
  { max: 60,  ink: '#8A6B1F', soft: '#D4C088', label: 'Movimento' },
  { max: 80,  ink: '#3F5F3F', soft: '#B8C2A8', label: 'Construção' },
  { max: 100, ink: '#1F3F5C', soft: '#A8B5C2', label: 'Excelência' },
];
const faixaFor = (pct) => FAIXAS.find(f => pct <= f.max) || FAIXAS[0];

// ─── SVG: topo em onda (cloud-like squircle) ───
// Caminho do card que tem topo "ondulado" e cantos super-arredondados embaixo
function WaveCard({ children, bg, height, style, onTop }) {
  // We use a CSS clip-path approximation with border-radius variations to create
  // a "squircle wave" feel. Top edge has 3 lobes.
  const id = React.useId().replace(/:/g, '');
  return (
    <div style={{
      position: 'relative',
      borderRadius: 28,
      background: bg,
      overflow: 'hidden',
      ...style,
    }}>
      {/* Onda superior: 3 lobos negativos */}
      <svg width="100%" height="22" viewBox="0 0 200 22" preserveAspectRatio="none"
        style={{ display: 'block', position: 'absolute', top: 0, left: 0, right: 0 }}>
        <path d="M0 22 L0 14 Q 16 0, 33 14 Q 50 28, 66 14 Q 83 0, 100 14 Q 117 28, 133 14 Q 150 0, 166 14 Q 183 28, 200 14 L200 22 Z"
          fill={bg}/>
      </svg>
      <div style={{ position: 'relative', zIndex: 1, paddingTop: onTop ? 0 : 14 }}>
        {children}
      </div>
    </div>
  );
}

// Mini bar chart vertical (estilo barras aleatórias da ref)
function MiniBars({ data, color, height = 60, width = 130 }) {
  const max = Math.max(...data, 1);
  const gap = 2;
  const bw = (width - gap * (data.length - 1)) / data.length;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * (height - 4));
        return (
          <rect key={i}
            x={i * (bw + gap)} y={height - h}
            width={bw} height={h} rx={bw/2}
            fill={color} opacity={0.85}/>
        );
      })}
    </svg>
  );
}

// Mini wave/area chart (preenchido)
function MiniWave({ data, color, height = 60, width = 130 }) {
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i*step, height - 4 - (v/max)*(height-8)]);
  // Smooth path
  let d = `M 0 ${height} L ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i-1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  d += ` L ${width} ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={d} fill={color} opacity="0.85"/>
    </svg>
  );
}

// Mini ring (semicircle) — como na ref "1 hour"
function MiniSemiRing({ pct, color, value, unit, size = 110 }) {
  const r = size/2 - 8;
  const cx = size/2;
  const cy = size - 12;
  const c = Math.PI * r; // half circle
  const offset = c * (1 - Math.min(pct,100)/100);
  return (
    <svg width={size} height={size/1.6} style={{ display: 'block' }}>
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="9" strokeLinecap="round"/>
      <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
        fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}/>
      <text x={cx} y={cy-12} textAnchor="middle"
        style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, fill: T.ink }}>
        {value}
      </text>
      <text x={cx} y={cy+2} textAnchor="middle"
        style={{ fontSize: 10, fill: T.weak, fontWeight: 600, letterSpacing: 0.4 }}>
        {unit}
      </text>
    </svg>
  );
}

// Anel grosso central
function BigRing({ pct, size = 220, stroke = 22, color, sublabel }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);
  const f = faixaFor(pct);
  const strokeColor = color || f.ink;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(27,26,23,0.06)" strokeWidth={stroke}/>
        <circle cx={cx} cy={cx} r={r} fill="none"
          stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: size*0.32, fontWeight: 700,
          lineHeight: 1, color: T.ink, letterSpacing: -2,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {pct}<span style={{ fontSize: size*0.13, color: T.weak, marginLeft: 2 }}>%</span>
        </div>
        {sublabel !== false && (
          <div style={{
            marginTop: 8, fontSize: size*0.06, fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: T.weak,
          }}>{f.label}</div>
        )}
      </div>
    </div>
  );
}

// MiniRing colorido (para área no card)
function MiniRing({ pct, color, size = 36, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(pct, 100) / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={stroke}/>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}/>
      </svg>
    </div>
  );
}

// Day pill — como Sun 01, com selecionado arredondado
function DayPills({ days, selected }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 6,
      padding: '0 4px',
    }}>
      {days.map((d, i) => {
        const sel = i === selected;
        return (
          <div key={i} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6,
            padding: '8px 4px 10px',
            borderRadius: 28,
            background: sel ? T.ink : 'transparent',
            color: sel ? T.bg : T.ink,
            transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600,
              color: sel ? 'rgba(244,238,226,0.7)' : T.weak,
              letterSpacing: 0.4,
            }}>{d.dow}</div>
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: sel ? 'rgba(244,238,226,0.15)' : 'transparent',
              fontSize: 13, fontWeight: 700,
              fontFamily: T.fontDisplay,
              fontVariantNumeric: 'tabular-nums',
              color: sel ? T.bg : T.ink,
            }}>{d.num}</div>
          </div>
        );
      })}
    </div>
  );
}

// Helper para pegar a semana de hoje
function makeWeek(centerDay = 4) {
  const dows = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return dows.map((d, i) => ({ dow: d, num: String(i + 5).padStart(2, '0') })).map((d, i) => ({
    ...d, num: String(centerDay - 3 + i).padStart(2, '0'),
  }));
}

// Tab bar arredondada com FAB
function TabBar({ active = 'home' }) {
  const Icon = ({ name, on }) => {
    const c = on ? T.ink : T.weak;
    const s = 22;
    if (name === 'home') return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <path d="M3 11 L11 4 L19 11 V18 H13 V13 H9 V18 H3 Z" stroke={c} strokeWidth="1.8"
          strokeLinejoin="round"/>
      </svg>
    );
    if (name === 'grid') return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <circle cx="6" cy="6" r="2.2" fill={c}/>
        <circle cx="11" cy="6" r="2.2" fill={c}/>
        <circle cx="16" cy="6" r="2.2" fill={c}/>
        <circle cx="6" cy="11" r="2.2" fill={c}/>
        <circle cx="11" cy="11" r="2.2" fill={c}/>
        <circle cx="16" cy="11" r="2.2" fill={c}/>
        <circle cx="6" cy="16" r="2.2" fill={c}/>
        <circle cx="11" cy="16" r="2.2" fill={c}/>
        <circle cx="16" cy="16" r="2.2" fill={c}/>
      </svg>
    );
    if (name === 'chart') return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <rect x="3" y="11" width="3.5" height="8" rx="1.2" fill={c}/>
        <rect x="9.25" y="6" width="3.5" height="13" rx="1.2" fill={c}/>
        <rect x="15.5" y="9" width="3.5" height="10" rx="1.2" fill={c}/>
      </svg>
    );
    if (name === 'profile') return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5" stroke={c} strokeWidth="1.8"/>
        <path d="M4 19 C 5 14, 17 14, 18 19" stroke={c} strokeWidth="1.8"
          strokeLinecap="round"/>
      </svg>
    );
  };
  const items = [
    { id: 'home', icon: 'home' },
    { id: 'areas', icon: 'grid' },
    { id: 'fab' },
    { id: 'insights', icon: 'chart' },
    { id: 'profile', icon: 'profile' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 28,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: T.ink, color: T.bg,
      borderRadius: 999,
      padding: '14px 24px',
      boxShadow: '0 8px 24px rgba(27,26,23,0.18)',
    }}>
      {items.map(it => {
        if (it.id === 'fab') return (
          <div key="fab" style={{
            width: 48, height: 48, borderRadius: 24,
            background: T.bg, color: T.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '-22px 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M10 3 V17 M3 10 H17" stroke={T.ink} strokeWidth="2.2"
                strokeLinecap="round"/>
            </svg>
          </div>
        );
        const on = it.id === active;
        return (
          <div key={it.id} style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* invert for dark bg */}
            <div style={{ filter: on ? 'invert(1) brightness(2)' : 'invert(1) brightness(1.5)', opacity: on ? 1 : 0.55 }}>
              <Icon name={it.icon}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PageHeader({ greeting, name, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 24px 14px',
    }}>
      <div>
        <div style={{ fontSize: 13, color: T.weak, fontWeight: 500, letterSpacing: 0.1 }}>
          {greeting},
        </div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700,
          color: T.ink, letterSpacing: -0.3, marginTop: 2,
        }}>
          {name}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {right}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 19,
      background: T.card, border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}

// Section title + "All habits >"
function SectionHeader({ title, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '8px 24px 12px',
    }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700,
        color: T.ink, letterSpacing: -0.8, lineHeight: 1.05,
        maxWidth: 220, textWrap: 'pretty',
      }}>{title}</div>
      {action && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 13, fontWeight: 600, color: T.ink,
          textDecoration: 'underline', textUnderlineOffset: 3,
        }}>
          {action}
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M3 2 L8 6 L3 10" stroke={T.ink} strokeWidth="1.6"
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// Screen wrapper
function Screen({ children, hideTabBar, tab = 'home', bg }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: bg || T.bg, color: T.ink,
      fontFamily: T.fontText, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, overflow: 'auto', paddingTop: 56,
        paddingBottom: hideTabBar ? 30 : 110 }}>
        {children}
      </div>
      {!hideTabBar && <TabBar active={tab}/>}
    </div>
  );
}

function BackBar({ title, action = 'Voltar' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px 4px',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 19,
        background: T.card, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M9 2 L4 7 L9 12" fill="none" stroke={T.ink} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {title && <div style={{
        fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 700, color: T.ink,
      }}>{title}</div>}
      <div style={{
        width: 38, height: 38, borderRadius: 19,
        background: T.card, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M2 11 L10 3 L12 5 L4 13 L2 13 Z" fill="none" stroke={T.ink}
            strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

Object.assign(window, {
  T, AREAS, AREA_LIST, FAIXAS, faixaFor,
  WaveCard, MiniBars, MiniWave, MiniSemiRing, BigRing, MiniRing,
  DayPills, makeWeek, TabBar, PageHeader, IconBtn, SectionHeader, Screen, BackBar,
});
