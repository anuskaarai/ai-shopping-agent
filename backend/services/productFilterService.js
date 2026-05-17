/**
 * productFilterService.js
 * -------------------------------------------------------
 * DETERMINISTIC logic only — no AI involved in this file.
 * All filtering, sorting, scoring, and budget validation
 * lives here so it can be tested independently of Gemini.
 * -------------------------------------------------------
 */

const products = require('../data/products.json');

/**
 * @typedef {Object} FilterCriteria
 * @property {string}   [category]    - electronics | footwear | clothing | accessories
 * @property {string}   [subcategory] - headphones | sneakers | laptop | etc.
 * @property {number}   [maxBudget]   - upper price limit in INR
 * @property {number}   [minBudget]   - lower price limit in INR
 * @property {string}   [style]       - casual | premium | gaming | formal | budget | outdoor
 * @property {string[]} [useCases]    - ["gaming","travel","work",…]
 * @property {string}   [brand]       - brand preference
 * @property {string[]} [productIds]  - explicit IDs recommended by AI
 * @property {string}   [sortBy]      - price_asc | price_desc | rating | relevance
 */

/**
 * Filter and score products based on deterministic criteria.
 * @param {FilterCriteria} criteria
 * @returns {Array} - scored, sorted product list (max 6)
 */
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

  // If AI provided explicit product IDs, honour them first
  if (productIds && productIds.length > 0) {
    const pinned = products.filter((p) => productIds.includes(p.id));
    if (pinned.length > 0) return applyBudgetFilter(pinned, minBudget, maxBudget).slice(0, 6);
  }

  let results = products.filter((p) => {
    // 1. Must be in stock
    if (!p.inStock) return false;

    // 2. Category filter
    if (category && p.category !== category) return false;

    // 3. Sub-category filter
    if (subcategory && p.subcategory !== subcategory) return false;

    // 4. Budget filter
    if (maxBudget !== undefined && p.price > maxBudget) return false;
    if (p.price < minBudget) return false;

    // 5. Style filter — soft match (don't eliminate, reduce score instead)
    // Hard block only when style is explicitly mismatched
    if (style && INCOMPATIBLE_STYLES[style] && INCOMPATIBLE_STYLES[style].includes(p.style)) {
      return false;
    }

    // 6. Brand filter (soft — return if no match but still score low)
    return true;
  });

  // Score each product for relevance
  results = results.map((p) => ({ ...p, _score: scoreProduct(p, criteria) }));

  // Sort
  results = sortProducts(results, sortBy);

  return results.slice(0, 6).map(({ _score, ...p }) => p);
}

/**
 * Score a product from 0–100 based on how well it matches criteria.
 * Higher is better.
 */
function scoreProduct(product, criteria) {
  let score = product.rating * 10; // base score from rating (max 50)

  const { style, useCases = [], brand, maxBudget } = criteria;

  // Style match: +20
  if (style && product.style === style) score += 20;

  // Use-case overlap: +5 per matching use case (max +20)
  if (useCases.length > 0) {
    const overlap = product.useCase.filter((u) => useCases.includes(u));
    score += Math.min(overlap.length * 5, 20);
  }

  // Brand match: +10
  if (brand && product.brand.toLowerCase() === brand.toLowerCase()) score += 10;

  // Budget headroom bonus: closer to budget ceiling = more relevant (up to +10)
  if (maxBudget !== undefined) {
    const ratio = product.price / maxBudget;
    if (ratio <= 1) score += Math.round(ratio * 10);
  }

  return score;
}

/**
 * Sort products by the given sort key.
 */
function sortProducts(products, sortBy) {
  switch (sortBy) {
    case 'price_asc':
      return products.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return products.sort((a, b) => b.price - a.price);
    case 'rating':
      return products.sort((a, b) => b.rating - a.rating);
    case 'relevance':
    default:
      return products.sort((a, b) => b._score - a._score);
  }
}

/**
 * Apply budget filter as a post-step (used when AI sends product IDs).
 */
function applyBudgetFilter(list, min, max) {
  return list.filter((p) => {
    if (max !== undefined && p.price > max) return false;
    if (p.price < (min || 0)) return false;
    return true;
  });
}

/**
 * Style incompatibility map — prevents absurd recommendations.
 * e.g. if user wants "formal", don't show "gaming" products.
 */
const INCOMPATIBLE_STYLES = {
  formal: ['gaming', 'outdoor'],
  gaming: ['formal'],
  outdoor: ['formal'],
};

/**
 * Validate that extracted budget is a sensible number.
 * @param {*} value
 * @returns {number|undefined}
 */
function parseBudget(value) {
  const n = Number(value);
  if (!isNaN(n) && n > 0 && n <= 10000000) return n;
  return undefined;
}

/**
 * Get a single product by ID.
 */
function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

/**
 * Get all categories in the dataset.
 */
function getCategories() {
  return [...new Set(products.map((p) => p.category))];
}

module.exports = { filterProducts, parseBudget, getProductById, getCategories };
