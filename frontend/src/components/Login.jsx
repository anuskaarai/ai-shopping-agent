import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function Login({ onLogin }) {
  const [showHelp, setShowHelp] = useState(false);

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
    setShowHelp(true);
  };

  const handleFallback = () => {
    onLogin({
      name: 'Anuskaa Rai',
      email: 'anuskaarai@gmail.com',
      avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Anuskaa&backgroundColor=f5efe6'
    });
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
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="outline"
            size="large"
            shape="rectangular"
            text="continue_with"
          />
          {showHelp && (
            <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'left' }}>
              <strong>OAuth Error:</strong> The Google Client ID does not authorize this domain. To fix this, you must create a Client ID in Google Cloud Console and add it to your Vercel Environment Variables as <code>VITE_GOOGLE_CLIENT_ID</code>.
              <br /><br />
              For now, you can continue using a local test account:
              <button 
                onClick={handleFallback}
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Continue in Hackathon Mode
              </button>
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
