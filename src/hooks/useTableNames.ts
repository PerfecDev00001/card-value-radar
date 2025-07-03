import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAllTableInfo, type TableName } from '@/utils/extractTableNames';

interface TableInfo {
  value: string;
  label: string;
}

export function useTableNames() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTableNames() {
      try {
        setLoading(true);
        setError(null);

        // Fetch actual table names from the database
        const actualTables = await fetchActualTableNames();
        console.log('Discovered tables:', actualTables.map(t => t.value));
        setTables([...actualTables, { value: 'all-data', label: 'All Data' }]);
      } catch (err) {
        console.error('Error fetching table names:', err);
        setError('Failed to fetch table names from database');
        // Fallback to type-based list only if database query fails
        const fallbackTables = getAllTableInfo();
        setTables([...fallbackTables, { value: 'all-data', label: 'All Data' }]);
      } finally {
        setLoading(false);
      }
    }

    fetchTableNames();
  }, []);

  return { tables, loading, error };
}

// Function to fetch actual table names from the database
async function fetchActualTableNames(): Promise<TableInfo[]> {
  // Method 1: Try to discover tables by attempting to query known/potential tables
  const discoveredTables = await discoverTablesByQuerying();
  
  if (discoveredTables.length > 0) {
    return discoveredTables;
  }

  // Method 2: Try using RLS-aware SQL functions if they exist
  try {
    // First try to get tables without RLS (most reliable for exports)
    // @ts-ignore
    // @ts-ignore
    const { data: noRlsData, error: noRlsError } = await supabase.rpc("get_tables_without_rls");
    
    if (!noRlsError && noRlsData && Array.isArray(noRlsData)) {
      // @ts-ignore
      return noRlsData.map((tableName: string) => ({
        value: tableName,
        label: formatTableName(tableName)
      }));
    }
  } catch (err) {
    // Function not available, try alternative
  }

  try {
    // Fallback to accessible tables function
    // @ts-ignore
    const { data: accessibleData, error: accessibleError } = await supabase.rpc('get_accessible_tables');
    
    if (!accessibleError && accessibleData && Array.isArray(accessibleData)) {
      // @ts-ignore
      return accessibleData.map((tableName: string) => ({
        value: tableName,
        label: formatTableName(tableName)
      }));
    }
  } catch (err) {
    // SQL functions not available, continue with discovery method
  }

  // If all methods fail, throw error to trigger fallback
  throw new Error('Unable to fetch table names from database');
}

// Method to discover tables by attempting to query them (RLS-aware)
async function discoverTablesByQuerying(): Promise<TableInfo[]> {
  // Start with known tables from the type system
  const potentialTables = getAllTableInfo();
  const discoveredTables: TableInfo[] = [];

  // Test each potential table with better error handling for RLS
  for (const tableInfo of potentialTables) {
    try {
      const { error } = await supabase
        .from(tableInfo.value as TableName)
        .select('*')
        .limit(0);

      if (!error) {
        discoveredTables.push(tableInfo);
      } else {
        // Check for specific error codes
        if (error.code === 'PGRST116') {
          // Table not found - skip silently
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          // Permission denied due to RLS - skip silently
          console.log(`Table ${tableInfo.value} has RLS enabled or permission denied`);
        } else if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          // Authentication issues - skip silently
          console.log(`Table ${tableInfo.value} requires authentication`);
        } else {
          // Other errors - log for debugging
          console.log(`Table ${tableInfo.value} error:`, error.code, error.message);
        }
      }
    } catch (err) {
      // Silently skip tables that cause exceptions
      // This prevents console spam from various access errors
    }
  }

  console.log(`Discovered ${discoveredTables.length} accessible tables out of ${potentialTables.length} potential tables`);
  return discoveredTables.sort((a, b) => a.label.localeCompare(b.label));
}

// Helper function to format table names for display
function formatTableName(tableName: string): string {
  return tableName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
