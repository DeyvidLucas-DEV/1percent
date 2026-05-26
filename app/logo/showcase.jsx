// showcase.jsx — Componentes de apresentação das marcas

const { PAPER, PAPER_HI, INK, DARK, ON_DARK, FONT } = window.LOGO_TOKENS;

// Card da marca: wordmark em cima + ficha embaixo
function MarkHeroCard({ mark, variant = 'light' }) {
  const isDark = variant === 'dark';
  const bg = isDark ? DARK : PAPER;
  const fg = isDark ? ON_DARK : INK;
  return (
    <div style={{
      background: bg, color: fg,
      borderRadius: 24, overflow: 'hidden',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
    }}>
      {/* arena do logo */}
      <div style={{
        flex: 1, padding: '64px 24px', minHeight: 240,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* canto: nome do conceito */}
        <div style={{
          position: 'absolute', top: 16, left: 18,
          fontSize: 10, letterSpacing: 1.4,
          textTransform: 'uppercase', fontWeight: 700,
          opacity: 0.55,
        }}>{mark.kind}</div>
        <div style={{ width: '100%', maxWidth: 280, height: 140,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <mark.Wordmark color={fg}/>
        </div>
      </div>
      {/* ficha */}
      <div style={{
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
        padding: '14px 18px',
        display: 'flex', alignItems: 'baseline', gap: 12,
      }}>
        <div style={{
          fontFamily: FONT, fontWeight: 700,
          fontSize: 17, letterSpacing: -0.3,
        }}>{mark.name}</div>
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 11, opacity: 0.6,
          lineHeight: 1.45,
        }}>{mark.rationale}</div>
      </div>
    </div>
  );
}

// Mostra a marca em todas as 5 variações necessárias
function MarkBreakdown({ mark }) {
  const Cell = ({ label, sub, children, height = 200 }) => (
    <div>
      <div style={{
        fontFamily: 'Inter, system-ui',
        fontSize: 10, fontWeight: 700, color: INK,
        letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.55,
        marginBottom: 8,
      }}>{label}</div>
      <div style={{ height, borderRadius: 18, overflow: 'hidden' }}>{children}</div>
      {sub && (
        <div style={{
          fontFamily: 'Inter, system-ui', fontSize: 10, color: INK,
          opacity: 0.5, marginTop: 6,
        }}>{sub}</div>
      )}
    </div>
  );

  // padding-friendly wordmark holder
  const WMHolder = ({ bg, fg }) => (
    <div style={{
      width: '100%', height: '100%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 220, height: 120,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <mark.Wordmark color={fg}/>
      </div>
    </div>
  );

  return (
    <div style={{
      background: PAPER_HI,
      borderRadius: 28, padding: 24,
      border: '1px solid rgba(0,0,0,0.08)',
      fontFamily: FONT,
    }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontFamily: 'Inter, system-ui',
          fontSize: 10, fontWeight: 700, color: INK,
          letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.5,
        }}>{mark.kind}</div>
        <div style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 24,
          color: INK, letterSpacing: -0.4, marginTop: 4,
        }}>{mark.name}</div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14,
        marginBottom: 14,
      }}>
        <Cell label="Light · bege" sub="ink sobre paper">
          <WMHolder bg={PAPER} fg={INK}/>
        </Cell>
        <Cell label="Dark · carvão" sub="paper sobre dark">
          <WMHolder bg={DARK} fg={ON_DARK}/>
        </Cell>
        <Cell label="Mono · contraste" sub="preto sobre branco">
          <WMHolder bg="#FFFFFF" fg="#000000"/>
        </Cell>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
      }}>
        <Cell label="Ícone do app · 1024" sub="full-bleed, iOS arredonda por fora">
          <div style={{ width: '100%', height: '100%' }}>
            <mark.Icon/>
          </div>
        </Cell>
        <Cell label="Adaptive Android · foreground" sub="símbolo na safe-zone 66%">
          <div style={{ width: '100%', height: '100%',
            background: `repeating-linear-gradient(45deg, ${PAPER}, ${PAPER} 8px, ${PAPER_HI} 8px, ${PAPER_HI} 16px)`,
            position: 'relative' }}>
            {/* máscara circular guia */}
            <svg viewBox="0 0 1024 1024" width="100%" height="100%"
              style={{ position: 'absolute', inset: 0 }}>
              <circle cx="512" cy="512" r="338"
                fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2"
                strokeDasharray="6 4"/>
            </svg>
            <div style={{ position: 'absolute', inset: 0 }}>
              <mark.Adaptive/>
            </div>
          </div>
        </Cell>
      </div>
    </div>
  );
}

// iOS springboard mockup com a marca como ícone
function IOSSpringboard({ mark, accent = '#3F5F3F' }) {
  // wallpaper degradê neutro
  const W = 390, H = 720;
  const apps = [
    { name: 'Calendário', color: '#fff', label: '21', isCal: true },
    { name: 'Notas',      color: '#FACC15', glyph: '✎' },
    { name: 'Câmera',     color: '#1f2937', glyph: '📷' }, // (não usamos emoji visualmente, é só layout)
    { name: 'Mapas',      color: '#34D399' },
    { name: 'Música',     color: '#F472B6' },
    { name: 'Mensagens',  color: '#22D3EE' },
    { name: 'Spotify',    color: '#10B981' },
    { name: 'WhatsApp',   color: '#16A34A' },
  ];
  const Tile = ({ children, name }) => (
    <div style={{
      width: 64, height: 64, borderRadius: 14, overflow: 'hidden',
      background: '#1f2937', display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>{children}</div>
  );
  return (
    <div style={{
      width: W, height: H, borderRadius: 36, overflow: 'hidden',
      position: 'relative',
      background: 'linear-gradient(160deg, #4A6B5C 0%, #2C3E4D 40%, #1F2933 100%)',
      fontFamily: 'Inter, system-ui',
    }}>
      {/* status bar */}
      <div style={{ height: 44, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', color: '#fff' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>9:41</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>5G ▮▮▮▮</span>
      </div>

      {/* data */}
      <div style={{ padding: '16px 24px 0', color: '#fff' }}>
        <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 600 }}>QUARTA, 20 MAI</div>
        <div style={{ fontFamily: window.LOGO_TOKENS.FONT, fontSize: 72,
          fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>9:41</div>
      </div>

      {/* grid de apps */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 100,
        padding: '0 28px', display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 22, justifyItems: 'center',
      }}>
        {/* nossa marca em primeiro */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Tile>
            <div style={{ width: '100%', height: '100%' }}>
              <mark.Icon/>
            </div>
          </Tile>
          <div style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>1%</div>
        </div>

        {apps.map((a, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6 }}>
            <Tile>
              <div style={{ width: '100%', height: '100%', background: a.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: a.color === '#fff' ? '#000' : '#fff' }}>
                {a.isCal && (
                  <div style={{ textAlign: 'center', lineHeight: 1 }}>
                    <div style={{ fontSize: 8, color: '#EF4444', fontWeight: 700 }}>QUA</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#000', marginTop: -2 }}>{a.label}</div>
                  </div>
                )}
                {a.glyph && !a.isCal && (
                  <div style={{ fontSize: 28 }}>{a.glyph}</div>
                )}
              </div>
            </Tile>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>{a.name}</div>
          </div>
        ))}
      </div>

      {/* dock */}
      <div style={{
        position: 'absolute', left: 14, right: 14, bottom: 18,
        height: 76, borderRadius: 28,
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0 12px',
      }}>
        {['#22C55E','#3B82F6','#F97316','#EF4444'].map((c, i) => (
          <div key={i} style={{
            width: 56, height: 56, borderRadius: 12, background: c,
          }}/>
        ))}
      </div>
    </div>
  );
}

// Android launcher mockup
function AndroidLauncher({ mark }) {
  const W = 380, H = 720;
  return (
    <div style={{
      width: W, height: H, borderRadius: 28, overflow: 'hidden',
      position: 'relative',
      background: 'linear-gradient(170deg, #C5B89B 0%, #A89E83 60%, #6B6356 100%)',
      fontFamily: 'Inter, system-ui',
    }}>
      {/* status bar */}
      <div style={{ height: 36, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px', color: '#111', fontSize: 12, fontWeight: 600 }}>
        <span>9:41</span>
        <span style={{ opacity: 0.6 }}>▮▮▮ 88%</span>
      </div>

      {/* clock */}
      <div style={{ padding: '14px 22px', color: '#111' }}>
        <div style={{ fontFamily: window.LOGO_TOKENS.FONT, fontSize: 88,
          fontWeight: 700, letterSpacing: -3, lineHeight: 0.9 }}>9:41</div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Qua, 20 mai</div>
      </div>

      {/* grid 4x4 */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 90,
        padding: '0 22px', display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 18, justifyItems: 'center',
      }}>
        {/* nosso ícone — círculo (máscara Android padrão) */}
        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            overflow: 'hidden', background: window.LOGO_TOKENS.PAPER,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            <mark.Adaptive/>
          </div>
          <div style={{ fontSize: 11, color: '#fff', fontWeight: 500,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>1%</div>
        </div>

        {[
          { c: '#4285F4', n: 'Chrome' },
          { c: '#34A853', n: 'Gmail' },
          { c: '#FBBC04', n: 'Maps' },
          { c: '#000000', n: 'Drive' },
          { c: '#7B61FF', n: 'Calendar' },
          { c: '#EA4335', n: 'Photos' },
          { c: '#1f2937', n: 'Files' },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: a.c, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}/>
            <div style={{ fontSize: 11, color: '#fff', fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{a.n}</div>
          </div>
        ))}
      </div>

      {/* dock barra */}
      <div style={{
        position: 'absolute', left: 18, right: 18, bottom: 12,
        height: 64, borderRadius: 18,
        background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 40, height: 40, borderRadius: '50%',
            background: ['#fff','#1f2937','#EF4444','#3B82F6','#10B981'][i-1],
          }}/>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MarkHeroCard, MarkBreakdown, IOSSpringboard, AndroidLauncher });
