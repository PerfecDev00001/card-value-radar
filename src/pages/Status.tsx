import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StatusTable } from '@/components/status/status-table';

interface SearchFilters {
  marketplaces?: string[];
  condition?: string[];
  gradingCompany?: string[];
  priceRange?: { min: number | null; max: number | null };
}

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

export function Status() {
  const [searches, setSearches] = useState<SearchStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch saved searches from Supabase
  useEffect(() => {
    const fetchSearches = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('saved_searches')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Transform the data to match our SearchStatus interface
          const transformedData: SearchStatus[] = data.map(search => ({
            id: search.id,
            searchTerm: search.search_terms,
            dateCreated: new Date(search.created_at).toLocaleDateString(),
            lastRun: new Date(search.created_at).toLocaleDateString(),//search.last_run ? new Date(search.last_run).toLocaleDateString() : 'Never',
            nextRun: new Date(search.created_at).toLocaleDateString(),//calculateNextRun(search.schedule, search.last_run),
            status: determineStatus(search),
            type: search.schedule === 'manual' ? 'manual' : 'scheduled',
            frequency: search.schedule !== 'manual' ? search.schedule : undefined,
            results: 0,//search.results_count || 0,
            marketplaces: (search.filters as SearchFilters)?.marketplaces || [],
            progress: 0,//search.progress || 0,
            errorMessage: ''//search.error_message
          }));

          setSearches(transformedData);
        }
      } catch (error) {
        toast({
          title: "Failed to load searches",
          description: "There was an error loading your saved searches",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSearches();
  }, [user, toast]);

  // Helper function to calculate next run time
  const calculateNextRun = (schedule: string, lastRun: string | null): string => {
    if (schedule === 'manual') return 'Manual';
    if (!lastRun) return 'Pending';

    const lastRunDate = new Date(lastRun);
    let nextRunDate = new Date(lastRunDate);

    switch (schedule) {
      case '15m':
        nextRunDate.setMinutes(nextRunDate.getMinutes() + 15);
        break;
      case '30m':
        nextRunDate.setMinutes(nextRunDate.getMinutes() + 30);
        break;
      case '1h':
        nextRunDate.setHours(nextRunDate.getHours() + 1);
        break;
      case '6h':
        nextRunDate.setHours(nextRunDate.getHours() + 6);
        break;
      case '12h':
        nextRunDate.setHours(nextRunDate.getHours() + 12);
        break;
      case '24h':
        nextRunDate.setDate(nextRunDate.getDate() + 1);
        break;
      case '7d':
        nextRunDate.setDate(nextRunDate.getDate() + 7);
        break;
      default:
        return 'Unknown';
    }

    return nextRunDate.toLocaleString();
  };

  // Helper function to determine search status
  const determineStatus = (search: any): SearchStatus['status'] => {
    if (!search.is_active) return 'paused';
    if (search.error_message) return 'failed';
    if (search.is_running) return 'running';
    if (search.schedule === 'manual') return 'completed';
    return 'scheduled';
  };

  // Handle search actions
  const handleRunSearch = async (id: string) => {
    /*try {
      // Update the search to set it as running
      const { error } = await supabase
        .from('saved_searches')
        .update({ 
          is_running: true,
          last_run: new Date().toISOString(),
          error_message: null
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setSearches(prev => prev.map(search => 
        search.id === id 
          ? { ...search, status: 'running', lastRun: new Date().toLocaleDateString() }
          : search
      ));

      toast({
        title: "Search started",
        description: "Your search has been queued and will start shortly",
      });

      // TODO: Trigger actual search execution via API
      
    } catch (error) {
      toast({
        title: "Failed to start search",
        description: "There was an error starting your search",
        variant: "destructive"
      });
    }*/
  };

  const handlePauseSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setSearches(prev => prev.map(search => 
        search.id === id ? { ...search, status: 'paused' } : search
      ));

      toast({
        title: "Search paused",
        description: "Your search has been paused",
      });
    } catch (error) {
      toast({
        title: "Failed to pause search",
        description: "There was an error pausing your search",
        variant: "destructive"
      });
    }
  };

  const handleResumeSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .update({ is_active: true, error_message: null })
        .eq('id', id);

      if (error) throw error;

      setSearches(prev => prev.map(search => 
        search.id === id ? { ...search, status: 'scheduled' } : search
      ));

      toast({
        title: "Search resumed",
        description: "Your search has been resumed",
      });
    } catch (error) {
      toast({
        title: "Failed to resume search",
        description: "There was an error resuming your search",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSearches(prev => prev.filter(search => search.id !== id));

      toast({
        title: "Search deleted",
        description: "Your search has been deleted",
      });
    } catch (error) {
      toast({
        title: "Failed to delete search",
        description: "There was an error deleting your search",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Status of Searching Cards</h1>
          <p className="text-muted-foreground">
            Monitor the status and progress of your card searches
          </p>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Status of Searching Cards</h1>
        <p className="text-muted-foreground">
          Monitor the status and progress of your card searches
        </p>
      </div>

      <StatusTable
        searches={searches}
        onRunSearch={handleRunSearch}
        onPauseSearch={handlePauseSearch}
        onResumeSearch={handleResumeSearch}
        onDeleteSearch={handleDeleteSearch}
      />
    </div>
  );
}