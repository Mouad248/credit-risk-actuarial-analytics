import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MapDebugInfoProps {
  data: any[];
  regionPositions: Map<string, { x: number; y: number }>;
  dimensions: { width: number; height: number };
  imageError: boolean;
  className?: string;
}

/**
 * Composant de débogage pour diagnostiquer les problèmes de la carte
 */
const MapDebugInfo: React.FC<MapDebugInfoProps> = ({
  data,
  regionPositions,
  dimensions,
  imageError,
  className = ''
}) => {
  const validPositions = Array.from(regionPositions.entries()).filter(([_, pos]) => 
    pos.x >= 0 && pos.y >= 0 && pos.x <= dimensions.width && pos.y <= dimensions.height
  );

  return (
    <Card className={`${className} max-w-md`}>
      <CardHeader>
        <CardTitle className="text-sm">🔍 Informations de Débogage - Carte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* État de l'image */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Image de fond :</span>
          <Badge variant={imageError ? "destructive" : "default"}>
            {imageError ? "❌ Erreur" : "✅ OK"}
          </Badge>
        </div>

        {/* Dimensions du conteneur */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Dimensions :</span>
          <span className="text-sm font-mono">
            {dimensions.width} × {dimensions.height}px
          </span>
        </div>

        {/* Données des régions */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Régions chargées :</span>
          <Badge variant="outline">{data.length}</Badge>
        </div>

        {/* Positions calculées */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Positions calculées :</span>
          <Badge variant="outline">{regionPositions.size}</Badge>
        </div>

        {/* Positions valides */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Positions valides :</span>
          <Badge variant={validPositions.length > 0 ? "default" : "destructive"}>
            {validPositions.length}
          </Badge>
        </div>

        {/* Détails des régions */}
        {data.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-900">Détails des Régions :</span>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {data.slice(0, 5).map((region, index) => {
                const position = regionPositions.get(region.id || `region-${index}`);
                const isValid = position && 
                  position.x >= 0 && position.y >= 0 && 
                  position.x <= dimensions.width && position.y <= dimensions.height;
                
                return (
                  <div key={region.id || index} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{region.name}</span>
                      <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
                        {isValid ? "✅" : "❌"}
                      </Badge>
                    </div>
                    <div className="text-gray-600 mt-1">
                      Coord: [{region.coordinates[0]}, {region.coordinates[1]}]
                    </div>
                    {position && (
                      <div className="text-gray-600">
                        Pos: [{Math.round(position.x)}, {Math.round(position.y)}]
                      </div>
                    )}
                  </div>
                );
              })}
              {data.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  ... et {data.length - 5} autres régions
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages d'aide */}
        {imageError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            ⚠️ L'image de fond ne peut pas être chargée. Le fallback SVG sera utilisé.
          </div>
        )}

        {validPositions.length === 0 && data.length > 0 && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ Aucun marqueur n'est dans la zone visible. Vérifiez les coordonnées.
          </div>
        )}

        {dimensions.width === 0 || dimensions.height === 0 && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            ❌ Dimensions du conteneur invalides. La carte ne peut pas s'afficher.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapDebugInfo;
