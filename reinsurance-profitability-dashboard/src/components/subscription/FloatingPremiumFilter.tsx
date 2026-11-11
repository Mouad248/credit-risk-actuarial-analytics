import { FC, useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface FloatingPremiumFilterProps {
  value?: number;
  onChange: (value: number | undefined) => void;
}

const FloatingPremiumFilter: FC<FloatingPremiumFilterProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState<string>(value ? value.toString() : '');
  const [tempUnit, setTempUnit] = useState<'DH' | 'K' | 'M'>('K');

  const handleValueChange = (inputValue: string) => {
    setTempValue(inputValue);
  };

  const handleUnitChange = (unit: 'DH' | 'K' | 'M') => {
    setTempUnit(unit);
  };

  const handleApply = () => {
    const numericValue = parseFloat(tempValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      onChange(undefined);
    } else {
      // Convertir en K DH
      let valueInK: number;
      switch (tempUnit) {
        case 'DH':
          valueInK = numericValue / 1000;
          break;
        case 'K':
          valueInK = numericValue;
          break;
        case 'M':
          valueInK = numericValue * 1000;
          break;
        default:
          valueInK = numericValue;
      }
      onChange(valueInK);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempValue('');
    onChange(undefined);
    setIsOpen(false);
  };

  const getDisplayValue = (val: number): { value: string; unit: string } => {
    if (val >= 1000) {
      return { value: (val / 1000).toFixed(1), unit: 'M DH' };
    } else if (val >= 1) {
      return { value: val.toFixed(1), unit: 'K DH' };
    } else {
      return { value: (val * 1000).toFixed(0), unit: 'DH' };
    }
  };

  const displayInfo = value ? getDisplayValue(value) : null;

  return (
    <>
      {/* Bouton flottant positionné dans le coin supérieur du tableau */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className={`rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isOpen 
                ? 'bg-green-600 hover:bg-green-700 border border-green-700' 
                : 'bg-green-500 hover:bg-green-600 border border-green-600'
            }`}
            size="icon"
          >
            <Filter className={`h-5 w-5 text-white transition-transform duration-300 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`} />
          </Button>
          
          {/* Badge indicateur si filtre actif */}
          {value && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse bg-green-700 text-white border border-white"
            >
              !
            </Badge>
          )}
        </div>
      </div>

      {/* Panneau coulissant */}
      <div className={`absolute top-16 right-4 w-80 bg-white border border-green-200 shadow-xl rounded-lg transition-all duration-300 ease-in-out z-20 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}>
        <div className="p-4 space-y-4">
          {/* En-tête du panneau */}
          <div className="flex items-center justify-between border-b border-green-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-green-600" />
              <h3 className="font-medium text-green-600">Filtre Prime</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Affichage du filtre actuel */}
          {displayInfo && (
            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <p className="text-xs text-green-700 font-medium mb-1">Filtre actuel :</p>
              <p className="text-sm font-bold text-green-600">
                {displayInfo.value} {displayInfo.unit}
              </p>
            </div>
          )}
          
          {/* Champ de saisie */}
          <div className="space-y-3">
            <Label htmlFor="premium-threshold" className="text-xs font-medium text-gray-700">
              Seuil minimum de prime
            </Label>
            
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <Input
                  id="premium-threshold"
                  type="number"
                  placeholder="0"
                  value={tempValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="text-sm h-8 border-green-200 focus:border-green-400 focus:ring-green-400"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="w-16">
                <Select value={tempUnit} onValueChange={handleUnitChange}>
                  <SelectTrigger className="text-sm h-8 border-green-200 focus:border-green-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DH">DH</SelectItem>
                    <SelectItem value="K">K DH</SelectItem>
                    <SelectItem value="M">M DH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              Filtre les cédantes avec un volume de primes supérieur au seuil
            </p>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex items-center gap-1 h-8 px-3 text-xs border-green-200 text-green-600 hover:bg-green-50"
            >
              <X className="h-3 w-3" />
              Effacer
            </Button>
            
            <Button
              onClick={handleApply}
              size="sm"
              className="h-8 px-4 text-xs bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Appliquer
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingPremiumFilter;
