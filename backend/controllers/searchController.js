const axios = require('axios');
const { fetchProductsFromAPI } = require('../services/retrievalService');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function searchProducts(req, res) {
  const { category, budget } = req.body;

  if (!category || !budget) {
    return res.status(400).json({ error: 'category and budget are required' });
  }

  let rawResults = [];
  let googleSearchFailed = false;

  // 1 & 2. Call SerpApi
  try {
    const query = `${category} under ₹${budget} buy`;
    const apiKey = process.env.SERP_API_KEY;

    if (!apiKey) {
      throw new Error("Missing SERP_API_KEY");
    }

    const response = await axios.get('https://serpapi.com/search.json', {
      params: { 
        api_key: apiKey,
        q: query,
        location: "India",
        hl: "en",
        gl: "in",
        num: 5
      }
    });

    // 3. Extract title, link, snippet, thumbnail
    if (response.data.organic_results) {
      rawResults = response.data.organic_results.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        thumbnail: item.thumbnail || null
      }));
    }
  } catch (err) {
    console.error("[SearchController] SerpApi Search failed:", err.message);
    googleSearchFailed = true;
  }

  // Handle errors gracefully: fallback to static/API product data
  if (googleSearchFailed || rawResults.length === 0) {
    try {
      console.log("[SearchController] Falling back to retrievalService data...");
      const staticProducts = await fetchProductsFromAPI(category);
      rawResults = staticProducts.slice(0, 5).map(p => ({
        title: p.name,
        link: p.imageUrl || '#',
        snippet: p.description || `Great option for ${category}`
      }));
    } catch (fallbackErr) {
      console.error("[SearchController] Fallback retrieval failed:", fallbackErr.message);
      return res.status(500).json({ error: "All product retrieval methods failed." });
    }
  }

  // 4. Pass results to Gemini for explanation
  let geminiExplanation = null;
  try {
    const prompt = `You are a shopping assistant. The user wants a ${category} under ₹${budget}.
Here are live search results: ${JSON.stringify(rawResults)}
Rank them best to worst, explain why each fits or doesn't fit the budget and use case.
Be concise. Format as a numbered list.`;

    const geminiRes = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 }
      }
    );

    geminiExplanation = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (geminiErr) {
    console.error("[SearchController] Gemini failed to generate explanation:", geminiErr.message);
  }

  // 5. Return results and explanation (even if explanation is null due to failure)
  return res.json({
    links: rawResults,
    explanation: geminiExplanation
  });
}

module.exports = { searchProducts };
