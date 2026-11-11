import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Filter, BarChart3, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { type MapRegion } from '@/hooks/useMapCoordinates';

export interface LegendItem {
  id: string;
  label: string;
  color: string;
  range: string;
  count: number;
  avgProfitability: number;
  visible: boolean;
}

export interface MapLegendProps {
  regions: MapRegion[];
  selectedMetric?: 'profitability' | 'volume' | 'growth';
  onMetricChange?: (metric: 'profitability' | 'volume' | 'growth') => void;
  onFilterChange?: (visibleCategories: string[]) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  collapsible?: boolean;
  showStats?: boolean;
  className?: string;
}

/**
 * Génère les catégories de rentabilité
 */
function generateProfitabilityCategories(regions: MapRegion[]): LegendItem[] {
  const categories = [
    { id: 'excellent', label: 'Excellent', range: '≥ 15%', color: 'bg-emerald-600', min: 15, max: Infinity },
    { id: 'very-good', label: 'Très bon', range: '10-15%', color: 'bg-green-600', min: 10, max: 15 },
    { id: 'good', label: 'Bon', range: '5-10%', color: 'bg-green-500', min: 5, max: 10 },
    { id: 'moderate', label: 'Modéré', range: '0-5%', color: 'bg-yellow-500', min: 0, max: 5 },
    { id: 'poor', label: 'Faible', range: '< 0%', color: 'bg-red-500', min: -Infinity, max: 0 },
  ];

  return categories.map(cat => {
    const matchingRegions = regions.filter(r => 
      r.profitability >= cat.min && r.profitability < cat.max
    );
    
    const avgProfitability = matchingRegions.length > 0
      ? matchingRegions.reduce((sum, r) => sum + r.profitability, 0) / matchingRegions.length
      : 0;

    return {
      id: cat.id,
      label: cat.label,
      color: cat.color,
      range: cat.range,
      count: matchingRegions.length,
      avgProfitability,
      visible: true,
    };
  });
}

/**
 * Composant MapLegend amélioré et interactif
 */
const MapLegend: React.FC<MapLegendProps> = ({
  regions,
  selectedMetric = 'profitability',
  onMetricChange,
  onFilterChange,
  position = 'bottom-right',
  collapsible = true,
  showStats = true,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  // Générer les éléments de légende
  const legendItems = useMemo(() => {
    switch (selectedMetric) {
      case 'profitability':
        return generateProfitabilityCategories(regions);
      default:
        return generateProfitabilityCategories(regions);
    }
  }, [regions, selectedMetric]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    const profitabilities = regions.map(r => r.profitability);
    const avg = profitabilities.reduce((sum, p) => sum + p, 0) / profitabilities.length;
    const min = Math.min(...profitabilities);
    const max = Math.max(...profitabilities);
    
    return {
      average: avg,
      minimum: min,
      maximum: max,
      total: regions.length,
    };
  }, [regions]);

  // Gestion de la visibilité des catégories
  const toggleCategoryVisibility = (categoryId: string) => {
    const newHidden = new Set(hiddenCategories);
    if (newHidden.has(categoryId)) {
      newHidden.delete(categoryId);
    } else {
      newHidden.add(categoryId);
    }
    setHiddenCategories(newHidden);
    
    // Notifier le parent des changements de filtre
    if (onFilterChange) {
      const visibleCategories = legendItems
        .filter(item => !newHidden.has(item.id))
        .map(item => item.id);
      onFilterChange(visibleCategories);
    }
  };

  // Classes de position
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div 
      className={`
        absolute ${positionClasses[position]} z-30
        bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg
        ${isCollapsed ? 'p-2' : 'p-4'}
        transition-all duration-300 ease-out max-w-xs
        ${className}
      `}
    >
      {/* En-tête avec titre et contrôles */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            {selectedMetric === 'profitability' ? 'Rentabilité' : 'Métriques'}
          </h4>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Sélecteur de métrique */}
          {onMetricChange && (
            <select 
              value={selectedMetric}
              onChange={(e) => onMetricChange(e.target.value as any)}
              className="text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded px-1"
            >
              <option value="profitability">Rentabilité</option>
              <option value="volume">Volume</option>
              <option value="growth">Croissance</option>
            </select>
          )}
          
          {/* Bouton de réduction */}
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={isCollapsed ? 'Développer la légende' : 'Réduire la légende'}
            >
              {isCollapsed ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      {!isCollapsed && (
        <div className="space-y-3">
          {/* Statistiques globales */}
          {showStats && (
            <div className="bg-gray-50 rounded-md p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Moyenne:</span>
                <span className="font-medium">{globalStats.average.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Min/Max:</span>
                <span className="font-medium">
                  {globalStats.minimum.toFixed(1)}% / {globalStats.maximum.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total régions:</span>
                <span className="font-medium">{globalStats.total}</span>
              </div>
            </div>
          )}

          {/* Éléments de légende */}
          <div className="space-y-2">
            {legendItems.map((item) => {
              const isHidden = hiddenCategories.has(item.id);
              
              return (
                <div 
                  key={item.id}
                  className={`
                    flex items-center justify-between p-2 rounded-md border
                    transition-all duration-200 hover:bg-gray-50 cursor-pointer
                    ${isHidden ? 'opacity-50 bg-gray-25' : 'bg-white'}
                  `}
                  onClick={() => toggleCategoryVisibility(item.id)}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="flex items-center space-x-2">
                      {isHidden ? (
                        <EyeOff className="h-3 w-3 text-gray-400" />
                      ) : (
                        <Eye className="h-3 w-3 text-gray-600" />
                      )}
                      <div className={`w-3 h-3 rounded-full ${item.color} ${isHidden ? 'grayscale' : ''}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-900">
                          {item.label}
                        </span>
                        <span className="text-xs text-gray-600">
                          {item.count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {item.range}
                        </span>
                        {item.count > 0 && (
                          <span className="text-xs text-gray-500">
                            Ø {item.avgProfitability.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicateur de filtre actif */}
          {hiddenCategories.size > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-600 bg-blue-50 rounded p-2">
              <div className="flex items-center space-x-1">
                <Filter className="h-3 w-3" />
                <span>{hiddenCategories.size} catégorie(s) masquée(s)</span>
              </div>
              <button
                onClick={() => {
                  setHiddenCategories(new Set());
                  if (onFilterChange) {
                    onFilterChange(legendItems.map(item => item.id));
                  }
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Tout afficher
              </button>
            </div>
          )}
        </div>
      )}

      {/* Version réduite */}
      {isCollapsed && (
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-gray-600" />
          <span className="text-xs font-medium text-gray-900">
            {globalStats.average.toFixed(1)}% moyenne
          </span>
          {hiddenCategories.size > 0 && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" title="Filtres actifs" />
          )}
        </div>
      )}
    </div>
  );
};

export default MapLegend;
