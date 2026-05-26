// logo-canvas.jsx — apresentação das 9 marcas para o app "1%"
// Para cada marca: card hero + grid de variantes (light, dark, mono, icon, adaptive)
// + mockups de iOS springboard e Android launcher pros 3 finalistas.

// ─── Atoms ───
function Cell({ bg = LOGO.paper, h = 220, label, children, style }) {
  return (
    <div style={{
      background: bg, borderRadius: 12,
      padding: 0, position: 'relative',
      display: 'flex', flexDirection: 'column',
      border: '0.5px solid rgba(0,0,0,0.08)',
      overflow: 'hidden', ...style,
    }}>
      <div style={{
        flex: 1, minHeight: h, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 16, overflow: 'hidden',
      }}>{children}</div>
      {label && (
        <div style={{
          padding: '6px 10px',
          fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.95)',
          background: 'rgba(0,0,0,0.55)',
          textAlign: 'center',
        }}>{label}</div>
      )}
    </div>
  );
}

function SectionTitle({ kind, name, rationale }) {
  return (
    <div style={{ marginBottom: 16, padding: '0 4px' }}>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
        color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase',
      }}>{kind}</div>
      <div style={{
        fontFamily: FD, fontSize: 32, fontWeight: 700, letterSpacing: -0.6,
        color: LOGO.ink, marginTop: 2,
      }}>{name}</div>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 4,
        maxWidth: 520, lineHeight: 1.5,
      }}>{rationale}</div>
    </div>
  );
}

// ─── Variant sheet por marca ───
function VariantSheet({ mark, w = 760 }) {
  const M = mark;
  // Pega cores default do .Icon — extraindo bg/fg via call de teste
  return (
    <div style={{ width: w }}>
      <SectionTitle kind={M.kind} name={M.name} rationale={M.rationale}/>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12,
      }}>
        <Cell bg={LOGO.paper} label="WORDMARK · LIGHT">
          <M.Wordmark color={LOGO.ink} h={92}/>
        </Cell>
        <Cell bg={LOGO.dark} label="WORDMARK · DARK">
          <M.Wordmark color={LOGO.onDark} h={92}/>
        </Cell>
        <Cell bg="#FFFFFF" label="WORDMARK · MONO">
          <M.Wordmark color="#000000" h={92}/>
        </Cell>
        <Cell bg="#222" label="APP ICON · 1024" style={{ padding: 0 }}>
          <div style={{ borderRadius: 28, overflow: 'hidden', width: 168, height: 168 }}>
            <M.Icon size={168}/>
          </div>
        </Cell>
        <Cell bg="#222" label="ADAPTIVE (66% SAFE)">
          {/* Foreground sobre placeholder de background neutro */}
          <div style={{
            width: 168, height: 168, borderRadius: '50%',
            background: LOGO.paper,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <M.Adaptive size={168}/>
            {/* safe zone guide */}
            <div style={{
              position: 'absolute', width: '66%', height: '66%',
              border: '1px dashed rgba(0,0,0,0.18)', borderRadius: '50%',
              pointerEvents: 'none',
            }}/>
          </div>
        </Cell>
      </div>
    </div>
  );
}

// ─── iOS Springboard mockup ───
function IOSSpringboard({ mark }) {
  // App grid 4x6, ícone "1%" no slot principal
  const apps = [
    { name: 'Mensagens', color: '#34C759' },
    { name: 'Calendário', color: '#FFFFFF' },
    { name: 'Fotos', color: '#FECB00' },
    { name: 'Câmera', color: '#3A3A3C' },
    { name: '1%', mark: true },
    { name: 'Notas', color: '#FFEB3B' },
    { name: 'Music', color: '#FF2D55' },
    { name: 'Settings', color: '#8E8E93' },
    { name: 'Mail', color: '#0A84FF' },
    { name: 'Maps', color: '#E5E5EA' },
    { name: 'Health', color: '#FFFFFF' },
    { name: 'Clock', color: '#000000' },
  ];

  return (
    <div style={{
      width: 320, height: 640,
      borderRadius: 44, overflow: 'hidden',
      position: 'relative',
      background: `linear-gradient(160deg, #2c3e50 0%, #4a6b8a 50%, #b89968 100%)`,
      boxShadow: '0 30px 60px rgba(0,0,0,0.3), 0 0 0 2px #1a1a1a',
      padding: '60px 20px 80px',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, system-ui, sans-serif',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 28, borderRadius: 20, background: '#000',
      }}/>
      <div style={{ color: '#fff', fontSize: 64, fontWeight: 200,
        textAlign: 'center', letterSpacing: -1, marginBottom: 6,
        textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
        9:41
      </div>
      <div style={{ color: '#fff', fontSize: 13, fontWeight: 500,
        textAlign: 'center', opacity: 0.95, marginBottom: 28,
        textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
        ter, 20 de maio
      </div>

      {/* App grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 12px',
        marginTop: 8,
      }}>
        {apps.map((a, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 13,
              background: a.color || '#fff',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              border: a.color === '#FFFFFF' ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
            }}>
              {a.mark && <mark.Icon size={56}/>}
            </div>
            <div style={{
              fontSize: 10, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              fontWeight: 500,
            }}>{a.name}</div>
          </div>
        ))}
      </div>

      {/* dock */}
      <div style={{
        position: 'absolute', bottom: 24, left: 12, right: 12,
        height: 78, borderRadius: 28,
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0 14px',
      }}>
        {['#0A84FF', '#34C759', '#FF9500', '#FF2D55'].map((c, i) => (
          <div key={i} style={{
            width: 50, height: 50, borderRadius: 12,
            background: c,
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Android launcher mockup ───
function AndroidLauncher({ mark, mask = 'circle' }) {
  // mask: 'circle' | 'squircle' | 'square'
  const apps = [
    { name: 'Phone', color: '#0F9D58' },
    { name: 'Messages', color: '#1A73E8' },
    { name: 'Chrome', color: '#fff' },
    { name: '1%', mark: true },
    { name: 'Maps', color: '#34A853' },
    { name: 'Gmail', color: '#fff' },
    { name: 'Photos', color: '#fff' },
    { name: 'YouTube', color: '#FF0000' },
    { name: 'Drive', color: '#fff' },
    { name: 'Calendar', color: '#fff' },
    { name: 'Camera', color: '#000' },
    { name: 'Settings', color: '#5F6368' },
    { name: 'Files', color: '#1A73E8' },
    { name: 'Clock', color: '#fff' },
    { name: 'Calculator', color: '#fff' },
    { name: 'Notes', color: '#FBBC04' },
  ];

  const maskRadius = mask === 'circle' ? '50%' : mask === 'squircle' ? '28%' : '12%';

  return (
    <div style={{
      width: 320, height: 640,
      borderRadius: 36, overflow: 'hidden',
      position: 'relative',
      background: `linear-gradient(180deg, #5a4a3a 0%, #2c2820 100%)`,
      boxShadow: '0 30px 60px rgba(0,0,0,0.3), 0 0 0 2px #1a1a1a',
      padding: '50px 16px 80px',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Roboto, system-ui, sans-serif',
    }}>
      {/* punch-hole camera */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 8, height: 8, borderRadius: 4, background: '#000',
      }}/>

      <div style={{ color: '#fff', fontSize: 56, fontWeight: 300,
        marginBottom: 4 }}>9:41</div>
      <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13,
        marginBottom: 24 }}>Quarta, 20 de maio</div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px 8px',
      }}>
        {apps.map((a, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: maskRadius,
              background: a.color || '#1F1B17',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {a.mark && <mark.Icon size={52}/>}
            </div>
            <div style={{
              fontSize: 9, color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              fontWeight: 400,
            }}>{a.name}</div>
          </div>
        ))}
      </div>

      {/* nav bar */}
      <div style={{
        position: 'absolute', bottom: 18, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60,
      }}>
        <div style={{ width: 14, height: 14, borderLeft: '2px solid #fff',
          borderTop: '2px solid #fff', transform: 'rotate(-45deg)' }}/>
        <div style={{ width: 14, height: 14, borderRadius: '50%',
          border: '2px solid #fff' }}/>
        <div style={{ width: 14, height: 14, border: '2px solid #fff' }}/>
      </div>
    </div>
  );
}

Object.assign(window, {
  Cell, SectionTitle, VariantSheet, IOSSpringboard, AndroidLauncher,
});
