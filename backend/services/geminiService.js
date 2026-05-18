/**
 * geminiService.js
 *
 * Only file that talks to Gemini.
 * The schema is intentionally kept simple — fewer nested objects
 * means Gemini produces valid JSON more reliably.
 */

const axios = require('axios');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const MAX_RETRIES = 1;

const SYSTEM_PROMPT = `You are ShopSense — an intelligent AI shopping assistant. Help users find the right product through conversation.

## Your behaviour
1. Ask 1-2 targeted follow-up questions before recommending. You need: budget, use-case, and preferences.
2. When you have enough info, recommend max 4 products with honest, specific reasoning.
3. Explain tradeoffs: "For ₹2000 more you get ANC and 2x battery life."
4. Mention briefly why certain options were skipped.
5. Never pick products by name — extract filters and let the system find them.

## Product categories available
Electronics: smartphones, laptops, headphones, earbuds, smartwatches, speakers, TVs, gaming peripherals
Footwear: sneakers, running shoes, formal shoes, boots
Clothing: jeans, t-shirts, shirts, jackets, blazers
Accessories: bags, backpacks

## IMPORTANT: Return ONLY this JSON structure, no markdown, no extra text

{
  "type": "question",
  "message": "your conversational reply",
  "preferences": {
    "budget": "e.g. under ₹5,000 or null",
    "usage": "e.g. gym and travel or null",
    "style": "e.g. wireless, casual or null",
    "priority": "e.g. battery life or null"
  },
  "filters": {
    "category": "electronics or footwear or clothing or accessories or null",
    "subcategory": "headphones or laptop or sneakers etc or null",
    "maxBudget": null,
    "minBudget": null,
    "style": "casual or premium or gaming or formal or budget or outdoor or sport or null",
    "useCases": [],
    "brand": null,
    "sortBy": "relevance"
  },
  "recommendations": [
    {
      "matchScore": 88,
      "pros": ["Within your budget", "Great for gym use"],
      "cons": ["Average mic quality"],
      "tradeoff": "optional one-line tradeoff for this product"
    }
  ],
  "whyNot": "optional: briefly explain what was excluded and why",
  "reasoning": "overall summary of why these products fit this user"
}

## Rules
- type "question": recommendations array is empty, ask only what you need
- type "recommendation": fill filters fully, add one recommendations entry per product (in order)
- matchScore 0-100: how well the product fits this specific user
- Prices in Indian Rupees. "5k"=5000, "1 lakh"=100000
- Return raw JSON only, no code fences`;

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
            temperature: 0.65,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        },
        { timeout: 20000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      return parseGeminiResponse(rawText);
    } catch (err) {
      lastError = err;
      console.error(`[Gemini] Attempt ${attempt + 1} failed:`, err?.response?.data || err.message);
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1200));
    }
  }

  console.error('[Gemini] All attempts failed:', lastError?.message);
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

    if (!parsed.type || !parsed.message) throw new Error('Missing type or message');

    // Defaults for all fields
    parsed.filters = {
      category: null, subcategory: null, maxBudget: null,
      minBudget: null, style: null, useCases: [], brand: null, sortBy: 'relevance',
      ...(parsed.filters || {}),
    };
    parsed.preferences = parsed.preferences || {};
    parsed.recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    parsed.whyNot = parsed.whyNot || '';
    parsed.reasoning = parsed.reasoning || '';

    return parsed;
  } catch (err) {
    console.error('[Gemini] Parse failed:', err.message, '| Raw snippet:', rawText?.slice(0, 200));
    return getFallbackResponse();
  }
}

function getFallbackResponse() {
  return {
    type: 'question',
    message: "I had trouble processing that — could you tell me what you're looking for and your budget? I'll find the best options for you.",
    preferences: {},
    filters: {
      category: null, subcategory: null, maxBudget: null,
      minBudget: null, style: null, useCases: [], brand: null, sortBy: 'relevance',
    },
    recommendations: [],
    whyNot: '',
    reasoning: '',
    _fallback: true,
  };
}

module.exports = { callGemini };
