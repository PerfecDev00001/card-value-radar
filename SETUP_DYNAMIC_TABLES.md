# Dynamic Table Names Setup

This document explains how to set up dynamic table name fetching for the Exports page.

## Overview

The Exports page now dynamically fetches table names from your Supabase database, ensuring that:
- New tables are automatically available for export
- Removed tables are automatically excluded
- The UI always reflects the current database schema

## Implementation

### 1. Hook: `useTableNames`

The `useTableNames` hook (`src/hooks/useTableNames.ts`) implements multiple strategies to fetch table names:

1. **Discovery by Querying**: Tests known tables by attempting to query them
2. **SQL Function**: Uses a custom SQL function if available
3. **Fallback**: Uses type-based table list if database queries fail

### 2. Utility: `extractTableNames`

The utility (`src/utils/extractTableNames.ts`) provides:
- Type-safe table name extraction from Database types
- Consistent table name formatting
- Fallback table information

### 3. SQL Function (Optional)

To enable the most robust table discovery, add this SQL function to your Supabase database:

```sql
-- Create function to get all public table names
CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_public_tables() TO authenticated;
```

## How to Add the SQL Function

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Paste the SQL function code above
5. Run the query

## Features

- **Automatic Discovery**: Finds all accessible tables in your database
- **Real-time Updates**: Reflects changes when tables are added/removed
- **Error Handling**: Graceful fallback if database queries fail
- **Loading States**: Shows loading indicators while fetching
- **Type Safety**: Uses TypeScript types for table names

## Usage

The Exports page will now automatically populate the "Data Source" dropdown with all available tables from your database. No manual configuration needed!

## Troubleshooting

If tables don't appear:
1. Check browser console for errors
2. Verify table permissions in Supabase
3. Ensure the SQL function is created (optional but recommended)
4. Check that tables exist in the 'public' schema