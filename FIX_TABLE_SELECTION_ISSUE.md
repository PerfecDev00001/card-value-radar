# Fix Table Selection Issue in Exports

## Problem
The exports page is showing all tables as having "no RLS" when some tables actually do have RLS enabled. This happens because:

1. The `get_tables_without_rls()` RPC function doesn't exist in your database
2. The fallback detection method was using `limit(0)` which doesn't trigger RLS policies

## Solution

### Step 1: Create the Missing RPC Function

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `fix_rls_function.sql` (created in this directory)

Alternatively, copy and paste this SQL directly:

```sql
-- Function to get tables without RLS
CREATE OR REPLACE FUNCTION get_tables_without_rls()
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT array_agg(t.table_name ORDER BY t.table_name)
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND n.nspname = 'public'
    AND NOT c.relrowsecurity; -- Only tables without RLS
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO anon;
```

### Step 2: Test the Fix

1. Refresh your application
2. Go to the Exports page
3. Check the browser console - you should now see:
   - "Successfully fetched tables without RLS via RPC: [array of table names]"
   - Only tables that actually have RLS disabled should appear in the dropdown

### Step 3: Verify RLS Status of Your Tables

To check which tables have RLS enabled, run this query in your Supabase SQL Editor:

```sql
SELECT 
    t.table_name,
    CASE 
        WHEN c.relrowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND n.nspname = 'public'
ORDER BY t.table_name;
```

## What Changed in the Code

1. **Improved RPC Function Call**: Better error handling and logging for the RPC function
2. **Enhanced Fallback Detection**: The fallback method now:
   - Uses `count` queries first to test table access
   - Then tries to fetch actual data to double-check
   - Properly identifies RLS-protected tables
3. **Better Error Logging**: More detailed console logs to help debug issues

## Expected Behavior After Fix

- Only tables without RLS should appear in the export dropdown
- The console should show clear messages about which tables are accessible
- Tables with RLS enabled should be properly filtered out
- Export functionality should work correctly for the available tables

## Troubleshooting

If you still see issues after running the SQL:

1. **Check the console logs** - they will show exactly what's happening
2. **Verify the RPC function exists**:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'get_tables_without_rls';
   ```
3. **Test the RPC function manually**:
   ```sql
   SELECT get_tables_without_rls();
   ```

The improved fallback detection should now work correctly even if the RPC function fails.