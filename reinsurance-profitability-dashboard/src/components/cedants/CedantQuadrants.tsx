import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, LabelList } from 'recharts';
import { AlertCircle, BarChart3, Download } from 'lucide-react';
import { CedantAnalytics } from '@/services/subscriptionService';

interface CedantQuadrantsProps {
  cedantId: string | null | 'multiple';
  analytics?: CedantAnalytics;
  loading?: boolean;
  error?: string;
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
  // Convertir en millions
  const millions = value / 1000000;
  return `${millions.toFixed(2)}M`;
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

const formatAxisNumber = (value: number) => {
  // Toujours afficher en millions
  return `${(value / 1000000).toFixed(2)}M`;
};

const CedantQuadrants: React.FC<CedantQuadrantsProps> = ({
  cedantId,
  analytics,
  loading = false,
  error
}) => {
  const [isLobModalOpen, setIsLobModalOpen] = useState(false);

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
    link.setAttribute('download', `lob_distribution_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (!cedantId) {
    console.log('🔍 Rendering: No cedant selected state');
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-h-[320px] md:min-h-[360px] glass-card">
            <CardContent className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                Sélectionnez des cédantes dans la barre de recherche
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (loading) {
    console.log('🔍 Rendering: Loading state');
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
    console.log('🔍 Rendering: Error state', error);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-h-[320px] md:min-h-[360px] glass-card">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 mb-2">
                  <AlertCircle className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    console.log('🔍 Rendering: No analytics state');
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-h-[320px] md:min-h-[360px] glass-card">
            <CardContent className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Aucune donnée disponible</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Préparer les données pour le graphique dual-axes
  const dualAxisData = analytics.annualSeries || [];

  // Préparer les données pour le mix contractuel (heatmap simplifiée)
  const contractMixData = (analytics.contractMix || []).reduce((acc, item) => {
    const key = `${item.segment}_${item.nature}`;
    acc[key] = item.premium;
    return acc;
  }, {} as Record<string, number>);

  const heatmapData = [
    { segment: 'FAC', PROP: contractMixData['FAC_PROP'] || 0, 'NON-PROP': contractMixData['FAC_NON-PROP'] || 0 },
    { segment: 'TRAITES', PROP: contractMixData['TRAITES_PROP'] || 0, 'NON-PROP': contractMixData['TRAITES_NON-PROP'] || 0 }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Cadre 1 - Tendances annuelles */}
      <Card className="min-h-[320px] md:min-h-[360px] glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            Tendances annuelles
          </CardTitle>
          <CardDescription>
            Évolution des primes et du ratio total (S/P + Commission) par année
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(analytics.annualSeries || []).length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Aucune donnée annuelle</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dualAxisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" orientation="left" tickFormatter={formatAxisNumber} />
                <YAxis yAxisId="right" orientation="right" />
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
                            Année {label} - Total: {data.total.toFixed(2)}%
                          </p>
                          <p style={{ margin: '4px 0', color: '#2563eb' }}>
                            S/P % : {data.sp.toFixed(2)}%
                          </p>
                          <p style={{ margin: '4px 0', color: '#1e40af' }}>
                            Commission % : {data.commission.toFixed(2)}%
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
                Répartition par LOB
              </CardTitle>
              <CardDescription>
                Distribution des primes par ligne d'affaires
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
                  <DialogTitle>Détails des LOB</DialogTitle>
                  <DialogDescription>
                    Distribution complète des primes par ligne d'affaires
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
                  label={(entry) => {
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

      {/* Cadre 3 - FAC/TRAITES × PROP/NON-PROP */}
      <Card className="min-h-[320px] md:min-h-[360px] glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            Mix contractuel
          </CardTitle>
          <CardDescription>
            Répartition FAC/TRAITES × Proportionnel/Non-proportionnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analytics.contractMix || analytics.contractMix.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Aucun contrat classé</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart 
                data={heatmapData} 
                margin={{ top: 10, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="segment" tick={{ fill: '#636e72' }} />
                <YAxis tick={{ fill: '#636e72' }} tickFormatter={formatAxisNumber} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const propValue = payload.find(p => p.dataKey === 'PROP')?.value || 0;
                      const nonPropValue = payload.find(p => p.dataKey === 'NON-PROP')?.value || 0;
                      
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
                            {label}
                          </p>
                          <p style={{ margin: '4px 0', color: BRAND_COLORS[0] }}>
                            Proportionnel : {(Number(propValue) / 1000000).toFixed(2)} MDH
                          </p>
                          <p style={{ margin: '4px 0', color: BRAND_COLORS[1] }}>
                            Non-proportionnel : {(Number(nonPropValue) / 1000000).toFixed(2)} MDH
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="PROP" stackId="a" fill={BRAND_COLORS[0]} name="Proportionnel" radius={[4, 4, 0, 0]} />
                <Bar dataKey="NON-PROP" stackId="a" fill={BRAND_COLORS[1]} name="Non-proportionnel" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Cadre 4 - Pays risques */}
      <Card className="min-h-[320px] md:min-h-[360px] glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">
            Pays risques
          </CardTitle>
          <CardDescription>
            Répartition par pays avec primes et S/P
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(analytics.riskCountries || []).length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Aucun pays risque trouvé</p>
            </div>
          ) : (
            <ScrollArea className="h-48">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead className="text-right">Primes</TableHead>
                    <TableHead className="text-right">S/P</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analytics.riskCountries || [])
                    .sort((a, b) => b.premium - a.premium)
                    .slice(0, 10)
                    .map((country, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{country.country}</TableCell>
                        <TableCell className="text-right">{formatCurrency(country.premium)}</TableCell>
                        <TableCell className="text-right">{formatPercentage(country.sp)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CedantQuadrants;
