
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

export function Dashboard({ onTabChange }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your sports card tracking.
        </p>
      </div>

      <DashboardCards />

      <div className="grid gap-6 md:grid-cols-4">
        <RecentActivity />
        <QuickActions onTabChange={onTabChange} />
      </div>
    </div>
  );
}
