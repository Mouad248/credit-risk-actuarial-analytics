import React, { useEffect, useRef, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Users, DollarSign } from 'lucide-react';

export interface TooltipData {
  title: string;
  subtitle?: string;
  profitability: number;
  trend?: 'up' | 'down' | 'stable';
  volume?: string;
  cedantCount?: number;
  additionalInfo?: Array<{ label: string; value: string; }>;
}

export interface MapTooltipProps {
  data: TooltipData;
  position: { x: number; y: number };
  isVisible: boolean;
  delay?: number;
  containerBounds?: DOMRect;
  className?: string;
}

/**
 * Position du tooltip par rapport au pointeur
 */
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Composant tooltip intelligent avec positionnement automatique
 */
const MapTooltip: React.FC<MapTooltipProps> = ({
  data,
  position,
  isVisible,
  delay = 300,
  containerBounds,
  className = ''
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>('top');
  const [actualPosition, setActualPosition] = useState({ x: 0, y: 0 });

  // Délai d'apparition du tooltip
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isVisible) {
      timeoutId = setTimeout(() => {
        setShowTooltip(true);
      }, delay);
    } else {
      setShowTooltip(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, delay]);

  // Calculer la position optimale du tooltip
  useEffect(() => {
    if (!showTooltip || !tooltipRef.current || !containerBounds) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 12; // Marge autour du tooltip

    let bestPosition: TooltipPosition = 'top';
    let finalX = position.x;
    let finalY = position.y;

    // Vérifier l'espace disponible dans chaque direction
    const spaceTop = position.y - margin;
    const spaceBottom = containerBounds.height - position.y - margin;
    const spaceLeft = position.x - margin;
    const spaceRight = containerBounds.width - position.x - margin;

    // Déterminer la position verticale
    const preferTop = spaceTop >= tooltipRect.height + margin;
    const preferBottom = spaceBottom >= tooltipRect.height + margin;

    // Déterminer la position horizontale
    const preferLeft = spaceLeft >= tooltipRect.width + margin;
    const preferRight = spaceRight >= tooltipRect.width + margin;

    // Choisir la meilleure position
    if (preferTop && preferLeft && spaceTop >= spaceLeft) {
      bestPosition = 'top';
      finalX = position.x - tooltipRect.width / 2;
      finalY = position.y - tooltipRect.height - margin;
    } else if (preferTop && preferRight && spaceTop >= spaceRight) {
      bestPosition = 'top';
      finalX = position.x - tooltipRect.width / 2;
      finalY = position.y - tooltipRect.height - margin;
    } else if (preferBottom && preferLeft && spaceBottom >= spaceLeft) {
      bestPosition = 'bottom';
      finalX = position.x - tooltipRect.width / 2;
      finalY = position.y + margin;
    } else if (preferBottom && preferRight && spaceBottom >= spaceRight) {
      bestPosition = 'bottom';
      finalX = position.x - tooltipRect.width / 2;
      finalY = position.y + margin;
    } else if (preferLeft) {
      bestPosition = 'left';
      finalX = position.x - tooltipRect.width - margin;
      finalY = position.y - tooltipRect.height / 2;
    } else if (preferRight) {
      bestPosition = 'right';
      finalX = position.x + margin;
      finalY = position.y - tooltipRect.height / 2;
    } else {
      // Fallback: positionner au mieux en évitant les débordements
      bestPosition = 'top-right';
      finalX = Math.min(position.x + margin, containerBounds.width - tooltipRect.width - margin);
      finalY = Math.max(margin, position.y - tooltipRect.height - margin);
    }

    // Ajuster pour éviter les débordements
    finalX = Math.max(margin, Math.min(finalX, containerBounds.width - tooltipRect.width - margin));
    finalY = Math.max(margin, Math.min(finalY, containerBounds.height - tooltipRect.height - margin));

    setTooltipPosition(bestPosition);
    setActualPosition({ x: finalX, y: finalY });
  }, [showTooltip, position, containerBounds]);

  // Rendu de l'icône de tendance
  const renderTrendIcon = () => {
    if (!data.trend) return null;
    
    const iconClass = "h-4 w-4";
    
    switch (data.trend) {
      case 'up':
        return <TrendingUp className={`${iconClass} text-green-500`} />;
      case 'down':
        return <TrendingDown className={`${iconClass} text-red-500`} />;
      case 'stable':
        return <Minus className={`${iconClass} text-gray-500`} />;
      default:
        return null;
    }
  };

  // Classe CSS pour la flèche du tooltip
  const arrowClass = useMemo(() => {
    const baseClass = "absolute w-3 h-3 bg-white border transform rotate-45";
    
    switch (tooltipPosition) {
      case 'top':
        return `${baseClass} -bottom-1.5 left-1/2 -translate-x-1/2 border-t-0 border-l-0`;
      case 'bottom':
        return `${baseClass} -top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0`;
      case 'left':
        return `${baseClass} -right-1.5 top-1/2 -translate-y-1/2 border-l-0 border-b-0`;
      case 'right':
        return `${baseClass} -left-1.5 top-1/2 -translate-y-1/2 border-r-0 border-t-0`;
      default:
        return `${baseClass} -bottom-1.5 left-4 border-t-0 border-l-0`;
    }
  }, [tooltipPosition]);

  if (!showTooltip) return null;

  return (
    <div
      ref={tooltipRef}
      className={`
        absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 
        transition-all duration-200 ease-out pointer-events-none
        ${showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${className}
      `}
      style={{
        left: actualPosition.x,
        top: actualPosition.y,
        maxWidth: '280px',
        minWidth: '200px'
      }}
    >
      {/* Flèche du tooltip */}
      <div className={arrowClass} />
      
      {/* Contenu principal */}
      <div className="space-y-2">
        {/* En-tête */}
        <div className="border-b border-gray-100 pb-2">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
            {data.title}
          </h4>
          {data.subtitle && (
            <p className="text-xs text-gray-600 mt-0.5">{data.subtitle}</p>
          )}
        </div>

        {/* Rentabilité avec tendance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-700">Rentabilité:</span>
            <span className={`text-sm font-bold ${
              data.profitability >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.profitability > 0 ? '+' : ''}{data.profitability.toFixed(1)}%
            </span>
          </div>
          {renderTrendIcon()}
        </div>

        {/* Informations supplémentaires */}
        {(data.volume || data.cedantCount) && (
          <div className="space-y-1 text-xs">
            {data.volume && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600">Volume:</span>
                <span className="font-medium text-gray-900">{data.volume}</span>
              </div>
            )}
            {data.cedantCount && (
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600">Cédantes:</span>
                <span className="font-medium text-gray-900">{data.cedantCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Informations additionnelles */}
        {data.additionalInfo && data.additionalInfo.length > 0 && (
          <div className="border-t border-gray-100 pt-2 space-y-1">
            {data.additionalInfo.map((info, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-gray-600">{info.label}:</span>
                <span className="font-medium text-gray-900">{info.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapTooltip;
