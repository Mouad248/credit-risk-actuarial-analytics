
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: ReactNode;
  description?: string;
}

const KPICard = ({ title, value, unit, trend = 0, icon, description }: KPICardProps) => {
  
  return (
    <div className="glass-card card-hover-effect">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-brand-gray-dark mb-1">{title}</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-semibold text-brand-gray-dark">{value}</span>
            {unit && <span className="ml-1 text-sm text-brand-gray">{unit}</span>}
          </div>
          
          
          {description && (
            <p className="text-sm text-brand-gray mt-2">{description}</p>
          )}
        </div>
        
        {icon && (
          <div className="p-3 bg-brand-primary-light/10 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
