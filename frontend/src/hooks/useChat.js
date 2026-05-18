import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

// In dev: VITE_API_URL is empty → Vite proxy forwards /api to localhost:5000
// In prod: VITE_API_URL is set to the full Render backend URL
const API_BASE = import.meta.env.VITE_API_URL || '';

const WELCOME = "Hi! I'm **ShopSense** 🛍️ — your AI shopping assistant.\n\nTell me what you're looking for and I'll help you find the perfect product. I'll ask a couple of smart questions before recommending anything.\n\nWhat are you shopping for today?";

export function useChat() {
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', text: WELCOME, type: 'greeting', timestamp: new Date() },
  ]);

  const [products, setProducts] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [preferences, setPreferences] = useState({});
  const [whyNot, setWhyNot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const geminiHistory = useRef([]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { id: `user-${Date.now()}`, role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE}/api/chat`,
        { message: text.trim(), history: geminiHistory.current },
        { timeout: 25000 }
      );

      const {
        message, products: recs, reasoning: why, type, _fallback,
        preferences: prefs, whyNot: excluded,
      } = response.data;

      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: message,
        type,
        isFallback: _fallback,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (prefs && Object.keys(prefs).length > 0) setPreferences(prefs);

      if (type === 'recommendation') {
        if (recs?.length > 0) setProducts(recs);
        setReasoning(why || '');
        setWhyNot(excluded || '');
      }

      geminiHistory.current = [
        ...geminiHistory.current,
        { role: 'user', parts: [{ text: text.trim() }] },
        { role: 'model', parts: [{ text: message }] },
      ];
      if (geminiHistory.current.length > 20) {
        geminiHistory.current = geminiHistory.current.slice(-20);
      }
    } catch (err) {
      console.error('[useChat] Request failed:', err);

      let errorText = "I couldn't reach the server right now. Check your connection and try again.";
      if (err.code === 'ECONNABORTED') errorText = 'The request timed out. Please try again.';
      else if (err.response?.status === 400) errorText = "That input didn't look right — could you rephrase?";
      else if (err.response?.status === 429) errorText = "Too many requests right now — give me a moment!";

      setError(errorText);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`, role: 'assistant',
        text: errorText, type: 'error', timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const resetChat = useCallback(() => {
    geminiHistory.current = [];
    setProducts([]); setReasoning(''); setPreferences({});
    setWhyNot(''); setError(null);
    setMessages([{ id: 'welcome', role: 'assistant', text: WELCOME, type: 'greeting', timestamp: new Date() }]);
  }, []);

  return {
    messages, products, reasoning, preferences,
    whyNot, isLoading, error, sendMessage, resetChat,
  };
}
