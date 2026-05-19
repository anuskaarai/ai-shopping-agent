const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const MAX_RETRIES = 1;

/**
 * STEP 1: INTENT EXTRACTION
 * Asks Gemini to understand what the user wants. 
 * If it's a general chat/greeting, it just replies.
 * If it's a product search, it extracts the deterministic fields for the backend.
 */
async function extractIntent(conversationHistory) {
  const prompt = `You are the Intent Extraction layer of an AI shopping assistant.
Analyze the conversation and determine what the user wants.

IMPORTANT PRINCIPLE: DO NOT invent products. You are only extracting intent so the backend can search the database.

Return strictly JSON matching this structure:
{
  "action": "chat" | "search",
  "message": "If action is 'chat', put your conversational reply here. If 'search', leave empty.",
  "searchQuery": "If action is 'search', put the main product keyword here (e.g. 'laptop', 'washing machine', 'shoes').",
  "maxBudget": 50000,
  "minBudget": null,
  "category": "broader category",
  "preferences": ["list", "of", "extracted", "features"]
}`;

  return await makeGeminiCall(conversationHistory, prompt);
}

/**
 * STEP 4: AI REASONING
 * Takes the REAL products retrieved by the backend and asks Gemini to explain them,
 * compare them, and ask follow-up questions.
 */
async function generateReasoning(intent, filteredProducts, conversationHistory) {
  const productData = JSON.stringify(filteredProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    rating: p.rating,
    features: p.features,
    description: p.description
  })));

  const prompt = `You are the Reasoning layer of ShopSense, an AI shopping assistant.
The backend has retrieved the following REAL products based on the user's query:
${productData}

Your job is to explain these recommendations to the user, compare them intelligently, and explicitly state tradeoffs (e.g. better quality vs higher price).
If the product list is empty, apologize and ask them to broaden their search.
If you need more details to narrow it down, ask smart contextual follow-up questions.

Return strictly JSON matching this structure:
{
  "type": "recommendation" | "question",
  "message": "Your conversational response. Explain why these are good, compare them, and ask follow-ups.",
  "recommendations": [
    {
      "id": "must exactly match the product id provided",
      "pros": ["pro 1", "pro 2"],
      "cons": ["con 1"],
      "tradeoff": "Explicit tradeoff reasoning",
      "matchScore": 95
    }
  ]
}`;

  return await makeGeminiCall(conversationHistory, prompt);
}

async function makeGeminiCall(history, systemInstruction) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
        {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: history,
          generationConfig: {
            temperature: 0.3, // Lower temperature for more deterministic JSON
            responseMimeType: 'application/json',
          },
        },
        { timeout: 15000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleaned);

    } catch (err) {
      lastError = err;
      console.error(`[Gemini] Attempt ${attempt + 1} failed:`, err?.response?.data || err.message);
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error(`Gemini API failed: ${lastError?.message}`);
}

module.exports = {
  extractIntent,
  generateReasoning
};
