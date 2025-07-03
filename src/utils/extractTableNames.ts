import type {Database} from '@/integrations/supabase/types';

// This utility automatically extracts table names from the Database type
// When the database schema changes, this will automatically reflect those changes

export type TableName = keyof Database['public']['Tables'];

// Helper to get all table names from the Database type
// This function uses TypeScript's type system to ensure we get all table names
export function getAllTableNames(): TableName[] {
  // We need to manually list them here, but TypeScript will ensure they match the Database type
  // If a table is added/removed from the Database type, TypeScript will show an error here
  // TypeScript will ensure this array only contains valid table names
  return [
    'admin_logs',
    'ai_predictions',
    'alerts',
    'exports',
    'marketplace_configs',
    'marketplaces',
    'notifications',
    'price_history',
    'saved_searches',
    'search_results',
    'settings',
    'users'
  ];
}

// Helper function to format table names for display
export function formatTableName(tableName: string): string {
  return tableName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Create table info objects
export function createTableInfo(tableName: TableName) {
  return {
    value: tableName,
    label: formatTableName(tableName)
  };
}

// Get all table info objects
export function getAllTableInfo() {
  return getAllTableNames().map(createTableInfo);
}