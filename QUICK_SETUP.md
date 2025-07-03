# Quick Setup: Dynamic Table Names

## Problem Fixed
The system was generating 404 errors due to Row Level Security (RLS) policies blocking table access. This has been resolved with RLS-aware table discovery.

## Quick Solution (Recommended)

To eliminate all 404 errors and get the most reliable table discovery, add this SQL function to your Supabase database:

### Step 1: Add SQL Function

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste this code:

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

-- Grant permission to users
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO anon;
```

4. Click **Run** to execute

### Step 2: Verify

After adding the function, the Exports page will:
- ✅ Load tables instantly without 404 errors
- ✅ Show only tables without RLS (safe for exports)
- ✅ Eliminate permission denied errors
- ✅ Automatically update when you add/remove tables

## Alternative (Current Implementation)

If you prefer not to add the SQL function, the current implementation:
- ✅ Still works by testing each table for accessibility
- ✅ Intelligently handles RLS-protected tables
- ✅ Suppresses 404 and permission denied errors
- ✅ Only shows tables you can actually access
- ✅ Provides clear console logging for debugging
- ⚠️ May take slightly longer to load (tests each table individually)

## Result

Your Exports page will now show a dropdown with all your actual database tables:
- Admin Logs
- AI Predictions  
- Alerts
- Exports
- Marketplace Configs
- Marketplaces
- Notifications
- Price History
- Saved Searches
- Search Results
- Settings
- Users
- All Data

The list will automatically update if you add or remove tables from your database!