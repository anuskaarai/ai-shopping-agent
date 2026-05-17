/**
 * chatController.js
 * -------------------------------------------------------
 * Orchestrates the full request pipeline:
 *   1. Validate input
 *   2. Call Gemini (AI)
 *   3. Filter products (deterministic)
 *   4. Return structured response
 *
 * AI responsibilities stay in geminiService.
 * Filtering stays in productFilterService.
 * This controller is the glue between them.
 * -------------------------------------------------------
 */

const { callGemini } = require('../services/geminiService');
const { filterProducts, parseBudget } = require('../services/productFilterService');

/**
 * POST /api/chat
 * Body: { message: string, history: Array }
 */
async function handleChat(req, res) {
  try {
    const { message, history = [] } = req.body;

    // --- Input Validation (deterministic) ---
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'message field is required and must be a string',
      });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (trimmed.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    // --- Build conversation history for Gemini ---
    const conversationHistory = buildHistory(history, trimmed);

    // --- Call AI (Gemini) ---
    const aiResponse = await callGemini(conversationHistory);

    // --- Deterministic product filtering ---
    let products = [];

    if (aiResponse.type === 'recommendation') {
      const filters = sanitiseFilters(aiResponse.filters);
      products = filterProducts({
        ...filters,
        productIds: aiResponse.productIds || [],
      });
    }

    // --- Return unified response ---
    return res.json({
      type: aiResponse.type,
      message: aiResponse.message,
      reasoning: aiResponse.reasoning || '',
      products,
      filters: aiResponse.filters,
      _fallback: aiResponse._fallback || false,
    });
  } catch (err) {
    console.error('[ChatController] Unexpected error:', err);

    // Graceful degradation — never crash the API
    return res.status(500).json({
      type: 'question',
      message:
        "Something went wrong on my end. Could you repeat what you were looking for? I'm ready to help!",
      products: [],
      reasoning: '',
      _fallback: true,
    });
  }
}

/**
 * Build the Gemini-compatible conversation history array.
 * Validates each history turn and appends the new user message.
 */
function buildHistory(history, newMessage) {
  const safe = [];

  if (Array.isArray(history)) {
    for (const turn of history) {
      if (
        turn &&
        (turn.role === 'user' || turn.role === 'model') &&
        typeof turn.parts?.[0]?.text === 'string'
      ) {
        safe.push(turn);
      }
    }
  }

  safe.push({ role: 'user', parts: [{ text: newMessage }] });
  return safe;
}

/**
 * Sanitise and coerce AI filter output before passing to deterministic filter.
 */
function sanitiseFilters(filters = {}) {
  return {
    category: typeof filters.category === 'string' && filters.category !== 'null'
      ? filters.category : undefined,
    subcategory: typeof filters.subcategory === 'string' && filters.subcategory !== 'null'
      ? filters.subcategory : undefined,
    maxBudget: parseBudget(filters.maxBudget),
    minBudget: parseBudget(filters.minBudget),
    style: typeof filters.style === 'string' && filters.style !== 'null'
      ? filters.style : undefined,
    useCases: Array.isArray(filters.useCases) ? filters.useCases : [],
    brand: typeof filters.brand === 'string' && filters.brand !== 'null'
      ? filters.brand : undefined,
    sortBy: ['relevance', 'price_asc', 'price_desc', 'rating'].includes(filters.sortBy)
      ? filters.sortBy : 'relevance',
  };
}

module.exports = { handleChat };
