
import { useState } from 'react';
import { Shield, TrendingUp, BarChart2, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from '@/components/dashboard/KPICard';
import ChartCard from '@/components/dashboard/ChartCard';
import BackgroundAnimation from '@/components/animations/BackgroundAnimation';

const RisksSolvency = () => {
  const [isLoaded, setIsLoaded] = useState(true);

  // Données fictives pour les graphiques
  const solvencyData = [
    { name: 'SCR Ratio', value: 215 },
    { name: 'MCR Ratio', value: 432 },
  ];

  const solvencyComposition = [
    { name: 'Risque de marché', value: 45 },
    { name: 'Risque de souscription', value: 35 },
    { name: 'Risque de contrepartie', value: 12 },
    { name: 'Risque opérationnel', value: 8 },
  ];

  const riskExposure = [
    { name: 'Vie', value: 38 },
    { name: 'Non-Vie', value: 45 },
    { name: 'Santé', value: 17 },
  ];

  const riskTrends = [
    { name: 'Jan', market: 42, underwriting: 32, counterparty: 10, operational: 7 },
    { name: 'Feb', market: 43, underwriting: 33, counterparty: 11, operational: 7 },
    { name: 'Mar', market: 44, underwriting: 34, counterparty: 12, operational: 8 },
    { name: 'Apr', market: 45, underwriting: 35, counterparty: 12, operational: 8 },
    { name: 'May', market: 44, underwriting: 35, counterparty: 11, operational: 8 },
    { name: 'Jun', market: 45, underwriting: 35, counterparty: 12, operational: 8 },
  ];

  const stressTestResults = [
    { scenario: 'Baseline', solvencyRatio: 215 },
    { scenario: 'Pandemic', solvencyRatio: 178 },
    { scenario: 'Market Crash', solvencyRatio: 155 },
    { scenario: 'Natural Catastrophe', solvencyRatio: 172 },
    { scenario: 'Combined Stress', solvencyRatio: 132 },
  ];

  return (
    <div className={`min-h-screen pt-20 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animation de fond */}
      <BackgroundAnimation />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-3xl font-bold text-brand-gray-dark mb-6">
          Risques & Solvabilité
        </h1>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Ratio de Solvabilité (SCR)"
            value={215}
            unit="%"
            trend={5}
            icon={<Shield className="h-6 w-6 text-brand-primary-dark" />}
            description="Seuil réglementaire: 100%"
          />
          <KPICard
            title="Capital de Solvabilité Requis"
            value={762}
            unit="MDH"
            trend={2.5}
            icon={<TrendingUp className="h-6 w-6 text-brand-primary-dark" />}
          />
          <KPICard
            title="Exposition aux catastrophes"
            value={320}
            unit="MDH"
            trend={-3.8}
            icon={<AlertTriangle className="h-6 w-6 text-brand-primary-dark" />}
          />
          <KPICard
            title="Ratio de sinistralité"
            value={62.5}
            unit="%"
            trend={-1.2}
            icon={<BarChart2 className="h-6 w-6 text-brand-primary-dark" />}
          />
        </div>
        
        {/* Onglets principaux */}
        <Tabs defaultValue="solvency" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="solvency">Solvabilité</TabsTrigger>
            <TabsTrigger value="underwriting">Risques de souscription</TabsTrigger>
            <TabsTrigger value="financial">Risques financiers</TabsTrigger>
            <TabsTrigger value="stress">Stress Tests</TabsTrigger>
          </TabsList>
          
          {/* Contenu onglet Solvabilité */}
          <TabsContent value="solvency">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Ratios de Solvabilité"
                subtitle="SCR et MCR (Solvabilité II)"
                type="bar"
                data={solvencyData}
                dataKey="value"
                categories="name"
              />
              
              <ChartCard
                title="Composition du SCR"
                subtitle="Répartition par type de risque"
                type="pie"
                data={solvencyComposition}
                dataKey="value"
                categories="name"
              />
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Analyse de la solvabilité</CardTitle>
                  <CardDescription>
                    Principaux facteurs impactant le ratio de solvabilité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Points forts</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Ratio SCR largement supérieur au minimum réglementaire (215% vs 100%)</li>
                        <li>Fonds propres de haute qualité (Tier 1 à 92%)</li>
                        <li>Diversification optimale du portefeuille</li>
                        <li>Programme de réassurance efficace</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Facteurs de vigilance</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Exposition au risque de marché en hausse</li>
                        <li>Sensibilité aux taux d'intérêt</li>
                        <li>Concentration sectorielle dans certains segments</li>
                        <li>Exposition aux catastrophes naturelles en Afrique</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Contenu onglet Risques de souscription */}
          <TabsContent value="underwriting">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Exposition par branche d'activité"
                subtitle="Répartition des engagements"
                type="pie"
                data={riskExposure}
                dataKey="value"
                categories="name"
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Risques de souscription</CardTitle>
                  <CardDescription>
                    Principaux facteurs de risque
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Risques majeurs</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Catastrophes naturelles (séismes, inondations)</li>
                        <li>Cumul de risques en zone urbaine</li>
                        <li>Risques pandémiques (santé, vie)</li>
                        <li>Tendances de longévité (rentes viagères)</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Mesures d'atténuation</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Programme de réassurance optimisé</li>
                        <li>Diversification géographique</li>
                        <li>Amélioration continue des modèles actuariels</li>
                        <li>Surveillance proactive des sinistres</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Sinistralité par segment</CardTitle>
                  <CardDescription>
                    Évolution des ratios S/P
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {/* Graphique de sinistralité à implémenter */}
                    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                      <p className="text-gray-500">Graphique de sinistralité à intégrer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Contenu onglet Risques financiers */}
          <TabsContent value="financial">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Évolution des risques"
                subtitle="Tendance sur 6 mois"
                type="line"
                data={riskTrends}
                dataKey="market"
                categories="name"
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Risques de marché</CardTitle>
                  <CardDescription>
                    Principaux facteurs de risque financier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Types de risques</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Risque de taux d'intérêt</li>
                        <li>Risque actions</li>
                        <li>Risque immobilier</li>
                        <li>Risque de spread</li>
                        <li>Risque de change</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Contrôles mis en place</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Suivi des limites d'investissement</li>
                        <li>Diversification des placements</li>
                        <li>Couverture partielle du risque de change</li>
                        <li>Analyses de sensibilité régulières</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Risque de contrepartie</CardTitle>
                  <CardDescription>
                    Exposition au risque de défaut
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Exposition</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Réassureurs: 65%</li>
                        <li>Banques: 20%</li>
                        <li>Émetteurs d'obligations: 10%</li>
                        <li>Autres: 5%</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Répartition par rating</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>AAA à AA-: 45%</li>
                        <li>A+ à A-: 35%</li>
                        <li>BBB+ à BBB-: 15%</li>
                        <li>&lt; BBB-: 5%</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Risque de liquidité</CardTitle>
                  <CardDescription>
                    Gestion des flux et des actifs liquides
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[260px]">
                  {/* À compléter avec des données réelles */}
                  <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Graphique de liquidité à intégrer</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Contenu onglet Stress Tests */}
          <TabsContent value="stress">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Résultats des stress tests</CardTitle>
                  <CardDescription>
                    Impact sur le ratio de solvabilité selon différents scénarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Scénario</th>
                          <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Description</th>
                          <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Ratio de solvabilité</th>
                          <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stressTestResults.map((test, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-3 text-sm text-brand-gray-dark font-medium">{test.scenario}</td>
                            <td className="p-3 text-sm text-brand-gray">
                              {test.scenario === 'Baseline' && 'Situation actuelle sans stress'}
                              {test.scenario === 'Pandemic' && 'Augmentation significative des sinistres vie et santé'}
                              {test.scenario === 'Market Crash' && 'Chute de 30% des marchés actions et immobilier'}
                              {test.scenario === 'Natural Catastrophe' && 'Événement catastrophique majeur'}
                              {test.scenario === 'Combined Stress' && 'Combinaison des scénarios précédents'}
                            </td>
                            <td className={`p-3 text-sm font-medium ${
                              test.solvencyRatio > 150 ? 'text-green-600' : 
                              test.solvencyRatio > 120 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {test.solvencyRatio}%
                            </td>
                            <td className="p-3 text-sm text-brand-gray">
                              {test.scenario === 'Baseline' ? '-' : `${Math.round((test.solvencyRatio - 215) / 2.15)}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Analyse d'impact</CardTitle>
                  <CardDescription>
                    Conclusions des tests de résistance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Principales observations</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Bonne résistance générale aux scénarios de stress</li>
                        <li>Maintien du ratio au-dessus du seuil réglementaire dans tous les scénarios</li>
                        <li>Sensibilité plus marquée aux risques de marché</li>
                        <li>Résilience face aux catastrophes naturelles grâce au programme de réassurance</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-brand-gray-dark mb-2">Points d'amélioration identifiés</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Renforcement des couvertures en cas de cumul d'événements</li>
                        <li>Diversification accrue des investissements</li>
                        <li>Réduction de l'exposition aux actifs volatils</li>
                        <li>Optimisation du capital alloué aux différentes lignes d'activité</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <ChartCard
                title="Sensibilité aux variables de marché"
                subtitle="Impact des variations sur le ratio de solvabilité"
                type="bar"
                data={[
                  { name: "Taux +100bp", value: 12 },
                  { name: "Taux -100bp", value: -15 },
                  { name: "Actions -30%", value: -25 },
                  { name: "Spread +100bp", value: -18 },
                  { name: "Immobilier -20%", value: -10 }
                ]}
                dataKey="value"
                categories="name"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RisksSolvency;
