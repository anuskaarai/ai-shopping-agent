import { useState } from 'react';

export default function Login({ onLogin }) {
  const [step, setStep] = useState('welcome');

  const handleMockGoogleAuth = () => {
    setStep('chooser');
  };

  const handleSelectAccount = () => {
    // Pass mock user data to App
    onLogin({
      name: 'Anuskaa Rai',
      email: 'anuskaarai@gmail.com',
      avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Anuskaa&backgroundColor=f5efe6'
    });
  };

  if (step === 'chooser') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f9', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ background: '#fff', padding: '36px 40px 36px', borderRadius: '28px', width: '100%', maxWidth: '448px', boxShadow: '0px 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <svg viewBox="0 0 48 48" width="40" height="40">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 400, color: '#1f1f1f', margin: '0 0 8px' }}>Choose an account</h1>
          <p style={{ fontSize: '16px', color: '#1f1f1f', margin: '0 0 24px' }}>to continue to ShopSense</p>

          <div style={{ textAlign: 'left', borderTop: '1px solid #dadce0' }}>
            <button
              onClick={handleSelectAccount}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #dadce0', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <img src="https://api.dicebear.com/9.x/notionists/svg?seed=Anuskaa&backgroundColor=e8dcc8" alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#3c4043' }}>Anuskaa Rai</div>
                <div style={{ fontSize: '12px', color: '#5f6368' }}>anuskaarai@gmail.com</div>
              </div>
            </button>
            <button
              onClick={handleSelectAccount}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid #dadce0' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '1px solid #dadce0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#5f6368"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#3c4043' }}>Use another account</div>
            </button>
          </div>
          
          <div style={{ marginTop: '36px', fontSize: '12px', color: '#5f6368', textAlign: 'left' }}>
            To continue, Google will share your name, email address, and profile picture with ShopSense.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #8B5E3C, #A0522D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,90,43,0.35)', margin: '0 auto 1.5rem' }}>
          <span style={{ fontSize: '24px' }}>🛍️</span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome to ShopSense</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Your personal AI shopping assistant. Sign in to save your chat history and preferences.</p>
        <button
          onClick={handleMockGoogleAuth}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.875rem', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
