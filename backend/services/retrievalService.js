const axios = require('axios');

/**
 * Dynamically retrieves products from an external API (DummyJSON)
 * based on the extracted search query.
 */
async function fetchProductsFromAPI(searchQuery) {
  try {
    // If there's no specific search query, just get a generic list
    const query = searchQuery ? encodeURIComponent(searchQuery) : '';
    const url = `https://dummyjson.com/products/search?q=${query}&limit=10`;
    
    console.log(`[Retrieval] Fetching products from: ${url}`);
    const response = await axios.get(url);
    
    if (!response.data || !response.data.products) {
      return [];
    }

    // Map DummyJSON structure to our frontend's expected structure
    return response.data.products.map(p => ({
      id: `dj_${p.id}`,
      name: p.title,
      category: p.category,
      subcategory: p.category, // DummyJSON has broad categories
      price: Math.floor(p.price * 83), // Convert USD to approximate INR
      rating: p.rating,
      brand: p.brand || 'Generic',
      style: 'casual',
      useCase: [],
      color: 'default',
      features: p.tags || [p.category],
      inStock: p.stock > 0,
      imageUrl: p.thumbnail, // direct image URL
      description: p.description
    }));

  } catch (err) {
    console.error('[Retrieval] Failed to fetch products:', err.message);
    return [];
  }
}

/**
 * Deterministic filtering logic.
 * The backend handles this, NOT the LLM.
 */
function deterministicFilter(products, intent) {
  let filtered = [...products];

  // 1. Budget Filtering
  if (intent.maxBudget && !isNaN(intent.maxBudget)) {
    filtered = filtered.filter(p => p.price <= intent.maxBudget);
  }
  if (intent.minBudget && !isNaN(intent.minBudget)) {
    filtered = filtered.filter(p => p.price >= intent.minBudget);
  }

  // 2. Sort by Rating by default to show best items first
  filtered.sort((a, b) => b.rating - a.rating);

  // Return top 4 matches
  return filtered.slice(0, 4);
}

module.exports = {
  fetchProductsFromAPI,
  deterministicFilter
};
