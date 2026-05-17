import { Lightbulb, TrendingUp } from 'lucide-react';
import ProductCard from './ProductCard';

/**
 * ProductGrid — Panel showing AI-recommended products with reasoning.
 * Appears on the right side of the layout (or below on mobile).
 */
export default function ProductGrid({ products, reasoning }) {
  if (!products || products.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
        overflowY: 'auto',
        padding: '0.25rem',
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.25rem' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TrendingUp size={14} color="#a5b4fc" />
        </div>
        <div>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Recommended For You
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {products.length} match{products.length !== 1 ? 'es' : ''} found
          </div>
        </div>
      </div>

      {/* AI Reasoning panel */}
      {reasoning && (
        <div
          style={{
            padding: '0.875rem 1rem',
            borderRadius: '1rem',
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.45rem',
            }}
          >
            <Lightbulb size={12} color="#a5b4fc" />
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#a5b4fc',
              }}
            >
              Why these products?
            </span>
          </div>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {reasoning}
          </p>
        </div>
      )}

      {/* Product cards with staggered animation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} delay={i * 80} />
        ))}
      </div>
    </div>
  );
}
