# Technical Document — Nexora AI Shopping Agent

**Authors:** Anuska Rai & Harsh Kumar  
**Deployment:** Frontend on Vercel | Backend on Render  

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React + Vite Frontend                              │   │
│  │                                                     │   │
│  │  useChat hook          ChatWindow component         │   │
│  │  ├─ LocalStorage save  ├─ Message bubble list       │   │
│  │  ├─ Error boundaries   ├─ Loading indicators        │   │
│  │  └─ API response logs  └─ Action CTA buttons        │   │
│  │                                                     │   │
│  │  ProductGrid           ProductCard                  │   │
│  │  ├─ Under-100w reason  ├─ Direct product links      │   │
│  │  └─ Safe array guards  └─ Default props fallback    │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ POST /api/chat { message, history }
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Node.js + Express Backend                  │
│                                                             │
│  chatController.js (Orchestration & Routing)                │
│  ├─ Step 1: Check Local Regex Extractor (0 API Calls)       │
│  ├─ Step 2: Query DummyJSON or Fallback to SerpApi          │
│  ├─ Step 3: Filter & relevance-score Google Shopping        │
│  └─ Step 4: Staggered Gemini reasoning with backoff         │
│                                                             │
│  geminiService.js              retrievalService.js          │
│  ├─ Model: gemini-1.5-flash    ├─ DummyJSON data store      │
│  ├─ 429 Backoff (2s → 4s)      └─ SerpApi Client            │
│  └─ x-goog-api-key auth           └─ engine: google_shopping│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Key Technical Implementation Decisions

### Decision 1: Google Shopping Engine Integration
Initially, the app used Google Custom Search API, which resulted in `403 Forbidden` errors due to search configuration limitations. We migrated to **SerpApi**.
*   *Implementation:* Rather than standard organic search (which returned blog reviews and YouTube links), we integrated `engine: 'google_shopping'`. This yields structured arrays with `extracted_price`, `source` (retailer name), and `thumbnail`.
*   *Relevance Filter:* Since Google Shopping searches are highly semantic and can return irrelevant accessories (like phone cases when searching for "headphones"), we added a regex word-match filter in `chatController.js` to ensure the product title contains at least one key word from the user's search query.

### Decision 2: Zero-Call Local Intent Extractor
To bypass the Gemini API free tier rate limit (~2 RPM limit on Gemini 2.5 Flash), we implemented a local regex parser in `geminiService.js` that intercepts common product searches:
*   *Implementation:* If a query matches search patterns (e.g. `[item] under [price]`), it extracts the `searchQuery` and `maxBudget` locally using regular expressions, returning the structured intent object immediately without hitting Gemini.
*   *Impact:* This reduced total Gemini API usage by over 90% and solved the persistent `429` error on search starts.

### Decision 3: Model Switch and Exponential Retry Backoff
We moved from `gemini-2.5-flash` to `gemini-1.5-flash` because the 1.5 free tier provides 15 RPM (vs 2.5's ~2 RPM).
*   *Backoff Logic:* For instances where Gemini is called (e.g., intent fallback or DummyJSON reasoning), we added a retry loop. If a `429` is caught:
    *   Attempt 1: Wait 2,000ms, retry once.
    *   Attempt 2: Wait 4,000ms, retry again.
    *   Attempt 3 (Final): Gracefully degrade.

---

## 3. AI vs. Deterministic Split

| Functionality | Component | Logic Type | Reason |
|---|---|---|---|
| Natural Language Chat | `geminiService` | AI | Conversational replies require NLP |
| Search Intent Extraction | `geminiService` | Hybrid | Regex first (fast/free), AI fallback for complex phrasing |
| Product Pricing & Budget | `chatController` | Deterministic | AI cannot reliably filter exact numbers |
| Live Product Querying | `SerpApi` | Deterministic | Crawled retail indexes are factual and structured |
| Title Relevance Filtering | `chatController` | Deterministic | Eliminates false-positives (cases, covers) strictly |
| UI Response Safety | `ProductGrid` | Deterministic | Prevents frontend crashes if API structures change |

---

## 4. Failure Handling & Graceful Degradation

### Scenario 1: Gemini API Rate Limit / Quota Exhaustion
*   *Symptom:* Gemini returns `429 Rate Limit Exceeded`.
*   *Handling:* The system catches the error. In the SerpApi search path, the backend bypasses the Gemini explanation generation and returns a locally constructed Markdown string: `"Here are the best deals I found for [item] under [budget]:"` alongside the raw product cards. In the standard path, it catches the error and provides a pre-formatted message without crashing.

### Scenario 2: Unexpected API Response Shape
*   *Symptom:* SerpApi returns items missing `link`, `extracted_price`, or list structures, causing frontend `.map()` crashes (blank screen).
*   *Handling:* We added robust defensive programming:
    *   *Frontend useChat Hook:* Validates `response.data` and falls back dynamically to `.products`, `.results`, or `.items` keys.
    *   *Frontend Grid:* Guards map execution with `Array.isArray(products) ? products : []`.
    *   *Frontend Card:* Uses default destructured values (`link = null`, `features = []`) and fallback checks so the cards render cleanly regardless of missing data.

---

## 5. Known Limitations & Next Steps
1.  **Direct Merchant API Integration:** Currently, SerpApi crawls Google Shopping. Connecting directly to Shopify Storefront API or Amazon Associates API would allow real-time checkout creation.
2.  **Streaming Responses:** Chat text takes 2 seconds to load. Implementing Server-Sent Events (SSE) to stream text token-by-token would improve the perceived UX.
3.  **Local Storage Size Constraints:** Chat histories are saved in localStorage. This can exceed limits over long sessions; adding a light backend database (SQLite/PostgreSQL) would resolve this.
