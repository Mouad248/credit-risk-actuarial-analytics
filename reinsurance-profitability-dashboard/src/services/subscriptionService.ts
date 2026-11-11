import { useState, useEffect } from 'react';

// URL de l'API : définie par VITE_API_URL en production, localhost en développement
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';


// Types exportés pour être utilisés dans d'autres composants
export interface KPIData {
  value: number | null; // null = non disponible (dénominateur nul)
  trend: number | null; // null = tendance non calculée
}

export interface RegionData {
  name: string;
  profitability: number;
  coordinates: [number, number];
}

export interface ProductTypeData {
  name: string;
  value: number;
}

export interface BusinessTypeData {
  name: string;
  value: number;
}

export interface RegionalPerformanceData {
  name: string;
  nonLife: number | null;
  life: number | null;
  health: number | null;
}

export interface AnnualPerformanceData {
  year: string;
  profitability: number | null;
  growth: number;
}

export interface LineOfBusinessData {
  id: string;      // ID unique de la LOB
  name: string;    // Nom standardisé de la LOB (sans préfixe numérique)
  value: number;   // Valeur associée à la LOB
}

export interface CedantPerformanceData {
  id: string;
  name: string;
  region: string;
  averageSP: number;
  averageBusinessCount: number;
  averagePremiumVolume: number;
  trend: number | null;
}

export interface ContractYearlyData {
  year: number;
  premium: number;
  claims: number;
  provisions: number;
  sp: number;
  commissionRate: number;
}

export interface CedantContract {
  contractNumber: string;
  yearRange: string;
  yearsCount: number;
  type: string;
  lineOfBusiness: string;
  premium: number;
  claims: number;
  sp: number;
  provisions: number;
  retentionRate: number;
  commissionRate: number;
  yearlyHistory: ContractYearlyData[];
}

export interface SubscriptionData {
  kpis: {
    combined: KPIData;
    life: KPIData;
    nonLife: KPIData;
    health: KPIData;
    profitability: KPIData;
    ca_global: KPIData;
    ca_volume: KPIData;
    ca_life: KPIData;
    ca_non_life: KPIData;
    ca_health: KPIData;
  };
  regions: RegionData[];
  productTypes: ProductTypeData[];
  businessType: BusinessTypeData[];
  regionalPerformance: RegionalPerformanceData[];
  annualPerformance: AnnualPerformanceData[];
  linesOfBusiness: LineOfBusinessData[];
  topCedants: CedantPerformanceData[];
  bottomCedants: CedantPerformanceData[];
}

export interface BranchAnalytics {
  branchName: string;
  insuredName: string;
  year: number;
  epiMoyen: number;
  ssMoyen: number;
  ratioTechnique: number;
  sp2016: number;
  sp2017: number;
  sp2018: number;
  sp2019: number;
  sp2020: number;
  sp2021: number;
  sp2022: number;
  sp2023: number;
  sp2024: number;
}

export interface CedantDetails {
  id: string;
  name: string;
  region: string;
  averageSP: number;
  averagePremiumVolume: number;
  averageBusinessCount: number;
  trend: number | null;
  retentionRate: number;
  growthRate: number;
  contracts: CedantContract[];
}

// Fonction pour récupérer les données depuis l'API backend
export const fetchSubscriptionData = async (
  region: string = 'all',
  productType: string = 'all',
  businessType: string = 'all',
  lineOfBusiness: string = 'all',
  minPremiumThreshold?: number,
  minPremiumThresholdBottom?: number
): Promise<SubscriptionData> => {
  const params = new URLSearchParams({
    region,
    product_type: productType,
    business_type: businessType,
    line_of_business: lineOfBusiness  // Le backend s'attend maintenant aux noms standardisés
  });

  // Ajouter le paramètre min_premium_threshold si spécifié
  if (minPremiumThreshold !== undefined && minPremiumThreshold !== null) {
    params.append('min_premium_threshold', minPremiumThreshold.toString());
  }

  // Ajouter le paramètre min_premium_threshold_bottom si spécifié
  if (minPremiumThresholdBottom !== undefined && minPremiumThresholdBottom !== null) {
    params.append('min_premium_threshold_bottom', minPremiumThresholdBottom.toString());
  }

  console.log('Calling API with params:', params.toString());
  
  try {
    const response = await fetch(`${API_BASE}/api/subscription-data?${params}`);
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API Response received:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export interface SubscriptionFilters {
  region: string;
  productType: string;
  businessType: string;
  lineOfBusiness: string;
  minPremiumThreshold?: number;
  minPremiumThresholdBottom?: number;
}

// Cache pour les résultats d'API avec TTL
interface CacheEntry {
  data: SubscriptionData;
  timestamp: number;
}

const dataCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 500; // 500ms

// Fonction utilitaire pour créer une clé de cache
const createCacheKey = (filters: SubscriptionFilters): string => {
  return JSON.stringify(filters);
};

// Fonction utilitaire pour vérifier si une entrée du cache est valide
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_TTL;
};

// Hook personnalisé pour le debounce
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useSubscriptionData = () => {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SubscriptionFilters>({
    region: 'all',
    productType: 'all',
    businessType: 'all',
    lineOfBusiness: 'all',
    minPremiumThreshold: undefined,
    minPremiumThresholdBottom: undefined
  });

  // Debounce les filtres
  const debouncedFilters = useDebounce(filters, DEBOUNCE_DELAY);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadData = async () => {
      try {
        // Vérifier le cache
        const cacheKey = createCacheKey(debouncedFilters);
        const cachedEntry = dataCache.get(cacheKey);

        if (cachedEntry && isCacheValid(cachedEntry)) {
          console.log('⚡ Using cached data');
          setData(cachedEntry.data);
          setLoading(false);
          return;
        }

        console.log('🔄 Loading data with filters:', debouncedFilters);
        setLoading(true);
        setError(null);

        const result = await fetchSubscriptionData(
          debouncedFilters.region,
          debouncedFilters.productType,
          debouncedFilters.businessType,
          debouncedFilters.lineOfBusiness,
          debouncedFilters.minPremiumThreshold,
          debouncedFilters.minPremiumThresholdBottom
        );

        if (!isMounted) return;

        console.log('✅ Data loaded successfully');
        
        // Mettre en cache le résultat
        dataCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        // Nettoyer le cache si trop grand
        if (dataCache.size > 50) {
          const oldestKey = Array.from(dataCache.keys())[0];
          dataCache.delete(oldestKey);
        }

        setData(result);
      } catch (err) {
        if (!isMounted) return;
        console.error('❌ Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [debouncedFilters]);

  const handleRegionClick = (regionId: string) => {
    setFilters(prev => ({ ...prev, region: regionId }));
  };

  const handleFilterChange = (filterType: keyof SubscriptionFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  return {
    filteredData: data,
    loading,
    error,
    filters: {
      ...filters,
      setRegion: (value: string) => handleFilterChange('region', value),
      setProductType: (value: string) => handleFilterChange('productType', value),
      setBusinessType: (value: string) => handleFilterChange('businessType', value),
      setLineOfBusiness: (value: string) => handleFilterChange('lineOfBusiness', value),
      setMinPremiumThreshold: (value: number | undefined) => handleFilterChange('minPremiumThreshold', value),
      setMinPremiumThresholdBottom: (value: number | undefined) => handleFilterChange('minPremiumThresholdBottom', value),
    },
    handleRegionClick,
    handleFilterChange
  };
};

export interface CedantSuggestion {
  id: string;
  name: string;
  region?: string;
  score?: number;
}

// Cache simple pour les suggestions
const suggestionCache = new Map<string, CedantSuggestion[]>();

export const searchCedantSuggestions = async (
  query: string, 
  signal?: AbortSignal, 
  limit = 8
): Promise<CedantSuggestion[]> => {
  // Normaliser la query pour le cache
  const normalizedQuery = query.trim().toLowerCase();
  
  // Vérifier le cache
  if (suggestionCache.has(normalizedQuery)) {
    return suggestionCache.get(normalizedQuery)!;
  }
  
  try {
    const response = await fetch(
      `${API_BASE}/api/cedants/suggest?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const suggestions = data.suggestions || [];
    
    // Mettre en cache
    suggestionCache.set(normalizedQuery, suggestions);
    
    // Nettoyer le cache si trop grand (garder les 100 dernières recherches)
    if (suggestionCache.size > 100) {
      const firstKey = suggestionCache.keys().next().value;
      suggestionCache.delete(firstKey);
    }
    
    return suggestions;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Erreur lors de la recherche de cédantes:', error);
    return [];
  }
};

// Cache pour les recherches par région
const regionSuggestionCache = new Map<string, CedantSuggestion[]>();

/**
 * Recherche toutes les cédantes d'une région spécifique
 */
export const searchCedantsByRegion = async (
  region: string, 
  signal?: AbortSignal, 
  limit = 50
): Promise<CedantSuggestion[]> => {
  const cacheKey = `region:${region}`;
  
  // Vérifier le cache
  if (regionSuggestionCache.has(cacheKey)) {
    return regionSuggestionCache.get(cacheKey)!;
  }
  
  try {
    const response = await fetch(
      `${API_BASE}/api/cedants/by-region?region=${encodeURIComponent(region)}&limit=${limit}`,
      { signal }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const suggestions = data.cedants || [];
    
    // Mettre en cache
    regionSuggestionCache.set(cacheKey, suggestions);
    
    // Nettoyer le cache si trop grand
    if (regionSuggestionCache.size > 20) {
      const firstKey = regionSuggestionCache.keys().next().value;
      regionSuggestionCache.delete(firstKey);
    }
    
    return suggestions;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Erreur lors de la recherche de cédantes par région:', error);
    return [];
  }
};

/**
 * Recherche des cédantes avec une query dans une région spécifique
 */
export const searchCedantsInRegion = async (
  query: string, 
  region: string, 
  signal?: AbortSignal, 
  limit = 8
): Promise<CedantSuggestion[]> => {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `region:${region}:query:${normalizedQuery}`;
  
  // Vérifier le cache
  if (regionSuggestionCache.has(cacheKey)) {
    return regionSuggestionCache.get(cacheKey)!;
  }
  
  try {
    const response = await fetch(
      `${API_BASE}/api/cedants/suggest?q=${encodeURIComponent(query)}&region=${encodeURIComponent(region)}&limit=${limit}`,
      { signal }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const suggestions = data.suggestions || [];
    
    // Mettre en cache
    regionSuggestionCache.set(cacheKey, suggestions);
    
    // Nettoyer le cache si trop grand
    if (regionSuggestionCache.size > 100) {
      const firstKey = regionSuggestionCache.keys().next().value;
      regionSuggestionCache.delete(firstKey);
    }
    
    return suggestions;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Erreur lors de la recherche de cédantes dans la région:', error);
    return [];
  }
};

// Constantes pour les régions disponibles
export const AVAILABLE_REGIONS = [
  'MAROC',
  'AFRIQUE', 
  'ASIE',
  'MOYEN-ORIENT',
  'AUTRE'
] as const;

export type AvailableRegion = typeof AVAILABLE_REGIONS[number];

export interface CedantAnalytics {
  annualSeries: Array<{
    year: number;
    premium: number;
    sp: number;
    commission: number;
    total: number;
  }>;
  lobDistribution: Array<{
    lob: string;
    premium: number;
  }>;
  contractMix?: Array<{
    segment: "FAC" | "TRAITES";
    nature: "PROP" | "NON-PROP";
    premium: number;
  }>;
  contractNature?: Array<{
    nature: "PROP" | "NON-PROP";
    premium: number;
  }>;
  riskCountries: Array<{
    country: string;
    premium: number;
    sp: number;
  }>;
  branchAnalytics?: BranchAnalytics[];
}

export const fetchCedantAnalytics = async (
  cedantId: string,
  options?: { segment?: "TRAITES" | "FAC"; branch?: string }
): Promise<CedantAnalytics> => {
  const params = new URLSearchParams();
  if (options?.segment) {
    params.append('segment', options.segment);
  }
  if (options?.branch && options.branch !== 'all') {
    params.append('branch', options.branch);
  }
  
  const url = `${API_BASE}/api/cedants/${cedantId}/analytics${params.toString() ? '?' + params.toString() : ''}`;
  
  try {
    console.log('🔍 DEBUG - Fetching URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('🔍 DEBUG - Response received:', data);
    console.log('🔍 DEBUG - branchAnalytics in response:', data.branchAnalytics?.length || 0);
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    // Retourner des données vides par défaut
    return {
      annualSeries: [],
      lobDistribution: [],
      contractMix: [],
      riskCountries: []
    };
  }
};

export const fetchCedantDetails = async (cedantId: string): Promise<CedantDetails> => {
  const response = await fetch(`${API_BASE}/api/cedant-details/${cedantId}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

export const fetchAvailableBranches = async (
  cedantIds: string[],
  segment?: "TRAITES" | "FAC"
): Promise<string[]> => {
  if (cedantIds.length === 0) {
    return [];
  }

  const combinedCedantId = cedantIds.join(',');
  const params = new URLSearchParams();
  if (segment) {
    params.append('segment', segment);
  }
  
  const url = `${API_BASE}/api/cedants/${combinedCedantId}/branches${params.toString() ? '?' + params.toString() : ''}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.branches || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des branches:', error);
    return [];
  }
};

// Cache pour les analytics
const analyticsCache = new Map<string, { data: CedantAnalytics; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Résultat d'un appel multiple avec gestion d'erreurs
 */
export interface MultipleCedantAnalyticsResult {
  analytics: CedantAnalytics;
  successCount: number;
  totalCount: number;
  failedCedants: string[];
  errors: string[];
}

/**
 * Récupère les analytics de plusieurs cédantes en parallèle avec gestion d'erreurs robuste
 */
export const fetchMultipleCedantAnalytics = async (
  cedantIds: string[],
  options?: { segment?: "TRAITES" | "FAC"; branch?: string }
): Promise<MultipleCedantAnalyticsResult> => {
  if (cedantIds.length === 0) {
    return {
      analytics: {
        annualSeries: [],
        lobDistribution: [],
        contractMix: [],
        contractNature: [],
        riskCountries: []
      },
      successCount: 0,
      totalCount: 0,
      failedCedants: [],
      errors: []
    };
  }

  const cacheKey = `${cedantIds.sort().join(',')}:${options?.segment || 'all'}:${options?.branch || 'all'}`;
  const cached = analyticsCache.get(cacheKey);
  
  // Vérifier le cache
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      analytics: cached.data,
      successCount: cedantIds.length,
      totalCount: cedantIds.length,
      failedCedants: [],
      errors: []
    };
  }

  // NOUVEAU: Faire un seul appel avec toutes les cédantes jointes par des virgules
  try {
    const combinedCedantId = cedantIds.join(',');
    const result = await fetchCedantAnalytics(combinedCedantId, options);
    
    // Mettre en cache
    analyticsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return {
      analytics: result,
      successCount: cedantIds.length,
      totalCount: cedantIds.length,
      failedCedants: [],
      errors: []
    };
  } catch (error) {
    // En cas d'erreur, fallback sur l'ancienne méthode (appels séparés)
    console.warn('Erreur avec appel combiné, fallback sur appels séparés:', error);
    
    // Faire tous les appels en parallèle avec Promise.allSettled
    const analyticsPromises = cedantIds.map(async (cedantId) => {
      try {
        const result = await fetchCedantAnalytics(cedantId, options);
        return { success: true, data: result, cedantId };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue', 
          cedantId 
        };
      }
    });
    
    const results = await Promise.allSettled(analyticsPromises);
    
    // Analyser les résultats
    const successfulResults: CedantAnalytics[] = [];
    const failedCedants: string[] = [];
    const errors: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successfulResults.push(result.value.data);
      } else {
        const cedantId = cedantIds[index];
        failedCedants.push(cedantId);
        
        if (result.status === 'fulfilled' && !result.value.success) {
          errors.push(`${cedantId}: ${result.value.error}`);
        } else if (result.status === 'rejected') {
          errors.push(`${cedantId}: ${result.reason}`);
        }
      }
    });
    
    // Agréger les résultats réussis
    const aggregatedAnalytics = aggregateCedantAnalytics(successfulResults);
    
    // Mettre en cache si au moins une cédante a réussi
    if (successfulResults.length > 0) {
      analyticsCache.set(cacheKey, {
        data: aggregatedAnalytics,
        timestamp: Date.now()
      });
      
      // Nettoyer le cache si trop grand
      if (analyticsCache.size > 50) {
        const oldestKey = Array.from(analyticsCache.keys())[0];
        analyticsCache.delete(oldestKey);
      }
    }
    
    return {
      analytics: aggregatedAnalytics,
      successCount: successfulResults.length,
      totalCount: cedantIds.length,
      failedCedants,
      errors
    };
  }
};

/**
 * Version de compatibilité qui retourne seulement les analytics agrégées (interface simple)
 */
export const fetchMultipleCedantAnalyticsSimple = async (
  cedantIds: string[],
  options?: { segment?: "TRAITES" | "FAC"; branch?: string }
): Promise<CedantAnalytics> => {
  const result = await fetchMultipleCedantAnalytics(cedantIds, options);
  return result.analytics;
};

/**
 * Combine les données de plusieurs CedantAnalytics en une seule
 */
export const aggregateCedantAnalytics = (
  analyticsArray: CedantAnalytics[]
): CedantAnalytics => {
  if (analyticsArray.length === 0) {
    return {
      annualSeries: [],
      lobDistribution: [],
      contractMix: [],
      contractNature: [],
      riskCountries: []
    };
  }

  // Agrégation des annualSeries
  const yearMap = new Map<number, { premium: number; sp: number; commission: number; total: number; totalPremium: number }>();
  
  analyticsArray.forEach(analytics => {
    analytics.annualSeries.forEach(({ year, premium, sp, commission, total }) => {
      if (yearMap.has(year)) {
        const existing = yearMap.get(year)!;
        existing.premium += premium;
        existing.totalPremium += premium;
        // Calculer la moyenne pondérée du S/P et de la commission
        existing.sp = (existing.sp * (existing.totalPremium - premium) + sp * premium) / existing.totalPremium;
        existing.commission = (existing.commission * (existing.totalPremium - premium) + commission * premium) / existing.totalPremium;
        existing.total = existing.sp + existing.commission;
      } else {
        yearMap.set(year, { premium, sp, commission, total, totalPremium: premium });
      }
    });
  });

  const annualSeries = Array.from(yearMap.entries())
    .map(([year, { premium, sp, commission, total }]) => ({ year, premium, sp, commission, total }))
    .sort((a, b) => a.year - b.year);

  // Agrégation des lobDistribution
  const lobMap = new Map<string, number>();
  
  analyticsArray.forEach(analytics => {
    analytics.lobDistribution.forEach(({ lob, premium }) => {
      lobMap.set(lob, (lobMap.get(lob) || 0) + premium);
    });
  });

  const lobDistribution = Array.from(lobMap.entries())
    .map(([lob, premium]) => ({ lob, premium }))
    .sort((a, b) => b.premium - a.premium);

  // Agrégation des contractMix
  const contractMixMap = new Map<string, number>();
  
  analyticsArray.forEach(analytics => {
    analytics.contractMix?.forEach(({ segment, nature, premium }) => {
      const key = `${segment}-${nature}`;
      contractMixMap.set(key, (contractMixMap.get(key) || 0) + premium);
    });
  });

  const contractMix = Array.from(contractMixMap.entries())
    .map(([key, premium]) => {
      const [segment, nature] = key.split('-') as ["FAC" | "TRAITES", "PROP" | "NON-PROP"];
      return { segment, nature, premium };
    })
    .sort((a, b) => b.premium - a.premium);

  // Agrégation des contractNature
  const contractNatureMap = new Map<string, number>();
  
  analyticsArray.forEach(analytics => {
    analytics.contractNature?.forEach(({ nature, premium }) => {
      contractNatureMap.set(nature, (contractNatureMap.get(nature) || 0) + premium);
    });
  });

  const contractNature = Array.from(contractNatureMap.entries())
    .map(([nature, premium]) => ({ nature: nature as "PROP" | "NON-PROP", premium }))
    .sort((a, b) => b.premium - a.premium);

  // Agrégation des riskCountries
  const countryMap = new Map<string, { premium: number; sp: number; totalPremium: number }>();
  
  analyticsArray.forEach(analytics => {
    analytics.riskCountries.forEach(({ country, premium, sp }) => {
      if (countryMap.has(country)) {
        const existing = countryMap.get(country)!;
        existing.premium += premium;
        existing.totalPremium += premium;
        // Calculer la moyenne pondérée du S/P
        existing.sp = (existing.sp * (existing.totalPremium - premium) + sp * premium) / existing.totalPremium;
      } else {
        countryMap.set(country, { premium, sp, totalPremium: premium });
      }
    });
  });

  const riskCountries = Array.from(countryMap.entries())
    .map(([country, { premium, sp }]) => ({ country, premium, sp }))
    .sort((a, b) => b.premium - a.premium);

  // Agrégation des branchAnalytics
  const allBranchAnalytics: BranchAnalytics[] = [];
  analyticsArray.forEach(analytics => {
    if (analytics.branchAnalytics) {
      allBranchAnalytics.push(...analytics.branchAnalytics);
    }
  });

  return {
    annualSeries,
    lobDistribution,
    contractMix: contractMix.length > 0 ? contractMix : undefined,
    contractNature: contractNature.length > 0 ? contractNature : undefined,
    riskCountries,
    branchAnalytics: allBranchAnalytics.length > 0 ? allBranchAnalytics : undefined
  };
};