import './index.css';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ProductGrid from './components/ProductGrid';
import { useChat } from './hooks/useChat';

/**
 * App — Root layout.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │           Header                │
 * ├──────────────────┬──────────────┤
 * │   Chat Window    │  Product     │
 * │   (left panel)   │  Grid        │
 * │                  │  (right)     │
 * └──────────────────┴──────────────┘
 *
 * On mobile: stacked vertically (chat on top, products below).
 */
export default function App() {
  const { messages, products, reasoning, isLoading, sendMessage, resetChat } = useChat();

  const hasProducts = products.length > 0;

  return (
    <>
      {/* SEO meta is in index.html */}
      <Header onReset={resetChat} />

      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: hasProducts ? '1fr 380px' : '1fr',
          gap: '0',
          height: 'calc(100vh - 64px)',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          overflow: 'hidden',
          transition: 'grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Chat Panel ─────────────────────────── */}
        <div
          style={{
            borderRight: hasProducts ? '1px solid rgba(99,102,241,0.1)' : 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
          />
        </div>

        {/* ── Product Panel ───────────────────────── */}
        {hasProducts && (
          <div
            style={{
              padding: '1.25rem 1rem',
              overflowY: 'auto',
              background: 'rgba(15,17,32,0.5)',
            }}
          >
            <ProductGrid products={products} reasoning={reasoning} />
          </div>
        )}
      </main>
    </>
  );
}
