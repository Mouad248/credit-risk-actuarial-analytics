import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Zap, TrendingUp } from 'lucide-react';
import { type MapRegion } from '@/hooks/useMapCoordinates';

export interface MapMarkerProps {
  region: MapRegion;
  position: { x: number; y: number };
  isSelected: boolean;
  isHovered: boolean;
  onClick: (region: MapRegion) => void;
  onHover: (region: MapRegion | null, event?: React.MouseEvent) => void;
  onDoubleClick?: (region: MapRegion) => void;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  showPulse?: boolean;
  className?: string;
}

/**
 * Détermine la couleur en fonction de la rentabilité
 */
function getProfitabilityColor(profitability: number): string {
  if (profitability >= 15) return 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500';
  if (profitability >= 10) return 'bg-green-600 hover:bg-green-700 border-green-500';
  if (profitability >= 5) return 'bg-green-500 hover:bg-green-600 border-green-400';
  if (profitability >= 0) return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400';
  return 'bg-red-500 hover:bg-red-600 border-red-400';
}

/**
 * Détermine l'icône en fonction de la rentabilité
 */
function getProfitabilityIcon(profitability: number) {
  if (profitability >= 15) return TrendingUp;
  if (profitability >= 10) return MapPin;
  if (profitability >= 0) return MapPin;
  return MapPin;
}

/**
 * Composant MapMarker avec interactions avancées et accessibilité
 */
const MapMarker: React.FC<MapMarkerProps> = ({
  region,
  position,
  isSelected,
  isHovered,
  onClick,
  onHover,
  onDoubleClick,
  size = 'medium',
  animated = true,
  showPulse = false,
  className = ''
}) => {
  const markerRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout>();

  // Gestion du double-clic
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setClickCount(prev => prev + 1);
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    
    clickTimerRef.current = setTimeout(() => {
      if (clickCount === 0) {
        // Simple clic
        onClick(region);
      } else if (clickCount === 1 && onDoubleClick) {
        // Double clic
        onDoubleClick(region);
      }
      setClickCount(0);
    }, 250);
  }, [onClick, onDoubleClick, region, clickCount]);

  // Gestion du hover
  const handleMouseEnter = useCallback((event: React.MouseEvent) => {
    onHover(region, event);
  }, [onHover, region]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  // Gestion du clavier
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsPressed(true);
        onClick(region);
        break;
      case 'Escape':
        if (markerRef.current) {
          markerRef.current.blur();
        }
        break;
    }
  }, [onClick, region]);

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsPressed(false);
    }
  }, []);

  // Focus management
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onHover(region);
  }, [onHover, region]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setIsPressed(false);
    onHover(null);
  }, [onHover]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  // Classes CSS
  const sizeClasses = {
    small: 'w-6 h-6 p-1',
    medium: 'w-8 h-8 p-1.5',
    large: 'w-10 h-10 p-2'
  };

  const iconSizes = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  const profitabilityColor = getProfitabilityColor(region.profitability);
  const IconComponent = getProfitabilityIcon(region.profitability);

  // Animation pulse
  const pulseAnimation = showPulse || (region.profitability >= 15 && animated);

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      data-testid="map-marker"
      data-coordinates={`${region.coordinates.latitude},${region.coordinates.longitude}`}
    >
      {/* Animation de pulse en arrière-plan */}
      {pulseAnimation && (
        <div 
          className={`
            absolute inset-0 rounded-full ${profitabilityColor.split(' ')[0]} 
            animate-ping opacity-20 scale-150
          `}
        />
      )}
      
      {/* Marqueur principal */}
      <button
        ref={markerRef}
        type="button"
        className={`
          relative rounded-full border-2 text-white font-medium
          transition-all duration-200 ease-out cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          transform-gpu
          ${sizeClasses[size]}
          ${profitabilityColor}
          ${isSelected || isFocused ? 'scale-125 z-20 ring-2 ring-white shadow-lg' : 'hover:scale-110'}
          ${isPressed ? 'scale-105' : ''}
          ${animated ? 'transition-transform duration-300' : ''}
          ${className}
        `}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyUp={handleKeyUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={`Région ${region.name}, rentabilité ${region.profitability}%`}
        aria-pressed={isSelected}
        aria-describedby={`marker-${region.id}-description`}
        role="button"
        tabIndex={0}
      >
        <IconComponent className={`${iconSizes[size]} drop-shadow-sm`} />
        
        {/* Indicateur de sélection */}
        {isSelected && (
          <div className="absolute -inset-1 rounded-full border-2 border-blue-400 animate-pulse" />
        )}
        
        {/* Indicateur pour les hautes performances */}
        {region.profitability >= 15 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white">
            <Zap className="h-2 w-2 text-yellow-800 absolute top-0.5 left-0.5" />
          </div>
        )}
      </button>

      {/* Description cachée pour l'accessibilité */}
      <div 
        id={`marker-${region.id}-description`}
        className="sr-only"
      >
        Région {region.name} avec une rentabilité de {region.profitability}%. 
        {region.profitability >= 15 && 'Région haute performance. '}
        {isSelected ? 'Actuellement sélectionnée. ' : ''}
        Appuyez sur Entrée ou Espace pour sélectionner.
      </div>
    </div>
  );
};

export default MapMarker;
