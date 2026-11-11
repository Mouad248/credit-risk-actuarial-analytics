import { useQuery } from '@tanstack/react-query';
import { TrendingUp, BarChart2, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KPICard from '@/components/dashboard/KPICard';
import ChartCard from '@/components/dashboard/ChartCard';
import BackgroundAnimation from '@/components/animations/BackgroundAnimation';
import InteractiveMap from '@/components/maps/InteractiveMap';
import AnnualTrendChart from '@/components/subscription/AnnualTrendChart';
import FiltersPanel from '@/components/subscription/FiltersPanel';
import CedantTables from '@/components/subscription/CedantTables';
import RegionalComparisonChart from '@/components/subscription/RegionalComparisonChart';
import { useSubscriptionData } from '@/services/subscriptionService';
import { toast } from '@/components/ui/use-toast';


// Affiche "n.d." lorsque le ratio n'est pas défini (dénominateur nul) plutôt qu'un faux 0 %
const fmtRatio = (v: number | null | undefined): string => (v === null || v === undefined ? 'n.d.' : v.toFixed(1));
const fmtPct = (v: number | null | undefined): string => (v === null || v === undefined ? 'n.d.' : `${v.toFixed(1)}%`);

const Subscription = () => {
  const { 
    filteredData, 
    loading, 
    error, 
    filters,
    handleRegionClick 
  } = useSubscriptionData();

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="glass-card p-8">
          <h2 className="text-xl font-medium text-brand-gray-dark mb-4">Chargement des données...</h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-brand-primary h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="glass-card p-8">
          <h2 className="text-xl font-medium text-red-600 mb-4">Erreur de chargement</h2>
          <p className="text-brand-gray mb-4">Impossible de charger les données. Veuillez réessayer plus tard.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-brand-primary text-white px-4 py-2 rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!filteredData) return null;

  return (
    <div className="min-h-screen pt-20">
      <BackgroundAnimation />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold text-brand-gray-dark mb-6">
          Rentabilité de la Souscription
        </h1>
        
        <FiltersPanel
          region={filters.region}
          setRegion={filters.setRegion}
          productType={filters.productType}
          setProductType={filters.setProductType}
          businessType={filters.businessType}
          setBusinessType={filters.setBusinessType}
          lineOfBusiness={filters.lineOfBusiness}
          setLineOfBusiness={filters.setLineOfBusiness}
          linesOfBusiness={filteredData.linesOfBusiness}
        />
        
        {/* Section KPIs avec Tabs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Indicateurs de Performance</CardTitle>
            <CardDescription>
              Vue d'ensemble des ratios techniques et du chiffre d'affaires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="global" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="global" className="text-base">
                  Vue Globale
                </TabsTrigger>
                <TabsTrigger value="segments" className="text-base">
                  Par Segment
                </TabsTrigger>
                <TabsTrigger value="ca" className="text-base">
                  Chiffre d'Affaires
                </TabsTrigger>
              </TabsList>
              
              {/* TAB 1: Vue Globale */}
              <TabsContent value="global" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KPICard
                    title="Ratio Technique Global"
                    value={fmtRatio(filteredData.kpis.combined.value)}
                    unit="%"
                    icon={<BarChart2 className="h-6 w-6 text-brand-primary-dark" />}
                    description="Total des coûts / Primes"
                  />
                  <KPICard
                    title="Rentabilité Globale"
                    value={fmtRatio(filteredData.kpis.profitability.value)}
                    unit="%"
                    icon={<TrendingUp className="h-6 w-6 text-brand-primary-dark" />}
                    description="Marge nette après charges"
                  />
                  <KPICard
                    title="Volume CA Total"
                    value={filteredData.kpis.ca_volume.value.toFixed(1)}
                    unit="M MAD"
                    icon={<PieChart className="h-6 w-6 text-brand-primary-dark" />}
                    description="Primes totales encaissées"
                  />
                </div>
                
                {/* Carte supplémentaire pour CA Global */}
                <div className="mt-4">
                  <div className="glass-card p-6 border border-brand-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-brand-gray mb-1">Chiffre d'Affaires Global</p>
                        <p className="text-4xl font-bold text-brand-gray-dark">
                          {filteredData.kpis.ca_global.value.toFixed(1)} <span className="text-2xl">M MAD</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-brand-gray mb-1">Toutes branches confondues</p>
                        <p className="text-lg text-brand-primary-dark font-semibold">Période 2016-2024</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* TAB 2: Par Segment */}
              <TabsContent value="segments" className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-brand-gray-dark mb-3">
                    Ratios Techniques par Branche
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KPICard
                      title="Vie"
                      value={fmtRatio(filteredData.kpis.life.value)}
                      unit="%"
                      icon={<BarChart2 className="h-6 w-6 text-brand-primary-dark" />}
                      description="Ratio technique Vie"
                    />
                    <KPICard
                      title="Non-Vie"
                      value={fmtRatio(filteredData.kpis.nonLife.value)}
                      unit="%"
                      icon={<BarChart2 className="h-6 w-6 text-brand-primary-dark" />}
                      description="Ratio technique Non-Vie"
                    />
                    <KPICard
                      title="Santé"
                      value={fmtRatio(filteredData.kpis.health.value)}
                      unit="%"
                      icon={<BarChart2 className="h-6 w-6 text-brand-primary-dark" />}
                      description="Ratio technique Santé"
                    />
                  </div>
                </div>
                
                {/* Note explicative */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Le ratio technique mesure l'efficacité opérationnelle. 
                    Un ratio inférieur à 100% indique une activité rentable avant frais financiers.
                  </p>
                </div>
              </TabsContent>
              
              {/* TAB 3: Chiffre d'Affaires */}
              <TabsContent value="ca" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KPICard
                    title="CA Vie"
                    value={filteredData.kpis.ca_life.value.toFixed(1)}
                    unit="M MAD"
                    icon={<BarChart2 className="h-6 w-6 text-brand-primary-dark" />}
                    description="Chiffre d'affaires Vie"
                  />
                  <KPICard
                    title="CA Non-Vie"
                    value={filteredData.kpis.ca_non_life.value.toFixed(1)}
                    unit="M MAD"
                    icon={<BarChart2 className="h-6 w-6 text-brand-primary-dark" />}
                    description="Chiffre d'affaires Non-Vie"
                  />
                  <KPICard
                    title="CA Santé"
                    value={filteredData.kpis.ca_health.value.toFixed(1)}
                    unit="M MAD"
                    icon={<BarChart2 className="h-6 w-6 text-brand-primary-dark" />}
                    description="Chiffre d'affaires Santé"
                  />
                </div>
                
                {/* Graphique de répartition */}
                <div className="mt-6 p-6 glass-card border border-brand-primary/20">
                  <h4 className="text-lg font-semibold text-brand-gray-dark mb-4">
                    Répartition du Chiffre d'Affaires
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-brand-gray">Vie</span>
                      <div className="flex items-center gap-3 flex-1 mx-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-brand-primary h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${filteredData.kpis.ca_global.value > 0 ? (filteredData.kpis.ca_life.value / filteredData.kpis.ca_global.value * 100).toFixed(1) : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-brand-gray-dark min-w-[60px] text-right">
                          {filteredData.kpis.ca_global.value > 0 ? (filteredData.kpis.ca_life.value / filteredData.kpis.ca_global.value * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-brand-gray">Non-Vie</span>
                      <div className="flex items-center gap-3 flex-1 mx-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${filteredData.kpis.ca_global.value > 0 ? (filteredData.kpis.ca_non_life.value / filteredData.kpis.ca_global.value * 100).toFixed(1) : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-brand-gray-dark min-w-[60px] text-right">
                          {filteredData.kpis.ca_global.value > 0 ? (filteredData.kpis.ca_non_life.value / filteredData.kpis.ca_global.value * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-brand-gray">Santé</span>
                      <div className="flex items-center gap-3 flex-1 mx-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: "0%" }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-brand-gray-dark min-w-[60px] text-right">
                          0.0%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Répartition géographique de la rentabilité</CardTitle>
            <CardDescription>
              Visualisation de la rentabilité par région. Cliquez sur une région pour afficher plus de détails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveMap 
              data={filteredData.regions} 
              onRegionClick={(region) => handleRegionClick(region.id)}
              selectedRegion={filters.region}
            />
          </CardContent>
        </Card>
        
        <Tabs defaultValue="evolution" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="evolution">Évolution temporelle</TabsTrigger>
            <TabsTrigger value="comparison">Comparaison par région</TabsTrigger>
            <TabsTrigger value="distribution">Répartition par produit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="evolution">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnnualTrendChart 
                data={filteredData.annualPerformance}
                title="Évolution de la rentabilité et du chiffre d'affaires"
                subtitle="Tendance de la rentabilité et croissance du CA sur 9 ans (2016-2024)"
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Analyse de tendance</CardTitle>
                  <CardDescription>
                    Aperçu des facteurs influençant la rentabilité et l'évolution du chiffre d'affaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Points clés</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Ratio technique calculé sur la période 2016-2024 : {fmtPct(filteredData.kpis.combined.value)}</li>
                        <li>Performance Vie sur la période : {fmtPct(filteredData.kpis.life.value)}</li>
                        <li>Performance Non-Vie sur la période : {fmtPct(filteredData.kpis.nonLife.value)}</li>
                        <li>Croissance forte sur le marché marocain et africain</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Facteurs d'impact</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Amélioration de la sélection des risques</li>
                        <li>Optimisation de la politique de tarification</li>
                        <li>Diversification du portefeuille</li>
                        <li>Réduction des coûts administratifs</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Métriques expliquées</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Rentabilité :</strong> Calculée comme (Primes - Sinistres - Provisions) / Primes</li>
                        <li><strong>Croissance CA :</strong> Variation annuelle du volume de primes (LAST_EPI_N)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="comparison">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RegionalComparisonChart
                data={filteredData.regionalPerformance}
                title="Performance par région"
                subtitle="Comparaison des segments d'activité"
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Analyse régionale</CardTitle>
                  <CardDescription>
                    Comparaison des performances par zone géographique
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Marchés performants</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Maroc: leader avec 16.2% de rentabilité moyenne</li>
                        <li>Afrique (hors Maroc): forte croissance à 12.8%</li>
                        <li>Moyen-Orient: progression régulière à 8.4%</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Défis régionaux</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Amériques: difficultés persistantes (-2.1%)</li>
                        <li>Asie: croissance modérée mais stable (5.2%)</li>
                        <li>Europe: performance satisfaisante mais concurrence intense (7.9%)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Répartition par type de produit"
                subtitle="Part de chaque segment dans le portefeuille"
                type="pie"
                data={filteredData.productTypes}
                dataKey="value"
                categories="name"
              />
              
              <ChartCard
                title="Répartition par type d'affaires"
                subtitle="Traités vs Facultatives"
                type="pie"
                data={filteredData.businessType}
                dataKey="value"
                categories="name"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-brand-gray-dark mb-4">
            Analyse des cédantes
          </h2>
          <p className="text-brand-gray mb-6">
            Analyse comparative des performances des cédantes sur une période de 8 ans, basée sur le ratio Sinistre/Prime (S/P), 
            le nombre d'affaires moyen et le volume de prime annuel.
          </p>
          
          {filteredData.topCedants && filteredData.bottomCedants && (
            <CedantTables 
              topCedants={filteredData.topCedants} 
              bottomCedants={filteredData.bottomCedants}
              region={filters.region}
              productType={filters.productType}
              businessType={filters.businessType}
              lineOfBusiness={filters.lineOfBusiness}
              minPremiumThreshold={filters.minPremiumThreshold}
              onMinPremiumThresholdChange={(value) => filters.setMinPremiumThreshold(value)}
              minPremiumThresholdBottom={filters.minPremiumThresholdBottom}
              onMinPremiumThresholdBottomChange={(value) => filters.setMinPremiumThresholdBottom(value)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
