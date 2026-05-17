import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

/**
 * useChat — Core state machine for the shopping agent conversation.
 *
 * Manages:
 * - Message history (user + AI turns)
 * - Gemini conversation history (for multi-turn context)
 * - Product recommendations
 * - Loading / error states
 * - Retry logic on transient failures
 */
export function useChat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm **ShopSense** 🛍️ — your AI shopping assistant.\n\nTell me what you're looking for and I'll help you find the perfect product. I'll ask a few smart questions before recommending anything.\n\nWhat are you shopping for today?",
      type: 'greeting',
      timestamp: new Date(),
    },
  ]);

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reasoning, setReasoning] = useState('');

  // Gemini-format history (separate from UI messages)
  const geminiHistory = useRef([]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    // Optimistically add user message to UI
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        '/api/chat',
        {
          message: text.trim(),
          history: geminiHistory.current,
        },
        { timeout: 20000 }
      );

      const { message, products: recs, reasoning: why, type, _fallback } = response.data;

      // Add AI response to UI
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: message,
        type,
        isFallback: _fallback,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Update recommendations if this was a recommendation turn
      if (type === 'recommendation' && recs?.length > 0) {
        setProducts(recs);
        setReasoning(why || '');
      }

      // Append to Gemini history for multi-turn context
      geminiHistory.current = [
        ...geminiHistory.current,
        { role: 'user', parts: [{ text: text.trim() }] },
        { role: 'model', parts: [{ text: message }] },
      ];

      // Keep history bounded (last 10 turns = 20 entries)
      if (geminiHistory.current.length > 20) {
        geminiHistory.current = geminiHistory.current.slice(-20);
      }
    } catch (err) {
      console.error('[useChat] Request failed:', err);

      let errorText =
        "I couldn't reach the server right now. Please check your connection and try again.";

      if (err.code === 'ECONNABORTED') {
        errorText = 'The request took too long. Please try again.';
      } else if (err.response?.status === 400) {
        errorText = "That input didn't look right. Could you rephrase it?";
      } else if (err.response?.status === 429) {
        errorText = "I'm getting too many requests right now. Give me a moment!";
      }

      setError(errorText);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: errorText,
          type: 'error',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const resetChat = useCallback(() => {
    geminiHistory.current = [];
    setProducts([]);
    setReasoning('');
    setError(null);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hi! I'm **ShopSense** 🛍️ — your AI shopping assistant.\n\nTell me what you're looking for and I'll help you find the perfect product. I'll ask a few smart questions before recommending anything.\n\nWhat are you shopping for today?",
        type: 'greeting',
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    products,
    reasoning,
    isLoading,
    error,
    sendMessage,
    resetChat,
  };
}
