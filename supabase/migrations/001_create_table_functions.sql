-- Function to get all accessible public tables (RLS disabled or accessible)
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
      -- Or include tables where current user has access (you can customize this logic)
      c.relrowsecurity = true
    );
$$;

-- Alternative simpler function that gets tables without RLS
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

-- Grant permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_accessible_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_tables() TO anon;
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO anon;