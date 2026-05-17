# Decision Log — ShopSense AI Shopping Agent

> A running log of every significant decision made during the build.
> Format: **Decision → Options Considered → Choice → Reason → Tradeoff**

---

## DL-001 · Tech Stack Selection

**Date:** Day 1  
**Decision:** React + Vite + Tailwind (frontend), Node.js + Express (backend), Gemini API (AI)

**Options Considered:**
- Next.js full-stack vs separate frontend/backend
- OpenAI GPT-4 vs Gemini
- Plain fetch vs axios

**Choice:** React/Vite + Express + Gemini

**Reason:**
- Vite gives instant HMR — critical for rapid iteration during hackathon
- Separate backend is a cleaner architecture boundary; judges can see the AI/deterministic split clearly
- Gemini API has a generous free tier and excellent instruction-following for structured JSON output
- Axios gives cleaner error handling and timeout support vs raw fetch

**Tradeoff:** More files to manage than a Next.js monolith, but clearer separation of concerns.

---

## DL-002 · Static JSON vs Live Product API

**Date:** Day 1  
**Decision:** Use static JSON product dataset instead of Shopify, Amazon, or Flipkart APIs

**Options Considered:**
- Shopify Storefront API
- RapidAPI Amazon scraper
- Fake Store API (fakeapi.platzi.com)
- Custom static JSON

**Choice:** Custom static JSON (`backend/data/products.json`)

**Reason:**
- Zero external dependencies = 100% demo reliability
- Full control over product schema (can add fields like `useCase`, `style` that real APIs don't expose)
- No API keys to manage, no rate limits, no schema surprises
- Faster iteration: changing a product takes 5 seconds

**Tradeoff:** Products are not real-time. Prices reflect approximate market rates, not live data. Architecture is designed so swapping to a live API is a single-file change in `productFilterService.js`.

---

## DL-003 · AI Output Schema Design

**Date:** Day 1  
**Decision:** Force Gemini to return strict JSON with `type`, `message`, `filters`, `productIds`, and `reasoning` fields

**Options Considered:**
- Free-form text response → parse with regex
- Semi-structured markdown → extract sections
- Strict JSON schema → parse deterministically

**Choice:** Strict JSON schema via system prompt + `responseMimeType: "application/json"`

**Reason:**
- Free-form text is unparseable reliably — AI hallucination breaks the pipeline
- The `type` field ("question" vs "recommendation") drives the entire UI branching
- Structured `filters` enables deterministic product filtering without AI involvement
- `reasoning` field surfaces explainability directly in the UI

**Tradeoff:** Stricter prompting means slightly more Gemini output tokens used per call. Acceptable cost for reliability.

---

## DL-004 · AI vs Deterministic Responsibility Split

**Date:** Day 1  
**Decision:** AI extracts intent → deterministic code filters products. AI never touches product data directly.

**Options Considered:**
- Let Gemini pick products by name from the full product list
- Give Gemini the product JSON and have it select directly
- AI extracts filters → code applies filters

**Choice:** AI extracts structured filters → `productFilterService.js` does all filtering

**Reason:**
- Gemini hallucinating product names would be catastrophic (recommending products that don't exist)
- Budget enforcement must be exact — "under ₹5000" cannot be approximate
- Deterministic code is testable, auditable, and debuggable
- Separation means product logic can be improved without touching AI prompts

**Tradeoff:** Two-step pipeline adds ~5ms latency. Worth it for correctness guarantee.

---

## DL-005 · Multi-turn Conversation History

**Date:** Day 2  
**Decision:** Maintain Gemini conversation history in a `useRef` (not state) on the frontend, capped at 10 turns

**Options Considered:**
- Store history in React state → causes re-renders on every append
- Store in backend session → requires auth + session management
- Store in localStorage → persists across reloads (more complex)
- Store in useRef, cap at 20 entries (10 turns)

**Choice:** `useRef` capped at 20 entries

**Reason:**
- `useRef` doesn't trigger re-renders — clean separation of conversation tracking from UI state
- 10 turns is sufficient context for any shopping conversation (2–3 questions + recommendation)
- Caps prevent ever-growing payloads that would hit Gemini token limits
- No backend session complexity needed

**Tradeoff:** History resets on page refresh. Acceptable for MVP.

---

## DL-006 · Retry Strategy for Gemini Failures

**Date:** Day 2  
**Decision:** Retry Gemini once after 1 second on any failure, then return a structured fallback response

**Options Considered:**
- No retry → immediate fallback
- 3 retries with exponential backoff
- 1 retry after 1 second → fallback

**Choice:** 1 retry after 1s

**Reason:**
- Most Gemini failures are transient (network blip, brief overload)
- Single retry catches ~80% of transient failures with minimal added latency
- 3 retries would add 6–9s of wait time — unacceptable for chat UX
- Fallback response keeps conversation going even when Gemini is fully unavailable

**Tradeoff:** Very rare back-to-back failures will hit the fallback. The fallback message is crafted to feel natural, not like a system error.

---

## DL-007 · Product Relevance Scoring Algorithm

**Date:** Day 2  
**Decision:** Score products on a 0–100 scale using: base rating score + style match + use-case overlap + brand match + budget headroom

**Options Considered:**
- Sort purely by rating
- Sort purely by price proximity to budget
- Multi-factor weighted score

**Choice:** Multi-factor weighted score

```
Base score   = rating × 10         (max 50)
Style match  = +20 if exact match
Use-case     = +5 per match        (max 20)
Brand match  = +10 if mentioned
Budget ratio = price/maxBudget × 10 (max 10)
```

**Reason:**
- Pure rating sort ignores user context (a 4.9-star TV is irrelevant for headphones)
- Price proximity alone ignores quality
- Weighted multi-factor score mirrors how a knowledgeable salesperson would rank products

**Tradeoff:** Weights are heuristic, not ML-trained. They can be tuned without touching AI code.

---

## DL-008 · Layout: Split Panel vs Full-screen Chat

**Date:** Day 3  
**Decision:** Split-panel layout — chat on left, products appear on right after recommendation

**Options Considered:**
- Full-screen chat → products appear as messages (like shopping chatbots)
- Separate page for products (route change)
- Split panel: chat left, products right

**Choice:** Split panel with animated column expansion

**Reason:**
- Keeps chat as the primary interface (doesn't abandon the conversation)
- Products in a dedicated panel are scannable — users can compare cards at a glance
- The panel appearing dynamically signals "I found something!" — better UX than inline messages
- No page navigation = no context loss

**Tradeoff:** On mobile (< 768px), the layout stacks vertically. Products appear below chat. This is acceptable for MVP.

---

## DL-009 · Not Building Authentication

**Date:** Day 1  
**Decision:** No user accounts, no login, no session persistence across page reloads

**Reason:**
- Auth adds auth service, database, JWT handling, cookie management — all irrelevant to the core thesis
- The product being evaluated is the **shopping reasoning**, not account management
- Multi-session persistence can be approximated with localStorage in a future iteration

**Tradeoff:** Users lose their conversation on refresh. Acceptable for a demo context.

---

## DL-010 · Quick-Start Prompts

**Date:** Day 3  
**Decision:** Show 5 quick-start prompt chips on the welcome screen

**Options Considered:**
- Blank input only
- Suggested categories (Electronics, Footwear…)
- Free-form example text in placeholder
- Clickable prompt chips

**Choice:** Clickable prompt chips

**Reason:**
- The biggest UX risk of a conversational agent is the blank-page problem — users don't know how to start
- Pre-written prompts demonstrate the system's capability immediately
- Chips are dismissive (they disappear after first message) so they don't clutter the interface

**Tradeoff:** Curated prompts may not cover every user's mental model. Mitigated by the open text input being always available.
