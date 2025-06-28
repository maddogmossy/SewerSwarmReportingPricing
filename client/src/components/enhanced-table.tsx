import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Filter, Eye, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Column {
  key: string;
  label: string;
  hideable?: boolean;
}

interface EnhancedTableProps {
  data: any[];
  columns: Column[];
  currentSector: any;
  calculateCost: (section: any) => string;
}

export function EnhancedTable({ data, columns, currentSector, calculateCost }: EnhancedTableProps) {
  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  
  // Filter states for each column
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  
  // Show/hide filter controls
  const [showFilters, setShowFilters] = useState(false);

  // Toggle column visibility
  const toggleColumnVisibility = (columnKey: string) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(columnKey)) {
      newHidden.delete(columnKey);
    } else {
      newHidden.add(columnKey);
    }
    setHiddenColumns(newHidden);
  };

  // Update column filter
  const updateFilter = (columnKey: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setColumnFilters({});
  };

  // Filter data based on column filters
  const filteredData = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return data;
    
    return data.filter(row => {
      return Object.entries(columnFilters).every(([columnKey, filterValue]) => {
        if (!filterValue) return true;
        
        const cellValue = String(row[columnKey] || '').toLowerCase();
        return cellValue.includes(filterValue.toLowerCase());
      });
    });
  }, [data, columnFilters]);

  // Get visible columns
  const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));

  // Get cell value with proper formatting
  const getCellValue = (row: any, columnKey: string) => {
    switch (columnKey) {
      case 'cost':
        return calculateCost(row);
      case 'severityGrade':
        const grade = row[columnKey];
        return grade ? (
          <Badge variant={grade === "0" ? "secondary" : grade >= "4" ? "destructive" : "default"}>
            Grade {grade}
          </Badge>
        ) : '';
      case 'adoptable':
        const adoptable = row[columnKey];
        return adoptable ? (
          <Badge variant={adoptable === "Yes" ? "default" : adoptable === "No" ? "destructive" : "secondary"}>
            {adoptable}
          </Badge>
        ) : '';
      case 'sectorType':
        return (
          <div className={`flex items-center gap-2 px-2 py-1 rounded text-sm font-medium ${
            currentSector.id === 'utilities' ? 'bg-blue-100 text-blue-800' :
            currentSector.id === 'adoption' ? 'bg-green-100 text-green-800' :
            currentSector.id === 'highways' ? 'bg-orange-100 text-orange-800' :
            currentSector.id === 'insurance' ? 'bg-red-100 text-red-800' :
            currentSector.id === 'construction' ? 'bg-purple-100 text-purple-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            <currentSector.icon className="h-3 w-3" />
            {row[columnKey]}
          </div>
        );
      default:
        return row[columnKey];
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border-2 ${
              currentSector.id === 'utilities' ? 'border-blue-500 bg-blue-50' :
              currentSector.id === 'adoption' ? 'border-green-500 bg-green-50' :
              currentSector.id === 'highways' ? 'border-orange-500 bg-orange-50' :
              currentSector.id === 'insurance' ? 'border-red-500 bg-red-50' :
              currentSector.id === 'construction' ? 'border-purple-500 bg-purple-50' :
              'border-yellow-500 bg-yellow-50'
            }`}>
              <currentSector.icon className={`h-4 w-4 ${currentSector.color}`} />
              <span className="font-medium text-slate-700">{currentSector.name} Sector</span>
            </div>
            <CardTitle>Section Inspection Data</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Column Visibility Controls */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.filter(col => col.hideable !== false).map((column) => (
                  <DropdownMenuItem
                    key={column.key}
                    className="flex items-center space-x-2"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Checkbox
                      checked={!hiddenColumns.has(column.key)}
                      onCheckedChange={() => toggleColumnVisibility(column.key)}
                    />
                    <span>{column.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Toggle */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-700">Column Filters</h4>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {visibleColumns.map((column) => (
                <div key={column.key} className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    {column.label}
                  </label>
                  <Input
                    placeholder={`Filter ${column.label.toLowerCase()}...`}
                    value={columnFilters[column.key] || ''}
                    onChange={(e) => updateFilter(column.key, e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {visibleColumns.map((column) => (
                  <th key={column.key} className="text-left p-3 text-sm font-medium text-slate-600">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="p-8 text-center text-slate-500">
                    {Object.keys(columnFilters).some(key => columnFilters[key]) 
                      ? "No data matches the current filters"
                      : "No data available"
                    }
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    {visibleColumns.map((column) => (
                      <td key={column.key} className="p-3 text-sm">
                        {getCellValue(row, column.key)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {filteredData.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              Showing {filteredData.length} of {data.length} sections
              {Object.keys(columnFilters).some(key => columnFilters[key]) && " (filtered)"}
            </span>
            <span>
              {hiddenColumns.size > 0 && `${hiddenColumns.size} columns hidden`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}