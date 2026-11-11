import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { BranchPaginationProps } from '@/types/branchAnalytics';
import { cn } from '@/lib/utils';

/**
 * Composant de pagination optimisé
 * Avec contrôles avancés et informations détaillées
 */
const BranchPagination = memo<BranchPaginationProps>(({
  config,
  onPageChange,
  onItemsPerPageChange,
  theme = 'light'
}) => {
  const { currentPage, itemsPerPage, totalItems } = config;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  /**
   * Génère les numéros de page à afficher
   */
  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique de pagination intelligente
      if (currentPage <= 3) {
        // Début de la liste
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Fin de la liste
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Milieu de la liste
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  /**
   * Gère le changement de page
   */
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  }, [onPageChange, totalPages]);

  /**
   * Gère le changement du nombre d'éléments par page
   */
  const handleItemsPerPageChange = useCallback((items: string) => {
    const newItemsPerPage = parseInt(items, 10);
    onItemsPerPageChange(newItemsPerPage);
  }, [onItemsPerPageChange]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg",
      theme === 'dark' && "bg-gray-800"
    )}>
      {/* Informations sur les éléments */}
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          Affichage de <span className="font-medium">{startItem}</span> à{' '}
          <span className="font-medium">{endItem}</span> sur{' '}
          <span className="font-medium">{totalItems}</span> résultats
        </div>
        
        {/* Sélecteur d'éléments par page */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Afficher:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">par page</span>
        </div>
      </div>

      {/* Contrôles de navigation */}
      <div className="flex items-center space-x-2">
        {/* Première page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        {/* Page précédente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Numéros de page */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-sm text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  className={cn(
                    "h-8 w-8 p-0",
                    currentPage === page && "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Page suivante */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {/* Dernière page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Informations sur la page actuelle */}
      <div className="text-sm text-gray-600">
        Page <span className="font-medium">{currentPage}</span> sur{' '}
        <span className="font-medium">{totalPages}</span>
      </div>
    </div>
  );
});

BranchPagination.displayName = 'BranchPagination';

export default BranchPagination;


