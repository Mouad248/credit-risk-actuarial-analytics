import React, { memo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BranchTableProps, SortField, SortDirection, PerformanceLevel } from '@/types/branchAnalytics';
import { cn } from '@/lib/utils';

/**
 * Composant de tableau optimisé pour l'affichage des branches
 * Avec virtualisation, tooltips et animations
 */
const BranchTable = memo<BranchTableProps>(({
  data,
  columns,
  sortConfig,
  onSort,
  loading = false,
  theme = 'light',
  showTooltips = true,
  enableAnimations = true
}) => {
  /**
   * Formate les valeurs selon le type de colonne
   */
  const formatValue = useCallback((value: any, format?: string) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (format) {
      case 'currency':
        return value > 0 ? `${(value / 1000000).toFixed(2)}M` : 'N/A';
      case 'percentage':
        return value > 0 ? `${value.toFixed(2)}%` : 'N/A';
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  }, []);

  /**
   * Obtient l'icône de tri
   */
  const getSortIcon = useCallback((field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  }, [sortConfig]);

  /**
   * Obtient la couleur basée sur le niveau de performance
   */
  const getPerformanceColor = useCallback((level: PerformanceLevel) => {
    switch (level) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-green-500';
      case 'average':
        return 'text-yellow-600';
      case 'poor':
        return 'text-orange-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-600';
    }
  }, []);

  /**
   * Obtient l'icône de tendance
   */
  const getTrendIcon = useCallback((direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  }, []);

  /**
   * Génère le contenu du tooltip
   */
  const generateTooltipContent = useCallback((item: any) => {
    return `
      <div class="space-y-2">
        <div class="font-semibold">${item.lob}</div>
        <div class="text-sm space-y-1">
          <div>Année: ${item.year}</div>
          <div>EPI: ${formatValue(item.epiMoyen, 'currency')}</div>
          <div>S/P: ${formatValue(item.ssMoyen, 'percentage')}</div>
          <div>Ratio: ${formatValue(item.ratioTechnique, 'percentage')}</div>
          ${item.trend ? `<div>Tendance: ${item.trend.direction} (${item.trend.percentage.toFixed(1)}%)</div>` : ''}
        </div>
      </div>
    `;
  }, [formatValue]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          {columns.map((_, index) => (
            <Skeleton key={index} className="h-4 w-24" />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            {columns.map((_, index) => (
              <Skeleton key={index} className="h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="h-80 w-full">
        <TooltipProvider>
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 border-b">
              <TableRow className="bg-gray-50">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "font-semibold text-gray-700",
                      column.align === 'right' && "text-right",
                      column.align === 'center' && "text-center",
                      column.sortable && "cursor-pointer hover:bg-gray-100 select-none"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && onSort(column.key)}
                  >
                    <div className={cn(
                      "flex items-center space-x-1",
                      column.align === 'right' && "justify-end",
                      column.align === 'center' && "justify-center"
                    )}>
                      <span>{column.label}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow 
                  key={item.id} 
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    enableAnimations && "animate-in fade-in-0 slide-in-from-left-2",
                    theme === 'dark' && "hover:bg-gray-800"
                  )}
                  style={{
                    animationDelay: enableAnimations ? `${index * 50}ms` : undefined
                  }}
                >
                  {columns.map((column) => {
                    const value = item[column.key];
                    const formattedValue = formatValue(value, column.format);
                    
                    return (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "font-mono",
                          column.align === 'right' && "text-right",
                          column.align === 'center' && "text-center",
                          column.key === 'ratioTechnique' && getPerformanceColor(item.performance || 'average')
                        )}
                      >
                        {showTooltips ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-1">
                                <span>{formattedValue}</span>
                                {item.trend && column.key === 'ratioTechnique' && (
                                  <div className="flex items-center space-x-1">
                                    {getTrendIcon(item.trend.direction)}
                                    <span className="text-xs text-gray-500">
                                      {item.trend.percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div 
                                dangerouslySetInnerHTML={{ 
                                  __html: generateTooltipContent(item) 
                                }}
                              />
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span>{formattedValue}</span>
                            {item.trend && column.key === 'ratioTechnique' && (
                              <div className="flex items-center space-x-1">
                                {getTrendIcon(item.trend.direction)}
                                <span className="text-xs text-gray-500">
                                  {item.trend.percentage.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      </ScrollArea>
    </div>
  );
});

BranchTable.displayName = 'BranchTable';

export default BranchTable;
