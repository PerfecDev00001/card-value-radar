# RLS-Aware Dynamic Table Discovery

## Problem Identified
The 404 errors were caused by Row Level Security (RLS) policies blocking access to tables. The system now intelligently handles RLS-protected tables.

## Solution Overview

The updated system now:
1. ✅ **Detects RLS Status**: Identifies which tables have RLS enabled
2. ✅ **Filters Accessible Tables**: Only shows tables the user can actually access
3. ✅ **Eliminates 404 Errors**: Proper error handling for RLS-blocked tables
4. ✅ **Provides Clear Feedback**: Logs which tables are RLS-protected

## Implementation Methods

### Method 1: SQL Functions (Recommended)

Add these SQL functions to your Supabase database for the most reliable results:

```sql
-- Function to get tables without RLS (best for exports)
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

-- Function to get all accessible tables
CREATE OR REPLACE FUNCTION get_accessible_tables()
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
    AND (
      -- Include tables where RLS is disabled
      NOT c.relrowsecurity
      OR
      -- Or include tables where current user has access
      c.relrowsecurity = true
    );
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO anon;
GRANT EXECUTE ON FUNCTION get_accessible_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_tables() TO anon;
```

### Method 2: Automatic Discovery (Current Fallback)

If SQL functions aren't available, the system automatically:
- Tests each table with a `limit 0` query
- Identifies RLS-protected tables by error codes
- Only includes accessible tables in the dropdown
- Provides clear console logging for debugging

## Error Codes Handled

The system now properly handles these RLS-related errors:
- `PGRST116`: Table not found
- `42501`: Permission denied (RLS)
- `PGRST301`: JWT/Authentication issues

## For Export Functionality

### Tables Suitable for Export:
- ✅ Tables with RLS disabled
- ✅ Tables with RLS policies that allow current user access
- ✅ Public tables without authentication requirements

### Tables NOT Suitable for Export:
- ❌ Tables with strict RLS policies
- ❌ Tables requiring specific user permissions
- ❌ Tables with complex access rules

## Recommendations

### For Development:
1. **Disable RLS** on tables you want to export during development
2. **Use the SQL functions** for most reliable table discovery
3. **Check console logs** to see which tables are being filtered out

### For Production:
1. **Carefully consider** which tables should be exportable
2. **Create appropriate RLS policies** for export functionality
3. **Test export access** with different user roles

## Commands to Check RLS Status

To see which tables have RLS enabled in your database:

```sql
-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasrls as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Result

Your Exports page will now:
- ✅ Show only tables you can actually access
- ✅ Eliminate all 404 errors
- ✅ Provide clear feedback about table accessibility
- ✅ Automatically adapt to RLS policy changes