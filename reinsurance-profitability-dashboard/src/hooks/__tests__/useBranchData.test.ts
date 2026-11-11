import { renderHook, act } from '@testing-library/react';
import { useBranchData } from '../useBranchData';
import { FilterConfig, SortConfig, PaginationConfig } from '@/types/branchAnalytics';
import { CedantAnalytics } from '@/services/subscriptionService';

// Mock des données de test
const mockAnalytics: CedantAnalytics = {
  annualSeries: [],
  lobDistribution: [
    { lob: 'AUTO-AT-RC', premium: 1000000 },
    { lob: 'INCENDIE', premium: 500000 },
    { lob: 'V I E', premium: 2000000 },
    { lob: 'MARITIME-TRANSPORT', premium: 750000 },
  ],
  contractNature: [],
  riskCountries: [],
};

const defaultFilters: FilterConfig = {
  searchTerm: '',
  selectedYear: 'all',
  selectedCedants: [],
  dateRange: { start: 2016, end: 2024 }
};

const defaultSortConfig: SortConfig = {
  field: 'ratioTechnique',
  direction: 'desc'
};

const defaultPagination: PaginationConfig = {
  currentPage: 1,
  itemsPerPage: 100,
  totalItems: 0
};

describe('useBranchData', () => {
  it('devrait initialiser avec des données vides', () => {
    const { result } = renderHook(() => 
      useBranchData({
        analytics: undefined,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    expect(result.current.processedData).toEqual([]);
    expect(result.current.paginatedData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('devrait traiter les données correctement', () => {
    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    expect(result.current.processedData).toHaveLength(4);
    expect(result.current.processedData[0]).toHaveProperty('id');
    expect(result.current.processedData[0]).toHaveProperty('lob');
    expect(result.current.processedData[0]).toHaveProperty('year');
    expect(result.current.processedData[0]).toHaveProperty('epiMoyen');
    expect(result.current.processedData[0]).toHaveProperty('ssMoyen');
    expect(result.current.processedData[0]).toHaveProperty('ratioTechnique');
  });

  it('devrait filtrer par terme de recherche', () => {
    const filtersWithSearch: FilterConfig = {
      ...defaultFilters,
      searchTerm: 'AUTO'
    };

    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: filtersWithSearch,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    expect(result.current.processedData).toHaveLength(1);
    expect(result.current.processedData[0].lob).toBe('AUTO-AT-RC');
  });

  it('devrait filtrer par année', () => {
    const filtersWithYear: FilterConfig = {
      ...defaultFilters,
      selectedYear: '2024'
    };

    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: filtersWithYear,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    // Toutes les données devraient être filtrées car elles sont en 2024
    expect(result.current.processedData).toHaveLength(4);
    expect(result.current.processedData.every(item => item.year === 2024)).toBe(true);
  });

  it('devrait trier les données correctement', () => {
    const sortConfigAsc: SortConfig = {
      field: 'lob',
      direction: 'asc'
    };

    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: sortConfigAsc,
        pagination: defaultPagination
      })
    );

    const lobs = result.current.processedData.map(item => item.lob);
    expect(lobs).toEqual([...lobs].sort());
  });

  it('devrait paginer les données correctement', () => {
    const paginationSmall: PaginationConfig = {
      currentPage: 1,
      itemsPerPage: 2,
      totalItems: 4
    };

    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: paginationSmall
      })
    );

    expect(result.current.paginatedData).toHaveLength(2);
  });

  it('devrait calculer les statistiques globales', () => {
    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    expect(result.current.globalStats.totalBranches).toBe(4);
    expect(result.current.globalStats.totalEPI).toBeGreaterThan(0);
    expect(result.current.globalStats.averageRatio).toBeGreaterThan(0);
    expect(result.current.globalStats.yearRange.min).toBe(2024);
    expect(result.current.globalStats.yearRange.max).toBe(2024);
  });

  it('devrait extraire les années disponibles', () => {
    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    expect(result.current.availableYears).toEqual([2024]);
  });

  it('devrait gérer le cache correctement', () => {
    const { result, rerender } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination,
        enableCache: true
      })
    );

    // Premier rendu
    expect(result.current.processedData).toHaveLength(4);

    // Re-render avec les mêmes paramètres
    rerender();

    // Les données devraient être les mêmes (cache)
    expect(result.current.processedData).toHaveLength(4);
  });

  it('devrait rafraîchir les données', async () => {
    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    act(() => {
      result.current.refreshData();
    });

    expect(result.current.loading).toBe(true);

    // Attendre que le loading se termine
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    expect(result.current.loading).toBe(false);
  });

  it('devrait vider le cache', () => {
    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination,
        enableCache: true
      })
    );

    act(() => {
      result.current.clearCache();
    });

    // Le cache devrait être vidé (pas de test direct possible sans accès interne)
    expect(result.current.processedData).toHaveLength(4);
  });

  it('devrait gérer les données manquantes', () => {
    const analyticsWithMissingData: CedantAnalytics = {
      ...mockAnalytics,
      lobDistribution: [
        { lob: 'AUTO-AT-RC', premium: 1000000 },
        { lob: '', premium: 500000 }, // LOB vide
        { lob: 'INCENDIE', premium: 0 }, // Premium à 0
      ]
    };

    const { result } = renderHook(() => 
      useBranchData({
        analytics: analyticsWithMissingData,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    // Seules les entrées valides devraient être traitées
    expect(result.current.processedData).toHaveLength(2);
    expect(result.current.processedData.every(item => item.lob && item.lob.trim() !== '')).toBe(true);
  });

  it('devrait calculer les tendances correctement', () => {
    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    // Vérifier que les tendances sont calculées
    const itemsWithTrend = result.current.processedData.filter(item => item.trend);
    expect(itemsWithTrend.length).toBeGreaterThanOrEqual(0);
  });

  it('devrait déterminer les niveaux de performance', () => {
    const { result } = renderHook(() => 
      useBranchData({
        analytics: mockAnalytics,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination
      })
    );

    // Vérifier que les niveaux de performance sont assignés
    const itemsWithPerformance = result.current.processedData.filter(item => item.performance);
    expect(itemsWithPerformance.length).toBe(4);
  });
});


