import { User, Zap, DollarSign, Target, Star } from 'lucide-react';

export default function PreferenceSummary({ preferences }) {
  const entries = Object.entries(preferences || {}).filter(([, v]) => v && v !== 'null');
  if (entries.length === 0) return null;

  const icons = { budget: DollarSign, usage: Zap, style: Star, priority: Target, brand: User };
  const labels = { budget: 'Budget', usage: 'Usage', style: 'Style', priority: 'Priority', brand: 'Brand' };

  return (
    <div style={{
      borderRadius: '0.875rem',
      border: '1px solid rgba(139,90,43,0.22)',
      background: 'rgba(139,90,43,0.06)',
      padding: '0.875rem',
      marginBottom: '0.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5E3C', boxShadow: '0 0 5px rgba(139,90,43,0.6)' }} />
        <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B5E3C' }}>
          Understood So Far
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {entries.map(([key, value]) => {
          const Icon = icons[key] || Target;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, background: 'rgba(139,90,43,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
                <Icon size={10} color="#8B5E3C" />
              </div>
              <div>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', lineHeight: 1 }}>{labels[key] || key}</span>
                <span style={{ fontSize: '0.81rem', color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
