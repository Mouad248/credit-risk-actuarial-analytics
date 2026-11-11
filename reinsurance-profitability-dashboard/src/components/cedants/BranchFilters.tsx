import React, { memo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { BranchFiltersProps, GlobalStats } from '@/types/branchAnalytics';
import { cn } from '@/lib/utils';

/**
 * Composant de filtres optimisé pour les branches
 * Avec statistiques globales et contrôles avancés
 */
const BranchFilters = memo<BranchFiltersProps>(({
  searchTerm,
  selectedYear,
  availableYears,
  onSearchChange,
  onYearChange,
  onClearFilters,
  globalStats,
  theme = 'light'
}) => {
  /**
   * Formate les statistiques globales
   */
  const formatStats = useCallback((stats: GlobalStats) => {
    return {
      totalEPI: `${(stats.totalEPI / 1000000).toFixed(1)}M`,
      averageRatio: `${stats.averageRatio.toFixed(1)}%`,
      yearRange: `${stats.yearRange.min}-${stats.yearRange.max}`
    };
  }, []);

  const stats = formatStats(globalStats);
  const hasActiveFilters = searchTerm || selectedYear !== 'all';

  return (
    <div className="space-y-4">
      {/* Contrôles de filtrage */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">
            {globalStats.totalBranches} branche{globalStats.totalBranches > 1 ? 's' : ''} trouvée{globalStats.totalBranches > 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              Filtres actifs
            </Badge>
          )}
        </div>
        
        {/* Contrôles de filtrage */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une branche..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          
          {/* Filtre par année */}
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="w-full sm:w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Bouton de nettoyage */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Badges de filtres actifs */}
      {(searchTerm || selectedYear !== 'all') && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              "{searchTerm}"
            </Badge>
          )}
          {selectedYear !== 'all' && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {selectedYear}
            </Badge>
          )}
        </div>
      )}

      {/* Statistiques globales */}
      <Card className={cn(
        "border-l-4 border-l-blue-500",
        theme === 'dark' && "bg-gray-800 border-gray-700"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiques Globales
          </CardTitle>
          <CardDescription className="text-xs">
            Vue d'ensemble des données filtrées
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {globalStats.totalBranches}
              </div>
              <div className="text-xs text-gray-500">Branches</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {stats.totalEPI}
              </div>
              <div className="text-xs text-gray-500">EPI Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.averageRatio}
              </div>
              <div className="text-xs text-gray-500">S/P Moyen</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {stats.yearRange}
              </div>
              <div className="text-xs text-gray-500">Période</div>
            </div>
          </div>
          
          {/* Performeurs */}
          {(globalStats.bestPerformer || globalStats.worstPerformer) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {globalStats.bestPerformer && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Meilleur performeur
                      </div>
                      <div className="text-xs text-gray-500">
                        {globalStats.bestPerformer}
                      </div>
                    </div>
                  </div>
                )}
                {globalStats.worstPerformer && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Performance à améliorer
                      </div>
                      <div className="text-xs text-gray-500">
                        {globalStats.worstPerformer}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

BranchFilters.displayName = 'BranchFilters';

export default BranchFilters;
