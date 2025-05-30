
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Plus, 
  Trash2,
  Edit,
  DollarSign,
  Percent,
  Mail,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  cardName: string;
  priceThreshold?: number;
  percentageThreshold?: number;
  isActive: boolean;
  notificationMethods: string[];
  createdAt: string;
  lastTriggered?: string;
}

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      cardName: '2021 Topps Chrome Patrick Mahomes PSA 10',
      priceThreshold: 120,
      isActive: true,
      notificationMethods: ['email'],
      createdAt: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      cardName: '2022 Panini Prizm Tom Brady',
      percentageThreshold: 15,
      isActive: true,
      notificationMethods: ['email', 'sms'],
      createdAt: '2024-01-12T14:30:00Z',
      lastTriggered: '2024-01-15T09:15:00Z'
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    cardName: '',
    alertType: 'price' as 'price' | 'percentage',
    priceThreshold: '',
    percentageThreshold: '',
    notificationMethods: ['email'] as string[]
  });

  const { toast } = useToast();

  const handleCreateAlert = () => {
    if (!newAlert.cardName.trim()) {
      toast({
        title: "Card name required",
        description: "Please enter a card name for the alert",
        variant: "destructive"
      });
      return;
    }

    if (newAlert.alertType === 'price' && !newAlert.priceThreshold) {
      toast({
        title: "Price threshold required",
        description: "Please enter a price threshold",
        variant: "destructive"
      });
      return;
    }

    if (newAlert.alertType === 'percentage' && !newAlert.percentageThreshold) {
      toast({
        title: "Percentage threshold required",
        description: "Please enter a percentage threshold",
        variant: "destructive"
      });
      return;
    }

    const alert: Alert = {
      id: Date.now().toString(),
      cardName: newAlert.cardName,
      priceThreshold: newAlert.alertType === 'price' ? Number(newAlert.priceThreshold) : undefined,
      percentageThreshold: newAlert.alertType === 'percentage' ? Number(newAlert.percentageThreshold) : undefined,
      isActive: true,
      notificationMethods: newAlert.notificationMethods,
      createdAt: new Date().toISOString()
    };

    setAlerts([...alerts, alert]);
    setNewAlert({
      cardName: '',
      alertType: 'price',
      priceThreshold: '',
      percentageThreshold: '',
      notificationMethods: ['email']
    });
    setShowCreateForm(false);

    toast({
      title: "Alert created!",
      description: `Price alert for "${alert.cardName}" has been created`,
    });
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    toast({
      title: "Alert deleted",
      description: "The price alert has been removed",
    });
  };

  const toggleNotificationMethod = (method: string) => {
    const methods = newAlert.notificationMethods.includes(method)
      ? newAlert.notificationMethods.filter(m => m !== method)
      : [...newAlert.notificationMethods, method];
    
    setNewAlert({ ...newAlert, notificationMethods: methods });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Price Alerts</h1>
          <p className="text-muted-foreground">
            Get notified when card prices drop below your threshold
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>
              Set up price notifications for specific cards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cardName">Card Name</Label>
              <Input
                id="cardName"
                placeholder="e.g., 2021 Topps Chrome Patrick Mahomes PSA 10"
                value={newAlert.cardName}
                onChange={(e) => setNewAlert({ ...newAlert, cardName: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <Label>Alert Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-colors ${
                    newAlert.alertType === 'price' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setNewAlert({ ...newAlert, alertType: 'price' })}
                >
                  <CardContent className="p-4 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium">Fixed Price</h3>
                    <p className="text-sm text-muted-foreground">Alert when price drops below a specific amount</p>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer transition-colors ${
                    newAlert.alertType === 'percentage' ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setNewAlert({ ...newAlert, alertType: 'percentage' })}
                >
                  <CardContent className="p-4 text-center">
                    <Percent className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium">Percentage Drop</h3>
                    <p className="text-sm text-muted-foreground">Alert when price drops by a percentage</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {newAlert.alertType === 'price' && (
              <div className="space-y-2">
                <Label htmlFor="priceThreshold">Price Threshold ($)</Label>
                <Input
                  id="priceThreshold"
                  type="number"
                  placeholder="120.00"
                  value={newAlert.priceThreshold}
                  onChange={(e) => setNewAlert({ ...newAlert, priceThreshold: e.target.value })}
                />
              </div>
            )}

            {newAlert.alertType === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="percentageThreshold">Percentage Drop (%)</Label>
                <Input
                  id="percentageThreshold"
                  type="number"
                  placeholder="15"
                  value={newAlert.percentageThreshold}
                  onChange={(e) => setNewAlert({ ...newAlert, percentageThreshold: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>Notification Methods</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="email"
                    checked={newAlert.notificationMethods.includes('email')}
                    onChange={() => toggleNotificationMethod('email')}
                    className="rounded"
                  />
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sms"
                    checked={newAlert.notificationMethods.includes('sms')}
                    onChange={() => toggleNotificationMethod('sms')}
                    className="rounded"
                  />
                  <Label htmlFor="sms" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS Notifications
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreateAlert} className="flex-1">
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{alert.cardName}</h3>
                    <Badge variant={alert.isActive ? "default" : "secondary"}>
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {alert.priceThreshold ? (
                        <>
                          <DollarSign className="h-4 w-4" />
                          Alert when below ${alert.priceThreshold}
                        </>
                      ) : (
                        <>
                          <Percent className="h-4 w-4" />
                          Alert when drops {alert.percentageThreshold}%
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Bell className="h-4 w-4" />
                      {alert.notificationMethods.join(', ')}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(alert.createdAt).toLocaleDateString()}
                    {alert.lastTriggered && (
                      <span className="ml-4">
                        Last triggered: {new Date(alert.lastTriggered).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.isActive}
                    onCheckedChange={() => toggleAlert(alert.id)}
                  />
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Alerts Set</h3>
            <p className="text-muted-foreground mb-4">
              Create your first price alert to get notified when card prices drop.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
