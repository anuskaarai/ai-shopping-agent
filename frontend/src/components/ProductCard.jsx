import { CheckCircle, XCircle, Star, Tag, Zap, ShoppingCart } from 'lucide-react';

/**
 * ProductCard — pros/cons/matchScore come directly on the product object
 * (merged in by the controller from Gemini's recommendations[])
 */
export default function ProductCard({ product, delay = 0 }) {
  const { 
    name = 'Product', brand = '', price = 0, rating = 4.5, 
    style = 'casual', useCase = [], features = [], subcategory = '',
    matchScore = null, pros = [], cons = [], link = null, imageUrl = null,
    description = ''
  } = product || {};

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
    premium: { bg: 'rgba(139,90,43,0.15)', text: '#6B4226', border: 'rgba(139,90,43,0.3)' },
    casual:  { bg: 'rgba(160,82,45,0.1)',  text: '#8B5E3C', border: 'rgba(160,82,45,0.25)' },
    gaming:  { bg: 'rgba(180,60,60,0.1)',  text: '#c0392b', border: 'rgba(180,60,60,0.2)' },
    formal:  { bg: 'rgba(90,127,78,0.1)',  text: '#5a7f4e', border: 'rgba(90,127,78,0.2)' },
    budget:  { bg: 'rgba(184,115,51,0.1)', text: '#b87333', border: 'rgba(184,115,51,0.2)' },
    outdoor: { bg: 'rgba(78,120,60,0.1)',  text: '#4e783c', border: 'rgba(78,120,60,0.2)' },
    sport:   { bg: 'rgba(60,100,150,0.1)', text: '#3c6496', border: 'rgba(60,100,150,0.2)' },
  };
  const sc = styleColors[style] || styleColors.casual;

  const scoreColor = matchScore !== null
    ? (matchScore >= 85 ? '#5a7f4e' : matchScore >= 65 ? '#b87333' : '#8B5E3C')
    : null;

  return (
    <div
      className="glass-card product-enter"
      style={{ animationDelay: `${delay}ms`, padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent-primary), var(--accent-secondary), transparent)', opacity: 0.5 }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-glow)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
            {categoryEmoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{brand}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          </div>
        </div>

        {/* Match score */}
        {matchScore !== null && (
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: scoreColor, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{matchScore}%</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>match</div>
          </div>
        )}
      </div>

      {/* Rating + style badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map((i) => (
            <Star key={i} size={11} fill={i <= stars ? 'var(--warning)' : 'transparent'} color={i <= stars ? 'var(--warning)' : 'var(--text-muted)'} />
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{rating}</span>
        <div style={{ padding: '2px 8px', borderRadius: '999px', background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>
          {style}
        </div>
      </div>

      {/* Pros & Cons */}
      {(pros.length > 0 || cons.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
          {pros.map((p, i) => (
            <div key={`pro-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <CheckCircle size={12} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.74rem', color: 'var(--success)', lineHeight: 1.4 }}>{p}</span>
            </div>
          ))}
          {cons.map((c, i) => (
            <div key={`con-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
              <XCircle size={12} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Feature chips fallback */}
      {pros.length === 0 && features?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {features.slice(0, 3).map((f) => (
            <span key={f} style={{ padding: '2px 8px', borderRadius: '6px', background: 'var(--accent-glow)', border: '1px solid var(--border)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{f}</span>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.625rem', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Tag size={10} color="var(--text-muted)" />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Price</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em' }}>
            {formattedPrice}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow"
              style={{ textDecoration: 'none', padding: '0.3rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1, justifyContent: 'center' }}
              title="View Product"
            >
              View Product
            </a>
          ) : (
            <>
              <a
                href={`https://duckduckgo.com/?q=!ducky+${encodeURIComponent(name)}+site%3Aamazon.in`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow"
                style={{ textDecoration: 'none', padding: '0.3rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1, justifyContent: 'center' }}
                title="Open direct product on Amazon"
              >
                Amazon
              </a>
              <a
                href={`https://duckduckgo.com/?q=!ducky+${encodeURIComponent(name)}+site%3Aflipkart.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow"
                style={{ textDecoration: 'none', padding: '0.3rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1, justifyContent: 'center', background: 'rgba(20, 100, 255, 0.05)' }}
                title="Open direct product on Flipkart"
              >
                Flipkart
              </a>
              <a
                href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow"
                style={{ textDecoration: 'none', padding: '0.3rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', flex: 1, justifyContent: 'center', background: 'rgba(200, 50, 50, 0.05)' }}
                title="Search on Google Shopping"
              >
                Web
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
