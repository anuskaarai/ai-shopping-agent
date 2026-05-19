import { TrendingUp, Lightbulb, AlertCircle, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import PreferenceSummary from './PreferenceSummary';

export default function ProductGrid({ products, reasoning, whyNot, preferences }) {
  if (!products || products.length === 0) return null;

  // Check if we have at least one tradeoff note across products
  const tradeoffNote = products.find(p => p.tradeoff)?.tradeoff || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'var(--accent-glow)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TrendingUp size={14} color="var(--accent-primary)" />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
            Best Picks For You
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            {products.length} recommendation{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Preference Summary */}
      <PreferenceSummary preferences={preferences} />

      {/* Overall reasoning */}
      {reasoning && (
        <div style={{
          padding: '0.75rem 0.875rem', borderRadius: '0.875rem',
          background: 'var(--accent-glow)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
            <Lightbulb size={11} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
              Why these?
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{reasoning}</p>
        </div>
      )}

      {/* Product cards — pros/cons/matchScore are embedded on each product */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} delay={i * 80} />
        ))}
      </div>

      {/* Tradeoff note — use the first product's tradeoff as a general tip */}
      {tradeoffNote && (
        <div style={{
          padding: '0.75rem 0.875rem', borderRadius: '0.875rem',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.22)',
          display: 'flex', gap: '0.5rem',
        }}>
          <ArrowRight size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.76rem', color: 'var(--warning)', lineHeight: 1.55, margin: 0 }}>{tradeoffNote}</p>
        </div>
      )}

      {/* Why NOT recommended */}
      {whyNot && (
        <div style={{
          padding: '0.75rem 0.875rem', borderRadius: '0.875rem',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.18)',
          display: 'flex', gap: '0.5rem',
        }}>
          <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ef4444', marginBottom: '0.25rem' }}>
              Not Shown
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{whyNot}</p>
          </div>
        </div>
      )}
    </div>
  );
}
