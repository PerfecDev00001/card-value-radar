const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// eBay API Configuration
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const EBAY_BASE_URL = 'https://api.ebay.com';

// Cache for access tokens
let accessTokenCache = {
  token: null,
  expires: 0
};

// Get eBay access token
async function getEbayAccessToken() {
  // Check if we have a valid cached token
  // if (accessTokenCache.token && Date.now() < accessTokenCache.expires) {
  //   return accessTokenCache.token;
  // }

  try {
    const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(
      `${EBAY_BASE_URL}/identity/v1/oauth2/token`,
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    const { access_token } = response.data;
    return access_token;
  } catch (error) {
    console.error('Error getting eBay access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with eBay API');
  }
}

// Search eBay for cards
async function searchEbayCards(searchTerm) {
  try {
    const token = await getEbayAccessToken();
    
    const response = await axios.get(
      `${EBAY_BASE_URL}/buy/browse/v1/item_summary/search`,
      {
        params: {
          q: searchTerm,
          category_ids: '213', // Sports Trading Cards category
          limit: 20,
          sort: 'price'
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const items = response.data.itemSummaries || [];
    
    return items.map((item, index) => ({
      id: `ebay-${item.itemId || index}`,
      market: 'eBay',
      card: item.title,
      price: parseFloat(item.price?.value || 0),
      image: item.image?.imageUrl || 'https://via.placeholder.com/100x140?text=Card',
      url: item.itemWebUrl,
      difference: Math.random() * 10 - 5 // Mock difference for now
    }));
  } catch (error) {
    console.error('Error searching eBay:', error.response?.data || error.message);
    return []; // Return empty array on error
  }
}

// API Routes
app.post('/api/search', async (req, res) => {
  try {
    const { searchTerm, marketplaces } = req.body;

    if (!searchTerm || !marketplaces?.length) {
      return res.status(400).json({ error: 'Search term and marketplaces are required' });
    }

    const results = [];

    // Search eBay if selected
    if (marketplaces.includes('ebay')) {
      const ebayResults = await searchEbayCards(searchTerm);
      results.push(...ebayResults);
    }

    // Add other marketplaces here (mock data for now)
    if (marketplaces.includes('cardshq')) {
      results.push({
        id: 'cardshq-1',
        market: 'CardsHQ',
        card: `${searchTerm} PSA 10`,
        price: 285.00,
        image: 'https://via.placeholder.com/100x140?text=Card',
        url: 'https://www.cardshq.com/card/123456',
        difference: -2.8
      });
    }

    if (marketplaces.includes('myslabs')) {
      results.push({
        id: 'myslabs-1',
        market: 'MySlabs',
        card: `${searchTerm} PSA 10`,
        price: 310.50,
        image: 'https://via.placeholder.com/100x140?text=Card',
        url: 'https://www.myslabs.com/card/789012',
        difference: 8.9
      });
    }

    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});