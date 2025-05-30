
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Search as SearchIcon, Calendar, Filter, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchFilters {
  condition: string[];
  gradingCompany: string[];
  priceRange: { min: number | null; max: number | null };
}

export function Search() {
  const [searchTerms, setSearchTerms] = useState('');
  const [timeFrame, setTimeFrame] = useState('7');
  const [schedule, setSchedule] = useState('manual');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(['ebay']);
  const [filters, setFilters] = useState<SearchFilters>({
    condition: [],
    gradingCompany: [],
    priceRange: { min: null, max: null }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const marketplaces = [
    { id: 'ebay', name: 'eBay', enabled: true },
    { id: 'pwcc', name: 'PWCC Marketplace', enabled: true },
    { id: 'comc', name: 'COMC', enabled: true },
    { id: 'myslabs', name: 'MySlabs', enabled: true },
  ];

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

    try {
      // Save search logic will be implemented later
      toast({
        title: "Search saved!",
        description: "Your search has been saved and will run according to your schedule",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your search",
        variant: "destructive"
      });
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
                    <SelectItem value="manual">Manual only</SelectItem>
                    <SelectItem value="10min">Every 10 minutes</SelectItem>
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
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Searching...' : 'Search Now'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSaveSearch}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Search
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
