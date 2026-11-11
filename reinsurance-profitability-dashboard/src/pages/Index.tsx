
import { useState, useEffect } from 'react';
import { BRAND } from '@/config/brand';
import { Activity, DollarSign, TrendingUp, Percent, BarChart3 } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import ChartCard from '@/components/dashboard/ChartCard';

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Exemple de données pour les graphiques
  const profitabilityData = [
    { name: 'Jan', value: 42 },
    { name: 'Fév', value: 53 },
    { name: 'Mar', value: 48 },
    { name: 'Avr', value: 55 },
    { name: 'Mai', value: 60 },
    { name: 'Juin', value: 58 },
    { name: 'Juil', value: 65 },
  ];

  const investmentData = [
    { name: 'Actions', value: 35 },
    { name: 'Obligations', value: 45 },
    { name: 'Immobilier', value: 15 },
    { name: 'Autres', value: 5 },
  ];

  const regionData = [
    { name: 'Europe', value: 40 },
    { name: 'Amériques', value: 30 },
    { name: 'Asie', value: 20 },
    { name: 'Afrique', value: 10 },
  ];

  return (
    <div className={`min-h-screen flex flex-col pt-20 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-b from-white to-brand-gray-light/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-gray-dark mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary-dark to-brand-primary">
                Analysez la rentabilité
              </span>{" "}
              de votre portefeuille de réassurance
            </h1>
            <p className="text-lg text-brand-gray mb-8 max-w-2xl">
              {BRAND.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/subscription" className="btn-primary">
                Explorer la rentabilité
              </a>
              <a href="/cedantes" className="btn-outline">
                Analyser les cédantes
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards Section */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-brand-gray-dark mb-2 text-center">
            Indicateurs clés de performance
          </h2>
          <p className="text-center text-sm text-brand-gray mb-8">Valeurs d'exemple. Les données réelles se trouvent dans les pages Rentabilité et Cédantes.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Ratio technique"
              value="58.7"
              unit="%"
              trend={5.2}
              icon={<Percent className="h-5 w-5 text-brand-primary-dark" />}
              description="Ratio technique global calculé avec la formule métier"
            />
            
            <KPICard
              title="Primes émises"
              value="2.45"
              unit="Mds €"
              trend={3.8}
              icon={<DollarSign className="h-5 w-5 text-brand-primary-dark" />}
              description="Volume des primes émises ce trimestre"
            />
            
            <KPICard
              title="Ratio combiné"
              value="96.3"
              unit="%"
              trend={-1.2}
              icon={<Activity className="h-5 w-5 text-brand-primary-dark" />}
              description="Amélioration du ratio combiné"
            />
            
            <KPICard
              title="ROI Investissements"
              value="4.8"
              unit="%"
              trend={0.6}
              icon={<TrendingUp className="h-5 w-5 text-brand-primary-dark" />}
              description="Performance des investissements"
            />
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section className="py-16 px-4 md:px-6 bg-brand-gray-light/10">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-brand-gray-dark mb-8 text-center">
            Aperçu des performances
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <ChartCard
              title="Évolution de la rentabilité"
              subtitle="Progression sur les 7 derniers mois"
              type="line"
              data={profitabilityData}
              dataKey="value"
            />
            
            <ChartCard
              title="Répartition des investissements"
              subtitle="Allocation par classe d'actifs"
              type="pie"
              data={investmentData}
              dataKey="value"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            <ChartCard
              title="Distribution géographique"
              subtitle="Répartition des activités par région"
              type="bar"
              data={regionData}
              dataKey="value"
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 md:px-6 bg-brand-gray-dark text-white">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">
              Découvrez notre approche
            </h2>
            <p className="text-lg text-brand-gray-light mb-8">
              Explorez notre stratégie de gestion des risques et notre expertise en matière d'investissements.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="/about" className="btn bg-brand-primary text-white hover:bg-brand-primary/90 px-6 py-3">
                En savoir plus
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
