// Composants principaux
export { default as InteractiveMap } from './InteractiveMap';
export { default as MapMarker } from './MapMarker';
export { default as MapTooltip } from './MapTooltip';
export { default as MapLegend } from './MapLegend';

// Hooks personnalisés
export { useMapCoordinates, useMapViewport } from '@/hooks/useMapCoordinates';

// Utilitaires
export * from '@/utils/mapProjections';

// Types
export type { RegionData, InteractiveMapProps } from './InteractiveMap';
export type { MapMarkerProps } from './MapMarker';
export type { TooltipData, MapTooltipProps } from './MapTooltip';
export type { LegendItem, MapLegendProps } from './MapLegend';
export type { 
  MapRegion, 
  UseMapCoordinatesOptions, 
  UseMapCoordinatesReturn,
  UseMapViewportOptions,
  UseMapViewportReturn 
} from '@/hooks/useMapCoordinates';
export type {
  Coordinates,
  PixelPosition,
  MapBounds
} from '@/utils/mapProjections';

// Exemple d'utilisation (pour développement)
export { default as InteractiveMapExample } from './examples/InteractiveMapExample';
