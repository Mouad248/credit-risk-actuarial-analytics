/**
 * Types TypeScript stricts pour l'analyse des branches
 * Documentation complète des interfaces et types utilisés
 */

export type SortField = 'lob' | 'insuredName' | 'year' | 'epiMoyen' | 'ssMoyen' | 'ratioTechnique';
export type SortDirection = 'asc' | 'desc' | null;
export type SegmentType = 'TRAITES' | 'FAC';
export type ThemeMode = 'light' | 'dark';

/**
 * Configuration de tri pour le tableau
 */
export interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

/**
 * Configuration de pagination
 */
export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Configuration des filtres
 */
export interface FilterConfig {
  searchTerm: string;
  selectedYear: string;
  selectedCedants: string[];
  dateRange: {
    start: number;
    end: number;
  };
}

/**
 * Données d'une branche avec métriques calculées
 */
export interface BranchData {
  id: string;
  lob: string;
  insuredName: string;
  year: number;
  epiMoyen: number;
  ssMoyen: number; // S/P moyen (Sinistres/Primes)
  ratioTechnique: number;
  originalIndex: number;
  trend?: TrendIndicator;
  performance?: PerformanceLevel;
}

/**
 * Indicateur de tendance pour les métriques
 */
export interface TrendIndicator {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
}

/**
 * Niveau de performance basé sur les ratios
 */
export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

/**
 * Statistiques globales pour la légende
 */
export interface GlobalStats {
  totalBranches: number;
  averageRatio: number;
  bestPerformer: string;
  worstPerformer: string;
  totalEPI: number;
  yearRange: {
    min: number;
    max: number;
  };
}

/**
 * Configuration des colonnes du tableau
 */
export interface ColumnConfig {
  key: SortField;
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'percentage' | 'number' | 'text';
}

/**
 * Données de cache pour optimiser les performances
 */
export interface CacheData {
  processedData: BranchData[];
  globalStats: GlobalStats;
  availableYears: number[];
  lastUpdated: number;
  hash: string;
}

/**
 * Props pour le composant principal
 */
export interface CedantSegmentQuadrantsProps {
  cedantId: string | null | 'multiple';
  segment: SegmentType;
  analytics?: import('@/services/subscriptionService').CedantAnalytics;
  loading?: boolean;
  error?: string;
  theme?: ThemeMode;
  onDataExport?: (data: BranchData[], format: 'csv' | 'excel') => void;
}

/**
 * Props pour le hook de gestion des données
 */
export interface UseBranchDataProps {
  analytics?: import('@/services/subscriptionService').CedantAnalytics;
  filters: FilterConfig;
  sortConfig: SortConfig;
  pagination: PaginationConfig;
  enableCache?: boolean;
}

/**
 * Valeur de retour du hook de gestion des données
 */
export interface UseBranchDataReturn {
  processedData: BranchData[];
  paginatedData: BranchData[];
  globalStats: GlobalStats;
  availableYears: number[];
  loading: boolean;
  error: string | null;
  refreshData: () => void;
  clearCache: () => void;
}

/**
 * Props pour le composant de tableau
 */
export interface BranchTableProps {
  data: BranchData[];
  columns: ColumnConfig[];
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  loading?: boolean;
  theme?: ThemeMode;
  showTooltips?: boolean;
  enableAnimations?: boolean;
}

/**
 * Props pour le composant de filtres
 */
export interface BranchFiltersProps {
  searchTerm: string;
  selectedYear: string;
  availableYears: number[];
  onSearchChange: (term: string) => void;
  onYearChange: (year: string) => void;
  onClearFilters: () => void;
  globalStats: GlobalStats;
  theme?: ThemeMode;
}

/**
 * Props pour le composant de pagination
 */
export interface BranchPaginationProps {
  config: PaginationConfig;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  theme?: ThemeMode;
}

/**
 * Configuration des animations
 */
export interface AnimationConfig {
  duration: number;
  easing: string;
  stagger?: number;
}

/**
 * Configuration des tooltips
 */
export interface TooltipConfig {
  enabled: boolean;
  delay: number;
  position: 'top' | 'bottom' | 'left' | 'right';
  content: (data: BranchData) => string;
}

/**
 * Configuration du mode sombre
 */
export interface DarkModeConfig {
  enabled: boolean;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
}

/**
 * Métriques de performance pour le monitoring
 */
export interface PerformanceMetrics {
  renderTime: number;
  dataProcessingTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  lastUpdate: number;
}

/**
 * Configuration des exports
 */
export interface ExportConfig {
  formats: ('csv' | 'excel' | 'pdf')[];
  includeMetadata: boolean;
  filename: string;
  dateFormat: string;
}

/**
 * Événements du tableau pour l'analytics
 */
export interface TableEvents {
  onSort: (field: SortField, direction: SortDirection) => void;
  onFilter: (filters: FilterConfig) => void;
  onExport: (format: string, data: BranchData[]) => void;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
}
