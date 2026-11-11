
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCedantDetails } from "@/services/subscriptionService";
import { Skeleton } from "@/components/ui/skeleton";

interface CedantDetailsDialogProps {
  cedantId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CedantDetailsDialog = ({ cedantId, isOpen, onClose }: CedantDetailsDialogProps) => {
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  
  const { data: cedantDetails, isLoading } = useQuery({
    queryKey: ['cedantDetails', cedantId],
    queryFn: () => fetchCedantDetails(cedantId as string),
    enabled: !!cedantId && isOpen
  });

  const exportToCSV = () => {
    if (!cedantDetails) return;

    // Construire le contenu CSV avec les données agrégées
    const csvContent = [
      ['N° Contrat', 'Années', 'Nb Années', 'Type', "Ligne d'Affaires", 'Prime (KDH)', 'Sinistres (KDH)', 'Provisions (KDH)', 'S/P (%)', 'Taux Rétention (%)', 'Commission (%)'].join(';'),
      ...cedantDetails.contracts.map(contract => 
        [
          contract.contractNumber,
          contract.yearRange,
          contract.yearsCount,
          contract.type,
          contract.lineOfBusiness,
          contract.premium.toFixed(1),
          contract.claims.toFixed(1),
          contract.provisions.toFixed(1),
          contract.sp.toFixed(1),
          contract.retentionRate.toFixed(1),
          contract.commissionRate.toFixed(1)
        ].join(';')
      )
    ].join('\n');

    // Créer un blob et télécharger
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `contrats_${cedantDetails.name}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrats de {cedantDetails?.name}
            </div>
            {cedantDetails && (
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <ScrollArea className="h-[60vh]">
            {cedantDetails && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Contrat</TableHead>
                    <TableHead>Années</TableHead>
                    <TableHead>Ligne d'Affaires</TableHead>
                    <TableHead className="text-right">Prime (KDH)</TableHead>
                    <TableHead className="text-right">S/P (%)</TableHead>
                    <TableHead className="text-right">Taux Rétention (%)</TableHead>
                    <TableHead className="text-right">Historique</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cedantDetails.contracts.map((contract) => (
                    <React.Fragment key={contract.contractNumber}>
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <TableRow className="hover:bg-gray-50 cursor-help">
                              <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{contract.yearRange}</span>
                                  <span className="text-xs text-gray-500">{contract.yearsCount} année{contract.yearsCount > 1 ? 's' : ''}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                  {contract.lineOfBusiness}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-medium">{contract.premium.toFixed(1)}</TableCell>
                              <TableCell className="text-right">
                                <span className={`font-medium ${contract.sp > 100 ? 'text-red-600' : 'text-green-600'}`}>
                                  {contract.sp.toFixed(1)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">{contract.retentionRate.toFixed(1)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedContract(
                                      expandedContract === contract.contractNumber ? null : contract.contractNumber
                                    );
                                  }}
                                >
                                  {expandedContract === contract.contractNumber ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Masquer
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      Voir
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="p-4 max-w-xs">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm border-b pb-1">Détails du contrat {contract.contractNumber}</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Type :</span>
                                  <p className="font-medium capitalize">{contract.type}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Commission :</span>
                                  <p className="font-medium">{contract.commissionRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Sinistres :</span>
                                  <p className="font-medium">{contract.claims.toFixed(1)} KDH</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Provisions :</span>
                                  <p className="font-medium">{contract.provisions.toFixed(1)} KDH</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-2 italic">Survolez pour voir les détails</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {expandedContract === contract.contractNumber && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50 p-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Historique annuel du contrat {contract.contractNumber}</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Année</TableHead>
                                    <TableHead className="text-right">Prime (KDH)</TableHead>
                                    <TableHead className="text-right">Sinistres (KDH)</TableHead>
                                    <TableHead className="text-right">Provisions (KDH)</TableHead>
                                    <TableHead className="text-right">S/P (%)</TableHead>
                                    <TableHead className="text-right">Commission (%)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {contract.yearlyHistory.map((yearData) => (
                                    <TableRow key={yearData.year}>
                                      <TableCell className="font-medium">{yearData.year}</TableCell>
                                      <TableCell className="text-right">{yearData.premium.toFixed(1)}</TableCell>
                                      <TableCell className="text-right">{yearData.claims.toFixed(1)}</TableCell>
                                      <TableCell className="text-right">{yearData.provisions.toFixed(1)}</TableCell>
                                      <TableCell className="text-right">{yearData.sp.toFixed(1)}</TableCell>
                                      <TableCell className="text-right">{yearData.commissionRate.toFixed(1)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CedantDetailsDialog;
