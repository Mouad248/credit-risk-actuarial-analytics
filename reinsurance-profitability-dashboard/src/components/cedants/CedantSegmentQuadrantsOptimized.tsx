import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Database, TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, PieChart, Pie, Cell, LabelList } from 'recharts';
import { CedantSegmentQuadrantsProps, SortField, SortDirection, FilterConfig, PaginationConfig, ColumnConfig, ThemeMode } from '@/types/branchAnalytics';
import { CedantAnalytics } from '@/services/subscriptionService';
import { useBranchData } from '@/hooks/useBranchData';
import BranchTable from './BranchTable';
import BranchFilters from './BranchFilters';
import BranchPagination from './BranchPagination';

const BRAND_COLORS = [
  '#2563eb', // Bleu principal
  '#60a5fa', // Bleu clair  
  '#1e40af', // Bleu foncé
  '#2d3436', // Gris foncé
  '#636e72', // Gris
  '#dfe6e9', // Gris clair
  '#a29bfe', // Soft Purple
  '#74b9ff', // Soft Blue
  '#fd79a8', // Soft Pink
  '#fdcb6e'  // Soft Orange
];

const formatCurrency = (value: number) => {
  const millions = value / 1000000;
  return `${millions.toFixed(2)}M`;
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

const formatAxisNumber = (value: number) => {
  return `${(value / 1000000).toFixed(2)}M`;
};

/**
 * Composant principal optimisé pour l'analyse des branches
 * Avec séparation des responsabilités et optimisations de performance
 */
const CedantSegmentQuadrantsOptimized: React.FC<CedantSegmentQuadrantsProps> = ({
  cedantId,
  segment,
  analytics,
  loading = false,
  error,
  theme = 'light',
  onDataExport
}) => {
  const segmentLabel = segment === "TRAITES" ? "traités" : "facultatifs";
  
  // États pour la gestion du tri, filtres et pagination
  const [sortConfig, setSortConfig] = useState<{ field: SortField | null; direction: SortDirection }>({ 
    field: 'ratioTechnique', 
    direction: 'desc' 
  });
  const [filters, setFilters] = useState<FilterConfig>({
    searchTerm: '',
    selectedYear: 'all',
    selectedCedants: [],
    dateRange: { start: 2016, end: 2024 }
  });
  const [pagination, setPagination] = useState<PaginationConfig>({
    currentPage: 1,
    itemsPerPage: 100,
    totalItems: 0
  });

  // Configuration des colonnes du tableau
  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: 'lob',
      label: 'Branche',
      sortable: true,
      width: '200px',
      align: 'left',
      format: 'text'
    },
    {
      key: 'year',
      label: 'Année',
      sortable: true,
      width: '80px',
      align: 'right',
      format: 'number'
    },
    {
      key: 'epiMoyen',
      label: 'EPI moyen',
      sortable: true,
      width: '120px',
      align: 'right',
      format: 'currency'
    },
    {
      key: 'ssMoyen',
      label: 'S/P moyen',
      sortable: true,
      width: '120px',
      align: 'right',
      format: 'percentage'
    },
    {
      key: 'ratioTechnique',
      label: 'Ratio technique',
      sortable: true,
      width: '140px',
      align: 'right',
      format: 'percentage'
    }
  ], []);

  // Hook personnalisé pour la gestion des données
  const {
    processedData,
    paginatedData,
    globalStats,
    availableYears,
    loading: dataLoading,
    error: dataError,
    refreshData,
    clearCache
  } = useBranchData({
    analytics,
    filters,
    sortConfig,
    pagination,
    enableCache: true
  });

  // Mise à jour du total d'éléments
  React.useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalItems: processedData.length
    }));
  }, [processedData.length]);

  // Gestionnaires d'événements optimisés avec useCallback
  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        // Cycle: desc -> asc -> null -> desc
        if (prevConfig.direction === 'desc') return { field, direction: 'asc' };
        if (prevConfig.direction === 'asc') return { field, direction: null };
        return { field, direction: 'desc' };
      }
      return { field, direction: 'desc' };
    });
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleYearChange = useCallback((year: string) => {
    setFilters(prev => ({ ...prev, selectedYear: year }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      selectedYear: 'all',
      selectedCedants: [],
      dateRange: { start: 2016, end: 2024 }
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleItemsPerPageChange = useCallback((items: number) => {
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage: items, 
      currentPage: 1 
    }));
  }, []);

  // Fonction d'export CSV optimisée
  const handleExportCSV = useCallback(() => {
    const headers = ['Branche', 'Année', 'EPI moyen (M)', 'S/S moyen (%)', 'Ratio technique (%)', 'Tendance (%)'];
    const csvContent = [
      headers.join(','),
      ...processedData.map(item => [
        `"${item.lob}"`,
        item.year,
        item.epiMoyen > 0 ? (item.epiMoyen / 1000000).toFixed(2) : 'N/A',
        item.ssMoyen > 0 ? item.ssMoyen.toFixed(2) : 'N/A',
        item.ratioTechnique > 0 ? item.ratioTechnique.toFixed(2) : 'N/A',
        item.trend ? item.trend.percentage.toFixed(2) : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `branches_${segment}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Appeler le callback d'export si fourni
    if (onDataExport) {
      onDataExport(processedData, 'csv');
    }
  }, [processedData, segment, onDataExport]);

  // États de chargement et d'erreur
  if (!cedantId) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-h-[320px] md:min-h-[360px] glass-card">
            <CardContent className="flex items-center justify-center h-full">
              <p className="text-gray-600 text-center">
                Sélectionnez des cédantes dans la barre de recherche
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (loading || dataLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-h-[320px] md:min-h-[360px] glass-card">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || dataError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-h-[320px] md:min-h-[360px] glass-card">
            <CardContent className="flex items-center justify-center h-full">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || dataError || "Erreur lors du chargement des données"}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-h-[320px] md:min-h-[360px] glass-card">
            <CardContent className="flex items-center justify-center h-full">
              <p className="text-gray-600">Aucune donnée disponible</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Préparer les données pour les graphiques existants
  const dualAxisData = analytics.annualSeries || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Cadre 1 - Tendances annuelles */}
      <Card className="min-h-[320px] md:min-h-[360px] glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            Tendances annuelles ({segment})
          </CardTitle>
          <CardDescription>
            Évolution des primes et du ratio total (S/P + Commission) par année pour les {segmentLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(analytics.annualSeries || []).length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Aucune donnée annuelle</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={dualAxisData} margin={{ top: 10, right: 30, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fill: '#636e72' }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fill: '#636e72' }} tickFormatter={formatAxisNumber} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#636e72' }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          border: '1px solid rgba(124, 172, 57, 0.2)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                          padding: '12px',
                          fontSize: '14px'
                        }}>
                          <p style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>
                            Année {label} - Total: {data.total ? data.total.toFixed(2) + '%' : '0.00%'}
                          </p>
                          <p style={{ margin: '4px 0', color: '#2563eb' }}>
                            S/P % : {data.sp.toFixed(2)}%
                          </p>
                          <p style={{ margin: '4px 0', color: '#1e40af' }}>
                            Commission % : {data.commission ? data.commission.toFixed(2) + '%' : '0.00%'}
                          </p>
                          <p style={{ margin: '4px 0', color: '#000000' }}>
                            Primes : {(data.premium / 1000000).toFixed(2)}M
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                
                {/* Barres empilées S/P + Commission (en arrière-plan) */}
                <Bar yAxisId="right" dataKey="sp" stackId="ratios" fill={BRAND_COLORS[0]} name="S/P %" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="right" dataKey="commission" stackId="ratios" fill={BRAND_COLORS[2]} name="Commission %" radius={[2, 2, 0, 0]}>
                  <LabelList 
                    dataKey="total" 
                    position="top" 
                    formatter={(value) => `${Number(value).toFixed(2)}%`}
                    style={{ fontSize: '12px', fontWeight: 'bold', fill: '#374151' }}
                  />
                </Bar>
                
                {/* Ligne des primes (au premier plan) */}
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="premium" 
                  stroke="#000000" 
                  strokeWidth={4}
                  name="Primes"
                  dot={{ fill: "#000000", strokeWidth: 3, r: 5 }}
                  activeDot={{ fill: "#000000", strokeWidth: 3, r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Cadre 2 - Répartition par LOB */}
      <Card className="min-h-[320px] md:min-h-[360px] glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            Répartition par LOB ({segment})
          </CardTitle>
          <CardDescription>
            Distribution des primes par ligne d'affaires pour les {segmentLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(analytics.lobDistribution || []).length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Aucune LOB pour cette cédante</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={(analytics.lobDistribution || []).slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="premium"
                  label={(entry) => {
                    const percent = entry.percent || 0;
                    return percent >= 0.05 ? `${entry.lob}: ${(percent * 100).toFixed(0)}%` : '';
                  }}
                  labelLine={false}
                >
                  {(analytics.lobDistribution || []).slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    formatCurrency(Number(value)), 
                    props.payload?.lob || 'Prime'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderColor: 'rgba(124, 172, 57, 0.2)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Cadre 3-4 - Tableau des branches optimisé (occupe 2 colonnes) */}
      <Card className="min-h-[320px] md:min-h-[360px] glass-card col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            Analyse des branches ({segment})
          </CardTitle>
          <CardDescription>
            Données détaillées par branche avec EPI moyen, S/S moyen et ratio technique
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                  <Database className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Aucune donnée de branche</h3>
                  <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Aucune donnée de branche n'est disponible pour cette cédante et ce segment.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1 max-w-sm">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-3 h-3" />
                    <span>Vérifiez que la cédante a des données pour ce segment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-3 h-3" />
                    <span>Les données peuvent être en cours de traitement</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filtres et contrôles */}
              <BranchFilters
                searchTerm={filters.searchTerm}
                selectedYear={filters.selectedYear}
                availableYears={availableYears}
                onSearchChange={handleSearchChange}
                onYearChange={handleYearChange}
                onClearFilters={handleClearFilters}
                globalStats={globalStats}
                theme={theme}
              />

              {/* Tableau optimisé */}
              <BranchTable
                data={paginatedData}
                columns={columns}
                sortConfig={sortConfig}
                onSort={handleSort}
                loading={dataLoading}
                theme={theme}
                showTooltips={true}
                enableAnimations={true}
              />

              {/* Pagination */}
              {processedData.length > pagination.itemsPerPage && (
                <BranchPagination
                  config={pagination}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  theme={theme}
                />
              )}

              {/* Bouton d'export */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exporter CSV</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CedantSegmentQuadrantsOptimized;
