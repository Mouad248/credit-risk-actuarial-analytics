import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, PieChart, Pie, Cell, LabelList } from 'recharts';
import { AlertCircle, RefreshCw, Database, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Search, Download, Filter, BarChart3 } from 'lucide-react';
import { CedantAnalytics } from '@/services/subscriptionService';

interface CedantSegmentQuadrantsProps {
  cedantId: string | null | 'multiple';
  segment: "TRAITES" | "FAC";
  analytics?: CedantAnalytics;
  loading?: boolean;
  error?: string;
  selectedBranch?: string;
}

type SortField = 'lob' | 'insuredName' | 'year' | 'epiMoyen' | 'ssMoyen' | 'ratioTechnique' | 'sp2016' | 'sp2017' | 'sp2018' | 'sp2019' | 'sp2020' | 'sp2021' | 'sp2022' | 'sp2023' | 'sp2024';
type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

interface BranchData {
  lob: string;
  insuredName: string;
  year: number;
  epiMoyen: number;
  ssMoyen: number;
  ratioTechnique: number;
  originalIndex: number;
  // S/P par année (2016-2024)
  sp2016: number;
  sp2017: number;
  sp2018: number;
  sp2019: number;
  sp2020: number;
  sp2021: number;
  sp2022: number;
  sp2023: number;
  sp2024: number;
}

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
  // Convertir en millions avec 2 décimales
  const millions = value / 1000000;
  return `${millions.toFixed(2)}M`;
};

const formatPercentage = (value: number) => {
  // Formatage en pourcentage avec 2 décimales
  return `${value.toFixed(2)}%`;
};

const formatEPI = (value: number | null | undefined) => {
  // Formatage EPI en millions avec 2 décimales
  // null/undefined = pas de données → N/A
  // 0 = données avec primes nulles → 0.00M
  if (value === null || value === undefined) return 'N/A';
  const millions = value / 1000000;
  return `${millions.toFixed(2)}M`;
};

const formatRatio = (value: number | null | undefined) => {
  // Formatage des ratios avec 2 décimales
  // null/undefined = pas de données → N/A
  // 0 = données avec S/P = 0% → 0.00%
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(2)}%`;
};

// Fonction pour calculer le ratio technique selon la formule métier
const calculateTechnicalRatio = (
  claims: number,
  claimReserves: number,
  brokerage: number,
  otherCharges: number,
  overriderCommission: number,
  commission: number,
  epi: number
): number => {
  if (epi <= 0) return 0;
  
  const totalCharges = claims + claimReserves + brokerage + otherCharges + overriderCommission + commission;
  return (totalCharges / epi) * 100;
};

const formatAxisNumber = (value: number) => {
  // Toujours afficher en millions
  return `${(value / 1000000).toFixed(2)}M`;
};

const formatMDH = (value: number) => {
  // Convertir en millions avec 2 décimales
  return `${(value / 1000000).toFixed(2)}M`;
};

// Fonction pour exporter les données en CSV
const exportToCSV = (data: BranchData[], filename: string, segment: "TRAITES" | "FAC") => {
  const headers = [
    segment === 'FAC' ? 'Nom de l\'assuré' : 'Branche', 
    'EPI moyen (M)', 
    'S/P moyen (%)', 
    'Ratio technique (%)',
    'S/P 2016 (%)',
    'S/P 2017 (%)',
    'S/P 2018 (%)',
    'S/P 2019 (%)',
    'S/P 2020 (%)',
    'S/P 2021 (%)',
    'S/P 2022 (%)',
    'S/P 2023 (%)',
    'S/P 2024 (%)'
  ];
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      `"${segment === 'FAC' ? item.insuredName : item.lob}"`,
      item.epiMoyen !== null && item.epiMoyen !== undefined ? (item.epiMoyen / 1000000).toFixed(2) : 'N/A',
      item.ssMoyen !== null && item.ssMoyen !== undefined ? item.ssMoyen.toFixed(2) : 'N/A',
      item.ratioTechnique !== null && item.ratioTechnique !== undefined ? item.ratioTechnique.toFixed(2) : 'N/A',
      item.sp2016 !== null && item.sp2016 !== undefined ? item.sp2016.toFixed(2) : 'N/A',
      item.sp2017 !== null && item.sp2017 !== undefined ? item.sp2017.toFixed(2) : 'N/A',
      item.sp2018 !== null && item.sp2018 !== undefined ? item.sp2018.toFixed(2) : 'N/A',
      item.sp2019 !== null && item.sp2019 !== undefined ? item.sp2019.toFixed(2) : 'N/A',
      item.sp2020 !== null && item.sp2020 !== undefined ? item.sp2020.toFixed(2) : 'N/A',
      item.sp2021 !== null && item.sp2021 !== undefined ? item.sp2021.toFixed(2) : 'N/A',
      item.sp2022 !== null && item.sp2022 !== undefined ? item.sp2022.toFixed(2) : 'N/A',
      item.sp2023 !== null && item.sp2023 !== undefined ? item.sp2023.toFixed(2) : 'N/A',
      item.sp2024 !== null && item.sp2024 !== undefined ? item.sp2024.toFixed(2) : 'N/A'
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Fonction pour obtenir l'icône de tri
const getSortIcon = (field: SortField, sortConfig: SortConfig) => {
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
};

const CedantSegmentQuadrants: React.FC<CedantSegmentQuadrantsProps> = ({
  cedantId,
  segment,
  analytics,
  loading = false,
  error,
  selectedBranch
}) => {
  const segmentLabel = segment === "TRAITES" ? "traités" : "facultatifs";
  
  // États pour la gestion du tri, filtres et pagination
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'ratioTechnique', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLobModalOpen, setIsLobModalOpen] = useState(false);
  const itemsPerPage = 100;

  // Fonction pour exporter les LOB en CSV
  const exportLobToCSV = () => {
    if (!analytics?.lobDistribution) return;
    
    const total = analytics.lobDistribution.reduce((sum, lob) => sum + lob.premium, 0);
    const headers = ['LOB', 'Montant (MDH)', 'Pourcentage (%)'];
    const csvContent = [
      headers.join(','),
      ...analytics.lobDistribution.map((lob, index) => {
        const millions = lob.premium / 1000000;
        const percentage = (lob.premium / total) * 100;
        return `"${lob.lob}",${millions.toFixed(2)},${percentage.toFixed(2)}`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lob_distribution_${segment}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour gérer le tri
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => {
      if (prevConfig.field === field) {
        // Cycle: desc -> asc -> null -> desc
        if (prevConfig.direction === 'desc') return { field, direction: 'asc' };
        if (prevConfig.direction === 'asc') return { field, direction: null };
        return { field, direction: 'desc' };
      }
      return { field, direction: 'desc' };
    });
  };

  // Fonction pour traiter et filtrer les données
  const processedData = useMemo(() => {
    
    // Utiliser les données réelles des branchAnalytics depuis le backend
    if (analytics?.branchAnalytics && analytics.branchAnalytics.length > 0) {
      const data: BranchData[] = analytics.branchAnalytics.map((branch, index) => ({
        lob: branch.branchName,
        insuredName: branch.insuredName,
        year: 0,  // Ne pas afficher l'année
        epiMoyen: branch.epiMoyen,
        ssMoyen: branch.ssMoyen,
        ratioTechnique: branch.ratioTechnique,
        originalIndex: index,
        sp2016: branch.sp2016,
        sp2017: branch.sp2017,
        sp2018: branch.sp2018,
        sp2019: branch.sp2019,
        sp2020: branch.sp2020,
        sp2021: branch.sp2021,
        sp2022: branch.sp2022,
        sp2023: branch.sp2023,
        sp2024: branch.sp2024
      }));
      
      // Appliquer les filtres sur les données réelles
      let filteredData = data;
    
      // Filtre par recherche
      if (searchTerm) {
        filteredData = filteredData.filter(item => 
          (item.lob && item.lob.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.insuredName && item.insuredName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Appliquer le tri
      if (sortConfig.field && sortConfig.direction) {
        filteredData.sort((a, b) => {
          const aValue = a[sortConfig.field!];
          const bValue = b[sortConfig.field!];
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' 
              ? aValue - bValue
              : bValue - aValue;
          }
          
          return 0;
        });
      }

      return filteredData;
    }
    
    // Pas de données branchAnalytics disponibles
    return [];
  }, [analytics, searchTerm, sortConfig]);

  // Données paginées
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  // Fonction pour exporter en CSV
  const handleExportCSV = () => {
    const filename = `${segment === 'FAC' ? 'assures' : 'branches'}_${segment}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(processedData, filename, segment);
  };

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

  if (loading) {
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

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-h-[320px] md:min-h-[360px] glass-card">
            <CardContent className="flex items-center justify-center h-full">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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

  // Préparer les données pour le graphique dual-axes  
  const dualAxisData = analytics?.annualSeries || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Cadre 1 - Tendances annuelles */}
      <Card className="min-h-[320px] md:min-h-[360px] glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            {segment === 'FAC' ? 'Tendances annuelles (FAC)' : `Tendances annuelles (${segment})`}
          </CardTitle>
          <CardDescription>
            {segment === 'FAC' 
              ? 'Évolution des primes par année pour les facultatifs'
              : `Évolution des primes et du ratio total (S/P + Commission) par année pour les ${segmentLabel}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(analytics.annualSeries || []).length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Aucune donnée annuelle</p>
            </div>
          ) : segment === 'FAC' ? (
            /* BarChart pour FAC - Primes uniquement */
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dualAxisData} margin={{ top: 10, right: 30, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#636e72' }} 
                  tickFormatter={(tickItem, index) => {
                    // Afficher uniquement les années paires : 2016, 2018, 2020, 2022, 2024
                    return tickItem % 2 === 0 ? tickItem.toString() : '';
                  }}
                />
                <YAxis 
                  tick={{ fill: '#636e72' }} 
                  tickFormatter={(value) => formatMDH(value)}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  content={({ active, payload, label }: any) => {
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
                            Année {label}
                          </p>
                          <p style={{ margin: '4px 0', color: '#2563eb' }}>
                            Primes: {formatMDH(data.premium)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="premium" 
                  fill={BRAND_COLORS[0]} 
                  name="Primes"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* ComposedChart pour TRAITES - Original */
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={dualAxisData} margin={{ top: 10, right: 30, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fill: '#636e72' }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fill: '#636e72' }} tickFormatter={formatAxisNumber} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#636e72' }} />
                <Tooltip 
                  content={({ active, payload, label }: any) => {
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
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-medium text-gray-800">
                Répartition par LOB ({segment})
              </CardTitle>
              <CardDescription>
                Distribution des primes par ligne d'affaires pour les {segmentLabel}
              </CardDescription>
            </div>
            <Dialog open={isLobModalOpen} onOpenChange={setIsLobModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Détails
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Détails des LOB - {segment}</DialogTitle>
                  <DialogDescription>
                    Distribution complète des primes par ligne d'affaires pour les {segmentLabel}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Ligne d'affaires (LOB)</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Pourcentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(analytics?.lobDistribution || []).map((lob, index) => {
                        const total = analytics?.lobDistribution?.reduce((sum, l) => sum + l.premium, 0) || 1;
                        const percentage = (lob.premium / total) * 100;
                        const millions = lob.premium / 1000000;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div 
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length] }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{lob.lob}</TableCell>
                            <TableCell className="text-right font-mono">
                              {millions.toFixed(2)} MDH
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {percentage.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportLobToCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exporter CSV
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsLobModalOpen(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {(analytics.lobDistribution || []).length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Aucune LOB pour cette cédante</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={analytics.lobDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="premium"
                  label={(entry: any) => {
                    const percent = entry.percent || 0;
                    return percent >= 0.05 ? `${entry.lob}: ${(percent * 100).toFixed(0)}%` : '';
                  }}
                  labelLine={false}
                >
                  {(analytics.lobDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => {
                    const premium = Number(value);
                    const millions = premium / 1000000;
                    const total = analytics.lobDistribution?.reduce((sum, lob) => sum + lob.premium, 0) || 1;
                    const percentage = (premium / total) * 100;
                    return [
                      `${millions.toFixed(2)} MDH (${percentage.toFixed(2)}%)`,
                      props.payload?.lob || 'Prime'
                    ];
                  }}
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

      {/* Cadre 3-4 - Tableau des branches (occupe 2 colonnes) */}
      <Card className="min-h-[320px] md:min-h-[360px] glass-card col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            {segment === 'FAC' ? `Analyse des assurés (${segment})` : `Analyse des branches (${segment})`}
          </CardTitle>
          <CardDescription>
            {segment === 'FAC' 
              ? 'Données détaillées par assuré avec EPI moyen, S/P moyen et ratio technique'
              : 'Données détaillées par branche avec EPI moyen, S/P moyen et ratio technique'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">
                  {segment === 'FAC' ? 'Chargement des données des assurés...' : 'Chargement des données des branches...'}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-18" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Alert variant="destructive" className="w-full max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Erreur lors du chargement des données</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {error || (segment === 'FAC' ? "Impossible de récupérer les données des assurés" : "Impossible de récupérer les données des branches")}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réessayer
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : !analytics || (analytics.lobDistribution || []).length === 0 ? (
            /* Empty State */
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
            /* Data State */
            <div className="space-y-4">
              {/* Header avec contrôles */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">
                    {processedData.length} branche{processedData.length > 1 ? 's' : ''} trouvée{processedData.length > 1 ? 's' : ''}
                  </span>
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Filtré: "{searchTerm}"
                    </Badge>
                  )}
                </div>
                
                {/* Contrôles de filtrage et export */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Recherche */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher une branche..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full sm:w-64"
                    />
                  </div>
                  
                  {/* Export CSV */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>

              {/* Tableau avec scroll horizontal et vertical */}
              <div className="border rounded-lg overflow-auto max-h-80">
                <Table className="min-w-full">
                    <TableHeader className="sticky top-0 bg-white z-10 border-b">
                      <TableRow className="bg-gray-50">
                        <TableHead 
                          className="font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-48"
                          onClick={() => handleSort(segment === 'FAC' ? 'insuredName' : 'lob')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{segment === 'FAC' ? 'Nom de l\'assuré' : 'Branche'}</span>
                            {getSortIcon(segment === 'FAC' ? 'insuredName' : 'lob', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-32"
                          onClick={() => handleSort('epiMoyen')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>EPI moyen</span>
                            {getSortIcon('epiMoyen', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-28"
                          onClick={() => handleSort('ssMoyen')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P moyen</span>
                            {getSortIcon('ssMoyen', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-32"
                          onClick={() => handleSort('ratioTechnique')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>Ratio technique</span>
                            {getSortIcon('ratioTechnique', sortConfig)}
                          </div>
                        </TableHead>
                        {/* Colonnes S/P par année */}
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2016')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2016</span>
                            {getSortIcon('sp2016', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2017')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2017</span>
                            {getSortIcon('sp2017', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2018')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2018</span>
                            {getSortIcon('sp2018', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2019')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2019</span>
                            {getSortIcon('sp2019', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2020')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2020</span>
                            {getSortIcon('sp2020', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2021')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2021</span>
                            {getSortIcon('sp2021', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2022')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2022</span>
                            {getSortIcon('sp2022', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2023')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2023</span>
                            {getSortIcon('sp2023', sortConfig)}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 select-none w-24"
                          onClick={() => handleSort('sp2024')}
                        >
                          <div className="flex items-center justify-end space-x-1">
                            <span>S/P 2024</span>
                            {getSortIcon('sp2024', sortConfig)}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item) => {
                        // Couleur conditionnelle pour le ratio technique avec thème de l'application
                        const getRatioColor = (ratio: number) => {
                          if (ratio >= 95) return "text-green-600"; // Bleu principal
                          if (ratio >= 90) return "text-green-500"; // Bleu clair
                          if (ratio >= 85) return "text-yellow-600"; // Warning
                          if (ratio >= 80) return "text-orange-500"; // Caution
                          return "text-red-500"; // Danger
                        };
                        
                        // Fonction pour obtenir la couleur des S/P
                        const getSPColor = (sp: number | null | undefined) => {
                          if (sp === null || sp === undefined) return "text-gray-400"; // Pas de données
                          if (sp < 100) return "text-green-600"; // Bon (vert) - inclut 0%
                          if (sp < 120) return "text-yellow-600"; // Moyen (jaune)
                          return "text-red-500"; // Mauvais (rouge)
                        };

                        return (
                          <TableRow key={item.originalIndex} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900 w-48">
                              {segment === 'FAC' ? item.insuredName : item.lob}
                            </TableCell>
                            <TableCell className="text-right font-mono text-gray-700 w-32">
                              {formatEPI(item.epiMoyen)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-gray-700 w-28">
                              {formatRatio(item.ssMoyen)}
                            </TableCell>
                            <TableCell className={`text-right font-semibold font-mono w-32 ${getRatioColor(item.ratioTechnique)}`}>
                              {formatRatio(item.ratioTechnique)}
                            </TableCell>
                            {/* Cellules S/P par année */}
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2016)}`}>
                              {formatRatio(item.sp2016)}
                            </TableCell>
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2017)}`}>
                              {formatRatio(item.sp2017)}
                            </TableCell>
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2018)}`}>
                              {formatRatio(item.sp2018)}
                            </TableCell>
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2019)}`}>
                              {formatRatio(item.sp2019)}
                            </TableCell>
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2020)}`}>
                              {formatRatio(item.sp2020)}
                            </TableCell>
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2021)}`}>
                              {formatRatio(item.sp2021)}
                            </TableCell>
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2022)}`}>
                              {formatRatio(item.sp2022)}
                            </TableCell>
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2023)}`}>
                              {formatRatio(item.sp2023)}
                            </TableCell>
                            <TableCell className={`text-right font-mono w-24 ${getSPColor(item.sp2024)}`}>
                              {formatRatio(item.sp2024)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {processedData.length > itemsPerPage && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, processedData.length)} sur {processedData.length} résultats
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} sur {Math.ceil(processedData.length / itemsPerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(processedData.length / itemsPerPage)))}
                      disabled={currentPage >= Math.ceil(processedData.length / itemsPerPage)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CedantSegmentQuadrants;
