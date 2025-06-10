import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomMultiSelect } from '@/components/ui/custom-multi-select';
import { useToast } from '@/hooks/use-toast';
import { Search as SearchIcon, ExternalLink, ChevronLeft, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { cardSearchAPI, type SearchResult } from '@/services/api';

export function SearchTest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter state
  const [marketFilter, setMarketFilter] = useState<string[]>([]);
  const [cardFilter, setCardFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  const { toast } = useToast();
  
  // State for marketplace options fetched from Supabase
  const [marketplaceOptions, setMarketplaceOptions] = useState<{ label: string; value: string }[]>([]);
  const [fetchingMarketplaces, setFetchingMarketplaces] = useState(false);
  
  // Fetch marketplaces from Supabase
  useEffect(() => {
    const fetchMarketplaces = async () => {
      setFetchingMarketplaces(true);
      try {
        const { data, error } = await supabase
          .from('marketplaces')
          .select('id, name')
          .eq('is_active', true);
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to the format expected by CustomMultiSelect
          const options = data.map(marketplace => ({
            label: marketplace.name,
            value: marketplace.name,
          }));
          //marketplace.id.toLowerCase()
          setMarketplaceOptions(options);
        }
      } catch (error) {
        console.error('Error fetching marketplaces:', error);
        toast({
          title: "Failed to load marketplaces",
          description: "There was an error loading marketplace options",
          variant: "destructive"
        });
      } finally {
        setFetchingMarketplaces(false);
      }
    };
    
    fetchMarketplaces();
  }, [toast]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a search term for cards",
        variant: "destructive"
      });
      return;
    }

    if (selectedMarketplaces.length === 0) {
      toast({
        title: "Marketplace required",
        description: "Please select at least one marketplace",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    // Clear old data immediately when starting new search
    setResults([]);
    // Reset filters and pagination
    setMarketFilter([]);
    setCardFilter('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
    
    try {
      // Use the API service to search for cards
      const searchResults = await cardSearchAPI.searchCardsWitheBayAPI({
        searchTerm,
        marketplaces: selectedMarketplaces
      });

      setResults(searchResults);
      
      toast({
        title: "Search completed!",
        description: `Found ${searchResults.length} results for "${searchTerm}"`,
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: "There was an error performing your search",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and pagination logic
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      // Market filter
      if (marketFilter.length > 0 && !marketFilter.includes(result.market.toLowerCase())) {
        return false;
      }
      
      // Card name filter
      if (cardFilter && !result.card.toLowerCase().includes(cardFilter.toLowerCase())) {
        return false;
      }
      
      // Price range filter
      if (minPrice && result.price < parseFloat(minPrice)) {
        return false;
      }
      
      if (maxPrice && result.price > parseFloat(maxPrice)) {
        return false;
      }
      
      return true;
    });
  }, [results, marketFilter, cardFilter, minPrice, maxPrice]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  }, [filteredResults, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setMarketFilter([]);
    setCardFilter('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  // Get unique markets for filter options
  const availableMarkets = useMemo(() => {
    const markets = [...new Set(results.map(result => result.market))];
    return markets.map(market => ({ label: market, value: market.toLowerCase() }));
  }, [results]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDifference = (difference: number) => {
    const sign = difference >= 0 ? '+' : '';
    return `${sign}${difference.toFixed(1)}%`;
  };

  const getDifferenceColor = (difference: number) => {
    if (difference > 0) return 'text-green-600';
    if (difference < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full">
        <CardHeader>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            {/* Labels Row */}
            <div className="flex gap-4">
              <div className="w-[50%]">
                <Label htmlFor="searchTerm">Search Term</Label>
              </div>
              <div className="w-[40%]">
                <Label>Marketplaces</Label>
              </div>
              <div className="w-[10%]">
                {/* Empty space for button alignment */}
              </div>
            </div>

            {/* Search Controls Row */}
            <div className="flex gap-4 items-end">
              {/* Search Input - 50% */}
              <div className="w-[50%]">
                <Input
                  id="searchTerm"
                  placeholder="e.g., 2021 Topps Chrome Patrick Mahomes PSA 10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>

              {/* Marketplace Selection - 40% */}
              <div className="w-[40%]">
                <CustomMultiSelect
                  options={marketplaceOptions}
                  selected={selectedMarketplaces}
                  onChange={setSelectedMarketplaces}
                  placeholder={fetchingMarketplaces ? "Loading marketplaces..." : "Select marketplaces to search..."}
                  disabled={fetchingMarketplaces}
                />
                {fetchingMarketplaces && (
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Loading marketplace options...
                  </div>
                )}
              </div>

              {/* Search Button - 10% */}
              <div className="w-[10%]">
                <Button 
                  onClick={handleSearch} 
                  disabled={loading || fetchingMarketplaces || marketplaceOptions.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Search Results</h3>
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} results
                    {filteredResults.length !== results.length && ` (filtered from ${results.length} total)`}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Found {results.length} results across selected marketplaces
                </p>
              </div>

              {/* Filters Section */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4" />
                  <Label className="text-sm font-medium">Filters</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="ml-auto text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Market Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Market</Label>
                    <CustomMultiSelect
                      options={availableMarkets}
                      selected={marketFilter}
                      onChange={setMarketFilter}
                      placeholder="All markets"
                    />
                  </div>
                  
                  {/* Card Name Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Card Name</Label>
                    <Input
                      placeholder="Filter by card name..."
                      value={cardFilter}
                      onChange={(e) => setCardFilter(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  
                  {/* Min Price Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Min Price ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  
                  {/* Max Price Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Max Price ($)</Label>
                    <Input
                      type="number"
                      placeholder="999999.99"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Difference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {result.market}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={result.card}>
                          {result.card}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(result.price)}
                      </TableCell>
                      <TableCell>
                        <img 
                          src={result.image} 
                          alt={result.card}
                          className="w-16 h-20 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/100x140?text=No+Image';
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className={getDifferenceColor(result.difference)}>
                          {formatDifference(result.difference)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Items per page:</Label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="text-center py-12 border-t">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Searching for cards...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we search across selected marketplaces
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Results Message */}
          {!loading && results.length === 0 && searchTerm && (
            <div className="text-center py-12 border-t">
              <p className="text-muted-foreground">
                No results found. Try adjusting your search terms or selecting different marketplaces.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}