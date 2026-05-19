const { extractIntent, generateReasoning } = require('../services/geminiService');
const { fetchProductsFromAPI, deterministicFilter } = require('../services/retrievalService');
const axios = require('axios');

async function handleChat(req, res) {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required and must be a string' });
    }
    const trimmed = message.trim();
    if (!trimmed.length) return res.status(400).json({ error: 'message cannot be empty' });

    const conversationHistory = buildHistory(history, trimmed);

    // STEP 1: INTENT EXTRACTION (uses local regex first — 0 API calls for product searches)
    console.log('[ChatController] Extracting intent...');
    const intent = await extractIntent(conversationHistory);
    console.log('[ChatController] Intent extracted:', JSON.stringify(intent));

    // If it's just a general chat/greeting or follow-up question
    if (intent.action === 'chat' || !intent.searchQuery) {
      return res.json({
        type: 'question',
        message: intent.message || "How can I help you shop today?",
        preferences: intent.preferences || {},
        products: [],
        filters: {}
      });
    }

    // STEP 2 & 3: DYNAMIC RETRIEVAL & DETERMINISTIC FILTERING (DummyJSON)
    console.log(`[ChatController] Searching DummyJSON for: ${intent.searchQuery}`);
    const rawProducts = await fetchProductsFromAPI(intent.searchQuery);
    const filteredProducts = deterministicFilter(rawProducts, intent);

    // ─── SERP API PATH — Zero Gemini calls ───────────────────────────────
    if (filteredProducts.length === 0) {
      let serpProducts = [];
      let serpMessage = null;
      const budget = intent.maxBudget || 10000;

      try {
        const apiKey = process.env.SERP_API_KEY;
        console.log(`[ChatController] SERP_API_KEY present: ${!!apiKey}`);

        if (apiKey) {
          const query = `${intent.searchQuery} under ₹${budget} buy`;
          console.log(`[ChatController] SerpApi query: "${query}"`);

          const response = await axios.get('https://serpapi.com/search.json', {
            params: { api_key: apiKey, q: query, location: 'India', hl: 'en', gl: 'in', num: 5 },
            timeout: 10000
          });

          const items = Array.isArray(response.data.organic_results) ? response.data.organic_results : [];
          console.log(`[ChatController] SerpApi returned ${items.length} items`);

          if (items.length > 0) {
            serpProducts = items.slice(0, 5).map((item, index) => ({
              id: `serp_${index}`,
              name: item.title,
              price: budget,
              rating: 4.5,
              brand: intent.searchQuery,
              style: 'premium',
              features: [item.snippet ? item.snippet.substring(0, 80) : 'Live result'],
              imageUrl: item.thumbnail || null,
              description: item.snippet || '',
              link: item.link
            }));

            // Template message — NO Gemini API call
            const topLinks = items.slice(0, 3)
              .map((r, i) => `${i + 1}. [${r.title}](${r.link})`)
              .join('\n');
            serpMessage = `Here are the top live results I found for **${intent.searchQuery}** under ₹${budget.toLocaleString('en-IN')}:\n\n${topLinks}\n\nClick any card below to view the product. Want me to narrow this down further?`;
          } else {
            serpMessage = `I searched everywhere but couldn't find any **${intent.searchQuery}** under ₹${budget}. This budget may be too low for this product category. Could you try a higher budget?`;
          }
        }
      } catch (err) {
        console.error('[ChatController] SerpApi failed:', err.response?.data || err.message);
        serpMessage = `I had trouble searching for **${intent.searchQuery}** right now. Please try again in a moment.`;
      }

      return res.json({
        type: 'recommendation',
        message: serpMessage || `I couldn't find **${intent.searchQuery}** right now. Please try rephrasing.`,
        preferences: intent.preferences || {},
        products: serpProducts,
        filters: {}
      });
    }

    // ─── DUMMYJSON PATH — Has real products, use Gemini for reasoning ───
    console.log(`[ChatController] Generating reasoning for ${filteredProducts.length} DummyJSON products...`);
    let aiReasoning;
    try {
      aiReasoning = await generateReasoning(intent, filteredProducts, conversationHistory);
    } catch (err) {
      console.error('[ChatController] Gemini reasoning failed, using template fallback:', err.message);
      // Graceful fallback — don't crash, just use a simple message
      const names = filteredProducts.map(p => p.name).join(', ');
      aiReasoning = {
        type: 'recommendation',
        message: `Based on your request, here are my top picks: ${names}. These are well-rated options that match your criteria!`,
        recommendations: []
      };
    }

    const enrichedProducts = filteredProducts.map((p) => {
      const rec = aiReasoning.recommendations?.find(r => r.id === p.id);
      return {
        ...p,
        matchScore: rec?.matchScore ?? 85,
        pros: rec?.pros ?? [],
        cons: rec?.cons ?? [],
        tradeoff: rec?.tradeoff ?? '',
      };
    });

    return res.json({
      type: aiReasoning.type || 'recommendation',
      message: aiReasoning.message,
      preferences: intent.preferences || {},
      reasoning: '',
      whyNot: '',
      products: enrichedProducts,
      filters: { category: intent.category, maxBudget: intent.maxBudget }
    });

  } catch (err) {
    console.error('[ChatController] Unhandled error:', err);
    return res.status(500).json({
      type: 'error',
      message: 'Something went wrong on our end. Please try again.',
      preferences: {},
      products: [],
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

module.exports = { handleChat };
