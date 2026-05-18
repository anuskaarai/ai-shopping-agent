/**
 * chatController.js
 *
 * Orchestrates: validate → call Gemini → filter products → return.
 * New fields pass through: preferences, productReasons, tradeoffNote, whyNot.
 */

const { callGemini } = require('../services/geminiService');
const { filterProducts, parseBudget } = require('../services/productFilterService');

async function handleChat(req, res) {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required and must be a string' });
    }
    const trimmed = message.trim();
    if (!trimmed.length) return res.status(400).json({ error: 'message cannot be empty' });
    if (trimmed.length > 1000) return res.status(400).json({ error: 'message too long (max 1000 chars)' });

    const conversationHistory = buildHistory(history, trimmed);
    const aiResponse = await callGemini(conversationHistory);

    let products = [];
    if (aiResponse.type === 'recommendation') {
      const filters = sanitiseFilters(aiResponse.filters);
      products = filterProducts({ ...filters, productIds: aiResponse.productIds || [] });
    }

    return res.json({
      type: aiResponse.type,
      message: aiResponse.message,
      preferences: aiResponse.preferences || {},
      reasoning: aiResponse.reasoning || '',
      productReasons: aiResponse.productReasons || {},
      tradeoffNote: aiResponse.tradeoffNote || '',
      whyNot: aiResponse.whyNot || '',
      products,
      filters: aiResponse.filters,
      _fallback: aiResponse._fallback || false,
    });
  } catch (err) {
    console.error('[ChatController] Error:', err);
    return res.status(500).json({
      type: 'question',
      message: "Something broke on my end — sorry! What were you looking for?",
      preferences: {},
      products: [],
      reasoning: '',
      productReasons: {},
      tradeoffNote: '',
      whyNot: '',
      _fallback: true,
    });
  }
}

function buildHistory(history, newMessage) {
  const safe = [];
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn && (turn.role === 'user' || turn.role === 'model') && typeof turn.parts?.[0]?.text === 'string') {
        safe.push(turn);
      }
    }
  }
  safe.push({ role: 'user', parts: [{ text: newMessage }] });
  return safe;
}

function sanitiseFilters(filters = {}) {
  return {
    category:    typeof filters.category === 'string' && filters.category !== 'null' ? filters.category : undefined,
    subcategory: typeof filters.subcategory === 'string' && filters.subcategory !== 'null' ? filters.subcategory : undefined,
    maxBudget:   parseBudget(filters.maxBudget),
    minBudget:   parseBudget(filters.minBudget),
    style:       typeof filters.style === 'string' && filters.style !== 'null' ? filters.style : undefined,
    useCases:    Array.isArray(filters.useCases) ? filters.useCases : [],
    brand:       typeof filters.brand === 'string' && filters.brand !== 'null' ? filters.brand : undefined,
    sortBy:      ['relevance','price_asc','price_desc','rating'].includes(filters.sortBy) ? filters.sortBy : 'relevance',
  };
}

module.exports = { handleChat };
