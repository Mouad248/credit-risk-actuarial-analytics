import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { 
  coordinatesToPixels, 
  pixelsToCoordinates, 
  calculateBounds,
  type Coordinates, 
  type PixelPosition, 
  type MapBounds,
  DEFAULT_MAP_BOUNDS 
} from '@/utils/mapProjections';

export interface MapRegion {
  id: string;
  name: string;
  coordinates: Coordinates;
  profitability: number;
  data?: Record<string, any>;
}

export interface UseMapCoordinatesOptions {
  containerWidth?: number;
  containerHeight?: number;
  customBounds?: MapBounds;
  autoFit?: boolean;
}

export interface UseMapCoordinatesReturn {
  // Positions calculées
  regionPositions: Map<string, PixelPosition>;
  bounds: MapBounds;
  
  // Fonctions de conversion
  coordinatesToPixels: (coords: Coordinates) => PixelPosition;
  pixelsToCoordinates: (position: PixelPosition) => Coordinates;
  
  // Gestion des dimensions
  containerRef: React.RefObject<HTMLDivElement>;
  dimensions: { width: number; height: number };
  
  // État interactif
  hoveredRegion: string | null;
  setHoveredRegion: (regionId: string | null) => void;
  
  // Cache et performance
  clearCache: () => void;
  updateDimensions: () => void;
}

/**
 * Hook personnalisé pour gérer les coordonnées et positions sur une carte interactive
 */
export function useMapCoordinates(
  regions: MapRegion[],
  options: UseMapCoordinatesOptions = {}
): UseMapCoordinatesReturn {
  const {
    containerWidth: defaultWidth = 1137,
    containerHeight: defaultHeight = 399,
    customBounds,
    autoFit = true
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ 
    width: defaultWidth, 
    height: defaultHeight 
  });
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [positionCache, setPositionCache] = useState(new Map<string, PixelPosition>());

  // Utiliser toujours les limites standard de la carte mondiale
  const bounds = useMemo((): MapBounds => {
    // Ignorer autoFit et toujours utiliser les limites mondiales standard
    return DEFAULT_MAP_BOUNDS;
  }, []);

  // Fonction pour mettre à jour les dimensions
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.round(rect.width);
      const newHeight = Math.round(rect.height);
      
      // Ne mettre à jour que si les dimensions ont réellement changé
      setDimensions(prev => {
        if (prev.width === newWidth && prev.height === newHeight) {
          return prev;
        }
        console.log('📐 Mise à jour dimensions:', { width: newWidth, height: newHeight });
        return { width: newWidth, height: newHeight };
      });
    }
  }, []);

  // Observer les changements de taille
  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);

  // Mise à jour initiale des dimensions
  useEffect(() => {
    updateDimensions();
  }, [updateDimensions]);

  // Calculer les positions des régions avec cache et debug détaillé
  const regionPositions = useMemo((): Map<string, PixelPosition> => {
    const positions = new Map<string, PixelPosition>();
    
    // Vérifier que nous avons des dimensions valides
    if (dimensions.width === 0 || dimensions.height === 0) {
      console.log('⚠️ Dimensions invalides:', dimensions);
      return positions;
    }
    
    regions.forEach(region => {
      const position = coordinatesToPixels(
        region.coordinates,
        dimensions.width,
        dimensions.height,
        bounds
      );
      
      positions.set(region.id, position);
    });
    
    return positions;
  }, [regions, dimensions, bounds]);

  // Fonction de conversion coordonnées -> pixels
  const coordToPixels = useCallback((coords: Coordinates): PixelPosition => {
    return coordinatesToPixels(coords, dimensions.width, dimensions.height, bounds);
  }, [dimensions, bounds]);

  // Fonction de conversion pixels -> coordonnées
  const pixelToCoords = useCallback((position: PixelPosition): Coordinates => {
    return pixelsToCoordinates(position, dimensions.width, dimensions.height, bounds);
  }, [dimensions, bounds]);

  // Fonction pour vider le cache
  const clearCache = useCallback(() => {
    setPositionCache(new Map());
  }, []);

  return {
    regionPositions,
    bounds,
    coordinatesToPixels: coordToPixels,
    pixelsToCoordinates: pixelToCoords,
    containerRef,
    dimensions,
    hoveredRegion,
    setHoveredRegion,
    clearCache,
    updateDimensions,
  };
}

/**
 * Hook pour gérer l'état de zoom et pan de la carte
 */
export interface UseMapViewportOptions {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  initialCenter?: Coordinates;
  panSensitivity?: number; // Sensibilité du pan (0.1 = très lent, 1 = normal, 2 = rapide)
  maxPanDistance?: number; // Distance maximum de déplacement en pixels
}

export interface UseMapViewportReturn {
  zoom: number;
  center: Coordinates;
  pan: { x: number; y: number };
  setZoom: (zoom: number) => void;
  setCenter: (center: Coordinates) => void;
  setPan: (pan: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToBounds: (bounds: MapBounds) => void;
  handlePanStart: (event: React.MouseEvent) => void;
  handlePanMove: (event: React.MouseEvent) => void;
  handlePanEnd: () => void;
  isDragging: boolean;
  isAtBoundary: { x: boolean; y: boolean };
}

export function useMapViewport(options: UseMapViewportOptions = {}): UseMapViewportReturn {
  const {
    minZoom = 0.5,
    maxZoom = 5,
    initialZoom = 1,
    initialCenter = { latitude: 20, longitude: 0 },
    panSensitivity = 0.5,
    maxPanDistance = 200
  } = options;

  const [zoom, setZoomState] = useState(initialZoom);
  const [center, setCenterState] = useState(initialCenter);
  const [pan, setPanState] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isAtBoundary, setIsAtBoundary] = useState({ x: false, y: false });

  const setZoom = useCallback((newZoom: number) => {
    setZoomState(Math.max(minZoom, Math.min(maxZoom, newZoom)));
  }, [minZoom, maxZoom]);

  const setCenter = useCallback((newCenter: Coordinates) => {
    setCenterState(newCenter);
  }, []);

  const setPan = useCallback((newPan: { x: number; y: number }) => {
    setPanState(newPan);
  }, []);

  // Gestion du déplacement par glisser-déposer
  const handlePanStart = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    event.preventDefault();
  }, []);

  const handlePanMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    // Utiliser la sensibilité configurée
    setPanState(prev => {
      const proposedX = prev.x + (deltaX * panSensitivity);
      const proposedY = prev.y + (deltaY * panSensitivity);
      
      // Calculer les limites dynamiques basées sur le zoom
      // Plus on zoome, plus on peut se déplacer, mais on garde toujours 25% de la carte visible
      const scaleFactor = zoom;
      const maxPanX = Math.max(0, (scaleFactor - 1) * maxPanDistance);
      const maxPanY = Math.max(0, (scaleFactor - 1) * maxPanDistance);
      
      // Vérifier si le mouvement est autorisé dans chaque direction
      let newX = prev.x;
      let newY = prev.y;
      
      // Déplacement horizontal seulement si on n'est pas déjà à la limite
      if ((deltaX > 0 && prev.x < maxPanX) || (deltaX < 0 && prev.x > -maxPanX)) {
        newX = Math.max(-maxPanX, Math.min(maxPanX, proposedX));
      }
      
      // Déplacement vertical seulement si on n'est pas déjà à la limite
      if ((deltaY > 0 && prev.y < maxPanY) || (deltaY < 0 && prev.y > -maxPanY)) {
        newY = Math.max(-maxPanY, Math.min(maxPanY, proposedY));
      }
      
      // Détecter si on est aux limites
      const atBoundaryX = Math.abs(newX) >= maxPanX - 5; // 5px de tolérance
      const atBoundaryY = Math.abs(newY) >= maxPanY - 5;
      setIsAtBoundary({ x: atBoundaryX, y: atBoundaryY });
      
      return { x: newX, y: newY };
    });

    setDragStart({ x: event.clientX, y: event.clientY });
    event.preventDefault();
  }, [isDragging, dragStart, panSensitivity, maxPanDistance, zoom]);

  const handlePanEnd = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(zoom * 1.2);
  }, [zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(zoom / 1.2);
  }, [zoom, setZoom]);

  const resetView = useCallback(() => {
    setZoom(initialZoom);
    setCenter(initialCenter);
    setPan({ x: 0, y: 0 });
    setIsAtBoundary({ x: false, y: false });
  }, [initialZoom, initialCenter]);

  const fitToBounds = useCallback((bounds: MapBounds) => {
    // Calculer le zoom et le centre pour ajuster aux limites
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    
    setCenter({ latitude: centerLat, longitude: centerLng });
    
    // Calculer le zoom basé sur la taille des limites
    const latRange = bounds.north - bounds.south;
    const lngRange = bounds.east - bounds.west;
    const maxRange = Math.max(latRange, lngRange);
    
    // Zoom inversement proportionnel à la taille de la zone
    const newZoom = Math.max(minZoom, Math.min(maxZoom, 180 / maxRange));
    setZoom(newZoom);
  }, [setZoom, setCenter, minZoom, maxZoom]);

  return {
    zoom,
    center,
    pan,
    setZoom,
    setCenter,
    setPan,
    zoomIn,
    zoomOut,
    resetView,
    fitToBounds,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    isDragging,
    isAtBoundary,
  };
}
