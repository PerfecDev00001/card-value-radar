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
      console.log('Successfully fetched tables without RLS via RPC:', noRlsData);
      return noRlsData.map((tableName: string) => ({
        value: tableName,
        label: formatTableName(tableName)
      }));
    } else {
      console.warn('RPC function get_tables_without_rls failed:', noRlsError?.message || 'Unknown error');
    }
  } catch (err) {
    console.warn('Error calling get_tables_without_rls function:', err);
  }

  // Priority 2: Try using discovery method but filter for non-RLS tables only
  console.log('Falling back to discovery method to detect tables without RLS...');
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
      // First, try to get the count to see if we can access the table at all
      const { count, error: countError } = await supabase
        .from(tableInfo.value as TableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        // Check for specific error codes that indicate RLS is enabled
        if (countError.code === 'PGRST116') {
          console.log(`Table ${tableInfo.value} not found - skipping`);
        } else if (countError.code === '42501' || countError.message?.includes('permission denied')) {
          console.log(`Table ${tableInfo.value} has RLS enabled (permission denied) - skipping`);
        } else if (countError.code === 'PGRST301' || countError.message?.includes('JWT')) {
          console.log(`Table ${tableInfo.value} requires authentication (RLS) - skipping`);
        } else if (countError.code === 'PGRST103' || countError.message?.includes('row-level security')) {
          console.log(`Table ${tableInfo.value} has RLS enabled (explicit RLS error) - skipping`);
        } else {
          console.log(`Table ${tableInfo.value} error (${countError.code}): ${countError.message} - skipping`);
        }
        continue;
      }

      // If count succeeded, try to actually fetch some data to double-check
      const { data, error: dataError } = await supabase
        .from(tableInfo.value as TableName)
        .select('*')
        .limit(1);

      if (!dataError) {
        // Table is accessible without RLS restrictions
        discoveredTables.push(tableInfo);
        console.log(`Table ${tableInfo.value} is accessible (no RLS) - count: ${count}, sample rows: ${data?.length || 0}`);
      } else {
        // Data fetch failed even though count succeeded - likely RLS issue
        console.log(`Table ${tableInfo.value} count succeeded but data fetch failed (likely RLS) - skipping:`, dataError.message);
      }
    } catch (err) {
      // Silently skip tables that cause exceptions
      console.log(`Table ${tableInfo.value} caused exception - skipping:`, err);
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
