import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-shopping-agent-wp5h.onrender.com';

const WELCOME = "Hi! I'm **Nexora** 🛍️ — your AI electronics & appliance shopping assistant.\n\nTell me what you're looking for and I'll help you find the perfect product. I'll ask a couple of smart questions before recommending anything.\n\nWhat are you shopping for today?";

export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [preferences, setPreferences] = useState({});
  const [whyNot, setWhyNot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const geminiHistory = useRef([]);

  // Load session from localStorage on mount or sessionId change
  useEffect(() => {
    const saved = localStorage.getItem(`chat_${sessionId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.messages || []);
        setProducts(parsed.products || []);
        setReasoning(parsed.reasoning || '');
        setPreferences(parsed.preferences || {});
        setWhyNot(parsed.whyNot || '');
        geminiHistory.current = parsed.geminiHistory || [];
      } catch (e) {
        initNewChat();
      }
    } else {
      initNewChat();
    }
  }, [sessionId]);

  const initNewChat = useCallback(() => {
    geminiHistory.current = [];
    setProducts([]); setReasoning(''); setPreferences({});
    setWhyNot(''); setError(null);
    setMessages([{ id: 'welcome', role: 'assistant', text: WELCOME, type: 'greeting', timestamp: new Date() }]);
  }, []);

  // Save to localStorage whenever important state changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${sessionId}`, JSON.stringify({
        messages, products, reasoning, preferences, whyNot, geminiHistory: geminiHistory.current
      }));
    }
  }, [messages, products, reasoning, preferences, whyNot, sessionId]);

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
        { timeout: 60000 }
      );

      // 🔍 Debug: log exact API response shape
      console.log('[useChat] API response received:', response.data);

      const data = response.data || {};
      const message = data.message || data.explanation || 'I had trouble processing that.';
      const type = data.type || 'question';
      const _fallback = data._fallback;
      const why = data.reasoning || '';
      const excluded = data.whyNot || '';
      const prefs = data.preferences || {};

      // Safe product extraction — try multiple keys, always default to []
      const rawRecs = data.products || data.results || data.items || [];
      const recs = Array.isArray(rawRecs) ? rawRecs : [];

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
        if (recs.length > 0) setProducts(recs);
        setReasoning(why);
        setWhyNot(excluded);
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
      
      if (err.response?.data?.message) {
        errorText = err.response.data.message;
      } else if (err.code === 'ECONNABORTED') {
        errorText = 'The request timed out. Please try again.';
      } else if (err.response?.status === 400) {
        errorText = "That input didn't look right — could you rephrase?";
      } else if (err.response?.status === 429) {
        errorText = "Too many requests right now — give me a moment!";
      }

      setError(errorText);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`, role: 'assistant',
        text: errorText, type: 'error', timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return {
    messages, products, reasoning, preferences,
    whyNot, isLoading, error, sendMessage, resetChat: initNewChat,
  };
}
