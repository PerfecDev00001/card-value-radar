
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  BarChart3,
  Bell,
  TrendingUp,
  FileDown,
  Settings,
  Store,
  Brain,
  LogOut,
  Home,
  Shield,
  TestTube
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'search-test', label: 'Search Test', icon: TestTube },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'trends', label: 'Price Trends', icon: TrendingUp },
  { id: 'exports', label: 'Exports', icon: FileDown },
  { id: 'marketplaces', label: 'Marketplaces', icon: Store },
  { id: 'ai-estimator', label: 'AI Estimator', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin', label: 'Admin Panel', icon: Shield },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { signOut } = useAuth();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Sports Card Tracker</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeTab === item.id && "bg-blue-50 text-blue-700"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => signOut()}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
