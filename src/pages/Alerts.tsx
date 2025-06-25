import {useState, useEffect} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Switch} from '@/components/ui/switch';
import {Separator} from '@/components/ui/separator';
import {Badge} from '@/components/ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {
    Bell,
    Plus,
    Trash2,
    Edit,
    DollarSign,
    Percent,
    Mail,
    Smartphone,
    Search
} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {supabase} from '@/integrations/supabase/client';
import {useAuth} from '@/hooks/useAuth';

interface SavedSearch {
    id: string;
    search_terms: string;
    filters: any;
    time_frame: number;
    schedule: string;
    is_active: boolean;
    created_at: string;
}

interface Alert {
    id: string;
    user_id: string;
    saved_search_id: string;
    price_threshold?: number | null;
    percentage_threshold?: number | null;
    email: boolean;
    sms_push: boolean;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
}

export function Alerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
    const [newAlert, setNewAlert] = useState({
        saved_search_id: '',
        alertType: 'price' as 'price' | 'percentage',
        price_threshold: '',
        percentage_threshold: '',
        email: true,
        sms_push: true
    });
    const [editAlert, setEditAlert] = useState({
        saved_search_id: '',
        alertType: 'price' as 'price' | 'percentage',
        price_threshold: '',
        percentage_threshold: '',
        email: true,
        sms_push: true
    });

    const {toast} = useToast();
    const {user} = useAuth();

    // Load saved searches and alerts when user changes
    useEffect(() => {
        if (user) {
            loadSavedSearches();
            loadAlerts();
        }
    }, [user]);

    const loadSavedSearches = async () => {
        try {
            if (!user) {
                console.log('No authenticated user');
                return;
            }

            const {data, error} = await supabase
                .from('saved_searches')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('created_at', {ascending: false});

            if (error) {
                throw error;
            }

            setSavedSearches(data || []);
        } catch (error) {
            console.error('Error loading saved searches:', error);
            toast({
                title: "Error loading saved searches",
                description: "Failed to load your saved searches",
                variant: "destructive"
            });
        }
    };

    const loadAlerts = async () => {
        try {
            if (!user) {
                console.log('No authenticated user');
                setLoading(false);
                return;
            }

            const {data, error} = await supabase
                .from('alerts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', {ascending: false});

            if (error) {
                throw error;
            }

            // @ts-ignore
            setAlerts(data || []);
        } catch (error) {
            console.error('Error loading alerts:', error);
            toast({
                title: "Error loading alerts",
                description: "Failed to load your alerts",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };


    const handleCreateAlert = async () => {
        if (!newAlert.saved_search_id) {
            toast({
                title: "Search required",
                description: "Please select a saved search for the alert",
                variant: "destructive"
            });
            return;
        }

        if (newAlert.alertType === 'price' && !newAlert.price_threshold) {
            toast({
                title: "Price threshold required",
                description: "Please enter a price threshold",
                variant: "destructive"
            });
            return;
        }

        if (newAlert.alertType === 'percentage' && !newAlert.percentage_threshold) {
            toast({
                title: "Percentage threshold required",
                description: "Please enter a percentage threshold",
                variant: "destructive"
            });
            return;
        }

        if (!newAlert.email && !newAlert.sms_push) {
            toast({
                title: "Notification method required",
                description: "Please select at least one notification method (Email or SMS)",
                variant: "destructive"
            });
            return;
        }


        try {
            if (!user) {
                toast({
                    title: "Authentication required",
                    description: "Please sign in to create alerts",
                    variant: "destructive"
                });
                return;
            }

            const alertData = {
                user_id: user.id,
                saved_search_id: newAlert.saved_search_id,
                price_threshold: newAlert.alertType === 'price' ? Number(newAlert.price_threshold) : null,
                percentage_threshold: newAlert.alertType === 'percentage' ? Number(newAlert.percentage_threshold) : null,
                email: newAlert.email,
                sms_push: newAlert.sms_push,
                is_active: true
            };

            // @ts-ignore
            const {data, error} = await supabase
                .from('alerts')
                .insert(alertData)
                .select('*')
                .single();

            if (error) {
                throw error;
            }

            // Add to local state
            setAlerts([data, ...alerts]);

            // Reset form
            setNewAlert({
                saved_search_id: '',
                alertType: 'price',
                price_threshold: '',
                percentage_threshold: '',
                email: true,
                sms_push: true
            });
            setShowCreateForm(false);

            const selectedSearch = savedSearches.find(s => s.id === newAlert.saved_search_id);
            toast({
                title: "Alert created!",
                description: `Price alert for "${selectedSearch?.search_terms || 'search'}" has been created`,
            });
        } catch (error) {
            console.error('Error creating alert:', error);
            toast({
                title: "Error creating alert",
                description: "Failed to create the alert. Please try again.",
                variant: "destructive"
            });
        }
    };

    const toggleAlert = async (id: string) => {
        try {
            const alertToToggle = alerts.find(a => a.id === id);
            if (!alertToToggle) return;

            const {error} = await supabase
                .from('alerts')
                .update({is_active: !alertToToggle.is_active})
                .eq('id', id);

            if (error) {
                throw error;
            }

            // Update local state
            setAlerts(alerts.map(alert =>
                alert.id === id ? {...alert, is_active: !alert.is_active} : alert
            ));
        } catch (error) {
            console.error('Error toggling alert:', error);
            toast({
                title: "Error updating alert",
                description: "Failed to update alert status",
                variant: "destructive"
            });
        }
    };

    const deleteAlert = async (id: string) => {
        try {
            const {error} = await supabase
                .from('alerts')
                .delete()
                .eq('id', id);

            if (error) {
                throw error;
            }

            // Update local state
            setAlerts(alerts.filter(alert => alert.id !== id));
            toast({
                title: "Alert deleted",
                description: "The price alert has been removed",
            });
        } catch (error) {
            console.error('Error deleting alert:', error);
            toast({
                title: "Error deleting alert",
                description: "Failed to delete the alert",
                variant: "destructive"
            });
        }
    };

    const startEditAlert = (alert: Alert) => {
        setEditingAlert(alert);
        setEditAlert({
            saved_search_id: alert.saved_search_id,
            alertType: alert.price_threshold ? 'price' : 'percentage',
            price_threshold: alert.price_threshold?.toString() || '',
            percentage_threshold: alert.percentage_threshold?.toString() || '',
            email: alert.email,
            sms_push: alert.sms_push
        });
        setShowEditForm(true);
        setShowCreateForm(false); // Close create form if open
    };

    const handleUpdateAlert = async () => {
        if (!editingAlert) return;

        if (!editAlert.saved_search_id) {
            toast({
                title: "Search required",
                description: "Please select a saved search for the alert",
                variant: "destructive"
            });
            return;
        }

        if (editAlert.alertType === 'price' && !editAlert.price_threshold) {
            toast({
                title: "Price threshold required",
                description: "Please enter a price threshold",
                variant: "destructive"
            });
            return;
        }

        if (editAlert.alertType === 'percentage' && !editAlert.percentage_threshold) {
            toast({
                title: "Percentage threshold required",
                description: "Please enter a percentage threshold",
                variant: "destructive"
            });
            return;
        }

        if (!editAlert.email && !editAlert.sms_push) {
            toast({
                title: "Notification method required",
                description: "Please select at least one notification method (Email or SMS)",
                variant: "destructive"
            });
            return;
        }

        try {
            if (!user) {
                toast({
                    title: "Authentication required",
                    description: "Please sign in to update alerts",
                    variant: "destructive"
                });
                return;
            }

            const updateData = {
                saved_search_id: editAlert.saved_search_id,
                price_threshold: editAlert.alertType === 'price' ? Number(editAlert.price_threshold) : null,
                percentage_threshold: editAlert.alertType === 'percentage' ? Number(editAlert.percentage_threshold) : null,
                email: editAlert.email,
                sms_push: editAlert.sms_push,
                updated_at: new Date().toISOString()
            };

            const {data, error} = await supabase
                .from('alerts')
                .update(updateData)
                .eq('id', editingAlert.id)
                .select('*')
                .single();

            if (error) {
                throw error;
            }

            // Update local state
            setAlerts(alerts.map(alert => 
                alert.id === editingAlert.id ? data : alert
            ));

            // Reset edit form
            setEditingAlert(null);
            setEditAlert({
                saved_search_id: '',
                alertType: 'price',
                price_threshold: '',
                percentage_threshold: '',
                email: true,
                sms_push: true
            });
            setShowEditForm(false);

            const selectedSearch = savedSearches.find(s => s.id === editAlert.saved_search_id);
            toast({
                title: "Alert updated!",
                description: `Alert for "${selectedSearch?.search_terms || 'search'}" has been updated`,
            });
        } catch (error) {
            console.error('Error updating alert:', error);
            toast({
                title: "Error updating alert",
                description: "Failed to update the alert. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading alerts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Price Alerts</h1>
                    <p className="text-muted-foreground">
                        Get notified when card prices drop below your threshold
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setShowCreateForm(!showCreateForm);
                        setShowEditForm(false); // Close edit form if open
                    }}
                >
                    <Plus className="h-4 w-4 mr-2"/>
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
                            <Label htmlFor="savedSearch">Saved Search</Label>
                            <Select
                                value={newAlert.saved_search_id}
                                onValueChange={(value) => setNewAlert({...newAlert, saved_search_id: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a saved search"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {savedSearches.filter(search =>
                                        !alerts.some(alert => alert.saved_search_id === search.id)
                                    ).map((search) => (
                                        <SelectItem key={search.id} value={search.id}>
                                            <div className="flex items-center gap-2">
                                                <Search className="h-4 w-4"/>
                                                {search.search_terms}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {savedSearches.filter(search =>
                                !alerts.some(alert => alert.saved_search_id === search.id)
                            ).length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No available searches. All your saved searches already have alerts, or you need to
                                    create some searches first.
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Label>Alert Type</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Card
                                    className={`cursor-pointer transition-colors ${
                                        newAlert.alertType === 'price' ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                    onClick={() => setNewAlert({...newAlert, alertType: 'price'})}
                                >
                                    <CardContent className="p-4 text-center">
                                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600"/>
                                        <h3 className="font-medium">Fixed Price</h3>
                                        <p className="text-sm text-muted-foreground">Alert when price drops below a
                                            specific amount</p>
                                    </CardContent>
                                </Card>
                                <Card
                                    className={`cursor-pointer transition-colors ${
                                        newAlert.alertType === 'percentage' ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                    onClick={() => setNewAlert({...newAlert, alertType: 'percentage'})}
                                >
                                    <CardContent className="p-4 text-center">
                                        <Percent className="h-8 w-8 mx-auto mb-2 text-blue-600"/>
                                        <h3 className="font-medium">Percentage Drop</h3>
                                        <p className="text-sm text-muted-foreground">Alert when price drops by a
                                            percentage</p>
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
                                    value={newAlert.price_threshold}
                                    onChange={(e) => setNewAlert({...newAlert, price_threshold: e.target.value})}
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
                                    value={newAlert.percentage_threshold}
                                    onChange={(e) => setNewAlert({...newAlert, percentage_threshold: e.target.value})}
                                />
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label>Notification Methods</Label>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4"/>
                                        <Label htmlFor="emailSwitch">Email Notifications</Label>
                                    </div>
                                    <Switch
                                        id="emailSwitch"
                                        checked={newAlert.email}
                                        onCheckedChange={(checked) => setNewAlert({...newAlert, email: checked})}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4"/>
                                        <Label htmlFor="smsSwitch">SMS Notifications</Label>
                                    </div>
                                    <Switch
                                        id="smsSwitch"
                                        checked={newAlert.sms_push}
                                        onCheckedChange={(checked) => setNewAlert({...newAlert, sms_push: checked})}
                                    />
                                </div>
                            </div>
                            {!newAlert.email && !newAlert.sms_push && (
                                <p className="text-sm text-red-600">
                                    ⚠️ Please select at least one notification method
                                </p>
                            )}
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

            {/* Edit Alert Form */}
            {showEditForm && editingAlert && (
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Alert</CardTitle>
                        <CardDescription>
                            Update your price notification settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="editSavedSearch">Saved Search</Label>
                            <Select
                                value={editAlert.saved_search_id}
                                onValueChange={(value) => setEditAlert({...editAlert, saved_search_id: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a saved search"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {savedSearches.filter(search =>
                                        search.id === editingAlert.saved_search_id || 
                                        !alerts.some(alert => alert.saved_search_id === search.id)
                                    ).map((search) => (
                                        <SelectItem key={search.id} value={search.id}>
                                            <div className="flex items-center gap-2">
                                                <Search className="h-4 w-4"/>
                                                {search.search_terms}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label>Alert Type</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Card
                                    className={`cursor-pointer transition-colors ${
                                        editAlert.alertType === 'price' ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                    onClick={() => setEditAlert({...editAlert, alertType: 'price'})}
                                >
                                    <CardContent className="p-4 text-center">
                                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600"/>
                                        <h3 className="font-medium">Fixed Price</h3>
                                        <p className="text-sm text-muted-foreground">Alert when price drops below a
                                            specific amount</p>
                                    </CardContent>
                                </Card>
                                <Card
                                    className={`cursor-pointer transition-colors ${
                                        editAlert.alertType === 'percentage' ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                    onClick={() => setEditAlert({...editAlert, alertType: 'percentage'})}
                                >
                                    <CardContent className="p-4 text-center">
                                        <Percent className="h-8 w-8 mx-auto mb-2 text-blue-600"/>
                                        <h3 className="font-medium">Percentage Drop</h3>
                                        <p className="text-sm text-muted-foreground">Alert when price drops by a
                                            percentage</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {editAlert.alertType === 'price' && (
                            <div className="space-y-2">
                                <Label htmlFor="editPriceThreshold">Price Threshold ($)</Label>
                                <Input
                                    id="editPriceThreshold"
                                    type="number"
                                    placeholder="120.00"
                                    value={editAlert.price_threshold}
                                    onChange={(e) => setEditAlert({...editAlert, price_threshold: e.target.value})}
                                />
                            </div>
                        )}

                        {editAlert.alertType === 'percentage' && (
                            <div className="space-y-2">
                                <Label htmlFor="editPercentageThreshold">Percentage Drop (%)</Label>
                                <Input
                                    id="editPercentageThreshold"
                                    type="number"
                                    placeholder="15"
                                    value={editAlert.percentage_threshold}
                                    onChange={(e) => setEditAlert({...editAlert, percentage_threshold: e.target.value})}
                                />
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label>Notification Methods</Label>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4"/>
                                        <Label htmlFor="editEmailSwitch">Email Notifications</Label>
                                    </div>
                                    <Switch
                                        id="editEmailSwitch"
                                        checked={editAlert.email}
                                        onCheckedChange={(checked) => setEditAlert({...editAlert, email: checked})}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4"/>
                                        <Label htmlFor="editSmsSwitch">SMS Notifications</Label>
                                    </div>
                                    <Switch
                                        id="editSmsSwitch"
                                        checked={editAlert.sms_push}
                                        onCheckedChange={(checked) => setEditAlert({...editAlert, sms_push: checked})}
                                    />
                                </div>
                            </div>
                            {!editAlert.email && !editAlert.sms_push && (
                                <p className="text-sm text-red-600">
                                    ⚠️ Please select at least one notification method
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={handleUpdateAlert} className="flex-1">
                                Update Alert
                            </Button>
                            <Button variant="outline" onClick={() => setShowEditForm(false)}>
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
                                        <h3 className="font-semibold">
                                            {savedSearches.find(s => s.id === alert.saved_search_id)?.search_terms || 'Unknown Search'}
                                        </h3>
                                        <Badge variant={alert.is_active ? "default" : "secondary"}>
                                            {alert.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            {alert.price_threshold ? (
                                                <>
                                                    <DollarSign className="h-4 w-4"/>
                                                    Alert when below ${alert.price_threshold}
                                                </>
                                            ) : (
                                                <>
                                                    <Percent className="h-4 w-4"/>
                                                    Alert when drops {alert.percentage_threshold}%
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {alert.email && <Mail className="h-4 w-4"/>}
                                            {alert.sms_push && <Smartphone className="h-4 w-4"/>}
                                            <span className="text-sm">
                        {alert.email && alert.sms_push ? 'Email & SMS' :
                            alert.email ? 'Email only' :
                                alert.sms_push ? 'SMS only' : 'No notifications'}
                      </span>
                                        </div>
                                    </div>


                                    <div className="text-xs text-muted-foreground">
                                        Created: {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : 'Unknown'}
                                        {alert.updated_at && (
                                            <span className="ml-4">
                        Updated: {new Date(alert.updated_at).toLocaleDateString()}
                      </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={alert.is_active}
                                        onCheckedChange={() => toggleAlert(alert.id)}
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => startEditAlert(alert)}
                                    >
                                        <Edit className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteAlert(alert.id)}
                                    >
                                        <Trash2 className="h-4 w-4"/>
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
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No Alerts Set</h3>
                        <p className="text-muted-foreground mb-4">
                            Create your first price alert to get notified when card prices drop.
                        </p>
                        <Button onClick={() => setShowCreateForm(true)}>
                            <Plus className="h-4 w-4 mr-2"/>
                            Create Your First Alert
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
