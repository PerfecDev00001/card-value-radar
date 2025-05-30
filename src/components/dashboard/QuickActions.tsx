
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, FileDown, Settings } from 'lucide-react';

interface QuickActionsProps {
  onTabChange: (tab: string) => void;
}

export function QuickActions({ onTabChange }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => onTabChange('search')}
        >
          <Search className="mr-2 h-4 w-4" />
          New Search
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => onTabChange('alerts')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Alert
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => onTabChange('exports')}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export Data
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => onTabChange('settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </CardContent>
    </Card>
  );
}
