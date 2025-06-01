import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomMultiSelect } from '@/components/ui/custom-multi-select';
import { useToast } from '@/hooks/use-toast';
import { Search as SearchIcon, ExternalLink } from 'lucide-react';
import { cardSearchAPI, type SearchResult } from '@/services/api';

export function SearchTest() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  const marketplaceOptions = [
    { label: 'eBay', value: 'ebay' },
    { label: 'CardsHQ', value: 'cardshq' },
    { label: 'MySlabs', value: 'myslabs' }
  ];

  const marketplaceUrls = {
    ebay: 'https://www.ebay.com/',
    cardshq: 'https://www.cardshq.com/',
    myslabs: 'https://www.myslabs.com'
  };

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
    
    try {
      // Use the API service to search for cards
      const searchResults = await cardSearchAPI.searchCards({
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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Search Test</h1>
        <p className="text-muted-foreground mt-2">
          Test search functionality across multiple marketplaces
        </p>
      </div>

      {/* Search Section */}
      <div className="flex justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <SearchIcon className="h-5 w-5" />
              Card Search
            </CardTitle>
            <CardDescription className="text-center">
              Enter search terms and select marketplaces to search
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Search Term</Label>
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

            {/* Marketplace Selection */}
            <div className="space-y-2">
              <Label>Marketplaces</Label>
              <CustomMultiSelect
                options={marketplaceOptions}
                selected={selectedMarketplaces}
                onChange={setSelectedMarketplaces}
                placeholder="Select marketplaces to search..."
              />
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {results.length} results across selected marketplaces
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {results.map((result) => (
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
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {!loading && results.length === 0 && searchTerm && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No results found. Try adjusting your search terms or selecting different marketplaces.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}