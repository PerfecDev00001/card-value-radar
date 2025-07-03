
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
import { getFormattedTableFields, getAllAvailableFields } from '@/utils/getTableFields';
import type { TableName } from '@/utils/extractTableNames';
import { CalendarIcon, Download, FileText, Table, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function Exports() {
  const [exportType, setExportType] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [includedFields, setIncludedFields] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const { toast } = useToast();
  const { tables, loading: tablesLoading, error: tablesError } = useTableNames();

  // Update available fields when data source changes
  useEffect(() => {
    if (!dataSource) {
      setAvailableFields([]);
      setIncludedFields([]);
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
  }, [dataSource]);

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
      // Simulate export generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export Generated",
        description: `${exportType.toUpperCase()} file has been generated and will download shortly.`,
      });

      // In a real app, you would trigger the actual file download here
      console.log('Export generated:', { exportType, dataSource, dateRange, includedFields, fileName });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error generating your export. Please try again.",
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
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-sm text-gray-600">Records available</div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Search Results Export</div>
                <div className="text-sm text-gray-600">CSV • 1,245 records • 2 hours ago</div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Price History Report</div>
                <div className="text-sm text-gray-600">PDF • 30 days • Yesterday</div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">All Data Backup</div>
                <div className="text-sm text-gray-600">JSON • Complete dataset • 3 days ago</div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
