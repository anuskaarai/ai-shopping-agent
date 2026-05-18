import { ShoppingBag } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function Login({ onLogin }) {
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
    alert('Google Login failed. If you see an origin mismatch error, please check the console or ensure your VITE_GOOGLE_CLIENT_ID is set correctly.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #8B5E3C, #A0522D)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139,90,43,0.35)', margin: '0 auto 1.5rem' }}>
          <ShoppingBag size={28} color="#fff8f0" />
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome to ShopSense</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Your personal AI shopping assistant. Sign in to save your chat history and preferences.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="outline"
            size="large"
            shape="rectangular"
            text="continue_with"
          />
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
