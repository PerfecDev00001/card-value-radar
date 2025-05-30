
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const activities = [
  {
    id: 1,
    type: 'price_alert',
    message: 'Price dropped for 2022 Topps Chrome Patrick Mahomes PSA 10',
    time: '2 minutes ago',
    badge: 'Alert',
    badgeVariant: 'destructive' as const,
  },
  {
    id: 2,
    type: 'search_completed',
    message: 'Search completed for "Tom Brady rookie cards"',
    time: '15 minutes ago',
    badge: 'Search',
    badgeVariant: 'default' as const,
  },
  {
    id: 3,
    type: 'export_ready',
    message: 'CSV export is ready for download',
    time: '1 hour ago',
    badge: 'Export',
    badgeVariant: 'secondary' as const,
  },
  {
    id: 4,
    type: 'new_listing',
    message: 'New listing found for LeBron James 2003 Topps Chrome',
    time: '2 hours ago',
    badge: 'Listing',
    badgeVariant: 'outline' as const,
  },
];

export function RecentActivity() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest notifications and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {activity.type === 'price_alert' && '💰'}
                  {activity.type === 'search_completed' && '🔍'}
                  {activity.type === 'export_ready' && '📄'}
                  {activity.type === 'new_listing' && '🆕'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.message}</p>
                <p className="text-sm text-muted-foreground">{activity.time}</p>
              </div>
              <Badge variant={activity.badgeVariant}>{activity.badge}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
