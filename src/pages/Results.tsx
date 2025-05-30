
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  ExternalLink, 
  Filter, 
  SortAsc, 
  SortDesc,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  cardName: string;
  marketplace: string;
  price: number;
  soldPriceAvg: number;
  condition: string;
  grade?: string;
  listingUrl: string;
  dateFetched: string;
  imageUrl?: string;
}

export function Results() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterMarketplace, setFilterMarketplace] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Mock data - in real app this would come from Supabase
  const mockResults: SearchResult[] = [
    {
      id: '1',
      cardName: '2021 Topps Chrome Patrick Mahomes',
      marketplace: 'eBay',
      price: 124.99,
      soldPriceAvg: 132.50,
      condition: 'PSA 10',
      grade: '10',
      listingUrl: 'https://ebay.com/item/123',
      dateFetched: '2024-01-15T10:30:00Z',
      imageUrl: '/placeholder.svg'
    },
    {
      id: '2',
      cardName: '2021 Topps Chrome Patrick Mahomes',
      marketplace: 'PWCC',
      price: 135.00,
      soldPriceAvg: 132.50,
      condition: 'PSA 10',
      grade: '10',
      listingUrl: 'https://pwcc.com/item/456',
      dateFetched: '2024-01-15T11:00:00Z',
      imageUrl: '/placeholder.svg'
    },
    {
      id: '3',
      cardName: '2022 Panini Prizm Tom Brady',
      marketplace: 'eBay',
      price: 89.99,
      soldPriceAvg: 95.25,
      condition: 'BGS 9.5',
      grade: '9.5',
      listingUrl: 'https://ebay.com/item/789',
      dateFetched: '2024-01-15T12:15:00Z',
      imageUrl: '/placeholder.svg'
    }
  ];

  useEffect(() => {
    // Simulate loading search results
    const loadResults = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResults(mockResults);
      setFilteredResults(mockResults);
      setLoading(false);
    };

    loadResults();
  }, []);

  useEffect(() => {
    let filtered = results.filter(result => {
      const matchesSearch = result.cardName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMarketplace = filterMarketplace === 'all' || result.marketplace === filterMarketplace;
      return matchesSearch && matchesMarketplace;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aValue: number | string = a[sortBy as keyof SearchResult];
      let bValue: number | string = b[sortBy as keyof SearchResult];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredResults(filtered);
  }, [results, searchTerm, filterMarketplace, sortBy, sortOrder]);

  const getPriceChangeIcon = (currentPrice: number, avgPrice: number) => {
    if (currentPrice > avgPrice) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (currentPrice < avgPrice) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getPriceChangePercentage = (currentPrice: number, avgPrice: number) => {
    if (avgPrice === 0) return 0;
    return ((currentPrice - avgPrice) / avgPrice * 100).toFixed(1);
  };

  const getMarketplaceBadgeColor = (marketplace: string) => {
    switch (marketplace) {
      case 'eBay':
        return 'bg-blue-100 text-blue-800';
      case 'PWCC':
        return 'bg-purple-100 text-purple-800';
      case 'COMC':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
          <p className="text-muted-foreground">Loading your search results...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
        <p className="text-muted-foreground">
          Found {filteredResults.length} results across multiple marketplaces
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Sort Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select value={filterMarketplace} onValueChange={setFilterMarketplace}>
                <SelectTrigger>
                  <SelectValue placeholder="All Marketplaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marketplaces</SelectItem>
                  <SelectItem value="eBay">eBay</SelectItem>
                  <SelectItem value="PWCC">PWCC</SelectItem>
                  <SelectItem value="COMC">COMC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="soldPriceAvg">Avg Sold Price</SelectItem>
                  <SelectItem value="cardName">Card Name</SelectItem>
                  <SelectItem value="dateFetched">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <SortAsc className="h-4 w-4 mr-2" />
                    Ascending
                  </>
                ) : (
                  <>
                    <SortDesc className="h-4 w-4 mr-2" />
                    Descending
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResults.map((result) => (
          <Card key={result.id} className="overflow-hidden">
            <CardContent className="p-0">
              {/* Card Image */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-gray-400" />
              </div>
              
              <div className="p-4 space-y-3">
                {/* Card Name and Marketplace */}
                <div>
                  <h3 className="font-semibold text-sm leading-tight">{result.cardName}</h3>
                  <Badge className={`text-xs mt-1 ${getMarketplaceBadgeColor(result.marketplace)}`}>
                    {result.marketplace}
                  </Badge>
                </div>

                <Separator />

                {/* Pricing Information */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Price</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-lg">${result.price}</span>
                      {getPriceChangeIcon(result.price, result.soldPriceAvg)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Sold (Last 3)</span>
                    <span className="text-sm">${result.soldPriceAvg}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Price Change</span>
                    <span className={`text-sm font-medium ${
                      result.price > result.soldPriceAvg ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {result.price > result.soldPriceAvg ? '+' : ''}
                      {getPriceChangePercentage(result.price, result.soldPriceAvg)}%
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Card Details */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Condition</span>
                    <span>{result.condition}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date Found</span>
                    <span>{new Date(result.dateFetched).toLocaleDateString()}</span>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1">
                    <a href={result.listingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Listing
                    </a>
                  </Button>
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResults.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find more results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
