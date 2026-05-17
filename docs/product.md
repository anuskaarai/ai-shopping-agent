# Product Document — ShopSense AI Shopping Agent

## Problem Statement

Online shopping today is broken for the majority of users. When someone wants to buy a laptop, they face 47 filter options, hundreds of results, and conflicting spec sheets — with zero guidance on what actually matters for their situation.

**The core problem:** Shoppers don't know what questions to ask. They know their *goal* (e.g., "a laptop for college"), but they don't know which specs matter, which tradeoffs to accept, or which products are genuinely suited to them.

Traditional search-and-filter approaches put the cognitive burden entirely on the shopper. The result is decision paralysis, poor purchases, and high return rates.

---

## Why the Problem Matters

- **Decision fatigue is real.** Studies show that more choices lead to worse decisions and lower satisfaction.
- **Search doesn't understand intent.** Searching "laptop under 40000" returns 200 results — none of which explain *why* they'd suit you.
- **Filters require expertise.** Most users don't know the difference between a Core i5 and Ryzen 5, or between OLED and IPS panels.
- **Recommendations aren't explanations.** "Best seller" badges don't tell you *why* something is best for *you*.

---

## Target Users

| User Type | Behaviour | Pain Point |
|-----------|-----------|------------|
| First-time buyer | Doesn't know what specs matter | Overwhelmed by choices |
| Budget-conscious shopper | Has a strict ceiling | Can't easily compare value |
| Gift buyer | Shopping for someone else's needs | Unclear requirements |
| Upgrader | Knows vaguely what they want | Can't articulate differences |

---

## Current Shopping Pain Points

1. **Filter overload** — Too many dimensions to slice simultaneously
2. **No context** — Filters don't understand "for college" vs "for video editing"
3. **Fake personalisation** — "Recommended for you" is just paid placement
4. **Spec jargon** — Product descriptions assume technical knowledge
5. **No tradeoff guidance** — Nothing explains "pay ₹5000 more for 2x battery life"
6. **Zero follow-up** — Can't ask the site a clarifying question

---

## Core User Flow

```
User states need (e.g., "I need headphones")
        ↓
ShopSense asks 1–2 targeted questions
(budget? use-case? style? brand preference?)
        ↓
User answers
        ↓
AI understands intent, extracts structured filters
        ↓
Deterministic engine filters & scores products
        ↓
AI explains WHY each pick suits this specific user
        ↓
User sees ≤4 curated recommendations with reasoning
        ↓
Guided toward purchase decision
```

---

## Product Decisions

### Decision 1: Conversational First, Browse Second
We deliberately removed a category-browse view from MVP. The point of the product is to *replace* browsing with conversation. Adding a browse view undermines the core thesis.

### Decision 2: Max 4 Recommendations
Showing 4 products forces quality over quantity. It also mirrors how a trusted friend would shop with you — they wouldn't hand you 50 options.

### Decision 3: Reasoning is Mandatory
Every recommendation surface includes a "Why these products?" explanation. This is non-negotiable. Without it, ShopSense is just a chatbot.

### Decision 4: Quick-Start Prompts
New users don't know how to start conversations with an AI. Quick prompts reduce the blank-page problem and onboard users into the interaction model.

### Decision 5: Split Panel Layout
Chat on the left, products on the right. Products appear only after a recommendation — keeping the conversation as the primary interface, with products as the output.

---

## Scope Decisions (What We Intentionally Did Not Build)

| Feature | Why Excluded |
|---------|--------------|
| User authentication | Adds infra complexity, not needed for MVP demo |
| Payment integration | Out of scope — focus is discovery, not checkout |
| Real e-commerce API | Reliability risk for demos; static data is fully controlled |
| Product images | Would require CDN or image scraping; emoji icons convey category clearly |
| Wishlist / saved items | Multi-session persistence adds backend complexity |
| Price comparison across sellers | Requires live scraping or API — not hackathon-scoped |
| Voice input | Nice-to-have; text-first covers 95% of use cases |
| Custom ML model | Gemini API gives better results faster |

---

## Tradeoffs and Reasoning

### Tradeoff 1: Static JSON vs Live API
- **Chose:** Static JSON product dataset
- **Why:** 100% reliable for demos. No rate limits, no auth keys, no schema surprises.
- **Cost:** Products are not real-time. Prices may be outdated.
- **Mitigation:** The architecture clearly separates data layer from logic, making a live API swap straightforward.

### Tradeoff 2: Gemini Flash vs Gemini Pro
- **Chose:** Gemini 1.5 Flash
- **Why:** Faster responses (critical for chat UX). Lower cost. Sufficient reasoning for shopping context.
- **Cost:** Slightly less capable than Pro on complex multi-step reasoning.

### Tradeoff 3: AI-asks-first vs Instant Results
- **Chose:** AI asks 1–2 questions before recommending
- **Why:** Better recommendations. Demonstrates the intelligence of the system. Aligns with the product thesis.
- **Cost:** Slightly more friction than instant results.
- **Mitigation:** Quick-start prompts pre-fill common queries to reduce friction.

### Tradeoff 4: Deterministic Filtering vs AI Filtering
- **Chose:** AI extracts intent → deterministic code filters
- **Why:** AI filtering is unpredictable and untestable. Deterministic code is reliable, explainable, and auditable.
- **Cost:** Two-step pipeline is slightly more complex to build.
- **Benefit:** Budget is always respected exactly. Recommendations never hallucinate products.
