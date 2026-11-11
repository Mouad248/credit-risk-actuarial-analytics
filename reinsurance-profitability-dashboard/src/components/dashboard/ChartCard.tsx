
import { ReactNode } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

type ChartType = 'bar' | 'line' | 'pie';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: ChartType;
  data: any[];
  dataKey: string;
  categories?: string;
  colors?: string[];
  height?: number | string;
  children?: ReactNode;
}

const defaultColors = [
  '#2563eb', // Bleu principal
  '#60a5fa', // Bleu clair
  '#1e40af', // Bleu foncé
  '#2d3436', // Gris foncé
  '#636e72', // Gris
  '#dfe6e9', // Gris clair
];

const ChartCard = ({
  title,
  subtitle,
  type,
  data,
  dataKey,
  categories = 'name',
  colors = defaultColors,
  height = 300,
  children,
}: ChartCardProps) => {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={categories} tick={{ fill: '#636e72' }} />
              <YAxis tick={{ fill: '#636e72' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderColor: 'rgba(124, 172, 57, 0.2)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={categories} tick={{ fill: '#636e72' }} />
              <YAxis tick={{ fill: '#636e72' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderColor: 'rgba(124, 172, 57, 0.2)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={colors[0]} 
                strokeWidth={2}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ fill: colors[0], strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey={dataKey}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderColor: 'rgba(124, 172, 57, 0.2)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
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
          {renderChart()}
        </div>
        
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

export default ChartCard;
