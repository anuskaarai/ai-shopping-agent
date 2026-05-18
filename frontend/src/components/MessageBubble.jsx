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
          ? 'linear-gradient(135deg, #8B5E3C, #A0522D)'
          : isError ? 'rgba(180,60,60,0.12)'
          : 'rgba(139,90,43,0.12)',
        border: isUser ? 'none'
          : isError ? '1px solid rgba(180,60,60,0.3)'
          : '1px solid rgba(139,90,43,0.22)',
      }}>
        {isUser ? '👤' : isError ? '⚠️' : '🤖'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: 'min(72%, 560px)',
        padding: '0.875rem 1.125rem',
        borderRadius: isUser ? '1.125rem 1.125rem 4px 1.125rem' : '1.125rem 1.125rem 1.125rem 4px',
        background: isUser
          ? 'linear-gradient(135deg, #8B5E3C, #A0522D)'
          : isError ? 'rgba(180,60,60,0.08)'
          : 'var(--ai-bubble)',
        border: isUser ? 'none'
          : isError ? '1px solid rgba(180,60,60,0.2)'
          : '1px solid var(--border)',
        color: isUser ? '#fff8f0' : 'var(--text-primary)',
        fontSize: '0.9rem', lineHeight: 1.65, wordBreak: 'break-word',
      }}>
        {isError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', color: '#c0392b', fontSize: '0.75rem', fontWeight: 600 }}>
            <AlertTriangle size={12} /> Something went wrong
          </div>
        )}

        {isUser ? (
          <span>{message.text}</span>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={{ margin: '0 0 0.5rem 0' }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: '#6B4226', fontWeight: 700 }}>{children}</strong>,
              em: ({ children }) => <em style={{ color: '#8B5E3C' }}>{children}</em>,
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
