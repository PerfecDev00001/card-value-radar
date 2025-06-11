'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MoreHorizontal, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Eye, 
  Trash, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface SearchStatus {
  id: string;
  searchTerm: string;
  dateCreated: string;
  lastRun: string;
  nextRun: string;
  status: 'active' | 'completed' | 'scheduled' | 'running' | 'paused' | 'failed';
  type: 'manual' | 'scheduled';
  frequency?: string;
  results: number;
  marketplaces: string[];
  progress?: number;
  errorMessage?: string;
}

interface StatusTableProps {
  searches: SearchStatus[];
  onRunSearch: (id: string) => void;
  onPauseSearch: (id: string) => void;
  onResumeSearch: (id: string) => void;
  onDeleteSearch: (id: string) => void;
}

export function StatusTable({ 
  searches,
  onRunSearch,
  onPauseSearch,
  onResumeSearch,
  onDeleteSearch
}: StatusTableProps) {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const handleAction = async (id: string, action: () => void) => {
    setLoadingActions(prev => ({ ...prev, [id]: true }));
    try {
      await action();
    } finally {
      setLoadingActions(prev => ({ ...prev, [id]: false }));
    }
  };

  const getStatusBadge = (status: SearchStatus['status'], progress?: number) => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-blue-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </Badge>
            {progress !== undefined && (
              <div className="w-16">
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        );
      case 'active':
      case 'scheduled':
        return (
          <Badge variant="default" className="bg-green-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Scheduled
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Pause className="h-3 w-3" />
            Paused
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: SearchStatus['type'], frequency?: string) => {
    if (type === 'manual') {
      return <Badge variant="outline">Manual</Badge>;
    }
    
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">
        {frequency}
      </Badge>
    );
  };

  const getMarketplacesBadges = (marketplaces: string[]) => {
    if (marketplaces.length === 0) return <span className="text-muted-foreground">None</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {marketplaces.slice(0, 2).map((marketplace) => (
          <Badge key={marketplace} variant="outline" className="text-xs">
            {marketplace}
          </Badge>
        ))}
        {marketplaces.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{marketplaces.length - 2} more
          </Badge>
        )}
      </div>
    );
  };

  const getActionButtons = (search: SearchStatus) => {
    const isLoading = loadingActions[search.id];
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Results
          </DropdownMenuItem>
          
          {search.status === 'paused' ? (
            <DropdownMenuItem 
              className="flex items-center gap-2"
              onClick={() => handleAction(search.id, () => onResumeSearch(search.id))}
            >
              <Play className="h-4 w-4" />
              Resume
            </DropdownMenuItem>
          ) : search.status === 'running' ? (
            <DropdownMenuItem 
              className="flex items-center gap-2"
              onClick={() => handleAction(search.id, () => onPauseSearch(search.id))}
            >
              <Pause className="h-4 w-4" />
              Pause
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              className="flex items-center gap-2"
              onClick={() => handleAction(search.id, () => onRunSearch(search.id))}
            >
              <Play className="h-4 w-4" />
              Run Now
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Restart
          </DropdownMenuItem>
          
          {search.status !== 'running' && (
            <>
              {search.status !== 'paused' && (
                <DropdownMenuItem 
                  className="flex items-center gap-2"
                  onClick={() => handleAction(search.id, () => onPauseSearch(search.id))}
                >
                  <Square className="h-4 w-4" />
                  Pause
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem 
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onClick={() => handleAction(search.id, () => onDeleteSearch(search.id))}
              >
                <Trash className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Status Monitor</CardTitle>
        <CardDescription>
          Track the progress and status of your automated card searches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Search Term</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Marketplaces</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead className="text-right">Results</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searches.map((search) => (
                <TableRow key={search.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{search.searchTerm}</div>
                      {search.errorMessage && (
                        <div className="text-xs text-destructive mt-1">
                          {search.errorMessage}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(search.status, search.progress)}</TableCell>
                  <TableCell>{getTypeBadge(search.type, search.frequency)}</TableCell>
                  <TableCell>{getMarketplacesBadges(search.marketplaces)}</TableCell>
                  <TableCell>{search.lastRun}</TableCell>
                  <TableCell>{search.nextRun}</TableCell>
                  <TableCell className="text-right">{search.results}</TableCell>
                  <TableCell>{getActionButtons(search)}</TableCell>
                </TableRow>
              ))}
              {searches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No searches found. Create a new search to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}