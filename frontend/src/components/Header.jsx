import { ShoppingBag, Sparkles, RefreshCw } from 'lucide-react';

/**
 * Header — Top navigation bar.
 * Shows brand name, tagline, and a "New Search" reset button.
 */
export default function Header({ onReset }) {
  return (
    <header
      style={{
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        background: 'rgba(10,11,20,0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99,102,241,0.4)',
            }}
          >
            <ShoppingBag size={18} color="white" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: '1.125rem',
                background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.1,
              }}
            >
              ShopSense
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              AI Shopping Agent
            </div>
          </div>
        </div>

        {/* Center badge */}
        <div
          className="badge badge-purple"
          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
        >
          <Sparkles size={10} />
          Powered by Gemini
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            borderRadius: '0.625rem',
            border: '1px solid rgba(99,102,241,0.25)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <RefreshCw size={13} />
          New Search
        </button>
      </div>
    </header>
  );
}
