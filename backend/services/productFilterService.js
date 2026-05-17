/**
 * productFilterService.js
 *
 * Pure deterministic logic — no AI anywhere in this file.
 * This is intentional. Budget filtering needs to be exact.
 * If Gemini says "under 5000", the code enforces that hard.
 *
 * The scoring algorithm is a weighted multi-factor system:
 * - Base: product rating (so bad products don't surface)
 * - Style/use-case match: rewards relevance to what the user said
 * - Budget headroom: prefers products that use the budget well
 *
 * It's not ML-trained. The weights are heuristic and can be tuned
 * without touching any AI code.
 */

const products = require('../data/products.json');

function filterProducts(criteria = {}) {
  const {
    category,
    subcategory,
    maxBudget,
    minBudget = 0,
    style,
    useCases = [],
    brand,
    productIds,
    sortBy = 'relevance',
  } = criteria;

  // If Gemini gave us specific product IDs, try those first
  if (productIds && productIds.length > 0) {
    const pinned = products.filter((p) => productIds.includes(p.id));
    if (pinned.length > 0) {
      return applyBudgetFilter(pinned, minBudget, maxBudget).slice(0, 6);
    }
  }

  let results = products.filter((p) => {
    if (!p.inStock) return false;
    if (category && p.category !== category) return false;
    if (subcategory && p.subcategory !== subcategory) return false;
    if (maxBudget !== undefined && p.price > maxBudget) return false;
    if (p.price < minBudget) return false;

    // Hard block clearly incompatible styles (e.g. gaming gear for formal use)
    if (style && INCOMPATIBLE_STYLES[style]?.includes(p.style)) return false;

    return true;
  });

  results = results.map((p) => ({ ...p, _score: scoreProduct(p, criteria) }));
  results = sortProducts(results, sortBy);

  return results.slice(0, 6).map(({ _score, ...p }) => p);
}

function scoreProduct(product, criteria) {
  let score = product.rating * 10; // base score out of 50

  const { style, useCases = [], brand, maxBudget } = criteria;

  if (style && product.style === style) score += 20;

  if (useCases.length > 0) {
    const overlap = product.useCase.filter((u) => useCases.includes(u));
    score += Math.min(overlap.length * 5, 20);
  }

  if (brand && product.brand.toLowerCase() === brand.toLowerCase()) score += 10;

  // Prefer products that use the budget well (not the cheapest, not over budget)
  if (maxBudget !== undefined) {
    score += Math.round((product.price / maxBudget) * 10);
  }

  return score;
}

function sortProducts(products, sortBy) {
  switch (sortBy) {
    case 'price_asc':  return products.sort((a, b) => a.price - b.price);
    case 'price_desc': return products.sort((a, b) => b.price - a.price);
    case 'rating':     return products.sort((a, b) => b.rating - a.rating);
    default:           return products.sort((a, b) => b._score - a._score);
  }
}

function applyBudgetFilter(list, min, max) {
  return list.filter((p) => {
    if (max !== undefined && p.price > max) return false;
    if (p.price < (min || 0)) return false;
    return true;
  });
}

// Prevents obviously bad matches — gaming headset for a formal office setup, etc.
const INCOMPATIBLE_STYLES = {
  formal:  ['gaming', 'outdoor'],
  gaming:  ['formal'],
  outdoor: ['formal'],
};

function parseBudget(value) {
  const n = Number(value);
  if (!isNaN(n) && n > 0 && n <= 10000000) return n;
  return undefined;
}

function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

function getCategories() {
  return [...new Set(products.map((p) => p.category))];
}

module.exports = { filterProducts, parseBudget, getProductById, getCategories };
