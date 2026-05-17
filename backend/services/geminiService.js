/**
 * geminiService.js
 * -------------------------------------------------------
 * Handles all communication with the Gemini API.
 * This is the ONLY file that calls Gemini.
 * AI responsibility: intent understanding, follow-up
 * questions, recommendation reasoning.
 * Deterministic logic lives in productFilterService.js.
 * -------------------------------------------------------
 */

const axios = require('axios');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const MAX_RETRIES = 1; // Retry once on transient failure (per spec)

/**
 * System prompt — the core brain of the shopping agent.
 * Defines strict output schema so the backend can parse
 * AI responses deterministically.
 */
const SYSTEM_PROMPT = `You are ShopSense — an intelligent AI shopping assistant.

Your role is to help users find the RIGHT product through conversation, NOT to list everything at once.

## Your Core Behaviour
1. Ask 1–2 targeted follow-up questions before recommending anything.
2. Always understand: budget, use-case, style preference, and key requirements.
3. When you have enough info, recommend specific products with clear reasoning.
4. Explain WHY each product fits this specific user's needs — not generic descriptions.
5. Handle tradeoffs explicitly: "Product A costs more but lasts longer. Product B is cheaper but has fewer features."
6. Never recommend more than 4 products at once.

## Available Product Categories
Electronics: smartphones, laptops, headphones, earbuds, smartwatches, speakers, TVs, gaming peripherals
Footwear: sneakers, running shoes, formal shoes, boots
Clothing: jeans, t-shirts, shirts, jackets, blazers
Accessories: bags, backpacks

## Output Format (STRICT JSON — never deviate)
You MUST always respond with a valid JSON object in this exact schema:

{
  "type": "question" | "recommendation" | "clarification",
  "message": "Your conversational reply to the user",
  "filters": {
    "category": "electronics|footwear|clothing|accessories|null",
    "subcategory": "headphones|laptop|sneakers|etc|null",
    "maxBudget": number_or_null,
    "minBudget": number_or_null,
    "style": "casual|premium|gaming|formal|budget|outdoor|sport|null",
    "useCases": ["array", "of", "use", "cases"],
    "brand": "preferred_brand_or_null",
    "sortBy": "relevance|price_asc|price_desc|rating"
  },
  "productIds": [],
  "reasoning": "Explain tradeoffs and why these products fit THIS user"
}

## Rules
- If type is "question": productIds must be empty. Ask only what you still need to know.
- If type is "recommendation": fill filters fully, provide reasoning.
- If the user's message is off-topic: set type to "clarification" and gently redirect.
- Prices are in Indian Rupees (INR ₹).
- Budget in INR: "2000 rupees" = 2000, "2k" = 2000, "20k" = 20000, "1 lakh" = 100000.
- Never make up product names. The system will look up real products using your filters.
- Keep "message" friendly, concise, and helpful — not robotic.
- Do NOT wrap JSON in markdown code fences. Return raw JSON only.`;

/**
 * Call Gemini API with retry logic.
 * @param {Array} conversationHistory - [{role, parts:[{text}]}]
 * @returns {Object} - parsed AI response object
 */
async function callGemini(conversationHistory) {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
        {
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: conversationHistory,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        },
        { timeout: 15000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      return parseGeminiResponse(rawText);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        // Wait 1s before retry
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // Both attempts failed — return a safe fallback
  console.error('[GeminiService] All attempts failed:', lastError?.message);
  return getFallbackResponse();
}

/**
 * Parse and validate the JSON returned by Gemini.
 * If malformed, return a graceful fallback.
 */
function parseGeminiResponse(rawText) {
  try {
    // Strip markdown fences if Gemini disobeys instructions
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (!parsed.type || !parsed.message) {
      throw new Error('Missing required fields in Gemini response');
    }

    // Sanitise filters with defaults
    parsed.filters = {
      category: null,
      subcategory: null,
      maxBudget: null,
      minBudget: null,
      style: null,
      useCases: [],
      brand: null,
      sortBy: 'relevance',
      ...(parsed.filters || {}),
    };

    parsed.productIds = parsed.productIds || [];
    parsed.reasoning = parsed.reasoning || '';

    return parsed;
  } catch (err) {
    console.error('[GeminiService] Parse error:', err.message, '| Raw:', rawText?.slice(0, 200));
    return getFallbackResponse();
  }
}

/**
 * Fallback response when Gemini fails or returns garbage.
 * Keeps the user experience intact.
 */
function getFallbackResponse() {
  return {
    type: 'question',
    message:
      "I'm having a moment — could you tell me a bit more about what you're looking for? For example: what's your budget and what will you mainly use it for?",
    filters: {
      category: null,
      subcategory: null,
      maxBudget: null,
      minBudget: null,
      style: null,
      useCases: [],
      brand: null,
      sortBy: 'relevance',
    },
    productIds: [],
    reasoning: '',
    _fallback: true,
  };
}

module.exports = { callGemini };
