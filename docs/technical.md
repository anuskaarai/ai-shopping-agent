# Technical Document — ShopSense AI Shopping Agent

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React + Vite + Tailwind Frontend                   │   │
│  │                                                     │   │
│  │  useChat hook          ChatWindow component         │   │
│  │  ├─ Message state      ├─ Message rendering         │   │
│  │  ├─ Gemini history     ├─ Auto-scroll               │   │
│  │  └─ Product state      └─ Input handling            │   │
│  │                                                     │   │
│  │  ProductGrid           MessageBubble                │   │
│  │  ├─ Reasoning panel    ├─ Markdown rendering        │   │
│  │  └─ ProductCard list   └─ Role-based styling        │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ POST /api/chat
                             │ { message, history }
┌────────────────────────────▼────────────────────────────────┐
│                  Node.js + Express Backend                  │
│                                                             │
│  chatController.js (orchestration)                          │
│  ├─ Input validation (deterministic)                        │
│  ├─ History sanitisation (deterministic)                    │
│  ├─ → geminiService.js (AI)                                 │
│  └─ → productFilterService.js (deterministic)               │
│                                                             │
│  geminiService.js              productFilterService.js      │
│  ├─ System prompt              ├─ Budget filtering          │
│  ├─ Retry logic (1 retry)      ├─ Category matching         │
│  ├─ Response parsing           ├─ Relevance scoring         │
│  └─ Fallback handling          └─ Sorting / ranking         │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ▼
                    Google Gemini 1.5 Flash API
```

---

## Data Flow

### Happy Path (Recommendation)

```
1. User types: "I need headphones for work from home, budget 5000"

2. Frontend (useChat.js):
   - Appends user message to UI state
   - Sends POST /api/chat { message, history: [...] }

3. Backend (chatController.js):
   - Validates: message is string, length 1–1000
   - Builds Gemini history array
   - Calls geminiService.callGemini()

4. geminiService.js:
   - Sends system prompt + conversation to Gemini Flash
   - Gemini returns JSON:
     {
       "type": "recommendation",
       "message": "Here are my top picks for WFH headphones under ₹5000...",
       "filters": { "category": "electronics", "subcategory": "headphones",
                    "maxBudget": 5000, "useCases": ["work"] },
       "reasoning": "Prioritised ANC for focus and mic quality for calls..."
     }
   - Parses and validates JSON
   - Returns structured object

5. chatController.js:
   - Receives AI response (type = "recommendation")
   - Calls productFilterService.filterProducts(filters)
   - Deterministic scoring: budget ✓, category ✓, useCase overlap ✓
   - Returns top 4 matching products

6. Response to frontend:
   { type, message, products: [...], reasoning }

7. Frontend (useChat.js):
   - Adds AI message to chat
   - Sets products state → triggers ProductGrid render
   - Appends turn to Gemini history for multi-turn context
```

### Follow-up Path (Question)

```
Gemini returns type: "question"
→ Backend returns empty products []
→ Frontend shows only the AI question bubble
→ User answers → loop continues
→ Eventually Gemini has enough info → type becomes "recommendation"
```

---

## AI vs Deterministic Logic Responsibilities

| Responsibility | Where | Why |
|---|---|---|
| Understand user intent | Gemini (AI) | Natural language is AI's domain |
| Generate follow-up questions | Gemini (AI) | Requires contextual reasoning |
| Extract budget/category/style | Gemini (AI) | Semantic parsing from free text |
| Explain recommendations | Gemini (AI) | Requires natural language generation |
| Filter by budget | productFilterService (deterministic) | Must be exact and reliable |
| Filter by category/subcategory | productFilterService (deterministic) | Boolean logic, no AI needed |
| Score product relevance | productFilterService (deterministic) | Transparent, testable algorithm |
| Sort results | productFilterService (deterministic) | Pure function |
| Validate user input | chatController (deterministic) | Security and reliability |
| Validate AI response schema | geminiService (deterministic) | Guard against hallucination |
| Multi-turn history management | useChat.js (deterministic) | Bounded array, no AI needed |

**Core principle:** AI makes decisions about meaning. Code makes decisions about data.

---

## Failure Handling

### Gemini API Failures

| Failure Type | Detection | Recovery |
|---|---|---|
| Network timeout (>15s) | axios timeout | 1 automatic retry after 1s |
| 5xx server error | HTTP status | 1 automatic retry |
| Malformed JSON response | JSON.parse() throws | Return fallback response object |
| Missing required fields | Field validation | Return fallback response object |
| Empty candidate response | Null check | Return fallback response object |
| Rate limiting (429) | HTTP status | Fallback + user message |

**Fallback response:** When all Gemini attempts fail, the system returns a friendly question asking the user to rephrase, maintaining conversation flow without crashing.

```js
// geminiService.js — fallback object
{
  type: 'question',
  message: "I'm having a moment — could you tell me a bit more...",
  filters: { /* all nulls */ },
  _fallback: true
}
```

### Frontend Failures

| Failure | Handling |
|---|---|
| Backend unreachable | Shows error bubble, `_fallback: true` timestamp |
| Request timeout (>20s) | Specific "took too long" message |
| 400 Bad Request | "Could you rephrase?" message |
| 429 Too Many Requests | "Give me a moment" message |
| Unknown errors | Generic retry message |

### Input Validation (deterministic)

```
- message must be a string
- message.trim().length must be 1–1000
- history must be an array
- each history turn must have valid role ("user"|"model") and parts[0].text
- Invalid turns are silently dropped (not rejected)
- maxBudget: must be a positive number ≤ 10,000,000
```

---

## Error Recovery

The system is designed to **never fully break the conversation**:

1. Gemini fails → fallback question → conversation continues
2. No products match filters → frontend shows nothing (no ghost cards)
3. AI returns invalid JSON → graceful parse fallback
4. AI hallucinates product IDs → productFilterService returns empty (IDs that don't exist are skipped)
5. Oversized payload → express JSON limit of 10kb rejects with 413

---

## Known Limitations

| Limitation | Impact | Future Fix |
|---|---|---|
| Static product data | Prices/availability may be outdated | Integrate live API (Shopify/Amazon) |
| No session persistence | Chat resets on page refresh | Add localStorage or backend sessions |
| Gemini response time ~2-4s | Noticeable lag | Stream Gemini responses token by token |
| Product images use emoji | Less visual appeal | Add image URLs to product JSON |
| No comparison view | Can't compare two products side by side | Add comparison panel |
| Single language (English) | Non-English input may confuse Gemini | Multi-language system prompt |
| Max 6 products shown | May miss edge cases | Pagination or "show more" |

---

## Future Improvements

### Near-term (next sprint)
- **Streaming responses** — Pipe Gemini token stream to frontend via SSE
- **Persistent sessions** — Save conversation to localStorage
- **Product image support** — Add image URLs to product schema
- **Comparison mode** — "Compare A vs B" conversation flow

### Medium-term
- **Live product API** — Replace static JSON with real inventory
- **User preference learning** — Remember past preferences within a session
- **Price alert flow** — "Notify me when this drops below ₹X"

### Long-term
- **Multi-modal input** — Upload an image of a product you saw
- **Purchase integration** — Deep link to real checkout flows
- **Feedback loop** — "Did you buy it? Was it right for you?" → improve recommendations
