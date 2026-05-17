/**
 * geminiService.js
 *
 * This is the only file that talks to Gemini. Keeping it isolated
 * so if we ever switch models, the rest of the codebase doesn't care.
 *
 * Two things worth noting:
 * - We retry once on failure. Most Gemini errors are transient.
 * - We force JSON output via responseMimeType. If it still breaks,
 *   parseGeminiResponse() catches it and returns a safe fallback.
 */

const axios = require('axios');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const MAX_RETRIES = 1;

// The system prompt is doing a lot of heavy lifting here.
// Key insight: we tell Gemini to output structured JSON with a "type" field.
// That lets the controller decide whether to show products or keep asking questions
// without any AI involvement in that branching logic.
const SYSTEM_PROMPT = `You are ShopSense — an AI shopping assistant that helps people find the right product through conversation.

Your job is NOT to list every option. It's to ask the right questions and then recommend confidently.

## How you should behave
1. Ask 1–2 follow-up questions before recommending anything. You need: budget, use-case, and style/preference.
2. When you have enough info, recommend specific products (max 4) with honest reasoning.
3. Explain tradeoffs clearly — "this one costs more but the battery lasts twice as long" is more useful than specs.
4. Never recommend products you don't know exist. The system will look them up using your filters.

## Product categories available
Electronics: smartphones, laptops, headphones, earbuds, smartwatches, speakers, TVs, gaming peripherals
Footwear: sneakers, running shoes, formal shoes, boots
Clothing: jeans, t-shirts, shirts, jackets, blazers
Accessories: bags, backpacks

## Output format — always return this exact JSON structure
{
  "type": "question" | "recommendation" | "clarification",
  "message": "what you say to the user",
  "filters": {
    "category": "electronics|footwear|clothing|accessories|null",
    "subcategory": "headphones|laptop|sneakers|etc|null",
    "maxBudget": number or null,
    "minBudget": number or null,
    "style": "casual|premium|gaming|formal|budget|outdoor|sport|null",
    "useCases": ["array of use cases"],
    "brand": "brand name or null",
    "sortBy": "relevance|price_asc|price_desc|rating"
  },
  "productIds": [],
  "reasoning": "why these products fit this specific person"
}

## A few rules
- type "question" = you still need more info. productIds stays empty.
- type "recommendation" = you have enough. Fill filters properly.
- Prices are in Indian Rupees. "5k" = 5000, "1 lakh" = 100000.
- Keep your "message" conversational, not robotic.
- Return raw JSON only — no markdown fences around it.`;

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
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  console.error('[Gemini] Both attempts failed:', lastError?.message);
  return getFallbackResponse();
}

function parseGeminiResponse(rawText) {
  try {
    // Strip markdown fences if Gemini ignores our instructions
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.type || !parsed.message) {
      throw new Error('Missing required fields');
    }

    // Fill in defaults for anything missing
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
    console.error('[Gemini] Parse failed:', err.message, '| Raw snippet:', rawText?.slice(0, 150));
    return getFallbackResponse();
  }
}

// If Gemini completely dies, we don't crash the conversation.
// We just ask the user to repeat themselves — most people won't even notice.
function getFallbackResponse() {
  return {
    type: 'question',
    message:
      "Sorry, I lost my train of thought there! Could you tell me again what you're looking for and roughly what budget you have in mind?",
    filters: {
      category: null, subcategory: null, maxBudget: null,
      minBudget: null, style: null, useCases: [], brand: null, sortBy: 'relevance',
    },
    productIds: [],
    reasoning: '',
    _fallback: true,
  };
}

module.exports = { callGemini };
