
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useMapCoordinates, useMapViewport, type MapRegion } from '@/hooks/useMapCoordinates';
import { type Coordinates } from '@/utils/mapProjections';
import MapMarker from './MapMarker';
import MapTooltip, { type TooltipData } from './MapTooltip';
import MapLegend from './MapLegend';

// Types pour la carte interactive (compatible avec l'interface existante)
export interface RegionData {
  id?: string;  // Optionnel pour compatibilité
  name: string;
  profitability: number;
  coordinates: [number, number]; // [latitude, longitude]
  volume?: string;
  cedantCount?: number;
  trend?: 'up' | 'down' | 'stable';
  data?: Record<string, any>;
}

export interface InteractiveMapProps {
  data: RegionData[];
  onRegionClick?: (region: RegionData) => void;
  onRegionDoubleClick?: (region: RegionData) => void;
  selectedRegion?: string;
  height?: number;
  showControls?: boolean;
  showLegend?: boolean;
  showTooltips?: boolean;
  animated?: boolean;
  className?: string;
  fallbackMap?: 'svg' | 'image' | 'none';
}

/**
 * Convertit RegionData vers MapRegion
 */
function convertToMapRegion(data: RegionData, index: number): MapRegion {
  return {
    id: data.id || `region-${index}`, // Génère un ID si absent
    name: data.name,
    coordinates: {
      latitude: data.coordinates[0],
      longitude: data.coordinates[1],
    },
    profitability: data.profitability,
    data: { 
      volume: data.volume,
      cedantCount: data.cedantCount,
      trend: data.trend,
      ...data.data 
    },
  };
}

/**
 * Détermine la catégorie de rentabilité d'une région
 */
function getProfitabilityCategory(profitability: number): string {
  if (profitability >= 15) return 'excellent';
  if (profitability >= 10) return 'very-good';
  if (profitability >= 5) return 'good';
  if (profitability >= 0) return 'moderate';
  return 'poor';
}

/**
 * Fallback SVG amélioré pour la carte du monde
 */
const WorldMapSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 1000 500" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8"/>
      </pattern>
      <pattern id="ocean" width="60" height="30" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1" fill="#bfdbfe" opacity="0.3"/>
        <circle cx="50" cy="20" r="1" fill="#bfdbfe" opacity="0.3"/>
        <circle cx="30" cy="25" r="1" fill="#bfdbfe" opacity="0.3"/>
      </pattern>
    </defs>
    
    {/* Fond océan avec motif */}
    <rect width="100%" height="100%" fill="#f0f9ff"/>
    <rect width="100%" height="100%" fill="url(#ocean)"/>
    <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4" />
    
    {/* Amérique du Nord */}
    <path d="M120,100 Q160,80 200,85 Q250,90 300,110 Q350,120 380,140 Q370,180 340,190 Q300,185 250,175 Q200,170 160,160 Q130,150 120,100Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" />
    {/* Canada */}
    <path d="M140,60 Q180,50 220,55 Q260,60 300,70 Q340,75 370,85 Q360,110 330,115 Q290,110 250,105 Q210,100 170,95 Q140,90 140,60Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" opacity="0.9" />
    
    {/* Amérique Centrale */}
    <path d="M180,190 Q200,185 220,190 Q240,195 250,205 Q245,215 235,220 Q225,215 215,210 Q205,205 195,200 Q185,195 180,190Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" opacity="0.9" />
    
    {/* Amérique du Sud */}
    <path d="M200,230 Q230,220 260,235 Q280,250 290,280 Q295,320 285,360 Q275,400 265,430 Q255,450 245,460 Q235,455 225,445 Q215,425 210,395 Q205,365 200,335 Q195,305 195,275 Q195,250 200,230Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" />
    
    {/* Europe */}
    <path d="M480,70 Q510,60 540,65 Q570,70 590,85 Q595,100 585,115 Q575,125 565,120 Q555,115 545,110 Q535,105 525,100 Q515,95 505,90 Q495,85 485,80 Q480,75 480,70Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" />
    
    {/* Afrique */}
    <path d="M490,140 Q520,130 550,140 Q580,150 595,180 Q600,220 595,260 Q590,300 580,340 Q570,370 560,390 Q550,405 540,410 Q530,405 520,395 Q510,385 505,370 Q500,350 495,325 Q490,300 485,275 Q480,250 475,220 Q475,180 485,155 Q490,145 490,140Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" />
    
    {/* Asie */}
    <path d="M620,50 Q670,40 720,50 Q770,60 820,75 Q870,90 910,110 Q940,125 950,140 Q945,160 925,170 Q905,175 885,170 Q865,165 845,160 Q825,155 805,150 Q785,145 765,140 Q745,135 725,130 Q705,125 685,120 Q665,115 645,110 Q625,105 615,95 Q615,75 620,50Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" />
    
    {/* Inde */}
    <path d="M650,180 Q680,170 700,185 Q715,200 720,220 Q715,240 705,250 Q695,255 685,250 Q675,245 665,240 Q655,235 650,225 Q645,210 645,195 Q645,185 650,180Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" opacity="0.9" />
    
    {/* Chine */}
    <path d="M720,90 Q760,85 800,95 Q840,105 870,120 Q875,140 865,155 Q855,165 845,160 Q835,155 825,150 Q815,145 805,140 Q795,135 785,130 Q775,125 765,120 Q755,115 745,110 Q735,105 725,100 Q720,95 720,90Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" opacity="0.9" />
    
    {/* Australie */}
    <path d="M780,340 Q820,330 860,340 Q890,350 900,370 Q895,390 885,400 Q875,405 865,400 Q855,395 845,390 Q835,385 825,380 Q815,375 805,370 Q795,365 785,360 Q780,350 780,340Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9" />
    
    {/* Groenland */}
    <path d="M350,30 Q380,20 400,30 Q410,45 405,60 Q395,70 385,65 Q375,60 365,55 Q355,50 350,45 Q345,35 350,30Z" 
          fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" opacity="0.9" />
    
    {/* Lignes importantes */}
    {/* Équateur */}
    <line x1="0" y1="250" x2="1000" y2="250" stroke="#94a3b8" strokeWidth="2" opacity="0.6" strokeDasharray="10,5"/>
    {/* Méridien de Greenwich */}
    <line x1="500" y1="0" x2="500" y2="500" stroke="#94a3b8" strokeWidth="2" opacity="0.6" strokeDasharray="10,5"/>
    
    {/* Tropiques */}
    <line x1="0" y1="185" x2="1000" y2="185" stroke="#a1a1aa" strokeWidth="1" opacity="0.4" strokeDasharray="5,3"/>
    <line x1="0" y1="315" x2="1000" y2="315" stroke="#a1a1aa" strokeWidth="1" opacity="0.4" strokeDasharray="5,3"/>
    
    {/* Labels */}
    <text x="500" y="485" textAnchor="middle" fontSize="11" fill="#64748b" fontFamily="Arial, sans-serif">
      Carte mondiale avec continents stylisés
    </text>
    <text x="25" y="255" fontSize="9" fill="#64748b" fontFamily="Arial, sans-serif">Équateur</text>
    <text x="505" y="20" fontSize="9" fill="#64748b" fontFamily="Arial, sans-serif">0°</text>
  </svg>
);

/**
 * Composant InteractiveMap refactorisé avec toutes les améliorations
 */
const InteractiveMap: React.FC<InteractiveMapProps> = ({
  data,
  onRegionClick,
  onRegionDoubleClick,
  selectedRegion,
  height = 400,
  showControls = true,
  showLegend = true,
  showTooltips = true,
  animated = true,
  className = '',
  fallbackMap = 'svg'
}) => {
  const [imageError, setImageError] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [containerBounds, setContainerBounds] = useState<DOMRect | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<string[]>([
    'excellent', 'very-good', 'good', 'moderate', 'poor'
  ]);
  
  // Convertir les données
  const mapRegions = useMemo(() => {
    const regions = data.map((item, index) => convertToMapRegion(item, index));
    
    // Debug: afficher les données reçues
    console.log('🗺️ Données de régions reçues:', data);
    console.log('🎯 Régions converties:', regions);
    
    return regions;
  }, [data]);

  // Hooks personnalisés
  const {
    regionPositions,
    containerRef,
    dimensions,
    hoveredRegion,
    setHoveredRegion,
  } = useMapCoordinates(mapRegions, {
    autoFit: true,
  });

  const viewport = useMapViewport({
    minZoom: 0.5,
    maxZoom: 3,
    initialZoom: 1,
    panSensitivity: 0.3, // Sensibilité réduite (0.3 = 3x plus lent)
    maxPanDistance: 150, // Limitation du déplacement à 150px
  });

  // Mettre à jour les limites du container pour le tooltip
  useEffect(() => {
    if (containerRef.current) {
      setContainerBounds(containerRef.current.getBoundingClientRect());
    }
  }, [dimensions]);

  // Gestion globale des événements de pan
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (viewport.isDragging) {
        viewport.handlePanMove(event as any);
      }
    };

    const handleGlobalMouseUp = () => {
      if (viewport.isDragging) {
        viewport.handlePanEnd();
      }
    };

    if (viewport.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [viewport.isDragging, viewport.handlePanMove, viewport.handlePanEnd]);

  // Gestion des clics
  const handleRegionClick = useCallback((region: MapRegion) => {
    const originalRegion = data.find(r => r.id === region.id);
    if (originalRegion && onRegionClick) {
      onRegionClick(originalRegion);
    }
  }, [data, onRegionClick]);

  const handleRegionDoubleClick = useCallback((region: MapRegion) => {
    const originalRegion = data.find(r => r.id === region.id);
    if (originalRegion && onRegionDoubleClick) {
      onRegionDoubleClick(originalRegion);
    }
    // Zoom sur la région
    viewport.setCenter(region.coordinates);
    viewport.zoomIn();
  }, [data, onRegionDoubleClick, viewport]);

  // Gestion du hover avec tooltip
  const handleRegionHover = useCallback((region: MapRegion | null, event?: React.MouseEvent) => {
    setHoveredRegion(region?.id || null);
    
    if (region && showTooltips) {
      const position = regionPositions.get(region.id);
      if (position) {
        // Utiliser la position du marqueur plutôt que la position de la souris
        setTooltipPosition({
          x: position.x,
          y: position.y,
        });
        
        setTooltipData({
          title: region.name,
          subtitle: `Région ${region.id}`,
          profitability: region.profitability,
          trend: region.data?.trend,
          volume: region.data?.volume,
          cedantCount: region.data?.cedantCount,
        });
      }
    } else {
      setTooltipData(null);
    }
  }, [setHoveredRegion, showTooltips, regionPositions]);

  // Gestion des événements clavier pour l'accessibilité
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case '+':
      case '=':
        event.preventDefault();
        viewport.zoomIn();
        break;
      case '-':
      case '_':
        event.preventDefault();
        viewport.zoomOut();
        break;
      case '0':
        event.preventDefault();
        viewport.resetView();
        break;
      case 'Escape':
        setHoveredRegion(null);
        setTooltipData(null);
        break;
    }
  }, [viewport, setHoveredRegion]);

  // Rendu de l'arrière-plan de la carte
  const renderMapBackground = () => {
    // Essayer d'abord le SVG externe, puis PNG, puis SVG intégré
    if (!imageError && fallbackMap !== 'none') {
      return (
        <div className="absolute inset-0">
          <img
            src="/worldmap-bg.png"
            alt="Carte du monde"
            className="w-full h-full object-cover opacity-60"
            onError={() => {
              setImageError(true);
            }}
            loading="lazy"
            style={{ display: imageError ? 'none' : 'block' }}
          />
          {/* SVG de fallback toujours présent */}
          <div className={`absolute inset-0 ${imageError ? 'opacity-70' : 'opacity-0'}`}>
            <WorldMapSVG className="w-full h-full" />
          </div>
        </div>
      );
    }
    
    // Utiliser directement le SVG intégré
    return (
      <div className="absolute inset-0">
        <WorldMapSVG className="w-full h-full opacity-70" />
      </div>
    );
  };

  return (
    <div 
      className={`relative bg-slate-50 rounded-lg overflow-hidden border border-gray-200 ${className}`}
      style={{ height }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Carte interactive des régions"
    >
      {/* Container zoomable qui contient tout */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          transform: `scale(${viewport.zoom}) translate(${viewport.pan.x}px, ${viewport.pan.y}px)`,
          transformOrigin: 'center center',
          transition: viewport.isDragging ? 'none' : 'transform 0.3s ease-out',
          cursor: viewport.isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={viewport.handlePanStart}
        onMouseMove={viewport.handlePanMove}
        onMouseUp={viewport.handlePanEnd}
        onMouseLeave={viewport.handlePanEnd}
      >
        {/* Arrière-plan de la carte */}
        {renderMapBackground()}
        
        {/* Container principal de la carte */}
        <div 
          ref={containerRef}
          className="absolute inset-0"
        >
        {/* Marqueurs de régions */}
        {mapRegions.map((region) => {
          const position = regionPositions.get(region.id);
          // Ne pas afficher le marqueur si pas de position valide
          if (!position || position.x < 0 || position.y < 0 || 
              position.x > dimensions.width || position.y > dimensions.height) {
            return null;
          }
          
          // Vérifier si la catégorie de cette région est visible
          const category = getProfitabilityCategory(region.profitability);
          if (!visibleCategories.includes(category)) {
            return null; // Masquer le marqueur si sa catégorie est cachée
          }
          
          const isSelected = selectedRegion === region.id || selectedRegion === region.name;
          const isHovered = hoveredRegion === region.id;
        
        return (
            <MapMarker
            key={region.id}
              region={region}
              position={position}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={handleRegionClick}
              onHover={handleRegionHover}
              onDoubleClick={handleRegionDoubleClick}
              animated={animated}
              showPulse={isSelected || (region.profitability >= 15)}
            />
          );
        })}
        </div>
      </div>

      {/* Contrôles de zoom et navigation */}
      {showControls && (
        <div className="absolute top-4 left-4 z-30 flex flex-col space-y-2">
          <button
            onClick={viewport.zoomIn}
            className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors"
            aria-label="Zoomer"
            title="Zoomer (ou appuyez sur +)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={viewport.zoomOut}
            className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors"
            aria-label="Dézoomer"
            title="Dézoomer (ou appuyez sur -)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={viewport.resetView}
            className="p-2 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-sm transition-colors"
            aria-label="Réinitialiser la vue"
            title="Réinitialiser (ou appuyez sur 0)"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
            </div>
      )}
      
      {/* Légende */}
      {showLegend && (
        <MapLegend
          regions={mapRegions}
          selectedMetric="profitability"
          onFilterChange={setVisibleCategories}
          position="bottom-right"
          showStats={true}
        />
      )}

      {/* Tooltip */}
      {showTooltips && tooltipData && (
        <MapTooltip
          data={tooltipData}
          position={tooltipPosition}
          isVisible={!!tooltipData}
          containerBounds={containerBounds}
          delay={200}
        />
      )}

      {/* Indicateur de zoom et pan */}
      <div className="absolute bottom-4 left-4 z-30 bg-white/90 px-2 py-1 rounded text-xs text-gray-600">
        <div>Zoom: {Math.round(viewport.zoom * 100)}%</div>
        {viewport.zoom > 1 && (
          <div className="text-blue-600">
            🖱️ Glissez pour déplacer
          </div>
        )}
        {viewport.isDragging && (
          <div className="text-green-600">
            ✋ Déplacement...
          </div>
        )}
        {(viewport.isAtBoundary.x || viewport.isAtBoundary.y) && viewport.zoom > 1 && (
          <div className="text-orange-600">
            🚧 Limite atteinte
          </div>
        )}
      </div>


      {/* Instructions d'accessibilité */}
      <div className="sr-only">
        Carte interactive des régions. Utilisez Tab pour naviguer entre les marqueurs, 
        Entrée ou Espace pour sélectionner, + et - pour zoomer, 0 pour réinitialiser la vue.
        Double-cliquez sur un marqueur pour zoomer sur la région.
      </div>
    </div>
  );
};

export default InteractiveMap;
