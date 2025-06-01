const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
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
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
    }
    const response = await axios.get(url, { headers });

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

async function scrapingForCardsHQ(searchTerm){
  const pageBase = "https://www.cardshq.com/";
  const itemsPerPage = 36;
  // Step 1: Fetch first page to get total count
  const firstUrl = `${pageBase}search?q=${searchTerm}&page=1`;
  const { data: firstHtml } = await axios.get(firstUrl);
  const $ = cheerio.load(firstHtml);
  const CardShqRst= [];
  // Extract total count text like "68 results"
  let totalCount = 0;
  $('div').each((i, el) => {
    const text = $(el).text().trim();
    const match = text.match(/^(\d+)\s+results$/);
    if (match) {
      totalCount = parseInt(match[1], 10);
    }
  });

  if (totalCount === 0) {
    console.log("Could not find result count.");
    return;
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  console.log(`Total count: ${totalCount}, Pages: ${totalPages}`);
  // Step 2: Loop through all pages to get card data
  for (let page = 1; page <= totalPages; page++) {
    const url = `${pageBase}search?q=${searchTerm}&page=${page}`;
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    $('.group.relative.flex.flex-col.w-full').each((index, element) => {
      let str = $(element).find('a.relative.flex.h-full.w-full.justify-center').attr('href');
      str = str.split('/');
      const id = str[str.length - 1] || '';
      const card = $(element).find('h2').text().trim();
      const proxyUrl = $(element).find('img').attr('src')?.trim() || '';
      const priceStr = $(element).find('p').text().trim();
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      const url = pageBase + $(element).find('a.relative.flex.h-full.w-full.justify-center').attr('href');
      const market = 'CardsHQ';
      const difference = 0.8; // Placeholder for difference calculation

      var image = '';
      const urlMatch = proxyUrl.match(/url=([^&]+)/);
      if (urlMatch && urlMatch[1]) {
        image = decodeURIComponent(urlMatch[1]);
      }
      CardShqRst.push({ id, market, card, price, image, url, difference });
    });
  }
  return CardShqRst
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
      const cardShqResults = await scrapingForCardsHQ(searchTerm);
      results.push(...cardShqResults);
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