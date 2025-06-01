# API Implementation Guide

## Overview
This document outlines how to implement the backend API for secure marketplace integration.

## Security Issues Fixed
The original code had several critical security and technical issues:

### ❌ Problems with Frontend API Integration:
1. **Exposed Credentials**: API keys and secrets were hardcoded in frontend code
2. **CORS Issues**: Direct browser calls to eBay API are blocked by CORS policy
3. **Browser Compatibility**: `Buffer` is not available in browser environment
4. **Rate Limiting**: No protection against API rate limits
5. **Security Risk**: Credentials visible to all users

### ✅ Proper Solution - Backend API:
1. **Secure Credentials**: API keys stored securely on server
2. **CORS Handling**: Backend acts as proxy to external APIs
3. **Rate Limiting**: Server-side rate limiting and caching
4. **Error Handling**: Proper error handling and logging
5. **Data Processing**: Server-side data aggregation and price comparison

## Backend Implementation

### Required Backend Endpoints:

#### POST /api/search
Search for cards across multiple marketplaces.

**Request Body:**
```json
{
  "searchTerm": "2021 Topps Chrome Patrick Mahomes",
  "marketplaces": ["ebay", "cardshq", "myslabs"]
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "unique-id",
      "market": "eBay",
      "card": "2021 Topps Chrome Patrick Mahomes PSA 10",
      "price": 299.99,
      "image": "https://image-url.com/card.jpg",
      "url": "https://marketplace-url.com/item",
      "difference": 5.2
    }
  ],
  "totalResults": 1,
  "searchTime": "2024-01-01T12:00:00Z"
}
```

### Environment Variables:
```bash
# eBay API
EBAY_CLIENT_ID=your_client_id
EBAY_CLIENT_SECRET=your_client_secret
EBAY_ENVIRONMENT=production # or sandbox

# Other marketplace APIs
CARDSHQ_API_KEY=your_api_key
MYSLABS_API_KEY=your_api_key

# Database
DATABASE_URL=your_database_url

# Redis for caching
REDIS_URL=your_redis_url
```

### Backend Technology Stack Options:

#### Option 1: Node.js/Express
```javascript
// Example Express endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { searchTerm, marketplaces } = req.body;
    
    // Validate input
    if (!searchTerm || !marketplaces?.length) {
      return res.status(400).json({ error: 'Invalid search parameters' });
    }
    
    // Search each marketplace
    const results = await Promise.allSettled(
      marketplaces.map(marketplace => searchMarketplace(marketplace, searchTerm))
    );
    
    // Process and aggregate results
    const aggregatedResults = processResults(results);
    
    res.json({ results: aggregatedResults });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
```

#### Option 2: Python/FastAPI
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

class SearchRequest(BaseModel):
    searchTerm: str
    marketplaces: list[str]

@app.post("/api/search")
async def search_cards(request: SearchRequest):
    try:
        # Validate input
        if not request.searchTerm or not request.marketplaces:
            raise HTTPException(status_code=400, detail="Invalid search parameters")
        
        # Search marketplaces
        results = await search_all_marketplaces(request.searchTerm, request.marketplaces)
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Search failed")
```

### Marketplace Integration Examples:

#### eBay API Integration:
```javascript
async function searchEbay(searchTerm) {
  // Get OAuth token
  const token = await getEbayToken();
  
  // Search items
  const response = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  // Transform to our format
  return data.itemSummaries?.map(item => ({
    id: item.itemId,
    market: 'eBay',
    card: item.title,
    price: parseFloat(item.price.value),
    image: item.image?.imageUrl,
    url: item.itemWebUrl,
    difference: calculatePriceDifference(item.price.value)
  })) || [];
}
```

## Current Implementation Status

✅ **Frontend**: Updated to use secure API service pattern  
✅ **API Service**: Created with proper TypeScript interfaces  
✅ **Mock Data**: Working mock implementation for development  
⏳ **Backend**: Needs to be implemented  
⏳ **Database**: Needs to be set up for caching and analytics  

## Next Steps

1. **Choose Backend Technology**: Node.js/Express or Python/FastAPI
2. **Set up Environment**: Configure API keys and database
3. **Implement Marketplace APIs**: Start with eBay, then add others
4. **Add Caching**: Implement Redis for performance
5. **Deploy Backend**: Set up hosting and CI/CD
6. **Update Frontend**: Point to production API endpoints

## Development vs Production

### Development:
- Uses mock data from `src/services/api.ts`
- No external API calls
- Fast development and testing

### Production:
- Backend API handles all external integrations
- Secure credential management
- Real marketplace data
- Caching and rate limiting