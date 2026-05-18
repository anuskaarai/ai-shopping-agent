import { TrendingUp, Lightbulb, AlertCircle, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import PreferenceSummary from './PreferenceSummary';

/**
 * ProductGrid — Right panel showing:
 * 1. Preference summary (what ShopSense understood)
 * 2. Product cards with match scores + reasons
 * 3. Tradeoff note ("for ₹X more you get Y")
 * 4. Why NOT shown (excluded products reasoning)
 */
export default function ProductGrid({ products, reasoning, productReasons, tradeoffNote, whyNot, preferences }) {
  if (!products || products.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', height: '100%', overflowY: 'auto', padding: '0.25rem' }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={14} color="#a5b4fc" />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Best Picks For You
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            {products.length} recommendation{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Preference summary */}
      <PreferenceSummary preferences={preferences} />

      {/* Overall reasoning */}
      {reasoning && (
        <div style={{ padding: '0.75rem 0.875rem', borderRadius: '0.875rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
            <Lightbulb size={11} color="#a5b4fc" />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a5b4fc' }}>
              Why these?
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{reasoning}</p>
        </div>
      )}

      {/* Product cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            delay={i * 80}
            reasons={productReasons?.[product.id] || null}
          />
        ))}
      </div>

      {/* Tradeoff note */}
      {tradeoffNote && (
        <div style={{ padding: '0.75rem 0.875rem', borderRadius: '0.875rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: '0.5rem' }}>
          <ArrowRight size={14} color="#fcd34d" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.76rem', color: '#fde68a', lineHeight: 1.55, margin: 0 }}>{tradeoffNote}</p>
        </div>
      )}

      {/* Why NOT recommended */}
      {whyNot && (
        <div style={{ padding: '0.75rem 0.875rem', borderRadius: '0.875rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', gap: '0.5rem' }}>
          <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f87171', marginBottom: '0.25rem' }}>Not Recommended</div>
            <p style={{ fontSize: '0.74rem', color: '#fca5a5', lineHeight: 1.55, margin: 0 }}>{whyNot}</p>
          </div>
        </div>
      )}
    </div>
  );
}
