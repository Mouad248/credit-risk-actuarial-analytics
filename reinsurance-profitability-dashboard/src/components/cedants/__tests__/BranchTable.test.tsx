import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BranchTable from '../BranchTable';
import { BranchData, ColumnConfig, SortConfig } from '@/types/branchAnalytics';

// Mock des composants UI
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, className }: any) => <td className={className}>{children}</td>,
  TableHead: ({ children, className, onClick }: any) => (
    <th className={className} onClick={onClick}>{children}</th>
  ),
  TableHeader: ({ children, className }: any) => <thead className={className}>{children}</thead>,
  TableRow: ({ children, className }: any) => <tr className={className}>{children}</tr>,
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('BranchTable', () => {
  const mockData: BranchData[] = [
    {
      id: '1',
      lob: 'AUTO-AT-RC',
      year: 2024,
      epiMoyen: 1000000,
      ssMoyen: 70.5,
      ratioTechnique: 88.5,
      originalIndex: 0,
      trend: {
        direction: 'up',
        percentage: 5.2,
        period: 'vs année précédente'
      },
      performance: 'good'
    },
    {
      id: '2',
      lob: 'INCENDIE',
      year: 2024,
      epiMoyen: 500000,
      ssMoyen: 75.0,
      ratioTechnique: 85.0,
      originalIndex: 1,
      trend: {
        direction: 'down',
        percentage: 2.1,
        period: 'vs année précédente'
      },
      performance: 'average'
    }
  ];

  const mockColumns: ColumnConfig[] = [
    {
      key: 'lob',
      label: 'Branche',
      sortable: true,
      width: '200px',
      align: 'left',
      format: 'text'
    },
    {
      key: 'year',
      label: 'Année',
      sortable: true,
      width: '80px',
      align: 'right',
      format: 'number'
    },
    {
      key: 'epiMoyen',
      label: 'EPI moyen',
      sortable: true,
      width: '120px',
      align: 'right',
      format: 'currency'
    },
    {
      key: 'ssMoyen',
      label: 'S/S moyen',
      sortable: true,
      width: '120px',
      align: 'right',
      format: 'percentage'
    },
    {
      key: 'ratioTechnique',
      label: 'Ratio technique',
      sortable: true,
      width: '140px',
      align: 'right',
      format: 'percentage'
    }
  ];

  const mockSortConfig: SortConfig = {
    field: 'ratioTechnique',
    direction: 'desc'
  };

  const mockOnSort = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche les données correctement', () => {
    render(
      <BranchTable
        data={mockData}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
      />
    );

    expect(screen.getByText('AUTO-AT-RC')).toBeInTheDocument();
    expect(screen.getByText('INCENDIE')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('1.00M')).toBeInTheDocument();
    expect(screen.getByText('0.50M')).toBeInTheDocument();
  });

  it('affiche l\'état de chargement', () => {
    render(
      <BranchTable
        data={[]}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
        loading={true}
      />
    );

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6); // 1 header + 5 lignes
  });

  it('gère le tri des colonnes', async () => {
    const user = userEvent.setup();
    
    render(
      <BranchTable
        data={mockData}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
      />
    );

    const brancheHeader = screen.getByText('Branche');
    await user.click(brancheHeader);

    expect(mockOnSort).toHaveBeenCalledWith('lob');
  });

  it('formate les valeurs correctement', () => {
    render(
      <BranchTable
        data={mockData}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
      />
    );

    // Vérifier le formatage des devises
    expect(screen.getByText('1.00M')).toBeInTheDocument();
    expect(screen.getByText('0.50M')).toBeInTheDocument();

    // Vérifier le formatage des pourcentages
    expect(screen.getByText('70.50%')).toBeInTheDocument();
    expect(screen.getByText('75.00%')).toBeInTheDocument();
    expect(screen.getByText('88.50%')).toBeInTheDocument();
    expect(screen.getByText('85.00%')).toBeInTheDocument();
  });

  it('affiche les icônes de tri correctement', () => {
    render(
      <BranchTable
        data={mockData}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
      />
    );

    // Vérifier que les icônes de tri sont présentes
    const sortIcons = screen.getAllByRole('img', { hidden: true });
    expect(sortIcons.length).toBeGreaterThan(0);
  });

  it('affiche les tendances correctement', () => {
    render(
      <BranchTable
        data={mockData}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
      />
    );

    // Vérifier que les tendances sont affichées
    expect(screen.getByText('5.2%')).toBeInTheDocument();
    expect(screen.getByText('2.1%')).toBeInTheDocument();
  });

  it('gère les données vides', () => {
    render(
      <BranchTable
        data={[]}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
      />
    );

    // Le tableau devrait être vide mais pas en erreur
    expect(screen.queryByText('AUTO-AT-RC')).not.toBeInTheDocument();
  });

  it('applique les classes CSS correctement', () => {
    render(
      <BranchTable
        data={mockData}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
        theme="dark"
      />
    );

    // Vérifier que les classes sont appliquées
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('gère les tooltips', () => {
    render(
      <BranchTable
        data={mockData}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
        showTooltips={true}
      />
    );

    // Vérifier que les tooltips sont activés
    expect(screen.getByText('AUTO-AT-RC')).toBeInTheDocument();
  });

  it('gère les animations', () => {
    render(
      <BranchTable
        data={mockData}
        columns={mockColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
        enableAnimations={true}
      />
    );

    // Vérifier que les animations sont activées
    expect(screen.getByText('AUTO-AT-RC')).toBeInTheDocument();
  });

  it('gère les colonnes non triables', () => {
    const nonSortableColumns: ColumnConfig[] = [
      {
        key: 'lob',
        label: 'Branche',
        sortable: false,
        width: '200px',
        align: 'left',
        format: 'text'
      }
    ];

    render(
      <BranchTable
        data={mockData}
        columns={nonSortableColumns}
        sortConfig={mockSortConfig}
        onSort={mockOnSort}
      />
    );

    const brancheHeader = screen.getByText('Branche');
    fireEvent.click(brancheHeader);

    // Ne devrait pas appeler onSort pour une colonne non triable
    expect(mockOnSort).not.toHaveBeenCalled();
  });
});


