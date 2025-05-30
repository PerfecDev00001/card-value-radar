
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  Search,
  Filter
} from 'lucide-react';

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

export function Trends() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');
  const [selectedCard, setSelectedCard] = useState('mahomes-chrome-2021');
  const [searchTerm, setSearchTerm] = useState('');

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
              <label className="text-sm font-medium mb-2 block">Search Cards</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Featured Card</label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mahomes-chrome-2021">2021 Topps Chrome Mahomes</SelectItem>
                  <SelectItem value="brady-prizm-2022">2022 Panini Prizm Brady</SelectItem>
                  <SelectItem value="allen-select-2020">2020 Panini Select Allen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price History - 2021 Topps Chrome Patrick Mahomes PSA 10</CardTitle>
          <CardDescription>
            Price trends across different marketplaces over the last {selectedTimeframe} days
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
                <p className="text-2xl font-bold">$142.50</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+8.5%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">30-Day High</p>
                <p className="text-2xl font-bold">$145.00</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Reached on Jan 25
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">30-Day Low</p>
                <p className="text-2xl font-bold">$122.00</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Reached on Jan 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volatility</p>
                <p className="text-2xl font-bold">18.8%</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              30-day price range
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
