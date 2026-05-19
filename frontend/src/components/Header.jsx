import { ShoppingBag, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-primary)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem',
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--user-bubble)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <ShoppingBag size={18} color="#fff8f0" />
          </div>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700, fontSize: '1.15rem',
              color: 'var(--text-primary)', lineHeight: 1.1,
              letterSpacing: '-0.01em',
            }}>
              Nexora
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              AI Electronics Agent
            </div>
          </div>
        </div>

        {/* Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          padding: '4px 12px', borderRadius: '999px',
          background: 'var(--accent-glow)',
          border: '1px solid var(--border)',
          fontSize: '0.65rem', fontWeight: 700,
          color: 'var(--accent-primary)', letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          <Sparkles size={10} />
          Powered by Gemini
        </div>
      </div>
    </header>
  );
}
