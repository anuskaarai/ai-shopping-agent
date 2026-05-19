# Nexora — AI Shopping Agent

Nexora is an intent-driven AI shopping assistant designed to simplify online electronics and appliance shopping. Instead of forcing users through endless grids of checkboxes and sponsored ads, Nexora allows users to search in natural language, analyzes their requirements, runs deterministic filters, crawls live deals, and explains the tradeoffs in plain terms.

*   **Live App:** [ai-shopping-agent-alpha.vercel.app](https://ai-shopping-agent-alpha.vercel.app)
*   **Backend API Status:** [Render Health API](https://ai-shopping-agent-wp5h.onrender.com/api/health)

---

## 📽️ Demo Video
*   **[Demo Video Link (Unlisted/Drive)]** *(Placeholder: Paste your Google Drive or unlisted YouTube link here)*

---

## 👥 Contribution Note

*   **Anuska Rai (Lead Product & Development):** Led the product architecture and the core backend/frontend development. Responsible for the LLM intent extraction logic, the deterministic filter scoring service, the migration from Google Custom Search to SerpApi Google Shopping engine, the local regex-based intent extraction layer to bypass 429 rate limit errors, and debugging the frontend JSON compatibility layer to prevent rendering crashes.
*   **Harsh Kumar (Frontend Setup & Testing):** Contributed to setting up the initial frontend skeleton, styles, and basic component layout. Conducted comprehensive user-testing across edge cases to identify and document irrelevant search results (e.g. phone cases displaying under headphones queries), which helped shape the backend title-relevance filters.

---

## 🛠️ Running Locally

### Prerequisites
*   Node.js (v18 or higher)
*   A Gemini API Key (get one free at [Google AI Studio](https://aistudio.google.com/))
*   A SerpApi Key (for live shopping search fallbacks)

### Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and populate your keys:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   SERP_API_KEY=your_serpapi_key_here
   PORT=5000
   ```
4. Install dependencies and start the backend:
   ```bash
   npm install
   npm run dev
   ```

### Frontend Configuration
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

---

# ==========================================
# REQUIRED DOCUMENT 1: PRODUCT DOCUMENT
# ==========================================

**Authors:** Anuska Rai & Harsh Kumar  
**Deployment:** Frontend on Vercel | Backend on Render  

## 1. Problem Statement & Context
Online shopping is broken. When a user wants to buy an electronic device, they are overwhelmed by hundreds of options, complex specification grids, and sponsored placements. Traditional e-commerce search relies on keyword matching, forcing users to manually research specs, read endless reviews, and figure out tradeoffs (e.g., "Is it worth paying ₹3,000 more for active noise cancellation?").

**The Core Problem:** Shoppers don't know what questions to ask. They know their end goal (e.g., "I want headphones to wear during work calls that won't hurt my ears"), but they don't know how that translates into specs like driver size, frequency response, or clamping force.

**Nexora** solves this by replacing the search-and-filter grid with a structured, intent-driven conversation. Instead of filtering, the user talks to an agent that asks relevant questions, understands their needs, retrieves real products, and explains the tradeoffs in plain language.

## 2. Target Users & Current Experience
*   **The Non-Technical Buyer:** Needs an appliance or gadget but gets lost in spec sheets. Their current experience is copying spec names into Google search to understand what they mean.
*   **The Budget-Conscious Shopper:** Has a strict price ceiling but wants the maximum utility. They struggle to find honest comparisons that aren't sponsored advertisements.
*   **The Goal-Oriented Buyer:** Has a specific use case (e.g., "coding", "commuting") rather than a specific product model. Their current experience is reading 10-page blog posts of "Top 10 Laptops of 2026."

## 3. The Core User Journey
1.  **State Need:** The user enters a natural language query (e.g., "need a smartwatch under 10k for running").
2.  **Clarifying Loop (Optional):** If the query is ambiguous, the agent asks 1–2 target questions (e.g., GPS preference, battery priority).
3.  **Search & Retrieve:** The system searches the internal catalog (via DummyJSON) or falls back to live web deals.
4.  **AI Synthesis:** The agent presents curated recommendations alongside a human-readable summary explaining the exact pros, cons, and tradeoffs.

## 4. Key Product Decisions & Rationale

### Decision 1: Hybrid AI & Deterministic Pipeline
We decided to split responsibilities strictly. Gemini extracts the user's intent (desired category, budget, preferences), but a deterministic backend service handles the actual filtering and sorting of products.
*   *Why:* AI is notoriously poor at enforcing hard numerical boundaries (like "under ₹5,000") and can hallucinate products that do not exist. Deterministic code guarantees that budget limits are respected exactly and that only real products are shown.

### Decision 2: Google Shopping Live Fallback
Initially, if a product wasn't found in our catalog, the bot would give up. We decided to add a live fallback.
*   *Why:* Electronics shoppers expect live prices and immediate availability. We integrated SerpApi to crawl live deals from major Indian retailers (Amazon, Flipkart, Croma) dynamically, ensuring the agent remains useful even for products outside our database.

### Decision 3: Limit Recommendations to 3–5 items
We strictly cap recommendation cards at 5.
*   *Why:* Decision paralysis is caused by too many choices. A curated list of 3 high-quality options is far more valuable than a list of 50.

## 5. Scope Decisions (What We Left Out & Why)
*   **Checkout & Payment Integrations:** We intentionally avoided building a shopping cart. The hard problem in e-commerce is *discovery* and *confidence*. Once a user decides, they are redirected to trusted retailers like Amazon or Flipkart via direct product links.
*   **User Accounts & Auth:** Omitted for the MVP. We wanted zero friction for testing. Instead, we persist session state and chat history in the browser's `localStorage`.
*   **Scraping Detailed Reviews:** We planned to scrape full user reviews but realized it introduced latency of 10+ seconds per query. We scoped this down to extracting high-level snippets and features to keep response times under 3 seconds.

## 6. Real-World Tradeoffs & Practical Challenges

### Tradeoff 1: AI Explanations vs. API Quota Exhaustion
During testing, our Gemini API key hit severe rate limits (429 errors). We faced a choice: either fail the request or degrade gracefully.
*   *Resolution:* We modified the SerpApi fallback to skip Gemini entirely if the API fails or is near limits. Instead, it generates a clean, structured text template pointing to the live deals. We also implemented a local regex intent extractor to intercept common queries without hitting the Gemini API at all, cutting API consumption by 90%.

### Tradeoff 2: Broad Web Search vs. Structured Shopping Data
Our first SerpApi integration used standard Google Search. It returned blog posts, review sites, and YouTube videos instead of actual products.
*   *Resolution:* We shifted to the `google_shopping` engine in SerpApi. This returned structured price, retailer, and thumbnail data. To prevent accessory clutter (like phone cases when searching for "headphones"), we added title-relevance filtering in the backend to throw out non-matching titles.

---

# ==========================================
# REQUIRED DOCUMENT 2: TECHNICAL DOCUMENT
# ==========================================

**Authors:** Anuska Rai & Harsh Kumar  
**Deployment:** Frontend on Vercel | Backend on Render  

## 1. System Architecture

```
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

## 3. AI vs. Deterministic Split

| Functionality | Component | Logic Type | Reason |
|---|---|---|---|
| Natural Language Chat | `geminiService` | AI | Conversational replies require NLP |
| Search Intent Extraction | `geminiService` | Hybrid | Regex first (fast/free), AI fallback for complex phrasing |
| Product Pricing & Budget | `chatController` | Deterministic | AI cannot reliably filter exact numbers |
| Live Product Querying | `SerpApi` | Deterministic | Crawled retail indexes are factual and structured |
| Title Relevance Filtering | `chatController` | Deterministic | Eliminates false-positives (cases, covers) strictly |
| UI Response Safety | `ProductGrid` | Deterministic | Prevents frontend crashes if API structures change |

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

## 5. Known Limitations & Next Steps
1.  **Direct Merchant API Integration:** Connecting directly to Shopify Storefront API or Amazon Associates API would allow real-time checkout creation.
2.  **Streaming Responses:** Chat text takes 2 seconds to load. Implementing Server-Sent Events (SSE) to stream text token-by-token would improve the perceived UX.
3.  **Local Storage Size Constraints:** Chat histories are saved in localStorage. This can exceed limits over long sessions; adding a light database would resolve this.

---

# ==========================================
# RECOMMENDED DOCUMENT 3: DECISION LOG
# ==========================================

This log lists the key engineering decisions, options considered, and selected trade-offs during the development of Nexora.

### DL-001 · Architecture and Tech Stack
*   **Decision:** React + Vite (Frontend) and Node.js + Express (Backend).
*   **Choice:** React/Vite + Express.
*   **Reason:** Gives a distinct boundary. The backend acts as the orchestrator (API retrieval, filtering, and scoring), keeping the React UI responsive and lightweight.

### DL-002 · Data Strategy (Hybrid Approach)
*   **Decision:** Internal database (DummyJSON mock) for standard matches; live API crawler for general query fallbacks.
*   **Choice:** Hybrid. Catalog first, fall back to live crawl if no matches.
*   **Reason:** Delivers the speed of local structured queries, but handles arbitrary user inquiries ("gaming chair under 15000") by falling back to live deals.

### DL-003 · AI vs. Deterministic Split
*   **Decision:** AI extracts search attributes; deterministic code executes filters and mathematical scoring.
*   **Choice:** Semantic intent extraction (Gemini) + Boolean constraints execution (Code).
*   **Reason:** Large Language Models are unreliable at math and strict filtering. Instructing an LLM to find products "under ₹5,000" can return ₹5,200 items because they are semantically "close." Code-based filtering enforces limits with 100% precision.

### DL-004 · Google Custom Search to SerpApi Migration
*   **Decision:** Replace Google Custom Search Engine (CSE) with SerpApi.
*   **Why:** Google CSE frequently returned `403 Forbidden` errors due to strict query quotas and API limitations, which broke the live fallback search.
*   **Tradeoff:** Introducing a third-party wrapper (SerpApi), but it resolved the authorization blocks immediately.

### DL-005 · Google Search to Google Shopping Engine
*   **Decision:** Use SerpApi's `google_shopping` engine instead of standard organic search.
*   **Why:** Organic web searches returned blogs, YouTube reviews, and news sites rather than buyable product links. Switching to Google Shopping gives structured prices, merchant sites, and product thumbnails.
*   **Result:** Product cards now map to genuine buy links on Amazon, Flipkart, and Croma instead of random text URLs.

### DL-006 · Managing Gemini API 429 Rate Limits
*   **Decision:** Add a local regex-based intent extractor, switch to `gemini-1.5-flash`, and implement retry backoff.
*   **Why:** The Gemini 2.5 Flash free-tier has a strict 2 RPM limit. Making two AI calls (intent parsing + reasoning) per query hit the rate limit immediately.
*   **Resolution:**
    *   *Local Extractor:* Matches common search phrases locally using regular expressions (extracts search item and budget). This processes ~90% of searches with 0 API calls.
    *   *Model Downgrade:* Swapped `gemini-2.5-flash` to `gemini-1.5-flash` (which offers a 15 RPM free tier).
    *   *Exponential Backoff:* Implemented a 2s → 4s wait loop on caught 429s, falling back to a structured local template if the rate limit persists.

### DL-007 · Title-Relevance Filtering for Shopping Results
*   **Decision:** Add a relevance matching check on product titles in the backend.
*   **Why:** Google Shopping searches return loose semantic matches. Searching for "headphones under 5000" returned headphone covers, headphone stands, and auxiliary cables.
*   **Resolution:** The backend now tokenizes the user's search query and checks if at least one core word (e.g. "headphones") is present in the product title, successfully filtering out accessories.

### DL-008 · Frontend Stability and Crash Prevention
*   **Decision:** Implement comprehensive prop default values and array checks in React components.
*   **Why:** Differences between internal JSON schemas and external SerpApi payloads (undefined fields like `link`, `useCase`, or `features`) caused the React app to crash with a blank screen.
*   **Resolution:**
    *   Ensured all product arrays default to `[]` and mapped variables using `safeProducts`.
    *   Applied default parameter values inside `ProductCard` (e.g. `link = null`, `features = []`) so that missing API fields do not throw JavaScript errors.
