import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function Login({ onLogin }) {
  const [showError, setShowError] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      onLogin({
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture
      });
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      alert('Login failed. Please try again.');
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
    setShowError(true);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) return;
    if (isRegistering && !name) return;
    
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    const payload = isRegistering ? { name, email, password } : { email, password };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store JWT if we want to make authenticated requests later
      localStorage.setItem('token', data.token);
      
      onLogin(data.user);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #8B5E3C, #A0522D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,90,43,0.35)', margin: '0 auto 1.5rem' }}>
          <ShoppingBag size={28} color="#fff8f0" />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome to ShopSense</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your personal AI shopping assistant.</p>
        
        {authError && (
          <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #fecaca' }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {isRegistering && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }}
            />
          )}
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.9rem' }}
          />
          <button 
            type="submit" 
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#111827', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '0.25rem' }}
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <span 
            onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
            style={{ color: '#8B5E3C', cursor: 'pointer', fontWeight: 600 }}
          >
            {isRegistering ? 'Log in' : 'Sign up'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'left', border: '1px solid #fecaca' }}>
              <strong>Setup Required:</strong> Real Google Login requires a Client ID to work for all users on all devices.
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
            />
          )}

          {showError && (
            <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'left', border: '1px solid #fecaca' }}>
              <strong>Login Failed (401 invalid_client)</strong><br />
              Google blocked the login because your Vercel domain is not whitelisted in your Google Cloud Console. 
              Please add your Vercel URL to your "Authorized JavaScript origins".
            </div>
          )}
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
