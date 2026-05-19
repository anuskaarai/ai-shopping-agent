import { useRef, useEffect, useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const QUICK_PROMPTS = [
  "Headphones under ₹5000 for WFH",
  "Best laptop for college student",
  "Smart TV for small bedroom",
  "Smartwatch under ₹10000",
  "Gaming setup budget ₹15000",
];

export default function ChatWindow({ messages, isLoading, onSend }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const showQuickPrompts = messages.length === 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, isLoading, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
        {isLoading && <TypingIndicator />}

        {showQuickPrompts && !isLoading && (
          <div style={{ marginTop: '0.5rem' }}>
            <div className="section-label" style={{ marginBottom: '0.625rem', paddingLeft: '0.25rem' }}>Quick starts</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSend(prompt)}
                  style={{
                    padding: '0.45rem 0.875rem', borderRadius: '999px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem', cursor: 'pointer',
                    transition: 'all 0.18s ease', fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'var(--accent-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '0.875rem 0.75rem 1rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-primary)',
        backdropFilter: 'blur(12px)',
      }}>
        <div
          style={{
            display: 'flex', gap: '0.625rem', alignItems: 'flex-end',
            background: 'var(--bg-input)',
            border: '1.5px solid var(--border)',
            borderRadius: '1rem', padding: '0.5rem 0.5rem 0.5rem 1rem',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <textarea
            ref={textareaRef} rows={1} value={input}
            onChange={handleInput} onKeyDown={handleKeyDown}
            placeholder="Ask me what you're looking for…"
            disabled={isLoading}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit',
              lineHeight: 1.55, resize: 'none', minHeight: '24px', maxHeight: '120px', padding: '0.2rem 0',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-glow"
            style={{ width: '38px', height: '38px', padding: 0, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
