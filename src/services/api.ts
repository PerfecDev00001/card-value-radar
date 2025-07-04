// API Service for card marketplace searches
// This should be implemented as a backend service for security and CORS handling

export interface SearchParams {
  searchTerm: string;
  marketplaces: string[];
}

export interface SearchResult {
  id: string;
  market: string;
  card: string;
  price: number;
  image: string;
  url: string;
  difference: number;
  differenceBase?: string; // What the difference is compared to (e.g., "Market Average", "Lowest Price", etc.)
}

export class CardSearchAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Search for cards across multiple marketplaces
   * Calls the backend API which handles:
   * - API authentication with marketplace APIs
   * - Rate limiting
   * - Data aggregation
   * - Price comparison calculations
   */
  async searchCardsWitheBayAPI(params: SearchParams): Promise<SearchResult[]> {
    try {
      // Try to call the backend API first
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      } else {
        throw new Error('Server connection error');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Server connection error') {
        throw error;
      }
      throw new Error('Server connection error');
    }
  }

  /**
   * Mock data for development/testing
   */
  private getMockResults(params: SearchParams): SearchResult[] {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        market: 'eBay',
        card: `${params.searchTerm} PSA 10`,
        price: 299.99,
        image: 'https://via.placeholder.com/100x140?text=Card',
        url: 'https://www.ebay.com/itm/123456789',
        difference: 5.2,
        differenceBase: 'Market Average'
      },
      {
        id: '2',
        market: 'CardsHQ',
        card: `${params.searchTerm} PSA 10`,
        price: 285.00,
        image: 'https://via.placeholder.com/100x140?text=Card',
        url: 'https://www.cardshq.com/card/123456',
        difference: -2.8,
        differenceBase: 'Market Average'
      },
      {
        id: '3',
        market: 'MySlabs',
        card: `${params.searchTerm} PSA 10`,
        price: 310.50,
        image: 'https://via.placeholder.com/100x140?text=Card',
        url: 'https://www.myslabs.com/card/789012',
        difference: 8.9,
        differenceBase: 'Market Average'
      },
      {
        id: '4',
        market: 'eBay',
        card: `${params.searchTerm} PSA 9`,
        price: 189.99,
        image: 'https://via.placeholder.com/100x140?text=Card',
        url: 'https://www.ebay.com/itm/987654321',
        difference: -1.5,
        differenceBase: 'Similar Cards'
      }
    ];

    // Filter results based on selected marketplaces
    return mockResults.filter(result =>
        params.marketplaces.includes(result.market.toLowerCase().replace(/\s+/g, ''))
    );
  }
}

// Export singleton instance
// Use localhost:3001 for development, will be updated for production
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://sportscardapi.onrender.com/api'
    : 'http://localhost:3001/api';

export const cardSearchAPI = new CardSearchAPI(API_BASE_URL);