import { User, Zap, DollarSign, Target, Star } from 'lucide-react';

/**
 * PreferenceSummary — shows the structured preferences ShopSense has
 * extracted from the conversation so far.
 * Appears in the right panel once preferences are known.
 */
export default function PreferenceSummary({ preferences }) {
  const entries = Object.entries(preferences).filter(([, v]) => v && v !== 'null');
  if (entries.length === 0) return null;

  const icons = { budget: DollarSign, usage: Zap, style: Star, priority: Target, brand: User };

  const labels = { budget: 'Budget', usage: 'Usage', style: 'Style', priority: 'Priority', brand: 'Brand' };

  return (
    <div
      style={{
        borderRadius: '1rem',
        border: '1px solid rgba(99,102,241,0.25)',
        background: 'rgba(99,102,241,0.05)',
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#6366f1',
            boxShadow: '0 0 6px rgba(99,102,241,0.8)',
          }}
        />
        <span
          style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#a5b4fc',
          }}
        >
          Understood So Far
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {entries.map(([key, value]) => {
          const Icon = icons[key] || Target;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div
                style={{
                  width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
                  background: 'rgba(99,102,241,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginTop: '1px',
                }}
              >
                <Icon size={10} color="#a5b4fc" />
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>
                  {labels[key] || key}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
