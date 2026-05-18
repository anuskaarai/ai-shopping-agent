import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function Login({ onLogin }) {
  const [showError, setShowError] = useState(false);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #8B5E3C, #A0522D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,90,43,0.35)', margin: '0 auto 1.5rem' }}>
          <ShoppingBag size={28} color="#fff8f0" />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome to ShopSense</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Your personal AI shopping assistant. Sign in to save your chat history and preferences.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'left', border: '1px solid #fecaca' }}>
              <strong>Setup Required:</strong> Real Google Login requires a Client ID to work for all users on all devices.
              <br /><br />
              Please check the <code>google_setup_guide.md</code> file in the project for instructions on how to enable this.
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
