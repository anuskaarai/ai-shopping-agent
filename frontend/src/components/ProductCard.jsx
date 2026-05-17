import { Star, ShoppingCart, Zap, Tag } from 'lucide-react';

/**
 * ProductCard — Displays a single recommended product.
 * Delay prop staggers the entrance animation for visual polish.
 */
export default function ProductCard({ product, delay = 0 }) {
  const { name, brand, price, rating, style, useCase, features, subcategory, color } = product;

  const stars = Math.round(rating);
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
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

  return (
    <div
      className="glass-card product-enter"
      style={{
        animationDelay: `${delay}ms`,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top glow accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)',
          opacity: 0.6,
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              flexShrink: 0,
            }}
          >
            {categoryEmoji}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {brand}
            </div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
              }}
            >
              {name}
            </div>
          </div>
        </div>

        {/* Style badge */}
        <div
          style={{
            padding: '3px 10px',
            borderRadius: '999px',
            background: sc.bg,
            color: sc.text,
            border: `1px solid ${sc.border}`,
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {style}
        </div>
      </div>

      {/* Rating row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={12}
              fill={i <= stars ? '#fbbf24' : 'transparent'}
              color={i <= stars ? '#fbbf24' : '#374151'}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {rating}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>· {color}</span>
      </div>

      {/* Features */}
      {features?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {features.slice(0, 3).map((f) => (
            <span
              key={f}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Use cases */}
      {useCase?.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <Zap size={10} color="var(--text-muted)" />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {useCase.slice(0, 3).join(' · ')}
          </span>
        </div>
      )}

      {/* Price + CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '0.625rem',
          borderTop: '1px solid rgba(99,102,241,0.1)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Tag size={11} color="var(--text-muted)" />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Price</span>
          </div>
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            {formattedPrice}
          </div>
        </div>

        <button
          className="btn-glow"
          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <ShoppingCart size={13} />
          Buy Now
        </button>
      </div>
    </div>
  );
}
