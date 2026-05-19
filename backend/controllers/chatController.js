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
          // Use exact product name — no filler words that confuse Google Shopping
          const query = `${intent.searchQuery}`;
          console.log(`[ChatController] SerpApi Shopping query: "${query}"`);

          const response = await axios.get('https://serpapi.com/search.json', {
            params: {
              api_key: apiKey,
              engine: 'google_shopping',
              q: query,
              location: 'India',
              hl: 'en',
              gl: 'in',
              num: 15,
              tbs: `mr:1,price:1,ppr_max:${budget}`
            },
            timeout: 10000
          });

          const allItems = Array.isArray(response.data.shopping_results)
            ? response.data.shopping_results
            : [];

          console.log(`[ChatController] SerpApi shopping returned ${allItems.length} items`);

          // Filter by RELEVANCE: title must contain at least one word from the search query
          const queryWords = intent.searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const relevantItems = allItems.filter(item => {
            const title = (item.title || '').toLowerCase();
            return queryWords.some(word => title.includes(word));
          });

          // Filter by PRICE: only items within budget
          const priceFiltered = relevantItems.filter(item => {
            const price = item.extracted_price;
            if (!price) return true; // keep items with no price data
            return price <= budget;
          });

          const finalItems = priceFiltered.slice(0, 5);
          console.log(`[ChatController] After relevance + price filtering: ${finalItems.length} items (from ${allItems.length} raw)`);

          if (finalItems.length > 0) {
            serpProducts = finalItems.map((item, index) => ({
              id: `serp_${index}`,
              name: item.title,
              price: item.extracted_price || budget,
              rating: item.rating || 4.0,
              brand: item.source || intent.searchQuery,
              style: 'premium',
              features: [item.snippet || `Available on ${item.source || 'retailer'}`],
              imageUrl: item.thumbnail || null,
              description: item.snippet || item.title,
              link: item.link || item.product_link || '#'
            }));

            const topLinks = finalItems.slice(0, 3)
              .map((r, i) => {
                const price = r.extracted_price ? `₹${r.extracted_price.toLocaleString('en-IN')}` : '';
                const store = r.source || '';
                return `${i + 1}. **${r.title}** ${price ? `— ${price}` : ''} ${store ? `(${store})` : ''}`;
              })
              .join('\n');
            serpMessage = `Here are the best deals I found for **${intent.searchQuery}** under ₹${budget.toLocaleString('en-IN')}:\n\n${topLinks}\n\nClick any card below to view and buy!`;
          } else {
            serpMessage = `I couldn't find any **${intent.searchQuery}** under ₹${budget.toLocaleString('en-IN')}. Try increasing your budget or simplifying your search.`;
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
