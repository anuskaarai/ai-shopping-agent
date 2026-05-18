import { useState, useEffect } from 'react';
import './index.css';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ProductGrid from './components/ProductGrid';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import { useChat } from './hooks/useChat';

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('user'));
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('chat_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return localStorage.getItem('current_session_id') || `session_${Date.now()}`;
  });

  const {
    messages, products, reasoning, preferences,
    whyNot, isLoading, sendMessage, resetChat,
  } = useChat(currentSessionId);

  // Update sessions list when messages change
  useEffect(() => {
    if (messages.length > 1) {
      setSessions((prev) => {
        const existing = prev.find((s) => s.id === currentSessionId);
        const title = messages[1]?.text?.slice(0, 30) + '...' || 'New Search';
        if (existing) {
          const updated = prev.map((s) => s.id === currentSessionId ? { ...s, title } : s);
          localStorage.setItem('chat_sessions', JSON.stringify(updated));
          return updated;
        } else {
          const newSessions = [{ id: currentSessionId, title }, ...prev];
          localStorage.setItem('chat_sessions', JSON.stringify(newSessions));
          return newSessions;
        }
      });
    }
  }, [messages, currentSessionId]);

  const handleLogin = () => {
    localStorage.setItem('user', 'true');
    setUser('true');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleNewSession = () => {
    const newId = `session_${Date.now()}`;
    setCurrentSessionId(newId);
    localStorage.setItem('current_session_id', newId);
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
    localStorage.setItem('current_session_id', id);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const hasProducts = products.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header onReset={handleNewSession} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onLogout={handleLogout}
        />
        <main style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: hasProducts ? '1fr 390px' : '1fr',
          height: '100%',
          overflow: 'hidden',
          transition: 'grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Chat */}
          <div style={{
            borderRight: hasProducts ? '1px solid rgba(139,90,43,0.12)' : 'none',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <ChatWindow messages={messages} isLoading={isLoading} onSend={sendMessage} />
          </div>

          {/* Products */}
          {hasProducts && (
            <div style={{
              padding: '1.25rem 1rem',
              overflowY: 'auto',
              background: 'rgba(237,228,211,0.6)',
              borderLeft: '1px solid rgba(139,90,43,0.1)',
            }}>
              <ProductGrid
                products={products}
                reasoning={reasoning}
                whyNot={whyNot}
                preferences={preferences}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
