import type { Database } from '@/integrations/supabase/types';
import type { TableName } from '@/utils/extractTableNames';

// Helper function to format field names for display
function formatFieldName(fieldName: string): string {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Function to get field names for a specific table
export function getTableFields(tableName: TableName): string[] {
  // Define field mappings for each table based on the Database type
  const tableFieldMappings: Record<TableName, string[]> = {
    admin_logs: ['action', 'details', 'id', 'performed_by', 'timestamp'],
    ai_predictions: ['card_attributes', 'confidence_score', 'created_at', 'id', 'model_version', 'predicted_price'],
    alerts: ['created_at', 'email', 'id', 'is_active', 'percentage_threshold', 'price_threshold', 'saved_search_id', 'sms_push', 'updated_at', 'user_id'],
    exports: ['created_at', 'export_type', 'file_url', 'id', 'status', 'user_id'],
    marketplace_configs: ['created_at', 'custom_settings', 'id', 'marketplace_id', 'user_id'],
    marketplaces: ['api_key', 'base_url', 'created_at', 'id', 'is_active', 'name'],
    notifications: ['alert_id', 'id', 'is_read', 'message', 'sent_at', 'type', 'user_id'],
    price_history: ['card_name', 'condition_grade', 'fetched_at', 'id', 'marketplace_id', 'price'],
    saved_searches: ['created_at', 'filters', 'id', 'is_active', 'schedule', 'search_terms', 'time_frame', 'updated_at', 'user_id'],
    search_results: ['card_id', 'card_name', 'date_fetched', 'id', 'listing_url', 'marketplace_id', 'metadata', 'price', 'saved_search_id', 'sold_price_avg'],
    settings: ['created_at', 'id', 'key', 'updated_at', 'value'],
    users: ['auth_user_id', 'created_at', 'email', 'full_name', 'id', 'role', 'updated_at']
  };

  return tableFieldMappings[tableName] || [];
}

// Function to get formatted field names for display
export function getFormattedTableFields(tableName: TableName): string[] {
  const fields = getTableFields(tableName);
  return fields.map(formatFieldName);
}

// Function to get all available fields for all tables (for "all-data" option)
export function getAllAvailableFields(): string[] {
  const allFields = new Set<string>();
  
  // Get all unique field names across all tables
  const tableNames: TableName[] = [
    'admin_logs', 'ai_predictions', 'alerts', 'exports', 'marketplace_configs',
    'marketplaces', 'notifications', 'price_history', 'saved_searches', 
    'search_results', 'settings', 'users'
  ];
  
  tableNames.forEach(tableName => {
    const fields = getTableFields(tableName);
    fields.forEach(field => allFields.add(field));
  });

  return Array.from(allFields).map(formatFieldName).sort();
}

// Function to check if a field exists in a specific table
export function isFieldInTable(tableName: TableName, fieldName: string): boolean {
  const fields = getTableFields(tableName);
  return fields.includes(fieldName.toLowerCase().replace(/\s+/g, '_'));
}