const axios = require('axios');

// Switched to gemini-1.5-flash: 15 RPM free tier vs 2.5-flash's ~2 RPM
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// ─────────────────────────────────────────────────────────
// REGEX-BASED INTENT EXTRACTOR — uses ZERO Gemini API calls
// Handles 90% of product search queries locally.
// ─────────────────────────────────────────────────────────
function extractIntentLocal(text) {
  const lower = text.toLowerCase();

  // Detect greetings / pure chat
  const chatPatterns = /^(hi|hello|hey|good morning|good evening|good night|how are you|what can you do|help|thanks|thank you|bye|okay|ok|sure|yes|no|hmm|interesting)\b/i;
  if (chatPatterns.test(lower) && lower.split(' ').length < 5) {
    return { action: 'chat', message: null, searchQuery: null, maxBudget: null, minBudget: null, category: null, preferences: [] };
  }

  // Extract budget — matches "5000", "₹5000", "5k", "under 10000", "below 20k", "budget of 15000"
  let maxBudget = null;
  const budgetMatch = lower.match(/(?:under|below|within|budget(?:\s+of)?|less\s+than|max|upto|up\s+to|around|approx(?:imately)?)?[\s₹rs.]*(\d[\d,]*)\s*(?:k|thousand)?/);
  if (budgetMatch) {
    let val = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    if (lower.includes('k') || lower.includes('thousand')) val *= 1000;
    if (val >= 100) maxBudget = val; // ignore tiny numbers like "1 product"
  }

  // Detect product keywords
  const productKeywords = [
    'tv', 'smart tv', 'television', 'led tv', 'oled', 'qled',
    'laptop', 'notebook', 'macbook',
    'phone', 'smartphone', 'mobile', 'iphone', 'android',
    'headphones', 'earphones', 'earbuds', 'headset', 'airpods',
    'speaker', 'bluetooth speaker', 'soundbar',
    'washing machine', 'washer',
    'refrigerator', 'fridge',
    'air conditioner', 'ac', 'cooler',
    'camera', 'dslr', 'mirrorless',
    'tablet', 'ipad',
    'smartwatch', 'watch',
    'printer',
    'router', 'wifi',
    'monitor', 'display',
    'keyboard', 'mouse',
    'microwave', 'oven',
    'fan', 'air purifier',
    'trimmer', 'shaver',
  ];

  let searchQuery = null;
  for (const kw of productKeywords) {
    if (lower.includes(kw)) {
      searchQuery = kw;
      break;
    }
  }

  // If no known keyword found, try to extract noun phrase after "looking for", "want", "need", "find", "suggest", "recommend"
  if (!searchQuery) {
    const intentMatch = lower.match(/(?:looking for|want(?:ing)?|need(?:ing)?|find|suggest|recommend|buy|purchase|get me|show me)\s+(?:a\s+|an\s+|the\s+)?([a-z0-9 ]+?)(?:\s+under|\s+below|\s+within|\s+for|\s+with|\s+around|$)/i);
    if (intentMatch) searchQuery = intentMatch[1].trim();
  }

  if (!searchQuery) {
    // Can't determine intent locally — signal that Gemini should handle it
    return null;
  }

  return {
    action: 'search',
    message: '',
    searchQuery,
    maxBudget,
    minBudget: null,
    category: searchQuery,
    preferences: []
  };
}

/**
 * STEP 1: INTENT EXTRACTION
 * First tries local regex (0 API calls). Falls back to Gemini only if needed.
 */
async function extractIntent(conversationHistory) {
  // Get the latest user message
  const lastMsg = [...conversationHistory].reverse().find(m => m.role === 'user');
  const userText = lastMsg?.parts?.[0]?.text || '';

  // Try local extraction first
  const localIntent = extractIntentLocal(userText);

  if (localIntent !== null) {
    console.log('[Gemini] Used local intent extraction (0 API calls):', localIntent.action, localIntent.searchQuery);
    // For pure chat intents that need a real reply, fall through to Gemini
    if (localIntent.action === 'chat') {
      // Let Gemini handle the chat reply
      console.log('[Gemini] Chat intent — calling Gemini for conversational reply...');
      return await makeGeminiCall(conversationHistory, INTENT_PROMPT);
    }
    return localIntent;
  }

  // Fallback: use Gemini for complex queries
  console.log('[Gemini] Local extraction failed — falling back to Gemini for intent...');
  return await makeGeminiCall(conversationHistory, INTENT_PROMPT);
}

const INTENT_PROMPT = `You are the Intent Extraction layer of Nexora, an AI electronics & appliance shopping assistant.
Analyze the conversation and determine what the user wants.

IMPORTANT PRINCIPLE: DO NOT invent products. You are only extracting intent so the backend can search the database.

Return strictly JSON matching this structure:
{
  "action": "chat" | "search",
  "message": "If action is 'chat', put your conversational reply here. If 'search', leave empty.",
  "searchQuery": "If action is 'search', put the main product keyword here (e.g. 'laptop', 'washing machine').",
  "maxBudget": 50000,
  "minBudget": null,
  "category": "broader category",
  "preferences": ["list", "of", "extracted", "features"]
}`;

/**
 * STEP 4: AI REASONING
 * Only called when DummyJSON returns actual product results (not SerpApi path).
 */
async function generateReasoning(intent, filteredProducts, conversationHistory) {
  const productData = JSON.stringify(filteredProducts.slice(0, 3).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    rating: p.rating,
    features: p.features,
    description: p.description
  })));

  const prompt = `You are Nexora, an AI electronics shopping assistant. 
Products found: ${productData}
User budget: ₹${intent.maxBudget || 'flexible'}
Task: In under 80 words, explain why these are good picks. No bullet points. Include a short tradeoff note.

Return strictly JSON:
{
  "type": "recommendation",
  "message": "your concise explanation",
  "recommendations": [{"id": "product_id", "pros": ["pro"], "cons": ["con"], "tradeoff": "note", "matchScore": 90}]
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
          timeout: 20000
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
          const waitTime = attempt === 0 ? 3000 : 6000;
          console.warn(`[Gemini] 429 Rate Limit. Retrying in ${waitTime}ms...`);
          await new Promise((r) => setTimeout(r, waitTime));
        } else {
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
