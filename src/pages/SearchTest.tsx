import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomMultiSelect } from '@/components/ui/custom-multi-select';
import { useToast } from '@/hooks/use-toast';
import { Search as SearchIcon, ExternalLink, ChevronLeft, ChevronRight, Filter, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'market' | 'card' | 'price' | 'difference' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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
    // Reset filters, sorting and pagination
    setMarketFilter([]);
    setSortBy(null);
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

  // Filter and sorting logic
  const filteredResults = useMemo(() => {
    let filtered = results.filter(result => {
      // Market filter
      if (marketFilter.length > 0 && !marketFilter.includes(result.market.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'market':
            aValue = a.market.toLowerCase();
            bValue = b.market.toLowerCase();
            break;
          case 'card':
            aValue = a.card.toLowerCase();
            bValue = b.card.toLowerCase();
            break;
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'difference':
            aValue = a.difference;
            bValue = b.difference;
            break;
          default:
            return 0;
        }
        
        if (typeof aValue === 'string') {
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
      });
    }

    return filtered;
  }, [results, marketFilter, sortBy, sortOrder]);

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
    setSortBy(null);
    setCurrentPage(1);
  };

  const handleSort = (column: 'market' | 'card' | 'price' | 'difference') => {
    if (sortBy === column) {
      // If already sorting by this column, toggle order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If sorting by new column, default to appropriate order
      setSortBy(column);
      // For text columns, default to ascending; for numbers, default to descending
      setSortOrder(column === 'market' || column === 'card' ? 'asc' : 'desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
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

  const getSortIcon = (column: 'market' | 'card' | 'price' | 'difference') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
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

              {/* Filters in Table Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Label className="text-sm font-medium">Filter by Market:</Label>
                  </div>
                  <div className="w-64">
                    <CustomMultiSelect
                      options={availableMarkets}
                      selected={marketFilter}
                      onChange={setMarketFilter}
                      placeholder="All markets"
                    />
                  </div>
                </div>
                {(marketFilter.length > 0 || sortBy) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear Filters & Sort
                  </Button>
                )}
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('market')}
                    >
                      <div className="flex items-center gap-1">
                        Market
                        {getSortIcon('market')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('card')}
                    >
                      <div className="flex items-center gap-1">
                        Card
                        {getSortIcon('card')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center gap-1">
                        Price
                        {getSortIcon('price')}
                      </div>
                    </TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => handleSort('difference')}
                    >
                      <div className="flex items-center gap-1">
                        Difference
                        {getSortIcon('difference')}
                      </div>
                    </TableHead>
                    <TableHead>Difference Base</TableHead>
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
                      <TableCell className="text-sm text-muted-foreground">
                        {result.differenceBase || 'N/A'}
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