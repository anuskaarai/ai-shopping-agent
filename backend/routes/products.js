const express = require('express');
const router = express.Router();
const products = require('../data/products.json');
const { filterProducts } = require('../services/productFilterService');

// GET /api/products — return all products
router.get('/', (req, res) => {
  res.json({ products, total: products.length });
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  const categories = [...new Set(products.map((p) => p.category))];
  res.json({ categories });
});

// GET /api/products/search?q=...&category=...&maxBudget=...
router.get('/search', (req, res) => {
  const { q, category, maxBudget, minBudget, style, sortBy } = req.query;
  const results = filterProducts({
    category,
    maxBudget: maxBudget ? Number(maxBudget) : undefined,
    minBudget: minBudget ? Number(minBudget) : undefined,
    style,
    sortBy,
  });
  res.json({ products: results, total: results.length });
});

module.exports = router;
