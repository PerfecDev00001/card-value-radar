
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Database, Settings, Activity, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  lastActive: string;
  searches: number;
}

interface SystemMetric {
  name: string;
  value: string;
  status: 'good' | 'warning' | 'error';
  description: string;
}

export function Admin() {
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      lastActive: '2 hours ago',
      searches: 145
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'user',
      status: 'active',
      lastActive: '1 day ago',
      searches: 89
    },
    {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'admin',
      status: 'active',
      lastActive: '5 minutes ago',
      searches: 234
    },
    {
      id: '4',
      name: 'Alice Brown',
      email: 'alice@example.com',
      role: 'user',
      status: 'suspended',
      lastActive: '1 week ago',
      searches: 12
    }
  ]);

  const [systemMetrics] = useState<SystemMetric[]>([
    {
      name: 'Database Health',
      value: '98.5%',
      status: 'good',
      description: 'All database connections are healthy'
    },
    {
      name: 'API Response Time',
      value: '245ms',
      status: 'good',
      description: 'Average response time is within normal range'
    },
    {
      name: 'Storage Usage',
      value: '78%',
      status: 'warning',
      description: 'Storage is approaching capacity'
    },
    {
      name: 'Active Users',
      value: '1,247',
      status: 'good',
      description: 'Users active in the last 24 hours'
    },
    {
      name: 'Failed Syncs',
      value: '3',
      status: 'error',
      description: 'Marketplace sync failures in the last hour'
    }
  ]);

  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  const handleUserAction = (userId: string, action: string) => {
    toast({
      title: "Action Performed",
      description: `${action} action performed for user ${userId}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">System administration and user management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</div>
              <div className="text-sm text-gray-600">Admins</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Database className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">98.5%</div>
              <div className="text-sm text-gray-600">System Health</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-gray-600">Issues</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input placeholder="Search users..." className="max-w-sm" />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Searches</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.lastActive}</TableCell>
                      <TableCell>{user.searches}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'Edit')}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUserAction(user.id, user.status === 'active' ? 'Suspend' : 'Activate')}
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>
                  Monitor system performance and health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {systemMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-gray-600">{metric.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{metric.value}</div>
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                View recent system activity and errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">User login</div>
                      <div className="text-sm text-gray-600">john@example.com logged in successfully</div>
                    </div>
                    <div className="text-sm text-gray-500">2 minutes ago</div>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-yellow-600">Sync warning</div>
                      <div className="text-sm text-gray-600">eBay marketplace sync took longer than expected</div>
                    </div>
                    <div className="text-sm text-gray-500">15 minutes ago</div>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-600">Sync error</div>
                      <div className="text-sm text-gray-600">Failed to connect to PWCC marketplace API</div>
                    </div>
                    <div className="text-sm text-gray-500">1 hour ago</div>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Database backup</div>
                      <div className="text-sm text-gray-600">Daily backup completed successfully</div>
                    </div>
                    <div className="text-sm text-gray-500">3 hours ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Site Maintenance</label>
                    <Button variant="outline">Enable Maintenance Mode</Button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">User Registration</label>
                    <Button variant="outline">Disable New Registrations</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Data Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Retention (days)</label>
                    <Input type="number" defaultValue="90" className="max-w-xs" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Backup Frequency</label>
                    <select className="w-full max-w-xs p-2 border rounded-md">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
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
