
import { useState, useEffect } from 'react';
import ChartCard from '@/components/dashboard/ChartCard';
import KPICard from '@/components/dashboard/KPICard';
import { Filter, Download, DollarSign, TrendingUp, PieChart, BarChart3 } from 'lucide-react';

const Investments = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // KPI données
  const kpiData = {
    totalAssets: '4.78 Mds €',
    return: '4.8%',
    allocation: '68%',
    alpha: '1.24'
  };

  // Données par type d'investissement
  const investmentTypeData = [
    { name: 'Actions', value: 35 },
    { name: 'Obligations', value: 45 },
    { name: 'Immobilier', value: 15 },
    { name: 'Autres', value: 5 },
  ];

  // Données par devise
  const currencyData = [
    { name: 'EUR', value: 60 },
    { name: 'USD', value: 25 },
    { name: 'GBP', value: 10 },
    { name: 'Autres', value: 5 },
  ];

  // Données de performance
  const performanceData = [
    { name: '2016', value: 3.2 },
    { name: '2017', value: 3.8 },
    { name: '2018', value: 3.6 },
    { name: '2019', value: 4.2 },
    { name: '2020', value: 3.5 },
    { name: '2021', value: 4.5 },
    { name: '2022', value: 4.1 },
    { name: '2023', value: 4.8 },
  ];

  // Données géographiques
  const geoData = [
    { name: 'Europe', value: 55 },
    { name: 'Amériques', value: 25 },
    { name: 'Asie', value: 15 },
    { name: 'Autres', value: 5 },
  ];

  // Données pour le tableau
  const tableData = [
    { type: 'Actions', region: 'Europe', currency: 'EUR', allocation: '22%', return: '6.2%', risk: 'Moyen' },
    { type: 'Actions', region: 'Amériques', currency: 'USD', allocation: '18%', return: '5.8%', risk: 'Moyen-Élevé' },
    { type: 'Obligations', region: 'Europe', currency: 'EUR', allocation: '28%', return: '3.5%', risk: 'Faible' },
    { type: 'Obligations', region: 'Amériques', currency: 'USD', allocation: '14%', return: '4.1%', risk: 'Faible-Moyen' },
    { type: 'Immobilier', region: 'Europe', currency: 'EUR', allocation: '9%', return: '4.8%', risk: 'Moyen' },
    { type: 'Immobilier', region: 'Asie', currency: 'JPY', allocation: '4%', return: '4.3%', risk: 'Moyen' },
    { type: 'Autres', region: 'Divers', currency: 'Divers', allocation: '5%', return: '3.7%', risk: 'Variable' },
  ];

  return (
    <div className={`min-h-screen flex flex-col pt-20 pb-16 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <section className="py-12 px-4 md:px-6 bg-gradient-to-r from-brand-gray-light to-brand-primary-light/20">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-dark mb-4 animate-fade-in">
            Investissements
          </h1>
          <p className="text-lg text-brand-gray max-w-3xl animate-fade-in">
            Analysez la performance et la répartition de nos investissements par devise, 
            région et horizon de placement.
          </p>
        </div>
      </section>

      {/* KPI Section */}
      <section className="py-8 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Actifs sous gestion"
              value={kpiData.totalAssets}
              icon={<DollarSign className="h-5 w-5 text-brand-primary-dark" />}
              description="Total des actifs investis"
            />
            
            <KPICard
              title="Rendement moyen"
              value={kpiData.return}
              icon={<TrendingUp className="h-5 w-5 text-brand-primary-dark" />}
              description="Performance annualisée"
              trend={0.7}
            />
            
            <KPICard
              title="Allocation stratégique"
              value={kpiData.allocation}
              icon={<PieChart className="h-5 w-5 text-brand-primary-dark" />}
              description="Conformité avec la stratégie"
            />
            
            <KPICard
              title="Alpha généré"
              value={kpiData.alpha}
              icon={<BarChart3 className="h-5 w-5 text-brand-primary-dark" />}
              description="Surperformance vs benchmark"
              trend={0.3}
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="glass-card mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-brand-primary-dark" />
                <span className="font-medium text-brand-gray-dark">Filtres:</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div>
                  <label htmlFor="currency-filter" className="block text-sm font-medium text-brand-gray mb-1">
                    Devise
                  </label>
                  <select
                    id="currency-filter"
                    className="w-full p-2 border border-brand-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary-light"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                  >
                    <option value="all">Toutes les devises</option>
                    <option value="eur">EUR</option>
                    <option value="usd">USD</option>
                    <option value="gbp">GBP</option>
                    <option value="other">Autres</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="region-filter" className="block text-sm font-medium text-brand-gray mb-1">
                    Région
                  </label>
                  <select
                    id="region-filter"
                    className="w-full p-2 border border-brand-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary-light"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                  >
                    <option value="all">Toutes les régions</option>
                    <option value="europe">Europe</option>
                    <option value="americas">Amériques</option>
                    <option value="asia">Asie</option>
                    <option value="other">Autres</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="timeframe-filter" className="block text-sm font-medium text-brand-gray mb-1">
                    Horizon de placement
                  </label>
                  <select
                    id="timeframe-filter"
                    className="w-full p-2 border border-brand-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary-light"
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                  >
                    <option value="all">Tous les horizons</option>
                    <option value="short">Court terme</option>
                    <option value="medium">Moyen terme</option>
                    <option value="long">Long terme</option>
                  </select>
                </div>
              </div>
              
              <button className="btn-outline flex items-center gap-2 whitespace-nowrap">
                <Download className="h-4 w-4" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="py-8 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ChartCard
              title="Répartition par type d'investissement"
              subtitle="Allocation des actifs par classe"
              type="pie"
              data={investmentTypeData}
              dataKey="value"
            />
            
            <ChartCard
              title="Répartition par devise"
              subtitle="Allocation par devise principale"
              type="pie"
              data={currencyData}
              dataKey="value"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ChartCard
              title="Performance historique"
              subtitle="Rendement annuel des investissements"
              type="bar"
              data={performanceData}
              dataKey="value"
            />
            
            <ChartCard
              title="Répartition géographique"
              subtitle="Allocation par zone géographique"
              type="bar"
              data={geoData}
              dataKey="value"
            />
          </div>
          
          {/* Data Table */}
          <div className="glass-card overflow-hidden">
            <h3 className="text-lg font-medium text-brand-gray-dark mb-4">Données détaillées</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-brand-gray-light/50">
                    <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Type</th>
                    <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Région</th>
                    <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Devise</th>
                    <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Allocation</th>
                    <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Rendement</th>
                    <th className="p-3 text-left text-sm font-medium text-brand-gray-dark">Risque</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-brand-gray-light/20'}>
                      <td className="p-3 text-sm text-brand-gray-dark">{row.type}</td>
                      <td className="p-3 text-sm text-brand-gray-dark">{row.region}</td>
                      <td className="p-3 text-sm text-brand-gray-dark">{row.currency}</td>
                      <td className="p-3 text-sm font-medium text-brand-gray-dark">{row.allocation}</td>
                      <td className="p-3 text-sm text-brand-primary">{row.return}</td>
                      <td className="p-3 text-sm text-brand-gray-dark">{row.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Investments;
