export default function TypingIndicator() {
  return (
    <div className="msg-enter" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', padding: '0.25rem 0' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        background: 'rgba(139,90,43,0.12)',
        border: '1px solid rgba(139,90,43,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '14px',
      }}>🤖</div>
      <div style={{
        background: 'var(--ai-bubble)',
        border: '1px solid var(--border)',
        borderRadius: '1.125rem', borderBottomLeftRadius: '4px',
        padding: '0.75rem 1rem',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
