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
      // 🚀 FALLBACK: Use SerpApi if DummyJSON fails
      let googleResults = null;
      let serpProducts = [];
      let budget = intent.maxBudget || 10000;
      
      try {
        const apiKey = process.env.SERP_API_KEY;
        
        console.log(`[ChatController] SERP_API_KEY (first 6): ${apiKey ? apiKey.substring(0, 6) : 'MISSING'}`);

        if (apiKey) {
          console.log(`[ChatController] No internal products found. Triggering SerpApi Search for: ${intent.searchQuery}`);
          const axios = require('axios');
          const query = `${intent.searchQuery} under ₹${budget} buy`;
          
          console.log(`[ChatController] SerpApi Search Query constructed: "${query}"`);
          const serpUrl = 'https://serpapi.com/search.json';
          
          const response = await axios.get(serpUrl, {
            params: {
              api_key: apiKey,
              q: query,
              location: "India",
              hl: "en",
              gl: "in",
              num: 5
            }
          });

          console.log(`[ChatController] SerpApi response status: ${response.status}`);
          
          if (response.data.organic_results && response.data.organic_results.length > 0) {
            console.log(`[ChatController] SerpApi returned ${response.data.organic_results.length} items.`);
            
            const rawResults = response.data.organic_results.map(item => ({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
              thumbnail: item.thumbnail || null
            }));

            // Map to product cards format
            serpProducts = rawResults.map((item, index) => ({
              id: `serp_${index}`,
              name: item.title,
              price: budget, // best guess based on query
              rating: 4.5, // placeholder
              brand: intent.searchQuery,
              style: 'premium',
              features: [item.snippet ? item.snippet.substring(0, 50) + '...' : 'Great choice'],
              imageUrl: item.thumbnail,
              description: item.snippet,
              link: item.link
            }));

            const prompt = `You are Nexora, a shopping assistant. The user wants ${intent.searchQuery} under ₹${budget}.
Here are live search results from India: ${JSON.stringify(rawResults)}
Summarize them, rank them best to worst, and explain why each fits the budget. 
Be concise. Format as a numbered list and make sure to include the actual Markdown links (e.g. [Product Name](link)) so the user can click them!`;

            console.log(`[ChatController] Sending prompt to Gemini for search parsing...`);
            const geminiRes = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
              { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3 } }
            );

            const explanation = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`[ChatController] Gemini response received. Length: ${explanation ? explanation.length : 'none'}`);
            if (explanation) {
              googleResults = explanation;
            }
          } else {
            console.log(`[ChatController] SerpApi returned 0 items.`);
          }
        }
      } catch (err) {
        console.error('[ChatController] SerpApi Search Fallback failed:', err.response?.data || err.message);
      }

      if (googleResults) {
        return res.json({
          type: 'recommendation',
          message: `I couldn't find exact matches in my internal database, but I scoured the web for live options!\n\n${googleResults}`,
          preferences: intent.preferences || {},
          products: serpProducts,
          filters: {}
        });
      }

      // Final fallback: Ask Gemini to use its own knowledge if everything else failed
      console.log(`[ChatController] Live search failed or returned 0 results. Falling back to Gemini knowledge.`);
      const prompt = `You are Nexora, an AI electronics shopping agent. The user is looking for "${intent.searchQuery}" with a max budget of ₹${budget}. 
I did a live web search for them but couldn't find any results. 
If their budget is completely unrealistic for this item (e.g. a Smart TV under ₹5000), tell them honestly that it doesn't exist and suggest what the actual minimum realistic budget would be.
If the budget is realistic but I just couldn't find anything, give them a few general recommendations based on your knowledge of the current market.`;
            
      const axios = require('axios');
      const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5 } }
      );

      const fallbackExplanation = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return res.json({
        type: 'recommendation',
        message: `I couldn't find live results right now, but based on your budget of ₹${budget}, here are my recommendations for ${intent.searchQuery}:\n\n${fallbackExplanation}`,
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
