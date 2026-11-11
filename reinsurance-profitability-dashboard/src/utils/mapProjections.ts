/**
 * Utilitaires pour la projection cartographique et le calcul de coordonnées
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Coordonnées de référence pour les principales régions géographiques
 */
export const REGION_COORDINATES: Record<string, Coordinates> = {
  // Europe
  'france': { latitude: 46.2276, longitude: 2.2137 },
  'germany': { latitude: 51.1657, longitude: 10.4515 },
  'uk': { latitude: 55.3781, longitude: -3.4360 },
  'spain': { latitude: 40.4637, longitude: -3.7492 },
  'italy': { latitude: 41.8719, longitude: 12.5674 },
  'netherlands': { latitude: 52.1326, longitude: 5.2913 },
  'belgium': { latitude: 50.5039, longitude: 4.4699 },
  'switzerland': { latitude: 46.8182, longitude: 8.2275 },
  
  // Amérique du Nord
  'usa': { latitude: 39.8283, longitude: -98.5795 },
  'canada': { latitude: 56.1304, longitude: -106.3468 },
  'mexico': { latitude: 23.6345, longitude: -102.5528 },
  
  // Asie
  'china': { latitude: 35.8617, longitude: 104.1954 },
  'japan': { latitude: 36.2048, longitude: 138.2529 },
  'india': { latitude: 20.5937, longitude: 78.9629 },
  'singapore': { latitude: 1.3521, longitude: 103.8198 },
  'thailand': { latitude: 15.8700, longitude: 100.9925 },
  
  // Afrique
  'morocco': { latitude: 31.7917, longitude: -7.0926 },
  'south_africa': { latitude: -30.5595, longitude: 22.9375 },
  'egypt': { latitude: 26.8206, longitude: 30.8025 },
  
  // Océanie
  'australia': { latitude: -25.2744, longitude: 133.7751 },
  'new_zealand': { latitude: -40.9006, longitude: 174.8860 },
  
  // Amérique du Sud
  'brazil': { latitude: -14.2350, longitude: -51.9253 },
  'argentina': { latitude: -38.4161, longitude: -63.6167 },
  'chile': { latitude: -35.6751, longitude: -71.5430 },
};

/**
 * Limites par défaut de la carte mondiale
 * Ajustées pour une projection équirectangulaire standard
 */
export const DEFAULT_MAP_BOUNDS: MapBounds = {
  north: 90,   // Pôle Nord
  south: -90,  // Pôle Sud
  east: 180,   // 180° Est
  west: -180,  // 180° Ouest
};

/**
 * Convertit des coordonnées géographiques en position pixel sur un container
 * Utilise une projection équirectangulaire simple
 */
// Positions fixes basées sur votre image de carte (en pourcentage) - FINALES
const FIXED_REGION_POSITIONS: Record<string, { x: number, y: number }> = {
  'MAROC': { x: 0.455, y: 0.200 },
  'AFRIQUE': { x: 0.530, y: 0.450 },
  'MOYEN-ORIENT': { x: 0.605, y: 0.255 },
  'ASIE': { x: 0.695, y: 0.180 },
  'AUTRE': { x: 0.490, y: 0.095 }, // Déplacé encore 5% plus bas (0.045 + 0.050 = 0.095)
};


export function coordinatesToPixels(
  coordinates: Coordinates,
  containerWidth: number,
  containerHeight: number,
  bounds: MapBounds = DEFAULT_MAP_BOUNDS
): PixelPosition {
  const { latitude, longitude } = coordinates;

  // Identifier la région basée sur les coordonnées du backend
  let regionId = '';
  
  if (Math.abs(latitude - 31.7917) < 1 && Math.abs(longitude - (-7.0926)) < 1) {
    regionId = 'MAROC';
  } else if (latitude <= -10 && longitude >= 10 && longitude <= 40) {
    regionId = 'AFRIQUE';
  } else if (latitude >= 20 && longitude >= 60 && longitude <= 80) {
    regionId = 'MOYEN-ORIENT';
  } else if (latitude >= 15 && longitude >= 90) {
    regionId = 'ASIE';
  } else if (latitude >= 45 && longitude >= 0 && longitude <= 30) {
    regionId = 'AUTRE';
  }

  // Utiliser les positions fixes optimisées
  if (regionId && FIXED_REGION_POSITIONS[regionId]) {
    const fixedPos = FIXED_REGION_POSITIONS[regionId];
    return {
      x: fixedPos.x * containerWidth,
      y: fixedPos.y * containerHeight
    };
  }

  // Fallback vers projection standard
  const clampedLat = Math.max(bounds.south, Math.min(bounds.north, latitude));
  const clampedLng = Math.max(bounds.west, Math.min(bounds.east, longitude));
  const normalizedLng = (clampedLng + 180) / 360;
  const normalizedLat = (90 - clampedLat) / 180;
  
  return {
    x: normalizedLng * containerWidth,
    y: normalizedLat * containerHeight
  };
}

/**
 * Convertit une position pixel en coordonnées géographiques
 */
export function pixelsToCoordinates(
  position: PixelPosition,
  containerWidth: number,
  containerHeight: number,
  bounds: MapBounds = DEFAULT_MAP_BOUNDS
): Coordinates {
  const { x, y } = position;
  
  const longitude = bounds.west + (x / containerWidth) * (bounds.east - bounds.west);
  const latitude = bounds.north - (y / containerHeight) * (bounds.north - bounds.south);
  
  return { latitude, longitude };
}

/**
 * Calcule la distance entre deux points géographiques (formule de Haversine)
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convertit des degrés en radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Trouve la région la plus proche d'une coordonnée donnée
 */
export function findNearestRegion(
  targetCoord: Coordinates,
  regions: Array<{ id: string; coordinates: Coordinates }>
): { id: string; distance: number } | null {
  if (regions.length === 0) return null;
  
  let nearest = regions[0];
  let minDistance = calculateDistance(targetCoord, nearest.coordinates);
  
  for (let i = 1; i < regions.length; i++) {
    const distance = calculateDistance(targetCoord, regions[i].coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = regions[i];
    }
  }
  
  return { id: nearest.id, distance: minDistance };
}

/**
 * Génère des coordonnées de référence pour un nom de région
 */
export function getRegionCoordinates(regionName: string): Coordinates | null {
  const normalizedName = regionName.toLowerCase()
    .replace(/[^a-z]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  return REGION_COORDINATES[normalizedName] || null;
}

/**
 * Calcule les limites géographiques pour un ensemble de points
 */
export function calculateBounds(coordinates: Coordinates[]): MapBounds {
  if (coordinates.length === 0) {
    return DEFAULT_MAP_BOUNDS;
  }
  
  let north = coordinates[0].latitude;
  let south = coordinates[0].latitude;
  let east = coordinates[0].longitude;
  let west = coordinates[0].longitude;
  
  coordinates.forEach(coord => {
    north = Math.max(north, coord.latitude);
    south = Math.min(south, coord.latitude);
    east = Math.max(east, coord.longitude);
    west = Math.min(west, coord.longitude);
  });
  
  // Ajouter une marge de 10%
  const latMargin = (north - south) * 0.1;
  const lngMargin = (east - west) * 0.1;
  
  return {
    north: Math.min(85, north + latMargin),
    south: Math.max(-85, south - latMargin),
    east: Math.min(180, east + lngMargin),
    west: Math.max(-180, west - lngMargin),
  };
}
