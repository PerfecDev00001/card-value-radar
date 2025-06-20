
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Search as SearchIcon, Calendar, Filter, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
interface SearchFilters {
  condition: string[];
  gradingCompany: string[];
  priceRange: { min: number | null; max: number | null };
}

export function Search() {
  const [searchTerms, setSearchTerms] = useState('Loading...');
  const [timeFrame, setTimeFrame] = useState('30');
  const [schedule, setSchedule] = useState('1h');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(['temp']);
  const [filters, setFilters] = useState<SearchFilters>({
    condition: ['Raw'],
    gradingCompany: ['PSA'],
    priceRange: { min: 10, max: 100 }
  });
  const [loading, setLoading] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  // State for marketplace options fetched from Supabase
  const [marketplaces, setMarketplaceOptions] = useState<{ id: string; name: string; enabled: boolean; is_active?: boolean; }[]>([]);
  const [fetchingMarketplaces, setFetchingMarketplaces] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Function to clear all settings
  const clearAllSettings = () => {
    setSearchTerms('');
    setTimeFrame('7');
    setSchedule('manual');
    setSelectedMarketplaces([]);
    setFilters({
      condition: [],
      gradingCompany: [],
      priceRange: { min: null, max: null }
    });
  };

  // Fetch marketplaces from Supabase
  useEffect(() => {
    const fetchMarketplaces = async () => {
      setFetchingMarketplaces(true);
      try {
        const { data, error } = await supabase
            .from('marketplaces')
            .select('id, name, is_active');

        if (error) {
          throw error;
        }

        if (data) {
          // Transform the data to the format expected by CustomMultiSelect
          const options = data.map(marketplace => ({
            id: marketplace.name,
            name: marketplace.name,
            enabled: marketplace.is_active ?? true
          }));
          //marketplace.id.toLowerCase()
          setMarketplaceOptions(options);
        }
      } catch (error) {
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

  // Clear all settings when marketplaces are loaded for the first time
  useEffect(() => {
    if (marketplaces.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
      clearAllSettings();
    }
  }, [marketplaces.length, isInitialLoad]);

  const conditions = ['Raw', 'Graded', 'PSA 10', 'PSA 9', 'BGS 9.5', 'BGS 9'];
  const gradingCompanies = ['PSA', 'BGS', 'SGC', 'CSG'];

  const handleConditionChange = (condition: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      condition: checked 
        ? [...prev.condition, condition]
        : prev.condition.filter(c => c !== condition)
    }));
  };

  const handleGradingCompanyChange = (company: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      gradingCompany: checked 
        ? [...prev.gradingCompany, company]
        : prev.gradingCompany.filter(c => c !== company)
    }));
  };

  const handleMarketplaceChange = (marketplace: string, checked: boolean) => {
    setSelectedMarketplaces(prev => 
      checked 
        ? [...prev, marketplace]
        : prev.filter(m => m !== marketplace)
    );
  };

  const handleSearch = async () => {
    if (!searchTerms.trim()) {
      toast({
        title: "Search terms required",
        description: "Please enter search terms for your cards",
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
      // Simulate search API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Search completed!",
        description: `Found results for "${searchTerms}" across ${selectedMarketplaces.length} marketplace(s)`,
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

  const handleSaveSearch = async () => {
    if (!searchTerms.trim()) {
      toast({
        title: "Search terms required",
        description: "Please enter search terms before saving",
        variant: "destructive"
      });
      return;
    }

    if (selectedMarketplaces.length === 0) {
      toast({
        title: "Marketplace required",
        description: "Please select at least one marketplace before saving",
        variant: "destructive"
      });
      return;
    }

    setSavingSearch(true);
    
    try {
      // For now, we'll use a dummy user_id. In a real app, this would come from authentication
      // const dummyUserId = user.id; // This should be replaced with actual user authentication

      const searchData = {
        search_terms: searchTerms.trim(),
        filters: {
          marketplaces: selectedMarketplaces,
          condition: filters.condition,
          gradingCompany: filters.gradingCompany,
          priceRange: filters.priceRange
        },
        schedule: schedule,
        time_frame: parseInt(timeFrame),
        is_active: true,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('saved_searches')
        .insert([searchData])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Search saved!",
        description: `Your search "${searchTerms}" has been saved and will run according to your ${schedule} schedule`,
      });

      // Clear all settings after successful save
      clearAllSettings();
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your search",
        variant: "destructive"
      });
    } finally {
      setSavingSearch(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Card Search</h1>
        <p className="text-muted-foreground">
          Search for sports cards across multiple marketplaces and set up automated monitoring
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Search Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5" />
                Search Configuration
              </CardTitle>
              <CardDescription>
                Configure your search terms and parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Terms */}
              <div className="space-y-2">
                <Label htmlFor="searchTerms">Search Terms</Label>
                <Input
                  id="searchTerms"
                  placeholder="e.g., 2021 Topps Chrome Patrick Mahomes"
                  value={searchTerms}
                  onChange={(e) => setSearchTerms(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter card name, player, set, or specific terms
                </p>
              </div>

              {/* Time Frame */}
              <div className="space-y-2">
                <Label htmlFor="timeFrame" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Time Frame
                </Label>
                <Select value={timeFrame} onValueChange={setTimeFrame}>
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

              {/* Schedule */}
              <div className="space-y-2">
                <Label htmlFor="schedule">Search Schedule</Label>
                <Select value={schedule} onValueChange={setSchedule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10min">Every 10 minutes</SelectItem>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="1h">Every hour</SelectItem>
                    <SelectItem value="6h">Every 6 hours</SelectItem>
                    <SelectItem value="24h">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Marketplaces */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Marketplaces</Label>
                {fetchingMarketplaces ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {marketplaces.map((marketplace) => (
                      <div key={marketplace.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={marketplace.id}
                          checked={selectedMarketplaces.includes(marketplace.id)}
                          onCheckedChange={(checked) => 
                            handleMarketplaceChange(marketplace.id, checked as boolean)
                          }
                          disabled={!marketplace.enabled}
                        />
                        <Label 
                          htmlFor={marketplace.id}
                          className={!marketplace.enabled ? 'text-muted-foreground' : ''}
                        >
                          {marketplace.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3">

                <Button 
                  variant="outline" 
                  onClick={handleSaveSearch}
                  disabled={savingSearch}
                  className="flex items-center gap-2"
                >
                  {savingSearch ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>
                Refine your search results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Condition Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Condition</Label>
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`condition-${condition}`}
                        checked={filters.condition.includes(condition)}
                        onCheckedChange={(checked) => 
                          handleConditionChange(condition, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`condition-${condition}`}
                        className="text-sm"
                      >
                        {condition}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Grading Company Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Grading Company</Label>
                <div className="space-y-2">
                  {gradingCompanies.map((company) => (
                    <div key={company} className="flex items-center space-x-2">
                      <Checkbox
                        id={`grading-${company}`}
                        checked={filters.gradingCompany.includes(company)}
                        onCheckedChange={(checked) => 
                          handleGradingCompanyChange(company, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`grading-${company}`}
                        className="text-sm"
                      >
                        {company}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Price Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: {
                          ...prev.priceRange,
                          min: e.target.value ? Number(e.target.value) : null
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: {
                          ...prev.priceRange,
                          max: e.target.value ? Number(e.target.value) : null
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setFilters({
                  condition: [],
                  gradingCompany: [],
                  priceRange: { min: null, max: null }
                })}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
