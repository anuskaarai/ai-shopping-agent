# Product Document — Nexora AI Shopping Agent

**Authors:** Anuska Rai & Harsh Kumar  
**Deployment:** Frontend on Vercel | Backend on Render  

---

## 1. Problem Statement & Context
Online shopping is broken. When a user wants to buy an electronic device, they are overwhelmed by hundreds of options, complex specification grids, and sponsored placements. Traditional e-commerce search relies on keyword matching, forcing users to manually research specs, read endless reviews, and figure out tradeoffs (e.g., "Is it worth paying ₹3,000 more for active noise cancellation?").

**The Core Problem:** Shoppers don't know what questions to ask. They know their end goal (e.g., "I want headphones to wear during work calls that won't hurt my ears"), but they don't know how that translates into specs like driver size, frequency response, or clamping force.

**Nexora** solves this by replacing the search-and-filter grid with a structured, intent-driven conversation. Instead of filtering, the user talks to an agent that asks relevant questions, understands their needs, retrieves real products, and explains the tradeoffs in plain language.

---

## 2. Target Users & Current Experience
*   **The Non-Technical Buyer:** Needs an appliance or gadget but gets lost in spec sheets. Their current experience is copying spec names into Google search to understand what they mean.
*   **The Budget-Conscious Shopper:** Has a hard price ceiling but wants the maximum utility. They struggle to find honest comparisons that aren't sponsored advertisements.
*   **The Goal-Oriented Buyer:** Has a specific use case (e.g., "coding", "commuting") rather than a specific product model. Their current experience is reading 10-page blog posts of "Top 10 Laptops of 2026."

---

## 3. The Core User Journey
1.  **State Need:** The user enters a natural language query (e.g., "need a smartwatch under 10k for running").
2.  **Clarifying Loop (Optional):** If the query is ambiguous, the agent asks 1–2 target questions (e.g., GPS preference, battery priority).
3.  **Search & Retrieve:** The system searches the internal catalog (via DummyJSON) or falls back to live web deals.
4.  **AI Synthesis:** The agent presents curated recommendations alongside a human-readable summary explaining the exact pros, cons, and tradeoffs.

---

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

---

## 5. Scope Decisions (What We Left Out & Why)
*   **Checkout & Payment Integrations:** We intentionally avoided building a shopping cart. The hard problem in e-commerce is *discovery* and *confidence*. Once a user decides, they are redirected to trusted retailers like Amazon or Flipkart via direct product links.
*   **User Accounts & Auth:** Omitted for the MVP. We wanted zero friction for testing. Instead, we persist session state and chat history in the browser's `localStorage`.
*   **Scraping Detailed Reviews:** We planned to scrape full user reviews but realized it introduced latency of 10+ seconds per query. We scoped this down to extracting high-level snippets and features to keep response times under 3 seconds.

---

## 6. Real-World Tradeoffs & Practical Challenges

### Tradeoff 1: AI Explanations vs. API Quota Exhaustion
During testing, our Gemini API key hit severe rate limits (429 errors). We faced a choice: either fail the request or degrade gracefully.
*   *Resolution:* We modified the SerpApi fallback to skip Gemini entirely if the API fails or is near limits. Instead, it generates a clean, structured text template pointing to the live deals. We also implemented a local regex intent extractor to intercept common queries without hitting the Gemini API at all, cutting API consumption by 90%.

### Tradeoff 2: Broad Web Search vs. Structured Shopping Data
Our first SerpApi integration used standard Google Search. It returned blog posts, review sites, and YouTube videos instead of actual products.
*   *Resolution:* We shifted to the `google_shopping` engine in SerpApi. This returned structured price, retailer, and thumbnail data. To prevent accessory clutter (like phone cases when searching for "headphones"), we added title-relevance filtering in the backend to throw out non-matching titles.
