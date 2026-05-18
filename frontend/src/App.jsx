import './index.css';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ProductGrid from './components/ProductGrid';
import { useChat } from './hooks/useChat';

export default function App() {
  const {
    messages, products, reasoning, preferences,
    whyNot, isLoading, sendMessage, resetChat,
  } = useChat();

  const hasProducts = products.length > 0;

  return (
    <>
      <Header onReset={resetChat} />
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: hasProducts ? '1fr 390px' : '1fr',
        height: 'calc(100vh - 64px)',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
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
    </>
  );
}
