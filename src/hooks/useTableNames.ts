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
        setError('Failed to fetch tables without RLS from database');
        // Fallback: Don't show any tables if we can't determine which ones have RLS disabled
        // This prevents showing tables that might have RLS enabled
        setTables([{ value: 'all-data', label: 'All Data' }]);
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
  // Priority 1: Try to get tables without RLS (most reliable for exports)
  try {
    const { data: noRlsData, error: noRlsError } = await supabase.rpc("get_tables_without_rls");
    
    if (!noRlsError && noRlsData && Array.isArray(noRlsData)) {
      console.log('Successfully fetched tables without RLS:', noRlsData);
      return noRlsData.map((tableName: string) => ({
        value: tableName,
        label: formatTableName(tableName)
      }));
    } else {
      console.warn('Failed to fetch tables without RLS:', noRlsError);
    }
  } catch (err) {
    console.warn('Error calling get_tables_without_rls function:', err);
  }

  // Priority 2: Try using discovery method but filter for non-RLS tables only
  const discoveredTables = await discoverTablesWithoutRLS();
  
  if (discoveredTables.length > 0) {
    return discoveredTables;
  }

  // If all methods fail, throw error to trigger fallback
  throw new Error('Unable to fetch tables without RLS from database');
}

// Method to discover tables without RLS by attempting to query them
async function discoverTablesWithoutRLS(): Promise<TableInfo[]> {
  // Start with known tables from the type system
  const potentialTables = getAllTableInfo();
  const discoveredTables: TableInfo[] = [];

  // Test each potential table and only include those without RLS restrictions
  for (const tableInfo of potentialTables) {
    try {
      // Try to query the table without authentication context
      const { error } = await supabase
        .from(tableInfo.value as TableName)
        .select('*')
        .limit(0);

      if (!error) {
        // Table is accessible without RLS restrictions
        discoveredTables.push(tableInfo);
        console.log(`Table ${tableInfo.value} is accessible (no RLS)`);
      } else {
        // Check for specific error codes that indicate RLS is enabled
        if (error.code === 'PGRST116') {
          // Table not found - skip silently
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          // Permission denied due to RLS - skip this table
          console.log(`Table ${tableInfo.value} has RLS enabled - skipping`);
        } else if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          // Authentication issues likely due to RLS - skip this table
          console.log(`Table ${tableInfo.value} requires authentication (RLS) - skipping`);
        } else {
          // Other errors - log for debugging but don't include table
          console.log(`Table ${tableInfo.value} error:`, error.code, error.message);
        }
      }
    } catch (err) {
      // Silently skip tables that cause exceptions
      console.log(`Table ${tableInfo.value} caused exception - skipping`);
    }
  }

  console.log(`Discovered ${discoveredTables.length} tables without RLS out of ${potentialTables.length} potential tables`);
  return discoveredTables.sort((a, b) => a.label.localeCompare(b.label));
}

// Helper function to format table names for display
function formatTableName(tableName: string): string {
  return tableName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
