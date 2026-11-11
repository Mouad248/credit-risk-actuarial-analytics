import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InteractiveMap, { type RegionData } from '../InteractiveMap';

// Mock des hooks personnalisés
jest.mock('@/hooks/useMapCoordinates', () => ({
  useMapCoordinates: () => ({
    regionPositions: new Map([
      ['region-0', { x: 100, y: 100 }],
      ['region-1', { x: 200, y: 150 }],
    ]),
    containerRef: { current: null },
    dimensions: { width: 800, height: 400 },
    hoveredRegion: null,
    setHoveredRegion: jest.fn(),
  }),
  useMapViewport: () => ({
    zoom: 1,
    center: { latitude: 0, longitude: 0 },
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    resetView: jest.fn(),
    setZoom: jest.fn(),
    setCenter: jest.fn(),
    fitToBounds: jest.fn(),
  }),
}));

// Données de test
const mockRegions: RegionData[] = [
  {
    name: 'France',
    profitability: 12.5,
    coordinates: [46.2276, 2.2137],
    volume: '€15.2M',
    cedantCount: 12,
    trend: 'up',
  },
  {
    name: 'Germany',
    profitability: 8.3,
    coordinates: [51.1657, 10.4515],
    volume: '€22.1M',
    cedantCount: 18,
    trend: 'stable',
  },
];

describe('InteractiveMap', () => {
  const mockOnRegionClick = jest.fn();
  const mockOnRegionDoubleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    it('rend le composant sans erreur', () => {
      render(
        <InteractiveMap 
          data={mockRegions}
          onRegionClick={mockOnRegionClick}
        />
      );
      
      expect(screen.getByRole('application')).toBeInTheDocument();
      expect(screen.getByLabelText('Carte interactive des régions')).toBeInTheDocument();
    });

    it('affiche les contrôles de zoom par défaut', () => {
      render(<InteractiveMap data={mockRegions} />);
      
      expect(screen.getByLabelText('Zoomer')).toBeInTheDocument();
      expect(screen.getByLabelText('Dézoomer')).toBeInTheDocument();
      expect(screen.getByLabelText('Réinitialiser la vue')).toBeInTheDocument();
    });

    it('cache les contrôles quand showControls est false', () => {
      render(<InteractiveMap data={mockRegions} showControls={false} />);
      
      expect(screen.queryByLabelText('Zoomer')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Dézoomer')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('appelle onRegionClick quand une région est cliquée', async () => {
      render(
        <InteractiveMap 
          data={mockRegions}
          onRegionClick={mockOnRegionClick}
        />
      );
      
      const regionButtons = screen.getAllByRole('button');
      const franceRegion = regionButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('France')
      );
      
      expect(franceRegion).toBeInTheDocument();
      
      if (franceRegion) {
        fireEvent.click(franceRegion);
        
        await waitFor(() => {
          expect(mockOnRegionClick).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'France',
              profitability: 12.5,
            })
          );
        });
      }
    });

    it('appelle onRegionDoubleClick sur double-clic', async () => {
      render(
        <InteractiveMap 
          data={mockRegions}
          onRegionClick={mockOnRegionClick}
          onRegionDoubleClick={mockOnRegionDoubleClick}
        />
      );
      
      const regionButtons = screen.getAllByRole('button');
      const franceRegion = regionButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('France')
      );
      
      if (franceRegion) {
        fireEvent.doubleClick(franceRegion);
        
        await waitFor(() => {
          expect(mockOnRegionDoubleClick).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'France',
            })
          );
        });
      }
    });
  });

  describe('Navigation clavier', () => {
    it('permet la navigation avec Tab', async () => {
      const user = userEvent.setup();
      
      render(<InteractiveMap data={mockRegions} />);
      
      // Focus sur le conteneur principal
      const mapContainer = screen.getByRole('application');
      await user.tab();
      
      expect(mapContainer).toHaveFocus();
    });

    it('active une région avec Enter', async () => {
      const user = userEvent.setup();
      
      render(
        <InteractiveMap 
          data={mockRegions}
          onRegionClick={mockOnRegionClick}
        />
      );
      
      const regionButtons = screen.getAllByRole('button');
      const franceRegion = regionButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('France')
      );
      
      if (franceRegion) {
        franceRegion.focus();
        await user.keyboard('{Enter}');
        
        expect(mockOnRegionClick).toHaveBeenCalled();
      }
    });

    it('active une région avec Espace', async () => {
      const user = userEvent.setup();
      
      render(
        <InteractiveMap 
          data={mockRegions}
          onRegionClick={mockOnRegionClick}
        />
      );
      
      const regionButtons = screen.getAllByRole('button');
      const franceRegion = regionButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('France')
      );
      
      if (franceRegion) {
        franceRegion.focus();
        await user.keyboard(' ');
        
        expect(mockOnRegionClick).toHaveBeenCalled();
      }
    });
  });

  describe('Accessibilité', () => {
    it('a les attributs ARIA appropriés', () => {
      render(<InteractiveMap data={mockRegions} />);
      
      const mapContainer = screen.getByRole('application');
      expect(mapContainer).toHaveAttribute('aria-label', 'Carte interactive des régions');
      
      const regionButtons = screen.getAllByRole('button');
      regionButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('fournit des descriptions pour les lecteurs d\'écran', () => {
      render(<InteractiveMap data={mockRegions} />);
      
      // Vérifie la présence des instructions d'accessibilité
      expect(screen.getByText(/Carte interactive des régions/)).toBeInTheDocument();
      expect(screen.getByText(/Utilisez Tab pour naviguer/)).toBeInTheDocument();
    });
  });

  describe('Légende', () => {
    it('affiche la légende par défaut', () => {
      render(<InteractiveMap data={mockRegions} />);
      
      expect(screen.getByText('Rentabilité')).toBeInTheDocument();
    });

    it('cache la légende quand showLegend est false', () => {
      render(<InteractiveMap data={mockRegions} showLegend={false} />);
      
      expect(screen.queryByText('Rentabilité')).not.toBeInTheDocument();
    });
  });

  describe('Props personnalisées', () => {
    it('applique la hauteur personnalisée', () => {
      render(<InteractiveMap data={mockRegions} height={500} />);
      
      const mapContainer = screen.getByRole('application');
      expect(mapContainer).toHaveStyle({ height: '500px' });
    });

    it('applique les classes CSS personnalisées', () => {
      render(<InteractiveMap data={mockRegions} className="custom-class" />);
      
      const mapContainer = screen.getByRole('application');
      expect(mapContainer).toHaveClass('custom-class');
    });

    it('gère les régions sans ID', () => {
      const regionsWithoutId = mockRegions.map(({ ...region }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = region as any;
        return rest;
      });
      
      expect(() => {
        render(<InteractiveMap data={regionsWithoutId} />);
      }).not.toThrow();
    });
  });

  describe('Gestion des erreurs', () => {
    it('fonctionne avec des données vides', () => {
      expect(() => {
        render(<InteractiveMap data={[]} />);
      }).not.toThrow();
    });

    it('gère les coordonnées invalides', () => {
      const invalidRegions = [
        {
          name: 'Invalid Region',
          profitability: 10,
          coordinates: [NaN, NaN] as [number, number],
        },
      ];
      
      expect(() => {
        render(<InteractiveMap data={invalidRegions} />);
      }).not.toThrow();
    });
  });

  describe('Fallback de carte', () => {
    it('utilise le fallback SVG par défaut', () => {
      render(<InteractiveMap data={mockRegions} />);
      
      expect(screen.getByText('Carte mondiale simplifiée')).toBeInTheDocument();
    });

    it('peut désactiver le fallback', () => {
      render(<InteractiveMap data={mockRegions} fallbackMap="none" />);
      
      expect(screen.queryByText('Carte mondiale simplifiée')).not.toBeInTheDocument();
    });
  });
});
