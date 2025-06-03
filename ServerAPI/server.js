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

async function scrapingForCardsMySlabs(searchTerm){
  const baseUrl = "https://www.myslabs.com";
  const query = searchTerm;
  const perPage = 72;
  let results = [];

  const axiosInstance = axios.create({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const delay = ms => new Promise(res => setTimeout(res, ms));

  try {
    // Fetch first page to determine total count
    const firstUrl = `${baseUrl}/search/all/?publish_type=all&owner=&q=${encodeURIComponent(query)}&x=13&y=14&o=created_desc`;
    console.log('Scraping URL:', firstUrl);

    const { data: firstHtml } = await axiosInstance.get(firstUrl);
    const $first = cheerio.load(firstHtml);

    // Scrape items on the first page
    $first('.slab_item').each((i, el) => {
      const card = $first(el).find('.slab-title').text().trim();
      let priceStr = $first(el).find('.item-price').text().trim();
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      const image = $first(el).find('.slab_item_img_inside img').attr('data-src')?.trim() ||
          $first(el).find('.slab_item_img_inside img').attr('src')?.trim() || '';
      let urlStr = $first(el).find('.text-decoration-none').attr('href')?.trim() || '';
      const url = baseUrl + urlStr;
      let idStr = urlStr.split('view');
      const id = parseFloat(idStr[1].replace(/[^0-9.]/g, ''));
      results.push({ id, market: 'MySlabs', card, price, image, url, difference: 0.8 });
    });

    // Extract total count
    const countText = $first('a#pills-all-tab small').text().trim();
    const countMatch = countText.match(/\(([\d,]+)\)/);
    const totalCount = countMatch ? parseInt(countMatch[1].replace(/,/g, '')) : 0;
    console.log('Total count:', totalCount);

    // Calculate total pages
    let totalPages = Math.ceil(totalCount / perPage);
    totalPages = totalPages > 25 ? 25 : totalPages;  // Optional limit to 25 pages
    console.log('Total pages:', totalPages);

    // Loop through the remaining pages
    for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
      const pageUrl = `${baseUrl}/search/all/?publish_type=all&q=${encodeURIComponent(query)}&o=created_desc&page=${pageNum}`;
      console.log('Scraping URL:', pageUrl);

      try {
        const { data: html } = await axiosInstance.get(pageUrl);
        const $ = cheerio.load(html);

        $('.slab_item').each((i, el) => {
          const card = $(el).find('.slab-title').text().trim();
          let priceStr = $(el).find('.item-price').text().trim();
          let price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
          const image = $(el).find('.slab_item_img_inside img').attr('data-src')?.trim() ||
              $(el).find('.slab_item_img_inside img').attr('src')?.trim() || '';
          let urlStr = ($first(el).find('.text-decoration-none').attr('href')?.trim() || '');
          const url = baseUrl + urlStr;
          let idStr = urlStr.split('view');
          const id = parseFloat(idStr[1].replace(/[^0-9.]/g, ''));
          results.push({ id, market: 'MySlabs', card, price, image, url, difference: 0.8 });
        });

        await delay(1000); // Polite delay between requests
      } catch (err) {
        console.error(`Failed on page ${pageNum}:`, err.message);
        break; // Optional: break on repeated failures
      }
    }

    console.log('Scraped total count:', results.length);
    console.log('Scraped total count:', results[results.length-1]);
    // Optionally return or save the results
    return results;

  } catch (err) {
    console.error('Initial scraping failed:', err.message);
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
      const cardShqResults = await scrapingForCardsHQ(searchTerm);
      results.push(...cardShqResults);
    }

    if (marketplaces.includes('myslabs')) {
      const cardMySlabsResults = await scrapingForCardsMySlabs(searchTerm);
      results.push(...cardMySlabsResults);
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