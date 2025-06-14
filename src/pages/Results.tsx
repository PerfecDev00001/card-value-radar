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
  DollarSign,
  Search,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Define types based on Supabase schema
type SavedSearch = Database['public']['Tables']['saved_searches']['Row'];
type SearchResult = Database['public']['Tables']['search_results']['Row'] & {
  marketplace_name?: string;
  condition?: string;
  grade?: string;
};

export function Results() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterMarketplace, setFilterMarketplace] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [marketplaces, setMarketplaces] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  // Fetch saved searches and marketplaces on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      
      try {
        // Fetch marketplaces for reference
        const { data: marketplacesData, error: marketplacesError } = await supabase
          .from('marketplaces')
          .select('id, name');
        
        if (marketplacesError) throw marketplacesError;
        
        const marketplacesMap: {[key: string]: string} = {};
        marketplacesData?.forEach(m => {
          marketplacesMap[m.id] = m.name;
        });
        setMarketplaces(marketplacesMap);
        
        // Fetch saved searches
        const { data: searches, error: searchesError } = await supabase
          .from('saved_searches')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (searchesError) throw searchesError;
        
        setSavedSearches(searches || []);
        
        // If there are saved searches, select the most recent one
        if (searches && searches.length > 0) {
          setSelectedSearch(searches[0].id);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load saved searches. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [toast]);
  
  // Fetch search results when a saved search is selected
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!selectedSearch) return;
      
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('search_results')
          .select('*')
          .eq('saved_search_id', selectedSearch);
        
        if (error) throw error;
        
        // Enhance results with marketplace names and parse metadata
        const enhancedResults = data?.map(result => {
          const metadata = result.metadata as any || {};
          return {
            ...result,
            marketplace_name: marketplaces[result.marketplace_id] || 'Unknown',
            condition: metadata.condition || 'Unknown',
            grade: metadata.grade || null
          };
        }) || [];
        
        setResults(enhancedResults);
        setFilteredResults(enhancedResults);
      } catch (error) {
        console.error('Error fetching search results:', error);
        toast({
          title: 'Error',
          description: 'Failed to load search results. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSearchResults();
  }, [selectedSearch, marketplaces, toast]);
  
  // Filter and sort results when filter criteria change
  useEffect(() => {
    let filtered = results.filter(result => {
      const matchesSearch = result.card_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMarketplace = filterMarketplace === 'all' || 
        result.marketplace_name?.toLowerCase() === filterMarketplace.toLowerCase();
      return matchesSearch && matchesMarketplace;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof SearchResult];
      let bValue: any = b[sortBy as keyof SearchResult];
      
      // Handle special cases for marketplace_name which isn't directly in the type
      if (sortBy === 'marketplace_name') {
        aValue = a.marketplace_name || '';
        bValue = b.marketplace_name || '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredResults(filtered);
  }, [results, searchTerm, filterMarketplace, sortBy, sortOrder]);

  const getPriceChangeIcon = (currentPrice: number | null, avgPrice: number | null) => {
    if (!currentPrice || !avgPrice) return null;
    
    if (currentPrice > avgPrice) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (currentPrice < avgPrice) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getPriceChangePercentage = (currentPrice: number | null, avgPrice: number | null) => {
    if (!currentPrice || !avgPrice || avgPrice === 0) return '0.0';
    return ((currentPrice - avgPrice) / avgPrice * 100).toFixed(1);
  };

  const getMarketplaceBadgeColor = (marketplace: string) => {
    switch (marketplace?.toLowerCase()) {
      case 'ebay':
        return 'bg-blue-100 text-blue-800';
      case 'pwcc':
        return 'bg-purple-100 text-purple-800';
      case 'comc':
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
          {selectedSearch ? 
            `Found ${filteredResults.length} results across multiple marketplaces` : 
            'Select a saved search to view results'}
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
              <Select value={selectedSearch || ''} onValueChange={setSelectedSearch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a saved search" />
                </SelectTrigger>
                <SelectContent>
                  {savedSearches.map(search => (
                    <SelectItem key={search.id} value={search.id}>
                      {search.search_terms}
                      {search.filters && 
                        <span className="ml-2 text-muted-foreground">
                          ({JSON.stringify(search.filters).substring(0, 20)}...)
                        </span>
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterMarketplace} onValueChange={setFilterMarketplace}>
                <SelectTrigger>
                  <SelectValue placeholder="All Marketplaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marketplaces</SelectItem>
                  {Object.values(marketplaces).map(name => (
                    <SelectItem key={name} value={name.toLowerCase()}>
                      {name}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="sold_price_avg">Avg Sold Price</SelectItem>
                  <SelectItem value="card_name">Card Name</SelectItem>
                  <SelectItem value="date_fetched">Date</SelectItem>
                  <SelectItem value="marketplace_name">Marketplace</SelectItem>
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

      {selectedSearch && (
        <>
         
          {/* Results Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((result) => (
              <Card key={result.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Card Image */}
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {result.metadata && (result.metadata as any).image_url ? (
                      <img
                        src={(result.metadata as any).image_url}
                        alt={result.card_name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <BarChart3 className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Card Name and Marketplace */}
                    <div>
                      <h3 className="font-semibold text-sm leading-tight">{result.card_name}</h3>
                      <Badge className={`text-xs mt-1 ${getMarketplaceBadgeColor(result.marketplace_name || '')}`}>
                        {result.marketplace_name}
                      </Badge>
                      {result.condition && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          {result.condition} {result.grade && `(${result.grade})`}
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    {/* Pricing Information */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Price</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-lg">${result.price?.toFixed(2) || 'N/A'}</span>
                          {getPriceChangeIcon(result.price, result.sold_price_avg)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Avg Sold Price</span>
                        <span className="text-sm">${result.sold_price_avg?.toFixed(2) || 'N/A'}</span>
                      </div>

                      {result.price && result.sold_price_avg && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Price Change</span>
                          <span className={`text-sm font-medium ${
                            result.price > result.sold_price_avg ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {result.price > result.sold_price_avg ? '+' : ''}
                            {getPriceChangePercentage(result.price, result.sold_price_avg)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Card Details */}
                    <div className="space-y-1">
                      {(result.metadata as any)?.seller && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Seller</span>
                          <span>{(result.metadata as any).seller}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date Found</span>
                        <span>{result.date_fetched ? new Date(result.date_fetched).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex gap-2">
                      {result.listing_url ? (
                        <Button asChild size="sm" className="flex-1">
                          <a href={result.listing_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Listing
                          </a>
                        </Button>
                      ) : (
                        <Button disabled size="sm" className="flex-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          No URL Available
                        </Button>
                      )}
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
        </>
      )}
    </div>
  );
}