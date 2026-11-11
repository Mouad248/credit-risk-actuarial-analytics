# Composants de Carte Interactive

Ce module contient une suite complète de composants pour créer des cartes interactives modernes et accessibles.

## Composants Principaux

### `InteractiveMap`
Le composant principal qui orchestre tous les autres composants de carte.

#### Fonctionnalités Principales
- ✅ **Projection cartographique correcte** avec calculs précis des coordonnées
- ✅ **Tooltips intelligentes** avec positionnement automatique anti-débordement
- ✅ **Accessibilité complète** (navigation clavier, ARIA, lecteurs d'écran)
- ✅ **Animations fluides** et interactions avancées
- ✅ **Fallback SVG** si l'image de fond n'est pas disponible
- ✅ **Zoom et pan** avec limites géographiques
- ✅ **Légende interactive** avec filtrage
- ✅ **Double-clic pour zoom** sur région
- ✅ **Performance optimisée** avec mémorisation et cache

#### Props
```typescript
interface InteractiveMapProps {
  data: RegionData[];                    // Données des régions
  onRegionClick?: (region: RegionData) => void;         // Callback clic simple
  onRegionDoubleClick?: (region: RegionData) => void;   // Callback double-clic
  selectedRegion?: string;               // ID ou nom de la région sélectionnée
  height?: number;                       // Hauteur en pixels (défaut: 400)
  showControls?: boolean;                // Afficher contrôles zoom (défaut: true)
  showLegend?: boolean;                  // Afficher légende (défaut: true)
  showTooltips?: boolean;                // Afficher tooltips (défaut: true)
  animated?: boolean;                    // Animations activées (défaut: true)
  className?: string;                    // Classes CSS supplémentaires
  fallbackMap?: 'svg' | 'image' | 'none'; // Type de fallback (défaut: 'svg')
}
```

#### Interface RegionData
```typescript
interface RegionData {
  id?: string;                  // ID unique (optionnel, généré automatiquement)
  name: string;                 // Nom de la région
  profitability: number;        // Rentabilité en %
  coordinates: [number, number]; // [latitude, longitude]
  volume?: string;              // Volume d'affaires (ex: "€2.5M")
  cedantCount?: number;         // Nombre de cédantes
  trend?: 'up' | 'down' | 'stable'; // Tendance
  data?: Record<string, any>;   // Données supplémentaires
}
```

#### Utilisation Basique
```tsx
import InteractiveMap from '@/components/maps/InteractiveMap';

const regions = [
  {
    name: "France",
    profitability: 12.5,
    coordinates: [46.2276, 2.2137],
    volume: "€15.2M",
    cedantCount: 12,
    trend: "up"
  },
  // ... autres régions
];

<InteractiveMap 
  data={regions}
  onRegionClick={(region) => console.log('Région cliquée:', region)}
  selectedRegion="France"
  height={500}
/>
```

#### Utilisation Avancée
```tsx
<InteractiveMap 
  data={regions}
  onRegionClick={handleRegionSelect}
  onRegionDoubleClick={handleRegionZoom}
  selectedRegion={selectedRegionId}
  height={600}
  showControls={true}
  showLegend={true}
  showTooltips={true}
  animated={true}
  fallbackMap="svg"
  className="custom-map-styles"
/>
```

### `MapMarker`
Composant pour les marqueurs individuels sur la carte.

#### Fonctionnalités
- Navigation clavier (Tab, Enter, Espace, Échap)
- Animations de hover et sélection
- Indicateurs visuels pour les hautes performances
- Support double-clic avec gestion des délais
- Couleurs automatiques basées sur la rentabilité

#### Accessibilité
- `role="button"` et attributs ARIA appropriés
- Support lecteurs d'écran avec descriptions
- Navigation clavier complète
- Focus visible et gestion des états

### `MapTooltip`
Tooltip intelligent avec positionnement automatique.

#### Fonctionnalités
- Positionnement anti-débordement
- Délai d'apparition configurable
- Contenu enrichi (tendances, volumes, statistiques)
- Animation d'apparition/disparition
- Flèche pointant vers la source

#### Positions Automatiques
Le tooltip se positionne automatiquement pour éviter les débordements :
- `top`, `bottom`, `left`, `right`
- `top-left`, `top-right`, `bottom-left`, `bottom-right`

### `MapLegend`
Légende interactive avec filtrage et statistiques.

#### Fonctionnalités
- Statistiques globales (moyenne, min/max, total)
- Filtrage interactif par catégorie
- Position configurable
- Mode réduit/développé
- Sélecteur de métriques

#### Positions Disponibles
- `top-left`, `top-right`
- `bottom-left`, `bottom-right`
- `bottom-center`

## Hooks Personnalisés

### `useMapCoordinates`
Hook pour la gestion des coordonnées et positions sur la carte.

```typescript
const {
  regionPositions,     // Map<string, PixelPosition>
  bounds,             // MapBounds
  containerRef,       // RefObject<HTMLDivElement>
  dimensions,         // { width: number, height: number }
  hoveredRegion,      // string | null
  setHoveredRegion,   // (id: string | null) => void
  clearCache,         // () => void
  updateDimensions,   // () => void
} = useMapCoordinates(regions, options);
```

### `useMapViewport`
Hook pour la gestion du zoom et du pan.

```typescript
const {
  zoom,         // number
  center,       // Coordinates
  setZoom,      // (zoom: number) => void
  setCenter,    // (center: Coordinates) => void
  zoomIn,       // () => void
  zoomOut,      // () => void
  resetView,    // () => void
  fitToBounds,  // (bounds: MapBounds) => void
} = useMapViewport(options);
```

## Utilitaires de Projection

### `mapProjections.ts`
Fonctions utilitaires pour les calculs cartographiques.

#### Fonctions Principales
- `coordinatesToPixels()` - Conversion coordonnées → pixels
- `pixelsToCoordinates()` - Conversion pixels → coordonnées  
- `calculateDistance()` - Distance entre deux points (Haversine)
- `findNearestRegion()` - Trouve la région la plus proche
- `calculateBounds()` - Calcul des limites géographiques

#### Coordonnées de Référence
Le module inclut des coordonnées pré-définies pour les principales régions mondiales.

## Contrôles Clavier

### Navigation
- **Tab** : Navigation entre les marqueurs
- **Enter / Espace** : Sélection d'un marqueur
- **Échap** : Fermer les tooltips et perdre le focus

### Zoom
- **+** : Zoomer
- **-** : Dézoomer  
- **0** : Réinitialiser la vue
- **Double-clic** : Zoomer sur la région

## Performance

### Optimisations Intégrées
- Mémorisation des calculs avec `useMemo`
- Cache des positions calculées
- Observateur de redimensionnement efficace
- Rendu conditionnel des composants coûteux
- Lazy loading de l'image de fond

### Considérations
- Idéal pour 5-50 marqueurs
- Au-delà de 50 marqueurs, considérer la virtualisation
- Le cache est automatiquement vidé lors des changements de dimensions

## Personalisation

### Styles CSS
Les composants utilisent Tailwind CSS et peuvent être personnalisés via :
- Props `className`
- Variables CSS pour les couleurs
- Overrides des classes Tailwind

### Couleurs de Rentabilité
```typescript
// Seuils par défaut
profitability >= 15  → Vert foncé (excellent)
profitability >= 10  → Vert (très bon)  
profitability >= 5   → Vert clair (bon)
profitability >= 0   → Jaune (modéré)
profitability < 0    → Rouge (faible)
```

## Migration depuis l'Ancien Composant

### Changements d'Interface
L'interface `RegionData` est **rétro-compatible**. Les propriétés `id`, `volume`, `cedantCount`, `trend` sont optionnelles.

### Nouvelles Fonctionnalités
```tsx
// Ancien composant
<InteractiveMap 
  data={regions}
  onRegionClick={handleClick}
  selectedRegion="France"
/>

// Nouveau composant (rétro-compatible)
<InteractiveMap 
  data={regions}
  onRegionClick={handleClick}
  selectedRegion="France"
  // + nouvelles props optionnelles
  onRegionDoubleClick={handleDoubleClick}
  height={500}
  showControls={true}
  animated={true}
/>
```

## Exemples d'Usage

### Carte Basique
```tsx
<InteractiveMap 
  data={regions}
  onRegionClick={selectRegion}
  selectedRegion={selectedId}
/>
```

### Carte avec Toutes les Fonctionnalités
```tsx
<InteractiveMap 
  data={enrichedRegions}
  onRegionClick={handleSelection}
  onRegionDoubleClick={handleZoom}
  selectedRegion={selectedRegion}
  height={600}
  showControls={true}
  showLegend={true}
  showTooltips={true}
  animated={true}
  fallbackMap="svg"
  className="border-2 border-gray-300"
/>
```

### Carte Minimale (Performance)
```tsx
<InteractiveMap 
  data={regions}
  onRegionClick={handleClick}
  showControls={false}
  showLegend={false}
  showTooltips={false}
  animated={false}
  fallbackMap="none"
  height={300}
/>
```

## Tests et Validation

### Tests Recommandés
- Navigation clavier complète
- Redimensionnement de fenêtre
- Performance avec nombreux marqueurs
- Accessibilité avec lecteurs d'écran
- Fonctionnement sans image de fond

### Métriques de Performance
- Temps de rendu initial < 100ms
- Temps de réponse interactions < 16ms
- Mémoire stable lors du redimensionnement
- Pas de fuites mémoire sur changements de données
