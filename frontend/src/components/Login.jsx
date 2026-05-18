import { ShoppingBag, LogIn } from 'lucide-react';

export default function Login({ onLogin }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '1rem',
    }}>
      <div className="glass-card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2.5rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #8B5E3C, #A0522D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(139,90,43,0.35)',
          margin: '0 auto 1.5rem',
        }}>
          <ShoppingBag size={28} color="#fff8f0" />
        </div>
        
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.75rem', color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}>
          Welcome to ShopSense
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '2rem',
        }}>
          Your personal AI shopping assistant. Sign in to save your chat history and preferences.
        </p>

        <button
          onClick={onLogin}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            padding: '0.875rem',
            borderRadius: '12px',
            background: 'white',
            border: '1px solid #e2e8f0',
            color: '#1e293b',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
          }}
        >
          <LogIn size={18} color="#4285F4" />
          Continue with Google
        </button>

        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
