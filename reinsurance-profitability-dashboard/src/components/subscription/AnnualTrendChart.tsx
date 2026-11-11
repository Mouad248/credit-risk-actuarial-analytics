
import { FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnualPerformanceData } from '@/services/subscriptionService';

interface AnnualTrendChartProps {
  data: AnnualPerformanceData[];
  title?: string;
  subtitle?: string;
}

const AnnualTrendChart: FC<AnnualTrendChartProps> = ({ 
  data, 
  title = "Évolution annuelle de la rentabilité", 
  subtitle = "Tendance sur 9 ans (2016-2024)" 
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fill: '#636e72' }} />
              <YAxis yAxisId="left" tick={{ fill: '#636e72' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#636e72' }} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "Rentabilité (%)") return [`${value}%`, "Rentabilité"];
                  if (name === "Croissance du CA (%)") return [`${value}%`, "Croissance CA"];
                  return [value, name];
                }}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderColor: 'rgba(124, 172, 57, 0.2)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="profitability" 
                name="Rentabilité (%)"
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="growth" 
                name="Croissance du CA (%)"
                stroke="#2d3436" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#2d3436', strokeWidth: 2, r: 4 }}
                activeDot={{ fill: '#2d3436', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnualTrendChart;
