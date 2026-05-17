# ShopSense — AI Shopping Agent

Shopping online is genuinely painful. You type "laptop" and get 847 results, 60 filter options, and zero guidance on what actually matters for what you need. I built ShopSense to fix that.

The idea is simple: instead of filtering, you have a conversation. You tell it what you're looking for, it asks you a couple of smart questions, and then it explains exactly why it's recommending what it recommends. No "sponsored" badges, no dark patterns — just honest reasoning.

---

## How it works

The core design decision I'm most proud of: **AI and deterministic code do different jobs.**

- **Gemini handles:** understanding what you mean, asking the right follow-up, explaining the tradeoffs
- **Regular code handles:** budget filtering, scoring, sorting — things that need to be exact and reliable

So when you say "under 5000", the code enforces that hard. Gemini doesn't touch product data directly — it just extracts your intent and passes structured filters to the filtering layer. This means Gemini can't hallucinate a product that doesn't exist.

---

## Running it locally

You'll need Node 18+ and a Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey)).

**Backend:**
```bash
cd backend
cp .env.example .env
# paste your Gemini key into .env
npm install
npm run dev
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

Then open [localhost:5173](http://localhost:5173).

---

## Project layout

```
├── frontend/
│   ├── src/
│   │   ├── components/      # Header, ChatWindow, MessageBubble, ProductCard, ProductGrid, TypingIndicator
│   │   ├── hooks/useChat.js # All chat state, history management, error handling
│   │   ├── App.jsx          # Split-panel layout (chat left, products right)
│   │   └── index.css        # Design tokens, animations, all custom styles
│   └── vite.config.js       # Tailwind v4 plugin + proxy to backend
│
├── backend/
│   ├── server.js                       # Express entry point
│   ├── routes/                         # chat.js, products.js
│   ├── controllers/chatController.js   # Glue layer — validates, calls AI, filters
│   ├── services/
│   │   ├── geminiService.js            # Only file that talks to Gemini
│   │   └── productFilterService.js     # Pure deterministic logic, no AI
│   └── data/products.json              # 30+ products across electronics, footwear, clothing
│
└── docs/
    ├── product.md        # Problem, users, decisions, tradeoffs
    ├── technical.md      # Architecture, data flow, failure handling
    └── decision-log.md   # Every significant decision with reasoning
```

---

## API

```
POST /api/chat
Body: { message: string, history: [] }

GET  /api/products
GET  /api/products/search?category=&maxBudget=&style=
GET  /api/health
```

---

## What I didn't build (and why)

- **No auth** — not the point of this project
- **No payments** — discovery is the hard problem, checkout is solved
- **No real product API** — static JSON means demos never break; the data layer is swappable
- **No custom ML** — Gemini is better at shopping reasoning than anything I'd train in a hackathon timeline

---

## Known rough edges

- Chat resets on page refresh (no persistence yet)
- Mobile layout stacks chat above products — works but isn't optimised
- Gemini takes 2–3 seconds per response; streaming would fix this

---

## Docs

- [Product doc](docs/product.md) — why this problem, who it's for, what we decided
- [Technical doc](docs/technical.md) — architecture, failure handling, limitations
- [Decision log](docs/decision-log.md) — the reasoning behind every major call we made
