import { Dispatch, SetStateAction } from 'react';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineOfBusinessData } from '@/services/subscriptionService';
import '@/styles/scrollbar.css';

interface FiltersPanelProps {
  region: string;
  setRegion: Dispatch<SetStateAction<string>>;
  productType: string;
  setProductType: Dispatch<SetStateAction<string>>;
  businessType: string;
  setBusinessType: Dispatch<SetStateAction<string>>;
  lineOfBusiness: string;
  setLineOfBusiness: Dispatch<SetStateAction<string>>;
  linesOfBusiness: LineOfBusinessData[];
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  region,
  setRegion,
  productType,
  setProductType,
  businessType,
  setBusinessType,
  lineOfBusiness,
  setLineOfBusiness,
  linesOfBusiness
}) => {
  const regionNames: {[key: string]: string} = {
    'MAROC': 'MAROC',
    'AFRIQUE': 'AFRIQUE',
    'ASIE': 'ASIE',
    'MOYEN-ORIENT': 'MOYEN-ORIENT',
    'AUTRE': 'AUTRE'
  };

  return (
    <div className="mb-8 glass-card">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              <SelectItem value="MAROC">Maroc</SelectItem>
              <SelectItem value="AFRIQUE">Afrique</SelectItem>
              <SelectItem value="ASIE">Asie</SelectItem>
              <SelectItem value="MOYEN-ORIENT">Moyen-Orient</SelectItem>
              <SelectItem value="AUTRE">Autre</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de produit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les produits</SelectItem>
              <SelectItem value="life">Vie</SelectItem>
              <SelectItem value="nonLife">Non-Vie</SelectItem>
              <SelectItem value="health">Santé</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={businessType} onValueChange={setBusinessType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type d'affaires" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="treaties">Traités</SelectItem>
              <SelectItem value="facultative">Facultatives</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={lineOfBusiness} onValueChange={setLineOfBusiness}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ligne d'affaires" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">Toutes les lignes</SelectItem>
              {linesOfBusiness.map((lob) => (
                <SelectItem 
                  key={lob.id} 
                  value={lob.name}
                >
                  {lob.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" className="flex items-center">
          <Filter className="mr-2 h-4 w-4" />
          Filtres avancés
        </Button>
      </div>
    </div>
  );
};

export default FiltersPanel;