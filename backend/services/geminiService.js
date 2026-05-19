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
  const prompt = `You are the Intent Extraction layer of Nexora, an AI electronics & appliance shopping assistant.
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

  const prompt = `You are the Reasoning layer of Nexora, an AI electronics & appliance shopping assistant.
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
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        GEMINI_API_URL,
        {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: history,
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        },
        { 
          headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
          timeout: 15000 
        }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleaned);

    } catch (err) {
      lastError = err;
      console.error(`[Gemini] Attempt ${attempt + 1} failed:`, err?.response?.data || err.message);
      
      if (attempt < maxRetries) {
        if (err.response?.status === 429) {
          const waitTime = attempt === 0 ? 2000 : 4000;
          console.warn(`[Gemini] 429 Rate Limit. Retrying in ${waitTime}ms...`);
          await new Promise((r) => setTimeout(r, waitTime));
        } else {
          // Fallback delay for non-429 errors just in case
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  throw new Error(`Gemini API failed: ${lastError?.message}`);
}

module.exports = {
  extractIntent,
  generateReasoning
};
