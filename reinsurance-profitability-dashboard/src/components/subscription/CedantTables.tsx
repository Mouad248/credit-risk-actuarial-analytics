import { FC } from 'react';
import { TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CedantPerformanceData } from '@/services/subscriptionService';
import CedantDetailsDialog from "./CedantDetailsDialog";
import FloatingPremiumFilter from "./FloatingPremiumFilter";
import { useState } from "react";

interface CedantTablesProps {
  topCedants: CedantPerformanceData[];
  bottomCedants: CedantPerformanceData[];
  region?: string;
  productType?: string;
  businessType?: string;
  lineOfBusiness?: string;
  minPremiumThreshold?: number;
  onMinPremiumThresholdChange?: (value: number | undefined) => void;
  minPremiumThresholdBottom?: number;
  onMinPremiumThresholdBottomChange?: (value: number | undefined) => void;
}

const CedantTables: FC<CedantTablesProps> = ({ 
  topCedants, 
  bottomCedants,
  region,
  productType,
  businessType,
  lineOfBusiness,
  minPremiumThreshold,
  onMinPremiumThresholdChange,
  minPremiumThresholdBottom,
  onMinPremiumThresholdBottomChange
}) => {
  const [selectedCedantId, setSelectedCedantId] = useState<string | null>(null);

  // Fonction pour formater les montants avec format intelligent
  const formatPremiumIntelligent = (value: number): string => {
    if (value >= 1000000) {
      // ≥ 1 million : afficher en MDH avec 1 décimale
      const millions = value / 1000000;
      const formatted = millions.toLocaleString('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
      return `${formatted} M`;
    } else if (value >= 1000) {
      // ≥ 1000 : afficher en KDH avec 0 décimale
      const thousands = value / 1000;
      const formatted = thousands.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return `${formatted} K`;
    } else {
      // < 1000 : afficher en DH
      return `${Math.round(value)}`;
    }
  };

  const noDataMessage = (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
        Aucune donnée disponible pour les critères sélectionnés
      </TableCell>
    </TableRow>
  );

  const getFilterInfo = () => {
    const filters = [];
    
    if (region && region !== 'all') {
      const regionNames: {[key: string]: string} = {
        'MAROC': 'MAROC',
        'AFRIQUE': 'AFRIQUE',
        'ASIE': 'ASIE',
        'MOYEN-ORIENT': 'MOYEN-ORIENT',
        'AUTRE': 'AUTRE'
      };
      filters.push(`Région: ${regionNames[region] || region}`);
    }
    
    if (productType && productType !== 'all') {
      const productNames: {[key: string]: string} = {
        'life': 'Vie',
        'nonLife': 'Non-Vie',
        'health': 'Santé'
      };
      filters.push(`Produit: ${productNames[productType] || productType}`);
    }
    
    if (businessType && businessType !== 'all') {
      const businessNames: {[key: string]: string} = {
        'treaties': 'Traités',
        'facultative': 'Facultatives'
      };
      filters.push(`Type d'affaires: ${businessNames[businessType] || businessType}`);
    }
    
    if (lineOfBusiness && lineOfBusiness !== 'all') {
      filters.push(`Ligne d'affaires: ${lineOfBusiness}`);
    }
    
    return filters.length > 0 ? `(${filters.join(', ')})` : '';
  };

  const handleCedantClick = (cedantId: string) => {
    setSelectedCedantId(cedantId);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top 10 Cédantes {getFilterInfo()}
              {minPremiumThreshold && (
                <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Prime ≥ {minPremiumThreshold}K DH
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Meilleures performances sur 8 ans (S/P moyen)
              {minPremiumThreshold && (
                <span className="block text-xs text-blue-600 mt-1">
                  Filtrage par prime minimale activé
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cédante</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead className="text-right">S/P Moyen</TableHead>
                    <TableHead className="text-right">Affaires/An</TableHead>
                    <TableHead className="text-right">Prime Moy. (DH)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCedants.length > 0 ? (
                    topCedants.map((cedant) => (
                      <TableRow 
                        key={cedant.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCedantClick(cedant.id)}
                      >
                        <TableCell className="font-medium">{cedant.name}</TableCell>
                        <TableCell>{cedant.region}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {cedant.averageSP.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {cedant.averageBusinessCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPremiumIntelligent(cedant.averagePremiumVolume)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    noDataMessage
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          
          {/* Filtre flottant positionné dans le coin supérieur du tableau Top 10 */}
          {onMinPremiumThresholdChange && (
            <FloatingPremiumFilter
              value={minPremiumThreshold}
              onChange={onMinPremiumThresholdChange}
            />
          )}
        </Card>

        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              10 Cédantes les moins performantes {getFilterInfo()}
              {minPremiumThresholdBottom && (
                <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Prime ≥ {minPremiumThresholdBottom}K DH
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Performances les plus faibles sur 8 ans (S/P moyen)
              {minPremiumThresholdBottom && (
                <span className="block text-xs text-blue-600 mt-1">
                  Filtrage par prime minimale activé
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cédante</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead className="text-right">S/P Moyen</TableHead>
                    <TableHead className="text-right">Affaires/An</TableHead>
                    <TableHead className="text-right">Prime Moy. (DH)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bottomCedants.length > 0 ? (
                    bottomCedants.map((cedant) => (
                      <TableRow 
                        key={cedant.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleCedantClick(cedant.id)}
                      >
                        <TableCell className="font-medium">{cedant.name}</TableCell>
                        <TableCell>{cedant.region}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {cedant.averageSP.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {cedant.averageBusinessCount}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPremiumIntelligent(cedant.averagePremiumVolume)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    noDataMessage
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Filtre flottant positionné dans le coin supérieur du tableau Bottom 10 */}
          {onMinPremiumThresholdBottomChange && (
            <FloatingPremiumFilter
              value={minPremiumThresholdBottom}
              onChange={onMinPremiumThresholdBottomChange}
            />
          )}
        </Card>
      </div>

      <CedantDetailsDialog
        cedantId={selectedCedantId}
        isOpen={!!selectedCedantId}
        onClose={() => setSelectedCedantId(null)}
      />
    </>
  );
};

export default CedantTables;
