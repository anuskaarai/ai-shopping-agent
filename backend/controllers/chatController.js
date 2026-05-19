const { extractIntent, generateReasoning } = require('../services/geminiService');
const { fetchProductsFromAPI, deterministicFilter } = require('../services/retrievalService');

async function handleChat(req, res) {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required and must be a string' });
    }
    const trimmed = message.trim();
    if (!trimmed.length) return res.status(400).json({ error: 'message cannot be empty' });

    const conversationHistory = buildHistory(history, trimmed);

    // STEP 1: INTENT EXTRACTION
    console.log('[ChatController] Extracting intent...');
    const intent = await extractIntent(conversationHistory);
    console.log('[ChatController] Intent extracted:', intent);

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

    // STEP 2 & 3: DYNAMIC RETRIEVAL & DETERMINISTIC FILTERING
    console.log(`[ChatController] Searching products for: ${intent.searchQuery}`);
    const rawProducts = await fetchProductsFromAPI(intent.searchQuery);
    const filteredProducts = deterministicFilter(rawProducts, intent);

    if (filteredProducts.length === 0) {
      // 🚀 FALLBACK: Use Google Custom Search if DummyJSON fails
      try {
        const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
        const key = process.env.GOOGLE_API_KEY;
        if (cx && key) {
          console.log(`[ChatController] No internal products found. Triggering Google Web Search for: ${intent.searchQuery}`);
          const axios = require('axios');
          const budget = intent.maxBudget || 10000;
          const query = `${intent.searchQuery} under ₹${budget} buy site:amazon.in OR site:flipkart.com OR site:croma.com`;
          
          const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: { key, cx, q: query, num: 5 }
          });

          if (response.data.items && response.data.items.length > 0) {
            const rawResults = response.data.items.map(item => ({
              title: item.title, link: item.link, snippet: item.snippet
            }));

            const prompt = `You are Nexora, a shopping assistant. The user wants ${intent.searchQuery} under ₹${budget}.
Here are live search results: ${JSON.stringify(rawResults)}
Summarize them, rank them best to worst, and explain why each fits the budget. 
Be concise. Format as a numbered list and make sure to include the actual Markdown links (e.g. [Product Name](link)) so the user can click them!`;

            const geminiRes = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
              { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }
            );

            const explanation = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (explanation) {
              return res.json({
                type: 'recommendation',
                message: `I couldn't find exact matches in my internal database, but I scoured the web for live options!\n\n${explanation}`,
                preferences: intent.preferences || {},
                products: [],
                filters: {}
              });
            }
          }
        }
      } catch (err) {
        console.error('[ChatController] Google Search Fallback failed:', err.message);
      }

      return res.json({
        type: 'question',
        message: `I looked everywhere, but I couldn't find any "${intent.searchQuery}" that matched your exact criteria. Could you broaden your search or adjust your budget?`,
        preferences: intent.preferences || {},
        products: [],
        filters: {}
      });
    }

    // STEP 4: AI REASONING
    console.log(`[ChatController] Generating reasoning for ${filteredProducts.length} products...`);
    const aiReasoning = await generateReasoning(intent, filteredProducts, conversationHistory);
    
    // Attach Gemini's per-product reasons by matching the IDs
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
      reasoning: '', // we put it in message now
      whyNot: '', 
      products: enrichedProducts,
      filters: { category: intent.category, maxBudget: intent.maxBudget }
    });

  } catch (err) {
    console.error('[ChatController] Error:', err);
    return res.status(500).json({
      type: 'error',
      message: `Error: ${err.message || 'Something broke on my end.'}. Please check the server logs or API keys.`,
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

module.exports = { handleChat };
