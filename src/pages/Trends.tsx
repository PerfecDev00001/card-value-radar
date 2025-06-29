
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Filter,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

interface PriceData {
  date: string;
  ebay: number;
  pwcc: number;
  comc: number;
  average: number;
}

interface TrendCard {
  id: string;
  name: string;
  currentPrice: number;
  weekChange: number;
  monthChange: number;
  volume: number;
}

// Define types based on Supabase schema
type SavedSearch = Database['public']['Tables']['saved_searches']['Row'];
type SearchResult = Database['public']['Tables']['search_results']['Row'] & {
  marketplace_name?: string;
  condition?: string;
  grade?: string;
};

export function Trends() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [selectedSearch, setSelectedSearch] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [marketplaces, setMarketplaces] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [openSearchSelect, setOpenSearchSelect] = useState(false);
  const [openCardSelect, setOpenCardSelect] = useState(false);
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
      if (!selectedSearch) {
        setSearchResults([]);
        setSelectedCard(null);
        return;
      }
      
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
        
        setSearchResults(enhancedResults);
        
        // Auto-select first result if available
        if (enhancedResults.length > 0) {
          setSelectedCard(enhancedResults[0].id);
        } else {
          setSelectedCard(null);
        }
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

  // Mock price history data
  const priceData: PriceData[] = [
    { date: '2024-01-01', ebay: 125, pwcc: 130, comc: 128, average: 127.7 },
    { date: '2024-01-05', ebay: 128, pwcc: 132, comc: 130, average: 130.0 },
    { date: '2024-01-10', ebay: 122, pwcc: 128, comc: 125, average: 125.0 },
    { date: '2024-01-15', ebay: 135, pwcc: 140, comc: 138, average: 137.7 },
    { date: '2024-01-20', ebay: 130, pwcc: 135, comc: 133, average: 132.7 },
    { date: '2024-01-25', ebay: 142, pwcc: 145, comc: 144, average: 143.7 },
    { date: '2024-01-30', ebay: 138, pwcc: 142, comc: 140, average: 140.0 },
  ];

  // Mock trending cards data
  const trendingCards: TrendCard[] = [
    {
      id: '1',
      name: '2021 Topps Chrome Patrick Mahomes PSA 10',
      currentPrice: 142.50,
      weekChange: 8.5,
      monthChange: 15.2,
      volume: 47
    },
    {
      id: '2',
      name: '2022 Panini Prizm Tom Brady BGS 9.5',
      currentPrice: 89.99,
      weekChange: -5.2,
      monthChange: -8.1,
      volume: 32
    },
    {
      id: '3',
      name: '2020 Panini Select Josh Allen PSA 10',
      currentPrice: 78.25,
      weekChange: 12.3,
      monthChange: 22.8,
      volume: 28
    },
    {
      id: '4',
      name: '2021 Panini Prizm Justin Herbert PSA 10',
      currentPrice: 156.00,
      weekChange: -2.1,
      monthChange: 5.4,
      volume: 19
    }
  ];

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  // Helper function to get selected search display text
  const getSelectedSearchText = () => {
    if (!selectedSearch) return null;
    return savedSearches.find((search) => search.id === selectedSearch)?.search_terms;
  };

  // Helper function to get selected card display text
  const getSelectedCardText = () => {
    if (!selectedCard || searchResults.length === 0) return null;
    const card = searchResults.find((result) => result.id === selectedCard);
    return card ? `${card.card_name} (${card.marketplace_name})` : null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Price Trends</h1>
          <p className="text-muted-foreground">Loading trend data...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Price Trends</h1>
          <p className="text-muted-foreground">
            Track price movements and market trends for sports cards
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Charts
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Chart Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Saved Search</label>
              <Popover open={openSearchSelect} onOpenChange={setOpenSearchSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSearchSelect}
                    className="w-full justify-between"
                    disabled={savedSearches.length === 0}
                  >
                    {getSelectedSearchText() ||
                      (savedSearches.length === 0 
                        ? "No saved searches available" 
                        : "Select a saved search")
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search saved searches..." />
                    <CommandList>
                      <CommandEmpty>No saved searches found.</CommandEmpty>
                      <CommandGroup>
                        {savedSearches.map((search) => (
                          <CommandItem
                            key={search.id}
                            value={search.search_terms}
                            onSelect={() => {
                              setSelectedSearch(search.id);
                              setSelectedCard(null); // Clear card selection when search changes
                              setOpenSearchSelect(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSearch === search.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {search.search_terms}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Card Results</label>
              <Popover open={openCardSelect} onOpenChange={setOpenCardSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCardSelect}
                    className="w-full justify-between"
                    disabled={!selectedSearch || searchResults.length === 0}
                  >
                    {getSelectedCardText() ||
                      (!selectedSearch 
                        ? "Select a search first" 
                        : searchResults.length === 0 
                          ? "No results found for this search" 
                          : "Select a card from results")
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search card results..." />
                    <CommandList>
                      <CommandEmpty>
                        {!selectedSearch ? "Select a saved search first" : "No card results found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {searchResults.map((result) => (
                          <CommandItem
                            key={result.id}
                            value={`${result.card_name} ${result.marketplace_name} ${result.price}`}
                            onSelect={() => {
                              setSelectedCard(result.id);
                              setOpenCardSelect(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCard === result.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{result.card_name}</span>
                              <span className="text-sm text-muted-foreground">
                                {result.marketplace_name} - ${result.price?.toFixed(2) || 'N/A'}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCard && searchResults.length > 0 
              ? `Price History - ${searchResults.find(r => r.id === selectedCard)?.card_name || 'Selected Card'}`
              : 'Price History - Select a card to view trends'
            }
          </CardTitle>
          <CardDescription>
            {selectedCard 
              ? `Price trends across different marketplaces over the last ${selectedTimeframe} days`
              : 'Select a saved search and card to view price trends'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ebay" 
                  stroke="#1f77b4" 
                  strokeWidth={2}
                  name="eBay"
                />
                <Line 
                  type="monotone" 
                  dataKey="pwcc" 
                  stroke="#ff7f0e" 
                  strokeWidth={2}
                  name="PWCC"
                />
                <Line 
                  type="monotone" 
                  dataKey="comc" 
                  stroke="#2ca02c" 
                  strokeWidth={2}
                  name="COMC"
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#d62728" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Average"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Market Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold">
                  {selectedCard && searchResults.length > 0 
                    ? formatCurrency(searchResults.find(r => r.id === selectedCard)?.price || 0)
                    : '$--'
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedCard && searchResults.length > 0 
                ? <span className="text-green-600">Real-time data</span>
                : 'Select a card to view pricing'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Sold Price</p>
                <p className="text-2xl font-bold">
                  {selectedCard && searchResults.length > 0 
                    ? formatCurrency(searchResults.find(r => r.id === selectedCard)?.sold_price_avg || 0)
                    : '$--'
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedCard && searchResults.length > 0 
                ? 'Based on sold listings'
                : 'Select a card to view data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Marketplace</p>
                <p className="text-2xl font-bold">
                  {selectedCard && searchResults.length > 0 
                    ? searchResults.find(r => r.id === selectedCard)?.marketplace_name || 'N/A'
                    : '--'
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedCard && searchResults.length > 0 
                ? 'Data source'
                : 'Select a card to view data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-2xl font-bold">
                  {selectedCard && searchResults.length > 0 
                    ? new Date(searchResults.find(r => r.id === selectedCard)?.date_fetched || '').toLocaleDateString()
                    : '--'
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedCard && searchResults.length > 0 
                ? 'Data fetch date'
                : 'Select a card to view data'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trending Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Cards</CardTitle>
          <CardDescription>
            Cards with significant price movements in the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendingCards.map((card) => (
              <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{card.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Current: {formatCurrency(card.currentPrice)}</span>
                    <span>Volume: {card.volume} sales</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {getChangeIcon(card.weekChange)}
                      <span className={`text-sm font-medium ${getChangeColor(card.weekChange)}`}>
                        {formatPercentage(card.weekChange)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">7 days</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {getChangeIcon(card.monthChange)}
                      <span className={`text-sm font-medium ${getChangeColor(card.monthChange)}`}>
                        {formatPercentage(card.monthChange)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">30 days</p>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
