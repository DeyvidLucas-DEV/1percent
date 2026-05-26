// marks.jsx — 7 marcas para o app "1%"
// Cada MARK tem: { name, kind, rationale, Wordmark, Icon, Adaptive }

const PAPER = '#E8E2D2';
const PAPER_HI = '#F5F1E5';
const INK = '#1A1916';
const DARK = '#0E0F12';
const ON_DARK = '#E8E2D2';
const C_MARROM = '#5C4A3A';
const C_VERMELHO = '#8C3A2A';
const C_AMARELO = '#8A6B1F';
const C_VERDE = '#3F5F3F';
const C_AZUL = '#1F3F5C';

const FONT = `'Bricolage Grotesque', 'Inter', system-ui, sans-serif`;

// ════════════════════════════════════════════════════════════════
// T1 · WORDMARK puro — "1%" peso 800, tracking apertado
// ════════════════════════════════════════════════════════════════
const T1 = {
  name: 'Wordmark',
  kind: 'Tipográfico',
  rationale:
    'O nome inteiro. Display pesada, peso 800, tracking apertado. Imprint editorial; sem floreio.',
  Wordmark: ({ color = INK }) => (
    <svg viewBox="0 0 220 110" width="100%" height="100%">
      <text x="110" y="86" textAnchor="middle"
        style={{ fontFamily: FONT, fontWeight: 800, fontSize: 96,
          letterSpacing: -4, fill: color }}>1%</text>
    </svg>
  ),
  Icon: ({ bg = INK, fg = PAPER }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <rect width="1024" height="1024" fill={bg}/>
      <text x="512" y="690" textAnchor="middle"
        style={{ fontFamily: FONT, fontWeight: 800, fontSize: 580,
          letterSpacing: -26, fill: fg }}>1%</text>
    </svg>
  ),
  Adaptive: ({ fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <text x="512" y="650" textAnchor="middle"
        style={{ fontFamily: FONT, fontWeight: 800, fontSize: 420,
          letterSpacing: -18, fill: fg }}>1%</text>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════
// T2 · STAT RULES — "1%" entre duas linhas (formato de tabela editorial)
// ════════════════════════════════════════════════════════════════
const T2 = {
  name: 'Stat Rules',
  kind: 'Tipográfico',
  rationale:
    'Número medido em pauta. Comunica "isto é uma estatística sobre você". Linguagem de balanço, não de promessa.',
  Wordmark: ({ color = INK }) => (
    <svg viewBox="0 0 240 140" width="100%" height="100%">
      <line x1="12" y1="22" x2="228" y2="22" stroke={color} strokeWidth="2"/>
      <text x="120" y="100" textAnchor="middle"
        style={{ fontFamily: FONT, fontWeight: 700, fontSize: 84,
          letterSpacing: -2, fill: color }}>1%</text>
      <line x1="12" y1="120" x2="228" y2="120" stroke={color} strokeWidth="2"/>
    </svg>
  ),
  Icon: ({ bg = PAPER, fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <rect width="1024" height="1024" fill={bg}/>
      <line x1="160" y1="260" x2="864" y2="260" stroke={fg} strokeWidth="10"/>
      <text x="512" y="680" textAnchor="middle"
        style={{ fontFamily: FONT, fontWeight: 700, fontSize: 460,
          letterSpacing: -16, fill: fg }}>1%</text>
      <line x1="160" y1="790" x2="864" y2="790" stroke={fg} strokeWidth="10"/>
    </svg>
  ),
  Adaptive: ({ fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <line x1="244" y1="290" x2="780" y2="290" stroke={fg} strokeWidth="8"/>
      <text x="512" y="650" textAnchor="middle"
        style={{ fontFamily: FONT, fontWeight: 700, fontSize: 360,
          letterSpacing: -10, fill: fg }}>1%</text>
      <line x1="244" y1="750" x2="780" y2="750" stroke={fg} strokeWidth="8"/>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════
// T3 · SLASH AXIS — "1" + slash grosso eixo + ponto
// ════════════════════════════════════════════════════════════════
const T3 = {
  name: 'Slash Axis',
  kind: 'Tipográfico',
  rationale:
    'O slash do "%" é tratado como eixo de medida. "1" e o ponto orbitam ele. Reconstrução geométrica do símbolo.',
  Wordmark: ({ color = INK }) => (
    <svg viewBox="0 0 190 130" width="100%" height="100%">
      <text x="38" y="100" textAnchor="middle"
        style={{ fontFamily: FONT, fontWeight: 800, fontSize: 96,
          fill: color, letterSpacing: -2 }}>1</text>
      <line x1="78" y1="118" x2="138" y2="14" stroke={color} strokeWidth="16"
        strokeLinecap="square"/>
      <rect x="64" y="22" width="18" height="18" fill={color}/>
      <rect x="134" y="92" width="18" height="18" fill={color}/>
    </svg>
  ),
  Icon: ({ bg = C_AZUL, fg = PAPER }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <rect width="1024" height="1024" fill={bg}/>
      <line x1="324" y1="824" x2="700" y2="200" stroke={fg} strokeWidth="68"
        strokeLinecap="square"/>
      <rect x="240" y="240" width="92" height="92" fill={fg}/>
      <rect x="692" y="692" width="92" height="92" fill={fg}/>
    </svg>
  ),
  Adaptive: ({ fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <line x1="372" y1="754" x2="652" y2="270" stroke={fg} strokeWidth="50"
        strokeLinecap="square"/>
      <rect x="308" y="308" width="64" height="64" fill={fg}/>
      <rect x="652" y="652" width="64" height="64" fill={fg}/>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════
// G1 · CENTÉSIMO — Grid 10×10 de pontos, 1 sólido, 99 vazios
// ════════════════════════════════════════════════════════════════
function CentesimoCells({ x0, y0, span, fg, r, sw }) {
  const cells = [];
  const gap = span / 9;
  for (let yi = 0; yi < 10; yi++) {
    for (let xi = 0; xi < 10; xi++) {
      const isFilled = xi === 0 && yi === 0;
      cells.push(
        <circle key={`${xi}-${yi}`}
          cx={x0 + xi * gap} cy={y0 + yi * gap}
          r={r}
          fill={isFilled ? fg : 'none'}
          stroke={fg}
          strokeWidth={isFilled ? 0 : sw}/>
      );
    }
  }
  return <>{cells}</>;
}

const G1 = {
  name: 'Centésimo',
  kind: 'Geométrico',
  rationale:
    'Literal: 100 pontos, 1 preenchido. Cada dia é uma marca. O todo é o quadro do progresso composto.',
  Wordmark: ({ color = INK }) => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      <CentesimoCells x0={10} y0={10} span={100} fg={color} r={3.6} sw={1.2}/>
    </svg>
  ),
  Icon: ({ bg = PAPER, fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <rect width="1024" height="1024" fill={bg}/>
      <CentesimoCells x0={140} y0={140} span={744} fg={fg} r={26} sw={9}/>
    </svg>
  ),
  Adaptive: ({ fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <CentesimoCells x0={224} y0={224} span={576} fg={fg} r={22} sw={7}/>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════
// G2 · ANEL ABERTO — anel grosso com gap de 3.6° (1% de 360°)
// ════════════════════════════════════════════════════════════════
function OpenRing({ cx, cy, r, sw, color, gapDeg = 3.6 }) {
  const c = 2 * Math.PI * r;
  const gapLen = c * (gapDeg / 360);
  const arcLen = c - gapLen;
  return (
    <circle cx={cx} cy={cy} r={r} fill="none"
      stroke={color} strokeWidth={sw}
      strokeDasharray={`${arcLen} ${gapLen}`}
      strokeDashoffset={arcLen / 2}
      transform={`rotate(-90 ${cx} ${cy})`}/>
  );
}

const G2 = {
  name: 'Anel Aberto',
  kind: 'Geométrico',
  rationale:
    'Um anel quase fechado. O gap é exatamente 3.6° — 1% do círculo. Ciclo intencionalmente incompleto.',
  Wordmark: ({ color = INK }) => (
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      <OpenRing cx={60} cy={60} r={46} sw={14} color={color}/>
    </svg>
  ),
  Icon: ({ bg = C_VERDE, fg = PAPER }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <rect width="1024" height="1024" fill={bg}/>
      <OpenRing cx={512} cy={512} r={340} sw={96} color={fg}/>
    </svg>
  ),
  Adaptive: ({ fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <OpenRing cx={512} cy={512} r={240} sw={68} color={fg}/>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════
// G3 · RÉGUA — 100 marcas, primeira preenchida
// ════════════════════════════════════════════════════════════════
function Ruler({ x0, y0, w, h, fg, sw }) {
  const ticks = [];
  for (let i = 0; i < 100; i++) {
    const tx = x0 + (i / 99) * w;
    const len = i % 10 === 0 ? h * 0.9 : h * 0.55;
    ticks.push(<line key={i} x1={tx} y1={y0} x2={tx} y2={y0 + len}
      stroke={fg} strokeWidth={sw}/>);
  }
  return <>{ticks}</>;
}

const G3 = {
  name: 'Régua',
  kind: 'Geométrico',
  rationale:
    'Régua de 100. Primeira marca preenchida. Posição honesta: você está começando, e dá pra ver o quanto falta.',
  Wordmark: ({ color = INK }) => (
    <svg viewBox="0 0 220 80" width="100%" height="100%">
      <Ruler x0={10} y0={10} w={200} h={20} fg={color} sw={1.2}/>
      <rect x="8" y="44" width="204" height="14" fill="none"
        stroke={color} strokeWidth="2"/>
      <rect x="8" y="44" width={204 / 100} height="14" fill={color}/>
    </svg>
  ),
  Icon: ({ bg = PAPER, fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <rect width="1024" height="1024" fill={bg}/>
      <Ruler x0={92} y0={350} w={840} h={130} fg={fg} sw={6}/>
      <rect x="92" y="540" width="840" height="120" fill="none"
        stroke={fg} strokeWidth="14"/>
      <rect x="92" y="540" width={840 / 100} height="120" fill={fg}/>
    </svg>
  ),
  Adaptive: ({ fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <Ruler x0={224} y0={400} w={576} h={100} fg={fg} sw={5}/>
      <rect x="224" y="540" width="576" height="80" fill="none"
        stroke={fg} strokeWidth="11"/>
      <rect x="224" y="540" width={576 / 100} height="80" fill={fg}/>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════
// M1 · COLUNA — Monograma "1" como coluna arquitetônica
// ════════════════════════════════════════════════════════════════
const M1 = {
  name: 'Coluna',
  kind: 'Monograma',
  rationale:
    'O "1" como coluna: capitel + fuste + base. Estrutura, peso, gravidade. Sem flecha, sem flecha pra cima.',
  Wordmark: ({ color = INK }) => (
    <svg viewBox="0 0 120 160" width="100%" height="100%">
      <line x1="20" y1="20" x2="100" y2="20" stroke={color} strokeWidth="5"/>
      <rect x="48" y="20" width="24" height="120" fill={color}/>
      <line x1="14" y1="142" x2="106" y2="142" stroke={color} strokeWidth="5"/>
    </svg>
  ),
  Icon: ({ bg = INK, fg = PAPER }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <rect width="1024" height="1024" fill={bg}/>
      <line x1="200" y1="200" x2="824" y2="200" stroke={fg} strokeWidth="36"/>
      <rect x="436" y="200" width="152" height="624" fill={fg}/>
      <line x1="148" y1="824" x2="876" y2="824" stroke={fg} strokeWidth="36"/>
    </svg>
  ),
  Adaptive: ({ fg = INK }) => (
    <svg viewBox="0 0 1024 1024" width="100%" height="100%">
      <line x1="280" y1="280" x2="744" y2="280" stroke={fg} strokeWidth="26"/>
      <rect x="460" y="280" width="104" height="464" fill={fg}/>
      <line x1="240" y1="744" x2="784" y2="744" stroke={fg} strokeWidth="26"/>
    </svg>
  ),
};

// ════════════════════════════════════════════════════════════════
// C1 · COMPOSTO — Centésimo (sigla) + "1%" (wordmark)
// ════════════════════════════════════════════════════════════════
const C1 = {
  name: 'Centésimo + Wordmark',
  kind: 'Composto',
  rationale:
    'Símbolo (Centésimo) + wordmark "1%", separáveis. Ideal pra onboarding, App Store, sites — onde o símbolo sozinho ainda não foi internalizado.',
  Wordmark: ({ color = INK }) => (
    <svg viewBox="0 0 280 120" width="100%" height="100%">
      <CentesimoCells x0={14} y0={14} span={92} fg={color} r={3.4} sw={1.1}/>
      <text x="130" y="92" textAnchor="start"
        style={{ fontFamily: FONT, fontWeight: 800, fontSize: 96,
          letterSpacing: -4, fill: color }}>1%</text>
    </svg>
  ),
  Icon: ({ bg = DARK, fg = ON_DARK }) =>
    G1.Icon({ bg, fg }),
  Adaptive: ({ fg = INK }) =>
    G1.Adaptive({ fg }),
};

const MARKS = [T1, T2, T3, G1, G2, G3, M1, C1];

Object.assign(window, {
  MARKS, T1, T2, T3, G1, G2, G3, M1, C1,
  LOGO_TOKENS: { PAPER, PAPER_HI, INK, DARK, ON_DARK,
    C_MARROM, C_VERMELHO, C_AMARELO, C_VERDE, C_AZUL, FONT },
});
