import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RegionalPerformanceData {
  name: string;
  nonLife: number;
  life: number;
  health: number;
}

interface RegionalComparisonChartProps {
  data: RegionalPerformanceData[];
  title?: string;
  subtitle?: string;
  height?: number;
}

const RegionalComparisonChart: React.FC<RegionalComparisonChartProps> = ({
  data,
  title = "Performance par région",
  subtitle = "Comparaison des segments d'activité",
  height = 400
}) => {
  // Couleurs pour chaque segment
  const colors = {
    nonLife: '#2563eb',    // Couleur principale pour Non-Vie
    life: '#60a5fa',       // Vert clair pour Vie
    health: '#1e40af'      // Vert foncé pour Santé
  };

  // Custom tooltip pour un meilleur affichage
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800 mb-2">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${getSegmentLabel(entry.dataKey)}: ${entry.value.toFixed(1)}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Fonction pour obtenir les labels français
  const getSegmentLabel = (dataKey: string) => {
    switch (dataKey) {
      case 'nonLife': return 'Non-Vie';
      case 'life': return 'Vie';
      case 'health': return 'Santé';
      default: return dataKey;
    }
  };

  return (
    <div className="glass-card">
      <div className="flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-brand-gray-dark">{title}</h3>
          {subtitle && <p className="text-sm text-brand-gray">{subtitle}</p>}
        </div>
        
        <div className="mt-2">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#636e72', fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fill: '#636e72' }}
                label={{ value: 'Rentabilité (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => getSegmentLabel(value)}
                wrapperStyle={{ paddingTop: '20px' }}
              />
              
              {/* Les trois barres pour chaque segment */}
              <Bar 
                dataKey="nonLife" 
                fill={colors.nonLife} 
                radius={[2, 2, 0, 0]}
                name="Non-Vie"
              />
              <Bar 
                dataKey="life" 
                fill={colors.life} 
                radius={[2, 2, 0, 0]}
                name="Vie"
              />
              <Bar 
                dataKey="health" 
                fill={colors.health} 
                radius={[2, 2, 0, 0]}
                name="Santé"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Informations supplémentaires */}
        <div className="mt-4 text-xs text-gray-500">
          <p>💡 Rentabilité calculée comme : (Primes - Sinistres - Provisions) / Primes × 100</p>
        </div>
      </div>
    </div>
  );
};

export default RegionalComparisonChart;
