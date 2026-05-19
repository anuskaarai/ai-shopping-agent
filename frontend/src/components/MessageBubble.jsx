import ReactMarkdown from 'react-markdown';
import { AlertTriangle } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.type === 'error';

  return (
    <div className="msg-enter" style={{
      display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row',
      gap: '0.75rem', alignItems: 'flex-end', maxWidth: '100%',
    }}>
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
        background: isUser
          ? 'var(--user-bubble)'
          : isError ? 'rgba(239,68,68,0.12)'
          : 'var(--accent-glow)',
        border: isUser ? 'none'
          : isError ? '1px solid rgba(239,68,68,0.3)'
          : '1px solid var(--border)',
      }}>
        {isUser ? '👤' : isError ? '⚠️' : '🤖'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: 'min(72%, 560px)',
        padding: '0.875rem 1.125rem',
        borderRadius: isUser ? '1.125rem 1.125rem 4px 1.125rem' : '1.125rem 1.125rem 1.125rem 4px',
        background: isUser
          ? 'var(--user-bubble)'
          : isError ? 'rgba(239,68,68,0.08)'
          : 'var(--ai-bubble)',
        border: isUser ? 'none'
          : isError ? '1px solid rgba(239,68,68,0.2)'
          : '1px solid var(--border)',
        color: isUser ? '#ffffff' : 'var(--text-primary)',
        fontSize: '0.9rem', lineHeight: 1.65, wordBreak: 'break-word',
      }}>
        {isError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
            <AlertTriangle size={12} /> Something went wrong
          </div>
        )}

        {isUser ? (
          <span>{message.text}</span>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ margin: '0 0 0.5rem 0' }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{children}</strong>,
              em: ({ children }) => <em style={{ color: 'var(--accent-primary)' }}>{children}</em>,
              ul: ({ children }) => <ul style={{ paddingLeft: '1.25rem', margin: '0.4rem 0' }}>{children}</ul>,
              li: ({ children }) => <li style={{ marginBottom: '0.2rem' }}>{children}</li>,
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}

        <div style={{
          marginTop: '0.35rem', fontSize: '0.62rem',
          color: isUser ? 'rgba(255,248,240,0.5)' : 'var(--text-muted)',
          textAlign: isUser ? 'right' : 'left',
        }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {message.isFallback && ' · fallback'}
        </div>
      </div>
    </div>
  );
}
