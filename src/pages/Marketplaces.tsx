
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, Store, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

interface Marketplace {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  apiKey?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export function Marketplaces() {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([
    {
      id: '1',
      name: 'eBay',
      url: 'https://ebay.com',
      isActive: true,
      lastSync: '2024-01-15 10:30 AM',
      status: 'connected'
    },
    {
      id: '2',
      name: 'COMC',
      url: 'https://comc.com',
      isActive: true,
      lastSync: '2024-01-15 10:25 AM',
      status: 'connected'
    },
    {
      id: '3',
      name: '130 Point',
      url: 'https://130point.com',
      isActive: false,
      lastSync: '2024-01-10 3:15 PM',
      status: 'disconnected'
    },
    {
      id: '4',
      name: 'PWCC',
      url: 'https://pwccmarketplace.com',
      isActive: true,
      lastSync: 'Never',
      status: 'error'
    }
  ]);

  const [newMarketplace, setNewMarketplace] = useState({
    name: '',
    url: '',
    apiKey: ''
  });

  const { toast } = useToast();

  const handleToggleMarketplace = (id: string) => {
    setMarketplaces(prev => 
      prev.map(mp => 
        mp.id === id 
          ? { ...mp, isActive: !mp.isActive, status: !mp.isActive ? 'connected' : 'disconnected' as const }
          : mp
      )
    );
    toast({
      title: "Marketplace Updated",
      description: "Marketplace status has been changed.",
    });
  };

  const handleAddMarketplace = () => {
    if (!newMarketplace.name || !newMarketplace.url) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and URL.",
        variant: "destructive",
      });
      return;
    }

    const marketplace: Marketplace = {
      id: Date.now().toString(),
      name: newMarketplace.name,
      url: newMarketplace.url,
      isActive: true,
      lastSync: 'Never',
      status: 'disconnected'
    };

    setMarketplaces(prev => [...prev, marketplace]);
    setNewMarketplace({ name: '', url: '', apiKey: '' });
    
    toast({
      title: "Marketplace Added",
      description: `${newMarketplace.name} has been added successfully.`,
    });
  };

  const handleDeleteMarketplace = (id: string) => {
    setMarketplaces(prev => prev.filter(mp => mp.id !== id));
    toast({
      title: "Marketplace Removed",
      description: "Marketplace has been deleted.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketplace Management</h1>
        <p className="text-gray-600">Configure and manage your marketplace connections</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add-marketplace">Add Marketplace</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{marketplaces.filter(mp => mp.status === 'connected').length}</div>
                  <div className="text-sm text-gray-600">Connected</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{marketplaces.filter(mp => mp.isActive).length}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{marketplaces.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {marketplaces.map((marketplace) => (
              <Card key={marketplace.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Store className="h-8 w-8 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{marketplace.name}</h3>
                          <Badge className={getStatusColor(marketplace.status)}>
                            {marketplace.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Last sync: {marketplace.lastSync}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <ExternalLink className="h-3 w-3" />
                          {marketplace.url}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={marketplace.isActive}
                        onCheckedChange={() => handleToggleMarketplace(marketplace.id)}
                      />
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteMarketplace(marketplace.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="add-marketplace">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Marketplace
              </CardTitle>
              <CardDescription>
                Connect a new marketplace to expand your search capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="marketplace-name">Marketplace Name</Label>
                <Input
                  id="marketplace-name"
                  placeholder="e.g., Heritage Auctions"
                  value={newMarketplace.name}
                  onChange={(e) => setNewMarketplace(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketplace-url">Website URL</Label>
                <Input
                  id="marketplace-url"
                  placeholder="https://example.com"
                  value={newMarketplace.url}
                  onChange={(e) => setNewMarketplace(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key (optional)</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter API key if available"
                  value={newMarketplace.apiKey}
                  onChange={(e) => setNewMarketplace(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddMarketplace} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Marketplace
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Marketplace Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sync Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-sync every hour</Label>
                      <p className="text-sm text-gray-600">Automatically fetch new listings</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable notifications</Label>
                      <p className="text-sm text-gray-600">Get notified when sync completes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Retry failed syncs</Label>
                      <p className="text-sm text-gray-600">Automatically retry if sync fails</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Store images locally</Label>
                      <p className="text-sm text-gray-600">Download and cache card images</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Track seller ratings</Label>
                      <p className="text-sm text-gray-600">Include seller information in data</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
