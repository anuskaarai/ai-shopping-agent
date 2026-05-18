import { CheckCircle, XCircle, Star, Tag, Zap, ShoppingCart } from 'lucide-react';

/**
 * ProductCard — shows a recommended product with:
 * - Match score badge
 * - ✓ pros (why recommended)
 * - ✗ cons (honest tradeoffs)
 */
export default function ProductCard({ product, delay = 0, reasons }) {
  const { name, brand, price, rating, style, useCase, features, subcategory, color } = product;
  const { matchScore = null, pros = [], cons = [] } = reasons || {};

  const stars = Math.round(rating);
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);

  const categoryEmoji = {
    headphones: '🎧', earbuds: '🎵', smartphone: '📱', laptop: '💻',
    smartwatch: '⌚', speaker: '🔊', tv: '📺', sneakers: '👟',
    running: '🏃', formal: '👔', boots: '🥾', jeans: '👖',
    tshirt: '👕', shirt: '👔', jacket: '🧥', blazer: '🥼',
    gaming: '🎮', printer: '🖨️', bag: '🎒', mouse: '🖱️', keyboard: '⌨️',
  }[subcategory] || '📦';

  const styleColors = {
    premium: { bg: 'rgba(139,92,246,0.12)', text: '#c4b5fd', border: 'rgba(139,92,246,0.25)' },
    casual:  { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
    gaming:  { bg: 'rgba(239,68,68,0.10)',  text: '#fca5a5', border: 'rgba(239,68,68,0.2)' },
    formal:  { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7', border: 'rgba(16,185,129,0.2)' },
    budget:  { bg: 'rgba(245,158,11,0.10)', text: '#fcd34d', border: 'rgba(245,158,11,0.2)' },
    outdoor: { bg: 'rgba(34,197,94,0.10)',  text: '#86efac', border: 'rgba(34,197,94,0.2)' },
    sport:   { bg: 'rgba(6,182,212,0.10)',  text: '#67e8f9', border: 'rgba(6,182,212,0.2)' },
  };
  const sc = styleColors[style] || styleColors.casual;

  const scoreColor = matchScore >= 85 ? '#10b981' : matchScore >= 65 ? '#f59e0b' : '#6366f1';

  return (
    <div
      className="glass-card product-enter"
      style={{ animationDelay: `${delay}ms`, padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)', opacity: 0.6 }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: 0 }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
            {categoryEmoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{brand}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          </div>
        </div>

        {/* Match score */}
        {matchScore !== null && (
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: scoreColor, lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{matchScore}%</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>match</div>
          </div>
        )}
      </div>

      {/* Rating + style */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map((i) => (
            <Star key={i} size={11} fill={i <= stars ? '#fbbf24' : 'transparent'} color={i <= stars ? '#fbbf24' : '#374151'} />
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{rating}</span>
        <div style={{ padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>
          {style}
        </div>
      </div>

      {/* Pros (why recommended) */}
      {pros.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {pros.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <CheckCircle size={12} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.75rem', color: '#d1fae5', lineHeight: 1.4 }}>{p}</span>
            </div>
          ))}
          {cons.map((c, i) => (
            <div key={`con-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <XCircle size={12} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.75rem', color: '#fecaca', lineHeight: 1.4 }}>{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Features (fallback if no reasons) */}
      {pros.length === 0 && features?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {features.slice(0, 3).map((f) => (
            <span key={f} style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{f}</span>
          ))}
        </div>
      )}

      {/* Use cases */}
      {useCase?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={10} color="var(--text-muted)" />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{useCase.slice(0, 3).join(' · ')}</span>
        </div>
      )}

      {/* Price + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.625rem', borderTop: '1px solid rgba(99,102,241,0.1)', marginTop: 'auto' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Tag size={10} color="var(--text-muted)" />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Price</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>{formattedPrice}</div>
        </div>
        <button className="btn-glow" style={{ padding: '0.4rem 0.875rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <ShoppingCart size={12} />Buy Now
        </button>
      </div>
    </div>
  );
}
