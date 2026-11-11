import React, { useState } from 'react';
import InteractiveMap, { type RegionData } from '../InteractiveMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Données d'exemple avec toutes les propriétés
const exampleRegions: RegionData[] = [
  {
    id: 'FR',
    name: 'France',
    profitability: 12.5,
    coordinates: [46.2276, 2.2137],
    volume: '€15.2M',
    cedantCount: 12,
    trend: 'up',
    data: {
      marketShare: 15.3,
      growthRate: 8.2,
      riskLevel: 'low',
      lastUpdate: '2024-01-15'
    }
  },
  {
    id: 'DE',
    name: 'Allemagne',
    profitability: 8.3,
    coordinates: [51.1657, 10.4515],
    volume: '€22.1M',
    cedantCount: 18,
    trend: 'stable',
    data: {
      marketShare: 22.1,
      growthRate: 2.1,
      riskLevel: 'medium',
      lastUpdate: '2024-01-14'
    }
  },
  {
    id: 'UK',
    name: 'Royaume-Uni',
    profitability: 15.7,
    coordinates: [55.3781, -3.4360],
    volume: '€18.9M',
    cedantCount: 15,
    trend: 'up',
    data: {
      marketShare: 18.9,
      growthRate: 12.3,
      riskLevel: 'low',
      lastUpdate: '2024-01-16'
    }
  },
  {
    id: 'ES',
    name: 'Espagne',
    profitability: 6.2,
    coordinates: [40.4637, -3.7492],
    volume: '€9.5M',
    cedantCount: 8,
    trend: 'down',
    data: {
      marketShare: 9.5,
      growthRate: -3.1,
      riskLevel: 'medium',
      lastUpdate: '2024-01-13'
    }
  },
  {
    id: 'IT',
    name: 'Italie',
    profitability: 4.1,
    coordinates: [41.8719, 12.5674],
    volume: '€11.2M',
    cedantCount: 10,
    trend: 'stable',
    data: {
      marketShare: 11.2,
      growthRate: 0.5,
      riskLevel: 'medium',
      lastUpdate: '2024-01-12'
    }
  },
  {
    id: 'JP',
    name: 'Japon',
    profitability: 18.3,
    coordinates: [36.2048, 138.2529],
    volume: '€28.7M',
    cedantCount: 22,
    trend: 'up',
    data: {
      marketShare: 28.7,
      growthRate: 15.8,
      riskLevel: 'low',
      lastUpdate: '2024-01-17'
    }
  },
  {
    id: 'US',
    name: 'États-Unis',
    profitability: 11.9,
    coordinates: [39.8283, -98.5795],
    volume: '€45.3M',
    cedantCount: 35,
    trend: 'up',
    data: {
      marketShare: 45.3,
      growthRate: 7.6,
      riskLevel: 'low',
      lastUpdate: '2024-01-18'
    }
  },
  {
    id: 'BR',
    name: 'Brésil',
    profitability: -2.1,
    coordinates: [-14.2350, -51.9253],
    volume: '€6.8M',
    cedantCount: 5,
    trend: 'down',
    data: {
      marketShare: 6.8,
      growthRate: -8.3,
      riskLevel: 'high',
      lastUpdate: '2024-01-10'
    }
  },
  {
    id: 'CN',
    name: 'Chine',
    profitability: 9.7,
    coordinates: [35.8617, 104.1954],
    volume: '€31.2M',
    cedantCount: 28,
    trend: 'stable',
    data: {
      marketShare: 31.2,
      growthRate: 1.8,
      riskLevel: 'medium',
      lastUpdate: '2024-01-16'
    }
  },
  {
    id: 'AU',
    name: 'Australie',
    profitability: 14.2,
    coordinates: [-25.2744, 133.7751],
    volume: '€12.4M',
    cedantCount: 9,
    trend: 'up',
    data: {
      marketShare: 12.4,
      growthRate: 9.1,
      riskLevel: 'low',
      lastUpdate: '2024-01-15'
    }
  }
];

/**
 * Composant d'exemple montrant toutes les fonctionnalités d'InteractiveMap
 */
const InteractiveMapExample: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [mapConfig, setMapConfig] = useState({
    height: 500,
    showControls: true,
    showLegend: true,
    showTooltips: true,
    animated: true,
    fallbackMap: 'svg' as const,
  });

  const handleRegionClick = (region: RegionData) => {
    setSelectedRegion(region);
    console.log('Région sélectionnée:', region);
  };

  const handleRegionDoubleClick = (region: RegionData) => {
    console.log('Double-clic sur région:', region);
    // Ici on pourrait ouvrir une vue détaillée ou zoomer
  };

  const getTrendBadge = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <Badge variant="default" className="bg-green-100 text-green-800">↗ Hausse</Badge>;
      case 'down':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">↘ Baisse</Badge>;
      case 'stable':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">→ Stable</Badge>;
      default:
        return null;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="default" className="bg-green-100 text-green-800">Faible</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Moyen</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Élevé</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const resetSelection = () => {
    setSelectedRegion(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Exemple Complet - Carte Interactive
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Cet exemple démontre toutes les fonctionnalités de la carte interactive : 
          navigation clavier, tooltips intelligentes, zoom, légende interactive, 
          et bien plus encore.
        </p>
      </div>

      {/* Contrôles de configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration de la Carte</CardTitle>
          <CardDescription>
            Personnalisez l'affichage et le comportement de la carte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hauteur (px)</label>
              <input
                type="range"
                min="300"
                max="800"
                step="50"
                value={mapConfig.height}
                onChange={(e) => setMapConfig(prev => ({ 
                  ...prev, 
                  height: parseInt(e.target.value) 
                }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{mapConfig.height}px</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contrôles</label>
              <Button
                variant={mapConfig.showControls ? "default" : "outline"}
                onClick={() => setMapConfig(prev => ({ 
                  ...prev, 
                  showControls: !prev.showControls 
                }))}
                className="w-full"
              >
                {mapConfig.showControls ? 'Activés' : 'Désactivés'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Légende</label>
              <Button
                variant={mapConfig.showLegend ? "default" : "outline"}
                onClick={() => setMapConfig(prev => ({ 
                  ...prev, 
                  showLegend: !prev.showLegend 
                }))}
                className="w-full"
              >
                {mapConfig.showLegend ? 'Visible' : 'Cachée'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Animations</label>
              <Button
                variant={mapConfig.animated ? "default" : "outline"}
                onClick={() => setMapConfig(prev => ({ 
                  ...prev, 
                  animated: !prev.animated 
                }))}
                className="w-full"
              >
                {mapConfig.animated ? 'Activées' : 'Désactivées'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carte interactive */}
      <Card>
        <CardHeader>
          <CardTitle>Carte Mondiale - Rentabilité par Région</CardTitle>
          <CardDescription>
            Cliquez sur une région pour voir les détails. Double-cliquez pour zoomer.
            Utilisez +/- pour zoomer, 0 pour réinitialiser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InteractiveMap
            data={exampleRegions}
            onRegionClick={handleRegionClick}
            onRegionDoubleClick={handleRegionDoubleClick}
            selectedRegion={selectedRegion?.id}
            height={mapConfig.height}
            showControls={mapConfig.showControls}
            showLegend={mapConfig.showLegend}
            showTooltips={mapConfig.showTooltips}
            animated={mapConfig.animated}
            fallbackMap={mapConfig.fallbackMap}
            className="border-2 border-gray-100"
          />
        </CardContent>
      </Card>

      {/* Détails de la région sélectionnée */}
      {selectedRegion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{selectedRegion.name}</span>
                  {getTrendBadge(selectedRegion.trend)}
                </CardTitle>
                <CardDescription>
                  Détails complets de la région sélectionnée
                </CardDescription>
              </div>
              <Button variant="outline" onClick={resetSelection}>
                Fermer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Métriques principales */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Métriques Principales</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rentabilité:</span>
                    <span className={`font-medium ${
                      selectedRegion.profitability >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedRegion.profitability > 0 ? '+' : ''}{selectedRegion.profitability}%
                    </span>
                  </div>
                  
                  {selectedRegion.volume && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume:</span>
                      <span className="font-medium">{selectedRegion.volume}</span>
                    </div>
                  )}
                  
                  {selectedRegion.cedantCount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cédantes:</span>
                      <span className="font-medium">{selectedRegion.cedantCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Données supplémentaires */}
              {selectedRegion.data && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Informations Additionnelles</h4>
                  <div className="space-y-2">
                    {selectedRegion.data.marketShare && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Part de marché:</span>
                        <span className="font-medium">{selectedRegion.data.marketShare}%</span>
                      </div>
                    )}
                    
                    {selectedRegion.data.growthRate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taux de croissance:</span>
                        <span className={`font-medium ${
                          selectedRegion.data.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedRegion.data.growthRate > 0 ? '+' : ''}{selectedRegion.data.growthRate}%
                        </span>
                      </div>
                    )}
                    
                    {selectedRegion.data.riskLevel && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Niveau de risque:</span>
                        {getRiskBadge(selectedRegion.data.riskLevel)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informations géographiques */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Localisation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latitude:</span>
                    <span className="font-medium font-mono">
                      {selectedRegion.coordinates[0].toFixed(4)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Longitude:</span>
                    <span className="font-medium font-mono">
                      {selectedRegion.coordinates[1].toFixed(4)}°
                    </span>
                  </div>
                  
                  {selectedRegion.data?.lastUpdate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dernière MAJ:</span>
                      <span className="font-medium">
                        {new Date(selectedRegion.data.lastUpdate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions d'Utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Navigation Souris</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• <strong>Clic simple</strong> : Sélectionner une région</li>
                <li>• <strong>Double-clic</strong> : Zoomer sur la région</li>
                <li>• <strong>Survol</strong> : Afficher les informations</li>
                <li>• <strong>Boutons zoom</strong> : Contrôler l'affichage</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Navigation Clavier</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• <strong>Tab</strong> : Naviguer entre les marqueurs</li>
                <li>• <strong>Entrée/Espace</strong> : Sélectionner une région</li>
                <li>• <strong>+/-</strong> : Zoomer/Dézoomer</li>
                <li>• <strong>0</strong> : Réinitialiser la vue</li>
                <li>• <strong>Échap</strong> : Fermer les tooltips</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveMapExample;
