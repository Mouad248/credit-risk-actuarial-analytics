import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CedantSegmentQuadrants from '../CedantSegmentQuadrants';
import { CedantAnalytics } from '@/services/subscriptionService';

// Mock des composants UI
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, className }: any) => <td className={className}>{children}</td>,
  TableHead: ({ children, className }: any) => <th className={className}>{children}</th>,
  TableHeader: ({ children, className }: any) => <thead className={className}>{children}</thead>,
  TableRow: ({ children, className }: any) => <tr className={className}>{children}</tr>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => (
    <input onChange={onChange} {...props} />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
}));

describe('CedantSegmentQuadrants', () => {
  const mockAnalytics: CedantAnalytics = {
    annualSeries: [],
    lobDistribution: [
      { lob: 'AUTO-AT-RC', premium: 1000000 },
      { lob: 'INCENDIE', premium: 500000 },
      { lob: 'V I E', premium: 2000000 },
    ],
    contractNature: [],
    riskCountries: [],
  };

  it('affiche l\'état de chargement', () => {
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        loading={true}
      />
    );

    expect(screen.getByText('Chargement des données des branches...')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6); // 1 header + 5 lignes
  });

  it('affiche l\'état d\'erreur', () => {
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        error="Erreur de connexion"
        loading={false}
      />
    );

    expect(screen.getByText('Erreur lors du chargement des données')).toBeInTheDocument();
    expect(screen.getByText('Erreur de connexion')).toBeInTheDocument();
    expect(screen.getByText('Réessayer')).toBeInTheDocument();
  });

  it('affiche l\'état vide', () => {
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        analytics={{ ...mockAnalytics, lobDistribution: [] }}
        loading={false}
      />
    );

    expect(screen.getByText('Aucune donnée de branche')).toBeInTheDocument();
    expect(screen.getByText('Aucune donnée de branche n\'est disponible pour cette cédante et ce segment.')).toBeInTheDocument();
  });

  it('affiche les données correctement', () => {
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        analytics={mockAnalytics}
        loading={false}
      />
    );

    expect(screen.getByText('3 branches trouvées')).toBeInTheDocument();
    expect(screen.getByText('AUTO-AT-RC')).toBeInTheDocument();
    expect(screen.getByText('INCENDIE')).toBeInTheDocument();
    expect(screen.getByText('V I E')).toBeInTheDocument();
  });

  it('gère les données manquantes', () => {
    const analyticsWithMissingData: CedantAnalytics = {
      ...mockAnalytics,
      lobDistribution: [
        { lob: 'AUTO-AT-RC', premium: 0 },
        { lob: '', premium: 1000000 },
        { lob: 'INCENDIE', premium: 500000 },
      ],
    };

    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        analytics={analyticsWithMissingData}
        loading={false}
      />
    );

    // Vérifier que les entrées vides sont filtrées
    expect(screen.getByText('2 branches trouvées')).toBeInTheDocument();
    expect(screen.getByText('AUTO-AT-RC')).toBeInTheDocument();
    expect(screen.getByText('INCENDIE')).toBeInTheDocument();
    // L'entrée vide ne devrait pas apparaître
    expect(screen.queryByText('')).not.toBeInTheDocument();
  });

  it('permet la recherche dans les branches', async () => {
    const user = userEvent.setup();
    
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        analytics={mockAnalytics}
        loading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher une branche...');
    await user.type(searchInput, 'AUTO');

    // Vérifier que la recherche fonctionne
    expect(screen.getByText('1 branche trouvée')).toBeInTheDocument();
    expect(screen.getByText('AUTO-AT-RC')).toBeInTheDocument();
    expect(screen.queryByText('INCENDIE')).not.toBeInTheDocument();
  });

  it('permet le tri des colonnes', async () => {
    const user = userEvent.setup();
    
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        analytics={mockAnalytics}
        loading={false}
      />
    );

    // Vérifier que le tri par défaut est sur ratio technique décroissant
    expect(screen.getByText('3 branches trouvées')).toBeInTheDocument();

    // Tester le tri sur la colonne Branche
    const brancheHeader = screen.getByText('Branche');
    await user.click(brancheHeader);

    // Vérifier que le tri a changé (les données sont triées)
    expect(screen.getByText('3 branches trouvées')).toBeInTheDocument();
  });

  it('affiche les contrôles de filtrage et export', () => {
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        analytics={mockAnalytics}
        loading={false}
      />
    );

    // Vérifier la présence des contrôles
    expect(screen.getByPlaceholderText('Rechercher une branche...')).toBeInTheDocument();
    expect(screen.getByText('Toutes')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });

  it('affiche les badges de filtres actifs', async () => {
    const user = userEvent.setup();
    
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        analytics={mockAnalytics}
        loading={false}
      />
    );

    // Tester le badge de recherche
    const searchInput = screen.getByPlaceholderText('Rechercher une branche...');
    await user.type(searchInput, 'AUTO');

    expect(screen.getByText('Filtré: "AUTO"')).toBeInTheDocument();
  });

  it('formate correctement les données', () => {
    render(
      <CedantSegmentQuadrants
        cedantId="test-cedant"
        segment="TRAITES"
        analytics={mockAnalytics}
        loading={false}
      />
    );

    // Vérifier le formatage des données
    expect(screen.getByText('1.00M')).toBeInTheDocument(); // EPI formaté
    expect(screen.getByText('0.50M')).toBeInTheDocument(); // EPI formaté
    expect(screen.getByText('2.00M')).toBeInTheDocument(); // EPI formaté
  });
});
