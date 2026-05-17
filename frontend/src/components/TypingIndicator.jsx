/**
 * TypingIndicator — Animated "AI is thinking" indicator.
 * Shows three bouncing dots while waiting for Gemini response.
 */
export default function TypingIndicator() {
  return (
    <div className="msg-enter" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', padding: '0.25rem 0' }}>
      {/* AI avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))',
          border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '14px',
        }}
      >
        🤖
      </div>

      {/* Dots bubble */}
      <div
        style={{
          background: 'var(--ai-bubble)',
          border: '1px solid var(--border)',
          borderRadius: '1.125rem',
          borderBottomLeftRadius: '4px',
          padding: '0.75rem 1rem',
          display: 'flex',
          gap: '5px',
          alignItems: 'center',
        }}
      >
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
