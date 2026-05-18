/**
 * geminiService.js
 *
 * Only file that talks to Gemini. Keeping it isolated
 * so model changes don't ripple through the codebase.
 *
 * The system prompt returns richer JSON now — per-product
 * reasons, match scores, tradeoff notes, and a preferences
 * summary so the UI can show "here's what I understood."
 */

const axios = require('axios');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const MAX_RETRIES = 1;

const SYSTEM_PROMPT = `You are ShopSense — an intelligent AI shopping assistant. Your job is to help users make confident purchase decisions through conversation.

## Your behaviour
1. Ask 1–2 targeted follow-up questions before recommending. You need: budget, use-case, and key preferences.
2. When you have enough info, recommend max 4 products with honest, specific reasoning.
3. Explain WHY each product fits this specific user — not generic descriptions.
4. Call out tradeoffs explicitly: "For ₹2000 more you get ANC and 2x battery life."
5. Mention why certain products were NOT recommended.
6. Never pick products by name — extract filters and let the system find them.

## Product categories available
Electronics: smartphones, laptops, headphones, earbuds, smartwatches, speakers, TVs, gaming peripherals
Footwear: sneakers, running shoes, formal shoes, boots
Clothing: jeans, t-shirts, shirts, jackets, blazers
Accessories: bags, backpacks

## Output format — always return this exact JSON, no markdown fences

{
  "type": "question" | "recommendation" | "clarification",
  "message": "Your conversational response to the user",
  "preferences": {
    "budget": "e.g. ₹5,000 or null",
    "usage": "e.g. gym + daily commute or null",
    "style": "e.g. wireless, casual or null",
    "priority": "e.g. battery life, bass quality or null",
    "brand": "e.g. Sony preferred or null"
  },
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
  "productReasons": {
    "PRODUCT_ID": {
      "matchScore": 85,
      "pros": ["Within your ₹5000 budget", "Great for gym use", "Sweat resistant"],
      "cons": ["Average mic quality"]
    }
  },
  "tradeoffNote": "Optional: 'For ₹2000 more, the Sony XM5 gives you ANC and 2x battery life.'",
  "whyNot": "Optional: explain what was excluded and why, e.g. 'Skipped wired options since you prefer wireless.'",
  "reasoning": "Overall summary of why these products fit this user's needs"
}

## Rules
- type 'question': productIds and productReasons are empty. Ask only what you still need.
- type 'recommendation': fill filters, productReasons with matchScore + pros/cons for each product.
- preferences: always fill what you know so far, even during questions.
- matchScore: 0–100, how well the product fits this specific user.
- Prices in Indian Rupees. "5k" = 5000, "1 lakh" = 100000.
- Return raw JSON only.`;

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
            maxOutputTokens: 1500,
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
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.type || !parsed.message) throw new Error('Missing required fields');

    parsed.filters = {
      category: null, subcategory: null, maxBudget: null,
      minBudget: null, style: null, useCases: [], brand: null, sortBy: 'relevance',
      ...(parsed.filters || {}),
    };

    parsed.preferences = parsed.preferences || {};
    parsed.productIds = parsed.productIds || [];
    parsed.productReasons = parsed.productReasons || {};
    parsed.tradeoffNote = parsed.tradeoffNote || '';
    parsed.whyNot = parsed.whyNot || '';
    parsed.reasoning = parsed.reasoning || '';

    return parsed;
  } catch (err) {
    console.error('[Gemini] Parse failed:', err.message, '| Snippet:', rawText?.slice(0, 150));
    return getFallbackResponse();
  }
}

function getFallbackResponse() {
  return {
    type: 'question',
    message: "Sorry, I lost my train of thought! Could you tell me again what you're looking for and roughly what budget you have in mind?",
    preferences: {},
    filters: {
      category: null, subcategory: null, maxBudget: null,
      minBudget: null, style: null, useCases: [], brand: null, sortBy: 'relevance',
    },
    productIds: [],
    productReasons: {},
    tradeoffNote: '',
    whyNot: '',
    reasoning: '',
    _fallback: true,
  };
}

module.exports = { callGemini };
