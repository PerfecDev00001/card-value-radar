
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
  [marketplace: string]: number | string | boolean | undefined;
  average: number;
  isInflectionPoint?: boolean;
}

interface TrendingCard {
  id: string;
  name: string;
  currentPrice: number;
  volume: number;
  weekChange: number;
  monthChange: number;
}



// Define types based on Supabase schema
type SavedSearch = Database['public']['Tables']['saved_searches']['Row'];
type SearchResult = Database['public']['Tables']['search_results']['Row'] & {
  marketplace_name?: string;
  condition?: string;
  grade?: string;
};

export function Trends() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const [selectedSearch, setSelectedSearch] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [cardHistoryData, setCardHistoryData] = useState<SearchResult[]>([]);
  const [marketplaces, setMarketplaces] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);
  const [openSearchSelect, setOpenSearchSelect] = useState(false);
  const [openCardSelect, setOpenCardSelect] = useState(false);
  const { toast } = useToast();

  // Compute trending cards from search results
  const trendingCards: TrendingCard[] = searchResults.map((result) => ({
    id: result.id,
    name: result.card_name,
    currentPrice: result.price || 0,
    volume: 0, // TODO: Calculate actual volume from historical data
    weekChange: 0, // TODO: Calculate week change from historical data
    monthChange: 0, // TODO: Calculate month change from historical data
  }));

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
        
        // Don't auto-select anything - let user choose
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
        
        // Don't auto-select cards - let user choose
        setSelectedCard(null);
        setCardHistoryData([]); // Clear card history when search changes
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

  // Fetch historical data for selected card
  useEffect(() => {
    const fetchCardHistory = async () => {
      if (!selectedCard || searchResults.length === 0) {
        setCardHistoryData([]);
        return;
      }

      const selectedCardData = searchResults.find(r => r.id === selectedCard);
      if (!selectedCardData) {
        setCardHistoryData([]);
        return;
      }

      setLoading(true);

      try {
        // Fetch all records with the same card_name from the database
        const { data, error } = await supabase
          .from('search_results')
          .select('*')
          .eq('card_name', selectedCardData.card_name)
          .order('date_fetched', { ascending: true });

        if (error) throw error;

        // Enhance results with marketplace names
        const enhancedHistory = data?.map(result => {
          const metadata = result.metadata as any || {};
          return {
            ...result,
            marketplace_name: marketplaces[result.marketplace_id] || 'Unknown',
            condition: metadata.condition || 'Unknown',
            grade: metadata.grade || null
          };
        }) || [];

        setCardHistoryData(enhancedHistory);
      } catch (error) {
        console.error('Error fetching card history:', error);
        toast({
          title: 'Error',
          description: 'Failed to load card price history. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCardHistory();
  }, [selectedCard, searchResults, marketplaces, toast]);





  // Get unique marketplaces from card history data
  const getUniqueMarketplaces = (): string[] => {
    const marketplaceSet = new Set<string>();
    cardHistoryData.forEach(record => {
      const marketplace = record.marketplace_name?.toLowerCase();
      if (marketplace) {
        marketplaceSet.add(marketplace);
      }
    });
    return Array.from(marketplaceSet);
  };

  // Convert card history data to chart format
  const getCardPriceData = (): PriceData[] => {
    if (!selectedCard || cardHistoryData.length === 0) {
      return [];
    }

    // For "today" timeframe, we need to handle hourly data
    if (selectedTimeframe === 'today') {
      // Get the saved search that this card belongs to
      const cardResult = searchResults.find(r => r.id === selectedCard);
      const savedSearchId = cardResult?.saved_search_id;
      
      // Get the selected saved search for schedule information
      const selectedSearchData = savedSearchId 
        ? savedSearches.find(search => search.id === savedSearchId)
        : null;
      
      // Get the creation date of the saved search as the starting point
      const searchCreatedAt = selectedSearchData?.created_at 
        ? new Date(selectedSearchData.created_at)
        : null;
      
      // Parse schedule information
      const schedule = selectedSearchData?.schedule || "hourly";
      
      // Helper function to parse schedule and determine if it's greater than 24 hours
      const parseScheduleInterval = (schedule: string): { intervalHours: number; isGreaterThan24Hours: boolean } => {
        // Handle the specific schedule values used in the application
        switch (schedule) {
          case "10min":
            return { intervalHours: 10/60, isGreaterThan24Hours: false }; // 10 minutes = 0.167 hours
          case "15min":
            return { intervalHours: 15/60, isGreaterThan24Hours: false }; // 15 minutes = 0.25 hours
          case "1h":
          case "hourly":
            return { intervalHours: 1, isGreaterThan24Hours: false };
          case "6h":
            return { intervalHours: 6, isGreaterThan24Hours: false };
          case "24h":
          case "daily":
            return { intervalHours: 24, isGreaterThan24Hours: true };
          case "weekly":
            return { intervalHours: 168, isGreaterThan24Hours: true }; // 7 * 24
          case "manual":
            return { intervalHours: 24, isGreaterThan24Hours: true }; // Treat manual as daily for chart purposes
        }
        
        // Handle legacy or custom schedule formats
        if (schedule.startsWith("every")) {
          // Parse "every X hours", "every X days", "every X weeks" format
          const hoursMatch = schedule.match(/every\s+(\d+)\s+hours?/i);
          const daysMatch = schedule.match(/every\s+(\d+)\s+days?/i);
          const weeksMatch = schedule.match(/every\s+(\d+)\s+weeks?/i);
          
          if (hoursMatch) {
            const hours = parseInt(hoursMatch[1], 10);
            return { intervalHours: hours, isGreaterThan24Hours: hours > 24 };
          } else if (daysMatch) {
            const days = parseInt(daysMatch[1], 10);
            const hours = days * 24;
            return { intervalHours: hours, isGreaterThan24Hours: true };
          } else if (weeksMatch) {
            const weeks = parseInt(weeksMatch[1], 10);
            const hours = weeks * 168;
            return { intervalHours: hours, isGreaterThan24Hours: true };
          }
        }
        
        // Default to every hour if parsing fails
        return { intervalHours: 1, isGreaterThan24Hours: false };
      };
      
      const { intervalHours, isGreaterThan24Hours } = parseScheduleInterval(schedule);
      
      // If schedule is greater than 24 hours, set timeline to 1 hour intervals
      // For minute-based schedules, also use 1 hour intervals to avoid too many data points
      const timelineInterval = isGreaterThan24Hours || intervalHours < 1 ? 1 : Math.ceil(intervalHours);
      
      // Find the earliest record for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter records for today
      const todayRecords = cardHistoryData.filter(record => {
        if (!record.date_fetched) return false;
        const recordDate = new Date(record.date_fetched);
        return recordDate >= today;
      });
      
      // Determine inflection points based on schedule
      const currentHour = new Date().getHours();
      const getInflectionHours = (): number[] => {
        if (!searchCreatedAt) return [0, 6, 12, 18]; // Default inflection points
        
        if (isGreaterThan24Hours) {
          // For schedules greater than 24 hours, use 1-hour timeline but mark actual search times
          // Since the search runs less frequently than daily, we need to identify when it actually ran
          const actualSearchHours: number[] = [];
          
          // Find actual search execution times from today's records
          todayRecords.forEach(record => {
            if (record.date_fetched) {
              const recordDate = new Date(record.date_fetched);
              const hour = recordDate.getHours();
              if (!actualSearchHours.includes(hour)) {
                actualSearchHours.push(hour);
              }
            }
          });
          
          // If no actual search times found, use the creation hour as fallback
          if (actualSearchHours.length === 0 && searchCreatedAt) {
            const creationHour = searchCreatedAt.getHours();
            if (creationHour <= currentHour) {
              actualSearchHours.push(creationHour);
            }
          }
          
          return actualSearchHours.sort((a, b) => a - b);
        } else {
          // For sub-daily schedules, calculate inflection points based on interval
          const startHour = searchCreatedAt ? searchCreatedAt.getHours() : 0;
          const points: number[] = [];
          
          // Handle minute-based schedules by converting to hours
          let hourInterval = intervalHours;
          if (intervalHours < 1) {
            // For minute-based schedules (10min, 15min), calculate how many times per hour
            const timesPerHour = Math.ceil(1 / intervalHours);
            // Mark every hour that would have a search
            for (let h = startHour; h <= currentHour; h++) {
              points.push(h);
            }
          } else {
            // For hour-based schedules
            // Start from the creation hour and add points at regular intervals
            for (let h = startHour; h <= currentHour; h += Math.ceil(hourInterval)) {
              points.push(h);
            }
            
            // Also add points from midnight at regular intervals
            for (let h = 0; h < startHour; h += Math.ceil(hourInterval)) {
              if (!points.includes(h)) {
                points.push(h);
              }
            }
          }
          
          // Sort the points and ensure they're within current hour
          return points.filter(h => h <= currentHour).sort((a, b) => a - b);
        }
      };
      
      const inflectionHours = getInflectionHours();
      
      // Create hourly data points from 0 to current hour
      const chartData: PriceData[] = [];
      const baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);
      
      // Group by hour and marketplace if we have today's records
      const hourlyData: { [hour: number]: { [marketplace: string]: number } } = {};
      
      if (todayRecords.length > 0) {
        todayRecords.forEach(record => {
          if (!record.date_fetched) return;
          
          const recordDate = new Date(record.date_fetched);
          const hour = recordDate.getHours();
          const marketplace = record.marketplace_name?.toLowerCase() || 'unknown';
          const price = record.price || 0;
          
          if (!hourlyData[hour]) {
            hourlyData[hour] = {};
          }
          
          hourlyData[hour][marketplace] = price;
        });
      }
      
      // Get unique marketplaces for this card
      const uniqueMarketplaces = getUniqueMarketplaces();
      
      // Get the last known prices to use for hours without data
      const lastKnownPrices: { [marketplace: string]: number } = { average: 0 };
      uniqueMarketplaces.forEach(marketplace => {
        lastKnownPrices[marketplace] = 0;
      });
      
      // Find the earliest record to get initial prices and sold_price_avg
      const earliestRecord = cardHistoryData
        .filter(r => r.date_fetched)
        .sort((a, b) => new Date(a.date_fetched!).getTime() - new Date(b.date_fetched!).getTime())[0];
      
      if (earliestRecord) {
        const marketplace = earliestRecord.marketplace_name?.toLowerCase() || 'unknown';
        const price = earliestRecord.price || 0;
        
        // Set initial price for the marketplace
        if (uniqueMarketplaces.includes(marketplace)) {
          lastKnownPrices[marketplace] = price;
        }
        
        // Use sold_price_avg from the database instead of calculating
        lastKnownPrices.average = earliestRecord.sold_price_avg || 0;
      }
      
      // Generate data points based on timeline interval
      // For schedules > 24 hours, use 1-hour intervals; otherwise use the schedule interval
      for (let hour = 0; hour <= currentHour; hour += timelineInterval) {
        const hourDate = new Date(baseDate);
        hourDate.setHours(hour);
        
        // If we have data for this hour, use it
        if (hourlyData[hour]) {
          const hourData = hourlyData[hour];
          
          // Update last known prices with this hour's data for all marketplaces
          uniqueMarketplaces.forEach(marketplace => {
            if (hourData[marketplace]) {
              lastKnownPrices[marketplace] = hourData[marketplace];
            }
          });
          
          // Find the record for this hour to get sold_price_avg
          const hourRecord = todayRecords.find(record => {
            if (!record.date_fetched) return false;
            const recordDate = new Date(record.date_fetched);
            return recordDate.getHours() === hour;
          });
          
          // Use sold_price_avg from the database if available
          if (hourRecord && hourRecord.sold_price_avg !== null) {
            lastKnownPrices.average = hourRecord.sold_price_avg;
          }
        }
        
        // Create data point for this hour with all marketplace prices
        const dataPoint: PriceData = {
          date: hourDate.toISOString(),
          average: lastKnownPrices.average,
          isInflectionPoint: inflectionHours.includes(hour)
        };
        
        // Add all marketplace prices to the data point
        uniqueMarketplaces.forEach(marketplace => {
          dataPoint[marketplace] = lastKnownPrices[marketplace];
        });
        
        chartData.push(dataPoint);
      }
      
      return chartData;
    }
    
    // For other timeframes or if no today's data, use the regular approach
    // Group data by date and marketplace, also track sold_price_avg
    const groupedData: { [date: string]: { [marketplace: string]: number } } = {};
    const avgSoldPriceByDate: { [date: string]: number } = {};
    
    cardHistoryData.forEach(record => {
      if (!record.date_fetched) return; // Skip records without date
      
      const date = new Date(record.date_fetched).toISOString().split('T')[0]; // Get date only
      const marketplace = record.marketplace_name?.toLowerCase() || 'unknown';
      const price = record.price || 0;

      if (!groupedData[date]) {
        groupedData[date] = {};
      }
      
      // Use the latest price for each marketplace on each date
      groupedData[date][marketplace] = price;
      
      // Store sold_price_avg for this date (use the latest one if multiple records per day)
      if (record.sold_price_avg !== null) {
        avgSoldPriceByDate[date] = record.sold_price_avg;
      }
    });

    // Get unique marketplaces for this card
    const uniqueMarketplaces = getUniqueMarketplaces();
    
    // Convert to PriceData format
    const chartData: PriceData[] = Object.keys(groupedData)
      .sort()
      .map(date => {
        const dayData = groupedData[date];
        
        // Create data point with all marketplace prices
        const dataPoint: PriceData = {
          date: date,
          average: 0,
          isInflectionPoint: true // Mark all actual data points as inflection points
        };
        
        // Add all marketplace prices to the data point
        const marketplacePrices: number[] = [];
        uniqueMarketplaces.forEach(marketplace => {
          const price = dayData[marketplace] || 0;
          dataPoint[marketplace] = price;
          if (price > 0) {
            marketplacePrices.push(price);
          }
        });
        
        // Use sold_price_avg from database if available, otherwise calculate from marketplace prices
        let average = avgSoldPriceByDate[date];
        if (average === undefined || average === null) {
          average = marketplacePrices.length > 0 
            ? marketplacePrices.reduce((sum, price) => sum + price, 0) / marketplacePrices.length 
            : 0;
        }
        
        dataPoint.average = Math.round(average * 100) / 100;
        
        return dataPoint;
      });

    // If there's only one data point, extend it to current time to show flat line
    if (chartData.length === 1) {
      const singlePoint = chartData[0];
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Add current date with same prices to show flat line
      if (singlePoint.date !== currentDate) {
        chartData.push({
          date: currentDate,
          ebay: singlePoint.ebay,
          pwcc: singlePoint.pwcc,
          comc: singlePoint.comc,
          average: singlePoint.average,
          isInflectionPoint: false // This is not an actual data point
        });
      }
    }

    return chartData;
  };

  // Get price data based on selected card and available data
  const priceData: PriceData[] = selectedCard && cardHistoryData.length > 0
    ? getCardPriceData()
    : [];



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

  // Generate colors for marketplaces
  const getMarketplaceColor = (marketplace: string, index: number): string => {
    const colors = [
      '#1f77b4', // blue
      '#ff7f0e', // orange  
      '#2ca02c', // green
      '#d62728', // red
      '#9467bd', // purple
      '#8c564b', // brown
      '#e377c2', // pink
      '#7f7f7f', // gray
      '#bcbd22', // olive
      '#17becf'  // cyan
    ];
    
    // Use consistent colors for known marketplaces
    const marketplaceColors: { [key: string]: string } = {
      'ebay': '#1f77b4',
      'pwcc': '#ff7f0e', 
      'comc': '#2ca02c',
      'cardshq': '#d62728'
    };
    
    return marketplaceColors[marketplace.toLowerCase()] || colors[index % colors.length];
  };

  // Get marketplace display name
  const getMarketplaceDisplayName = (marketplace: string): string => {
    const displayNames: { [key: string]: string } = {
      'ebay': 'eBay',
      'pwcc': 'PWCC',
      'comc': 'COMC', 
      'cardshq': 'CardsHQ'
    };
    
    return displayNames[marketplace.toLowerCase()] || marketplace.charAt(0).toUpperCase() + marketplace.slice(1);
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
          <div className="grid gap-4 md:grid-cols-[40%_40%_15%]">
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
                    <span className="truncate">
                      {getSelectedSearchText() ||
                        (savedSearches.length === 0 
                          ? "No saved searches available" 
                          : "Select a saved search")
                      }
                    </span>
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
                    <span className="truncate">
                      {getSelectedCardText() ||
                        (!selectedSearch 
                          ? "Select a search first" 
                          : searchResults.length === 0 
                            ? "No results found for this search" 
                            : "Select a card from results")
                      }
                    </span>
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
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
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
            {selectedCard && cardHistoryData.length > 0
              ? `Historical price data for this card across different marketplaces. "Avg Sold Price" shows the actual average sold price from search results${cardHistoryData.length === 1 ? ' (single data point extended to current time)' : ''}`
              : 'Select a saved search and card to view historical price trends from actual search data'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Legend for inflection points */}
          {selectedTimeframe === 'today' && (
            <div className="mb-4 text-sm text-muted-foreground flex items-center">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
                <span>
                  Dots on the chart indicate times when searches were performed based on the card's search schedule
                  {(() => {
                    const cardResult = searchResults.find(r => r.id === selectedCard);
                    const savedSearchId = cardResult?.saved_search_id;
                    const selectedSearchData = savedSearchId 
                      ? savedSearches.find(search => search.id === savedSearchId)
                      : null;
                    const schedule = selectedSearchData?.schedule || "hourly";
                    
                    // Check if schedule is greater than 24 hours using the same logic as the chart
                    const parseScheduleInterval = (schedule: string): { intervalHours: number; isGreaterThan24Hours: boolean } => {
                      switch (schedule) {
                        case "10min":
                          return { intervalHours: 10/60, isGreaterThan24Hours: false };
                        case "15min":
                          return { intervalHours: 15/60, isGreaterThan24Hours: false };
                        case "1h":
                        case "hourly":
                          return { intervalHours: 1, isGreaterThan24Hours: false };
                        case "6h":
                          return { intervalHours: 6, isGreaterThan24Hours: false };
                        case "24h":
                        case "daily":
                          return { intervalHours: 24, isGreaterThan24Hours: true };
                        case "weekly":
                          return { intervalHours: 168, isGreaterThan24Hours: true };
                        case "manual":
                          return { intervalHours: 24, isGreaterThan24Hours: true };
                      }
                      return { intervalHours: 1, isGreaterThan24Hours: false };
                    };
                    
                    const { isGreaterThan24Hours } = parseScheduleInterval(schedule);
                    
                    return isGreaterThan24Hours 
                      ? " (Timeline set to 1-hour intervals for schedules > 24 hours)"
                      : "";
                  })()}
                </span>
              </div>
            </div>
          )}
          
          <div className="h-96">
            {priceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={priceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    // For real card data or historical data, show date format
                    // For today's hourly data, show time format
                    if (selectedTimeframe === 'today') {
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } else {
                      return date.toLocaleDateString();
                    }
                  }}
                />
                <YAxis 
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    const dataPoint = priceData.find(p => p.date === value);
                    const isInflection = dataPoint?.isInflectionPoint;
                    
                    let formattedDate = '';
                    if (selectedTimeframe === 'today') {
                      formattedDate = date.toLocaleString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric'
                      });
                    } else {
                      formattedDate = date.toLocaleDateString();
                    }
                    
                    // Add indicator for search execution points
                    return isInflection 
                      ? `${formattedDate} 🔍 (Search executed)` 
                      : formattedDate;
                  }}
                  formatter={(value: number, name: string) => {
                    // Format the value as currency
                    return [formatCurrency(value), name];
                  }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                />
                <Legend />
                
                {/* Render lines dynamically for all marketplaces */}
                {priceData.length > 0 && getUniqueMarketplaces().map((marketplace, index) => {
                  const color = getMarketplaceColor(marketplace, index);
                  const displayName = getMarketplaceDisplayName(marketplace);
                  
                  return (
                    <Line 
                      key={marketplace}
                      type="monotone" 
                      dataKey={marketplace} 
                      stroke={color} 
                      strokeWidth={2}
                     name={displayName}
                       dot={(props: any) => {
                        const dataPoint = priceData[props.index];
                        if (!dataPoint) return null;
                        
                        return dataPoint.isInflectionPoint ? (
                          <circle 
                            key={`${marketplace}-${props.index}`}
                            cx={props.cx} 
                            cy={props.cy} 
                            r={4} 
                            fill={color} 
                            stroke="white" 
                            strokeWidth={1} 
                          />
                        ) : null;
                      }}
                      activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
                    />
                  );
                })}
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#9467bd" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Avg Sold Price"
                  dot={(props: any) => {
                    const dataPoint = priceData[props.index];
                    if (!dataPoint) return null;
                    
                    return dataPoint.isInflectionPoint ? (
                      <circle 
                        key={`average-${props.index}`}
                        cx={props.cx} 
                        cy={props.cy} 
                        r={4} 
                        fill="#9467bd" 
                        stroke="white" 
                        strokeWidth={1} 
                      />
                    ) : null;
                  }}
                  activeDot={{ r: 6, fill: '#9467bd', stroke: 'white', strokeWidth: 2 }}
                />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-lg text-muted-foreground mb-2">No price data available</p>
                  <p className="text-sm text-muted-foreground">
                    {!selectedCard 
                      ? "Select a card to view price trends"
                      : "No historical data found for this card"
                    }
                  </p>
                </div>
              </div>
            )}
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
