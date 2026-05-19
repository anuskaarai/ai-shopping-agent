# Decision Log — Nexora AI Shopping Agent

This log lists the key engineering decisions, options considered, and selected trade-offs during the development of Nexora.

---

## DL-001 · Architecture and Tech Stack
*   **Decision:** React + Vite (Frontend) and Node.js + Express (Backend).
*   **Options Considered:**
    *   Next.js Monolith: Fast setup, but harder to demonstrate the division between deterministic backend scoring and frontend UI components.
    *   React + Node.js (Separate): Decoupled layers, clean code inspection, simple API mapping.
*   **Choice:** React/Vite + Express.
*   **Reason:** Gives a distinct boundary. The backend acts as the orchestrator (API retrieval, filtering, and scoring), keeping the React UI responsive and lightweight.

---

## DL-002 · Data Strategy (Hybrid Approach)
*   **Decision:** Internal database (DummyJSON mock) for standard matches; live API crawler for general query fallbacks.
*   **Options Considered:**
    *   100% Mock JSON: Safe, but users cannot search for arbitrary electronic items.
    *   100% Live APIs: Hard to control schema, risks network failure and speed issues.
*   **Choice:** Hybrid. Catalog first, fall back to live crawl if no matches.
*   **Reason:** Delivers the speed of local structured queries, but handles arbitrary user inquiries ("gaming chair under 15000") by falling back to live deals.

---

## DL-003 · AI vs. Deterministic Split
*   **Decision:** AI extracts search attributes; deterministic code executes filters and mathematical scoring.
*   **Choice:** Semantic intent extraction (Gemini) + Boolean constraints execution (Code).
*   **Reason:** Large Language Models are unreliable at math and strict filtering. Instructing an LLM to find products "under ₹5,000" can return ₹5,200 items because they are semantically "close." Code-based filtering enforces limits with 100% precision.

---

## DL-004 · Google Custom Search to SerpApi Migration
*   **Decision:** Replace Google Custom Search Engine (CSE) with SerpApi.
*   **Why:** Google CSE frequently returned `403 Forbidden` errors due to strict query quotas and API limitations, which broke the live fallback search.
*   **Tradeoff:** Introducing a third-party wrapper (SerpApi), but it resolved the authorization blocks immediately.

---

## DL-005 · Google Search to Google Shopping Engine
*   **Decision:** Use SerpApi's `google_shopping` engine instead of standard organic search.
*   **Why:** Organic web searches returned blogs, YouTube reviews, and news sites rather than buyable product links. Switching to Google Shopping gives structured prices, merchant sites, and product thumbnails.
*   **Result:** Product cards now map to genuine buy links on Amazon, Flipkart, and Croma instead of random text URLs.

---

## DL-006 · Managing Gemini API 429 Rate Limits
*   **Decision:** Add a local regex-based intent extractor, switch to `gemini-1.5-flash`, and implement retry backoff.
*   **Why:** The Gemini 2.5 Flash free-tier has a strict 2 RPM limit. Making two AI calls (intent parsing + reasoning) per query hit the rate limit immediately.
*   **Resolution:**
    *   *Local Extractor:* Matches common search phrases locally using regular expressions (extracts search item and budget). This processes ~90% of searches with 0 API calls.
    *   *Model Downgrade:* Swapped `gemini-2.5-flash` to `gemini-1.5-flash` (which offers a 15 RPM free tier).
    *   *Exponential Backoff:* Implemented a 2s → 4s wait loop on caught 429s, falling back to a structured local template if the rate limit persists.

---

## DL-007 · Title-Relevance Filtering for Shopping Results
*   **Decision:** Add a relevance matching check on product titles in the backend.
*   **Why:** Google Shopping searches return loose semantic matches. Searching for "headphones under 5000" returned headphone covers, headphone stands, and auxiliary cables.
*   **Resolution:** The backend now tokenizes the user's search query and checks if at least one core word (e.g. "headphones") is present in the product title, successfully filtering out accessories.

---

## DL-008 · Frontend Stability and Crash Prevention
*   **Decision:** Implement comprehensive prop default values and array checks in React components.
*   **Why:** Differences between internal JSON schemas and external SerpApi payloads (undefined fields like `link`, `useCase`, or `features`) caused the React app to crash with a blank screen.
*   **Resolution:**
    *   Ensured all product arrays default to `[]` and mapped variables using `safeProducts`.
    *   Applied default parameter values inside `ProductCard` (e.g. `link = null`, `features = []`) so that missing API fields do not throw JavaScript errors.
