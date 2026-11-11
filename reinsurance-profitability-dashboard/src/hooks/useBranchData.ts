import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  BranchData, 
  FilterConfig, 
  SortConfig, 
  PaginationConfig, 
  GlobalStats, 
  UseBranchDataProps, 
  UseBranchDataReturn,
  TrendIndicator,
  PerformanceLevel,
  CacheData
} from '@/types/branchAnalytics';

/**
 * Hook personnalisé pour la gestion des données des branches
 * Optimisé avec cache, mémoisation et gestion d'état avancée
 */
export const useBranchData = ({
  analytics,
  filters,
  sortConfig,
  pagination,
  enableCache = true
}: UseBranchDataProps): UseBranchDataReturn => {
  // États locaux
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, CacheData>>(new Map());
  
  // Refs pour les métriques de performance
  const performanceRef = useRef({
    renderTime: 0,
    dataProcessingTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    lastUpdate: Date.now()
  });

  /**
   * Génère un hash unique pour les paramètres de cache
   */
  const generateCacheKey = useCallback((
    analyticsHash: string,
    filters: FilterConfig,
    sortConfig: SortConfig
  ): string => {
    return `${analyticsHash}_${JSON.stringify(filters)}_${JSON.stringify(sortConfig)}`;
  }, []);

  /**
   * Calcule les indicateurs de tendance pour une branche
   */
  const calculateTrend = useCallback((currentValue: number, previousValue: number): TrendIndicator => {
    if (previousValue === 0) {
      return { direction: 'stable', percentage: 0, period: 'N/A' };
    }
    
    const percentage = ((currentValue - previousValue) / previousValue) * 100;
    const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    
    return {
      direction,
      percentage: Math.abs(percentage),
      period: 'vs année précédente'
    };
  }, []);

  /**
   * Détermine le niveau de performance basé sur le ratio technique
   */
  const getPerformanceLevel = useCallback((ratio: number): PerformanceLevel => {
    if (ratio >= 95) return 'excellent';
    if (ratio >= 90) return 'good';
    if (ratio >= 85) return 'average';
    if (ratio >= 80) return 'poor';
    return 'critical';
  }, []);

  /**
   * Simule des données réalistes basées sur le type de branche
   * Dans un vrai projet, ces données viendraient du backend
   */
  const generateRealisticData = useCallback((
    lob: string, 
    premium: number, 
    year: number,
    previousYearData?: BranchData
  ): Partial<BranchData> => {
    const lobName = lob.toLowerCase();
    let ssMoyen: number;
    let ratioTechnique: number;
    
    // Simulation basée sur le type de branche
    if (lobName.includes('auto') || lobName.includes('at-rc')) {
      ssMoyen = 65 + Math.random() * 10; // 65-75% S/P pour l'auto
      ratioTechnique = 88 + Math.random() * 8; // 88-96%
    } else if (lobName.includes('incendie')) {
      ssMoyen = 70 + Math.random() * 15; // 70-85% S/P pour l'incendie
      ratioTechnique = 85 + Math.random() * 10; // 85-95%
    } else if (lobName.includes('vie')) {
      ssMoyen = 60 + Math.random() * 20; // 60-80% S/P pour la vie
      ratioTechnique = 90 + Math.random() * 8; // 90-98%
    } else if (lobName.includes('maritime') || lobName.includes('transport')) {
      ssMoyen = 75 + Math.random() * 15; // 75-90% S/P pour maritime
      ratioTechnique = 82 + Math.random() * 12; // 82-94%
    } else {
      ssMoyen = 65 + Math.random() * 20; // 65-85% S/P par défaut
      ratioTechnique = 85 + Math.random() * 12; // 85-97%
    }

    // Calculer la tendance si des données précédentes existent
    const trend = previousYearData ? calculateTrend(ratioTechnique, previousYearData.ratioTechnique) : undefined;
    const performance = getPerformanceLevel(ratioTechnique);

    return {
      ssMoyen,
      ratioTechnique,
      trend,
      performance
    };
  }, [calculateTrend, getPerformanceLevel]);

  /**
   * Traite les données brutes en données enrichies
   */
  const processRawData = useCallback((rawData: any[]): BranchData[] => {
    const startTime = performance.now();
    
    // Grouper par branche pour calculer les tendances
    const branchGroups = new Map<string, BranchData[]>();
    
    const processedData = rawData
      .filter(item => item.lob && item.lob.trim() !== '')
      .map((item, index) => {
        const year = item.year || 2024;
        const epiMoyen = item.premium || 0;
        
        // Générer des données réalistes
        const realisticData = generateRealisticData(item.lob, epiMoyen, year);
        
        const branchData: BranchData = {
          id: `${item.lob}_${year}_${index}`,
          lob: item.lob,
          year,
          epiMoyen,
          originalIndex: index,
          ...realisticData
        } as BranchData;

        // Grouper par branche pour calculer les tendances
        if (!branchGroups.has(item.lob)) {
          branchGroups.set(item.lob, []);
        }
        branchGroups.get(item.lob)!.push(branchData);

        return branchData;
      });

    // Calculer les tendances pour chaque branche
    branchGroups.forEach((branches) => {
      branches.sort((a, b) => a.year - b.year);
      branches.forEach((branch, index) => {
        if (index > 0) {
          const previousBranch = branches[index - 1];
          branch.trend = calculateTrend(branch.ratioTechnique, previousBranch.ratioTechnique);
        }
      });
    });

    const endTime = performance.now();
    performanceRef.current.dataProcessingTime = endTime - startTime;
    performanceRef.current.lastUpdate = Date.now();

    return processedData;
  }, [generateRealisticData, calculateTrend]);

  /**
   * Calcule les statistiques globales
   */
  const calculateGlobalStats = useCallback((data: BranchData[]): GlobalStats => {
    if (data.length === 0) {
      return {
        totalBranches: 0,
        averageRatio: 0,
        bestPerformer: '',
        worstPerformer: '',
        totalEPI: 0,
        yearRange: { min: 0, max: 0 }
      };
    }

    const totalEPI = data.reduce((sum, item) => sum + item.epiMoyen, 0);
    const averageRatio = data.reduce((sum, item) => sum + item.ratioTechnique, 0) / data.length;
    
    const sortedByRatio = [...data].sort((a, b) => b.ratioTechnique - a.ratioTechnique);
    const bestPerformer = sortedByRatio[0]?.lob || '';
    const worstPerformer = sortedByRatio[sortedByRatio.length - 1]?.lob || '';
    
    const years = data.map(item => item.year);
    const yearRange = {
      min: Math.min(...years),
      max: Math.max(...years)
    };

    return {
      totalBranches: data.length,
      averageRatio,
      bestPerformer,
      worstPerformer,
      totalEPI,
      yearRange
    };
  }, []);

  /**
   * Applique les filtres aux données
   */
  const applyFilters = useCallback((data: BranchData[], filters: FilterConfig): BranchData[] => {
    return data.filter(item => {
      // Filtre par recherche
      if (filters.searchTerm && !item.lob.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtre par année
      if (filters.selectedYear !== 'all' && item.year.toString() !== filters.selectedYear) {
        return false;
      }
      
      // Filtre par cédantes (si applicable)
      if (filters.selectedCedants.length > 0) {
        // Logique de filtrage par cédantes à implémenter selon les besoins
      }
      
      // Filtre par plage de dates
      if (item.year < filters.dateRange.start || item.year > filters.dateRange.end) {
        return false;
      }
      
      return true;
    });
  }, []);

  /**
   * Applique le tri aux données
   */
  const applySorting = useCallback((data: BranchData[], sortConfig: SortConfig): BranchData[] => {
    if (!sortConfig.field || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field!];
      const bValue = b[sortConfig.field!];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
  }, []);

  /**
   * Traite les données avec cache et optimisations
   */
  const processedData = useMemo(() => {
    if (!analytics?.lobDistribution) return [];

    const startTime = performance.now();
    
    // Générer une clé de cache
    const analyticsHash = JSON.stringify(analytics.lobDistribution);
    const cacheKey = generateCacheKey(analyticsHash, filters, sortConfig);
    
    // Vérifier le cache
    if (enableCache && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey)!;
      const cacheAge = Date.now() - cachedData.lastUpdated;
      
      // Cache valide si moins de 5 minutes
      if (cacheAge < 5 * 60 * 1000) {
        performanceRef.current.cacheHitRate = (performanceRef.current.cacheHitRate + 1) / 2;
        return cachedData.processedData;
      }
    }

    // Traiter les données
    const rawData = analytics.lobDistribution;
    const processed = processRawData(rawData);
    const filtered = applyFilters(processed, filters);
    const sorted = applySorting(filtered, sortConfig);

    // Mettre en cache
    if (enableCache) {
      const globalStats = calculateGlobalStats(sorted);
      const availableYears = [...new Set(sorted.map(item => item.year))].sort((a, b) => b - a);
      
      const cacheData: CacheData = {
        processedData: sorted,
        globalStats,
        availableYears,
        lastUpdated: Date.now(),
        hash: cacheKey
      };
      
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, cacheData);
        
        // Limiter la taille du cache à 50 entrées
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        
        return newCache;
      });
    }

    const endTime = performance.now();
    performanceRef.current.renderTime = endTime - startTime;

    return sorted;
  }, [analytics?.lobDistribution, filters, sortConfig, enableCache, cache, generateCacheKey, processRawData, applyFilters, applySorting, calculateGlobalStats]);

  /**
   * Données paginées
   */
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return processedData.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [processedData, pagination.currentPage, pagination.itemsPerPage]);

  /**
   * Statistiques globales
   */
  const globalStats = useMemo(() => {
    return calculateGlobalStats(processedData);
  }, [processedData, calculateGlobalStats]);

  /**
   * Années disponibles
   */
  const availableYears = useMemo(() => {
    return [...new Set(processedData.map(item => item.year))].sort((a, b) => b - a);
  }, [processedData]);

  /**
   * Rafraîchir les données
   */
  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);
    
    // Simuler un délai de chargement
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  /**
   * Vider le cache
   */
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Mise à jour des métriques de performance
  useEffect(() => {
    performanceRef.current.memoryUsage = performance.memory?.usedJSHeapSize || 0;
  }, [processedData]);

  return {
    processedData,
    paginatedData,
    globalStats,
    availableYears,
    loading,
    error,
    refreshData,
    clearCache
  };
};
