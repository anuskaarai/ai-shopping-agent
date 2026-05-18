import { MessageSquare, PlusCircle, LogOut } from 'lucide-react';

export default function Sidebar({ user, sessions, currentSessionId, onSelectSession, onNewSession, onLogout }) {
  return (
    <div style={{
      width: '260px',
      background: 'rgba(237,228,211,0.95)',
      borderRight: '1px solid rgba(139,90,43,0.15)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
    }}>
      <div style={{ padding: '1rem' }}>
        <button
          onClick={onNewSession}
          className="btn-glow"
          style={{
            width: '100%',
            padding: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
          }}
        >
          <PlusCircle size={16} /> New Search
        </button>
      </div>

      <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        Previous Searches
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 0.75rem',
              background: session.id === currentSessionId ? 'rgba(139,90,43,0.1)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: session.id === currentSessionId ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: session.id === currentSessionId ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.2s',
              marginBottom: '2px',
            }}
            onMouseEnter={(e) => {
              if (session.id !== currentSessionId) e.currentTarget.style.background = 'rgba(139,90,43,0.05)';
            }}
            onMouseLeave={(e) => {
              if (session.id !== currentSessionId) e.currentTarget.style.background = 'transparent';
            }}
          >
            <MessageSquare size={14} color={session.id === currentSessionId ? '#8B5E3C' : 'var(--text-muted)'} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session.title}
            </span>
          </button>
        ))}
        {sessions.length === 0 && (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No history yet
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid rgba(139,90,43,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139,90,43,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5E3C', fontWeight: 'bold' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{user?.name || 'User'}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.4rem', background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            transition: 'color 0.2s', borderRadius: '6px',
          }}
          title="Sign out"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#c0392b';
            e.currentTarget.style.background = 'rgba(180,60,60,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
