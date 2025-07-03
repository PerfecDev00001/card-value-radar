
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useTableNames } from '@/hooks/useTableNames';
import { getFormattedTableFields, getAllAvailableFields, getTableFields } from '@/utils/getTableFields';
import type { TableName } from '@/utils/extractTableNames';
import { CalendarIcon, Download, FileText, Table, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export function Exports() {
  const [exportType, setExportType] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [includedFields, setIncludedFields] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [loadingRowCount, setLoadingRowCount] = useState(false);
  const { toast } = useToast();
  const { tables, loading: tablesLoading, error: tablesError } = useTableNames();

  // Function to fetch row count for a specific table
  const fetchRowCount = async (tableName: string) => {
    if (tableName === 'all-data') {
      setLoadingRowCount(true);
      try {
        // For "all-data", we need to sum up all tables
        let totalCount = 0;
        for (const table of tables) {
          if (table.value !== 'all-data') {
            try {
              const { count, error } = await supabase
                .from(table.value as TableName)
                .select('*', { count: 'exact', head: true });
              
              if (!error && count !== null) {
                totalCount += count;
              }
            } catch (err) {
              // Skip tables that can't be counted
              console.log(`Could not count rows for table ${table.value}:`, err);
            }
          }
        }
        setRowCount(totalCount);
      } catch (error) {
        console.error('Error fetching total row count:', error);
        setRowCount(null);
      } finally {
        setLoadingRowCount(false);
      }
    } else {
      setLoadingRowCount(true);
      try {
        const { count, error } = await supabase
          .from(tableName as TableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching row count:', error);
          setRowCount(null);
        } else {
          setRowCount(count);
        }
      } catch (error) {
        console.error('Error fetching row count:', error);
        setRowCount(null);
      } finally {
        setLoadingRowCount(false);
      }
    }
  };

  // Update available fields and row count when data source changes
  useEffect(() => {
    if (!dataSource) {
      setAvailableFields([]);
      setIncludedFields([]);
      setRowCount(null);
      return;
    }

    let fields: string[] = [];
    
    if (dataSource === 'all-data') {
      // For "all-data", show all unique fields from all tables
      fields = getAllAvailableFields();
    } else {
      // For specific table, show only that table's fields
      fields = getFormattedTableFields(dataSource as TableName);
    }

    setAvailableFields(fields);
    // Clear previously selected fields when data source changes
    setIncludedFields([]);
    
    // Fetch row count for the selected data source
    fetchRowCount(dataSource);
  }, [dataSource, tables]);

  const handleFieldToggle = (field: string) => {
    setIncludedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleSelectAllFields = () => {
    setIncludedFields([...availableFields]);
  };

  const handleClearAllFields = () => {
    setIncludedFields([]);
  };

  // Helper function to convert formatted field names back to database field names
  const convertToDbFieldName = (formattedField: string): string => {
    return formattedField.toLowerCase().replace(/\s+/g, '_');
  };

  // Helper function to fetch data from a single table
  const fetchTableData = async (tableName: TableName, fields: string[]) => {
    const dbFields = fields.map(convertToDbFieldName);
    let query = supabase.from(tableName).select(dbFields.join(','));

    // Apply date range filter if specified
    if (dateRange.from || dateRange.to) {
      // Try to find a date field in the table (common date field names)
      const dateFields = ['created_at', 'updated_at', 'timestamp', 'date_fetched', 'fetched_at', 'sent_at'];
      const availableDbFields = getTableFields(tableName);
      const dateField = dateFields.find(field => availableDbFields.includes(field));

      if (dateField) {
        if (dateRange.from) {
          query = query.gte(dateField, dateRange.from.toISOString());
        }
        if (dateRange.to) {
          query = query.lte(dateField, dateRange.to.toISOString());
        }
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Helper function to generate CSV content
  const generateCSV = (data: any[], fields: string[]): string => {
    if (data.length === 0) return '';

    const dbFields = fields.map(convertToDbFieldName);
    const headers = fields.join(',');
    const rows = data.map(row => 
      dbFields.map(field => {
        const value = row[field];
        // Handle null/undefined values and escape commas/quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    return [headers, ...rows].join('\n');
  };

  // Helper function to generate JSON content
  const generateJSON = (data: any[], fields: string[]): string => {
    const dbFields = fields.map(convertToDbFieldName);
    const filteredData = data.map(row => {
      const filteredRow: any = {};
      dbFields.forEach((field, index) => {
        filteredRow[fields[index]] = row[field];
      });
      return filteredRow;
    });

    return JSON.stringify(filteredData, null, 2);
  };

  // Helper function to generate PDF content (simplified HTML for PDF generation)
  const generatePDF = (data: any[], fields: string[], tableName: string): string => {
    const dbFields = fields.map(convertToDbFieldName);
    const tableRows = data.map(row => 
      `<tr>${dbFields.map(field => `<td>${row[field] || ''}</td>`).join('')}</tr>`
    ).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Export Report - ${tableName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { margin-bottom: 20px; padding: 10px; background-color: #f0f8ff; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Export Report: ${tableName}</h1>
    <div class="summary">
        <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Total Records:</strong> ${data.length}</p>
        <p><strong>Fields Included:</strong> ${fields.join(', ')}</p>
        ${dateRange.from || dateRange.to ? `<p><strong>Date Range:</strong> ${dateRange.from ? format(dateRange.from, "PPP") : 'Start'} - ${dateRange.to ? format(dateRange.to, "PPP") : 'End'}</p>` : ''}
    </div>
    <table>
        <thead>
            <tr>${fields.map(field => `<th>${field}</th>`).join('')}</tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
</body>
</html>`;
  };

  // Helper function to trigger file download
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!exportType || !dataSource || includedFields.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      let allData: any[] = [];
      let exportFileName = fileName || `export-${Date.now()}`;

      if (dataSource === 'all-data') {
        // Export from all tables
        const allTables = tables.filter(table => table.value !== 'all-data');
        
        for (const table of allTables) {
          try {
            // Only include fields that exist in this table
            const tableFields = getFormattedTableFields(table.value as TableName);
            const relevantFields = includedFields.filter(field => tableFields.includes(field));
            
            if (relevantFields.length > 0) {
              const tableData = await fetchTableData(table.value as TableName, relevantFields);
              // Add table name to each record for identification
              const dataWithTableName = tableData.map(row => {
                // Ensure row is an object before spreading
                if (row && typeof row === 'object') {
                  if (!Array.isArray(row)) {
                    // @ts-ignore
                    return {
                      ...row,
                      source_table: table.label
                    };
                  }
                }
                // Fallback for non-object rows
                return {
                  data: row,
                  source_table: table.label
                };
              });
              allData.push(...dataWithTableName);
            }
          } catch (error) {
            console.warn(`Failed to fetch data from table ${table.value}:`, error);
          }
        }

        // Add source_table to included fields if not already present
        if (!includedFields.includes('Source Table')) {
          includedFields.push('Source Table');
        }
      } else {
        // Export from single table
        allData = await fetchTableData(dataSource as TableName, includedFields);
      }

      if (allData.length === 0) {
        toast({
          title: "No Data Found",
          description: "No data was found matching your criteria.",
          variant: "destructive",
        });
        return;
      }

      // Generate file content based on export type
      let fileContent: string;
      let mimeType: string;
      let fileExtension: string;

      switch (exportType) {
        case 'csv':
          fileContent = generateCSV(allData, includedFields);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'json':
          fileContent = generateJSON(allData, includedFields);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        case 'pdf':
          fileContent = generatePDF(allData, includedFields, dataSource === 'all-data' ? 'All Data' : dataSource);
          mimeType = 'text/html'; // We're generating HTML for PDF
          fileExtension = 'html';
          break;
        default:
          throw new Error('Unsupported export type');
      }

      // Download the file
      const fullFileName = `${exportFileName}.${fileExtension}`;
      downloadFile(fileContent, fullFileName, mimeType);

      toast({
        title: "Export Generated",
        description: `${exportType.toUpperCase()} file "${fullFileName}" has been downloaded successfully. ${allData.length} records exported.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "There was an error generating your export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Exports</h1>
        <p className="text-gray-600">Export your sports card data in various formats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Configuration
            </CardTitle>
            <CardDescription>
              Configure your data export settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-type">Export Format</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-source">Data Source</Label>
              <Select value={dataSource} onValueChange={setDataSource} disabled={tablesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={tablesLoading ? "Loading tables..." : "Select data to export"} />
                </SelectTrigger>
                <SelectContent>
                  {tablesLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading tables...
                    </div>
                  ) : tablesError ? (
                    <div className="text-red-500 p-2 text-sm">
                      Error loading tables: {tablesError}
                    </div>
                  ) : (
                    tables.map((table) => (
                      <SelectItem key={table.value} value={table.value}>
                        {table.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-name">File Name (optional)</Label>
              <Input
                id="file-name"
                placeholder="e.g., sports-cards-export"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Include Fields</CardTitle>
            <CardDescription>
              Select which data fields to include in your export
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!dataSource ? (
              <div className="text-center py-8 text-gray-500">
                <Table className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Please select a data source first to see available fields</p>
              </div>
            ) : availableFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No fields available for the selected data source</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllFields}
                    disabled={includedFields.length === availableFields.length}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAllFields}
                    disabled={includedFields.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-3">
                  {availableFields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={includedFields.includes(field)}
                        onCheckedChange={() => handleFieldToggle(field)}
                      />
                      <Label htmlFor={field} className="text-sm font-normal">
                        {field}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">CSV</div>
              <div className="text-sm text-gray-600">Best for spreadsheets</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">PDF</div>
              <div className="text-sm text-gray-600">Formatted reports</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{includedFields.length}</div>
              <div className="text-sm text-gray-600">Fields selected</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {loadingRowCount ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : rowCount !== null ? (
                  rowCount.toLocaleString()
                ) : (
                  '—'
                )}
              </div>
              <div className="text-sm text-gray-600">All Rows</div>
            </div>
          </div>
          
          <Button 
            onClick={handleExport} 
            disabled={isGenerating || !exportType || !dataSource || includedFields.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Export...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Export
              </>
            )}
          </Button>
        </CardContent>
      </Card>


    </div>
  );
}
