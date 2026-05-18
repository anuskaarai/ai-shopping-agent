/**
 * chatController.js
 * Maps the flat recommendations[] from Gemini onto the filtered products by index.
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
    // Map recommendations[] onto products by position
    let enrichedProducts = [];

    if (aiResponse.type === 'recommendation') {
      const filters = sanitiseFilters(aiResponse.filters);
      products = filterProducts({ ...filters });

      // If no products found in the static JSON, dynamically generate realistic mock products
      // This allows the AI to handle literally ANY query ("unlimited catalog") for the hackathon!
      if (products.length === 0 && filters.subcategory) {
        const sub = filters.subcategory;
        const basePrice = filters.maxBudget ? (filters.maxBudget * 0.85) : 2500;
        const capFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
        const nameType = capFirst(sub);

        products = [
          {
            id: `dyn_${Date.now()}_1`,
            name: `${filters.brand ? capFirst(filters.brand) : 'Premium'} ${nameType}`,
            category: filters.category || 'general',
            subcategory: sub,
            price: Math.floor(basePrice),
            rating: 4.7,
            brand: filters.brand || 'Premium Brand',
            imageUrl: sub,
          },
          {
            id: `dyn_${Date.now()}_2`,
            name: `${filters.brand ? capFirst(filters.brand) : 'Essential'} ${nameType}`,
            category: filters.category || 'general',
            subcategory: sub,
            price: Math.floor(basePrice * 0.65),
            rating: 4.2,
            brand: filters.brand || 'Value Brand',
            imageUrl: sub,
          },
          {
            id: `dyn_${Date.now()}_3`,
            name: `${filters.brand ? capFirst(filters.brand) : 'Pro'} ${nameType} Elite`,
            category: filters.category || 'general',
            subcategory: sub,
            price: Math.floor(basePrice * 1.3),
            rating: 4.9,
            brand: filters.brand || 'Pro Series',
            imageUrl: sub,
          }
        ];
      }

      // Attach Gemini's per-product reasons by index order
      enrichedProducts = products.map((p, i) => ({
        ...p,
        matchScore: aiResponse.recommendations[i]?.matchScore ?? null,
        pros: aiResponse.recommendations[i]?.pros ?? [],
        cons: aiResponse.recommendations[i]?.cons ?? [],
        tradeoff: aiResponse.recommendations[i]?.tradeoff ?? '',
      }));
    }

    return res.json({
      type: aiResponse.type,
      message: aiResponse.message,
      preferences: aiResponse.preferences || {},
      reasoning: aiResponse.reasoning || '',
      whyNot: aiResponse.whyNot || '',
      products: enrichedProducts.length > 0 ? enrichedProducts : products,
      filters: aiResponse.filters,
      _fallback: aiResponse._fallback || false,
    });
  } catch (err) {
    console.error('[ChatController] Error:', err);
    return res.status(500).json({
      type: 'question',
      message: "Something broke on my end. What were you looking for? I'll try again.",
      preferences: {},
      products: [],
      reasoning: '',
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
