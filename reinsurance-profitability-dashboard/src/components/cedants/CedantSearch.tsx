import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Trash2, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  searchCedantSuggestions, 
  searchCedantsByRegion, 
  searchCedantsInRegion, 
  CedantSuggestion, 
  AVAILABLE_REGIONS, 
  AvailableRegion 
} from '@/services/subscriptionService';

interface CedantSearchProps {
  onSelectionChange?: (cedants: CedantSuggestion[]) => void;
  selectedCedants?: CedantSuggestion[];
  maxSelections?: number;
  defaultValue?: string;
  className?: string;
  // Nouvelles props pour le filtre par région
  availableRegions?: AvailableRegion[];
  selectedRegion?: AvailableRegion | null;
  onRegionChange?: (region: AvailableRegion | null) => void;
}

const CedantSearch: React.FC<CedantSearchProps> = ({ 
  onSelectionChange, 
  selectedCedants = [],
  maxSelections = 5,
  defaultValue = '', 
  className = '',
  availableRegions = AVAILABLE_REGIONS,
  selectedRegion = null,
  onRegionChange
}) => {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<CedantSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [internalSelectedCedants, setInternalSelectedCedants] = useState<CedantSuggestion[]>(selectedCedants);
  const [showMaxError, setShowMaxError] = useState(false);
  const [internalSelectedRegion, setInternalSelectedRegion] = useState<AvailableRegion | null>(selectedRegion);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isRegionPopupOpen, setIsRegionPopupOpen] = useState(false);
  const [regionCedants, setRegionCedants] = useState<CedantSuggestion[]>([]);
  const [isLoadingRegionCedants, setIsLoadingRegionCedants] = useState(false);
  const [justClosedRegionPopup, setJustClosedRegionPopup] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchroniser avec les props
  useEffect(() => {
    setInternalSelectedCedants(selectedCedants);
  }, [selectedCedants]);

  // Synchroniser avec la région sélectionnée
  useEffect(() => {
    setInternalSelectedRegion(selectedRegion);
  }, [selectedRegion]);

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('cedant-selection');
    if (saved && selectedCedants.length === 0) {
      try {
        const savedCedants = JSON.parse(saved);
        setInternalSelectedCedants(savedCedants);
        onSelectionChange?.(savedCedants);
      } catch (error) {
        console.error('Erreur lors du chargement de la sélection:', error);
      }
    }
  }, []);

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('cedant-selection', JSON.stringify(internalSelectedCedants));
  }, [internalSelectedCedants]);

  // Debounce et recherche avec filtre par région
  useEffect(() => {
    // Ne pas déclencher de suggestions si le popup régional est ouvert
    if (isRegionPopupOpen) {
      return;
    }
    
    // Ne pas déclencher automatiquement si on vient de fermer le popup régional
    if (justClosedRegionPopup) {
      return;
    }
    
    const normalizedQuery = query.trim().toLowerCase();
    
    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Si pas de query mais région sélectionnée, charger toutes les cédantes de la région
    if (normalizedQuery.length < 2 && internalSelectedRegion) {
      const timeoutId = setTimeout(async () => {
        try {
          setIsLoading(true);
          const results = await searchCedantsByRegion(internalSelectedRegion, abortController.signal);
          
          if (!abortController.signal.aborted) {
            setSuggestions(results);
            // Toujours ouvrir si on a des résultats et qu'on peut encore sélectionner
            const shouldOpen = results.length > 0 && internalSelectedCedants.length < maxSelections;
            setIsOpen(shouldOpen);
            setSelectedIndex(-1);
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Erreur lors de la recherche par région:', error);
            setSuggestions([]);
            setIsOpen(false);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoading(false);
          }
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (abortController === abortControllerRef.current) {
          abortController.abort();
        }
      };
    }
    
    // Si pas de query et pas de région, comportement normal
    if (normalizedQuery.length < 2) {
      setSuggestions([]);
      // Ne fermer le Popover que si l'input n'a pas le focus ou si on a atteint la limite
      const shouldClose = inputRef.current !== document.activeElement || 
                         internalSelectedCedants.length >= maxSelections;
      setIsOpen(!shouldClose);
      return;
    }

    // Recherche avec query
    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        let results: CedantSuggestion[];
        
        if (internalSelectedRegion) {
          // Recherche dans la région spécifique
          results = await searchCedantsInRegion(normalizedQuery, internalSelectedRegion, abortController.signal);
        } else {
          // Recherche globale
          results = await searchCedantSuggestions(normalizedQuery, abortController.signal);
        }
        
        if (!abortController.signal.aborted) {
          setSuggestions(results);
          // Rouvrir automatiquement si on a des résultats et que l'input a le focus
          setIsOpen(results.length > 0 && inputRef.current === document.activeElement);
          setSelectedIndex(-1);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Erreur lors de la recherche:', error);
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      if (abortController === abortControllerRef.current) {
        abortController.abort();
      }
    };
  }, [query, internalSelectedRegion, internalSelectedCedants.length, maxSelections, isRegionPopupOpen, justClosedRegionPopup]);

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex], e.ctrlKey || e.metaKey);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (cedant: CedantSuggestion, isMultiSelect = false) => {
    console.log('handleSelect called:', { cedant: cedant.name, isMultiSelect });
    setShowMaxError(false);
    
    if (isMultiSelect) {
      // Vérifier si la cédante est déjà sélectionnée
      const isAlreadySelected = internalSelectedCedants.some(c => c.id === cedant.id);
      
      if (isAlreadySelected) {
        // Retirer de la sélection
        const newSelection = internalSelectedCedants.filter(c => c.id !== cedant.id);
        setInternalSelectedCedants(newSelection);
        onSelectionChange?.(newSelection);
      } else {
        // Ajouter à la sélection si limite non atteinte
        if (internalSelectedCedants.length >= maxSelections) {
          setShowMaxError(true);
          setTimeout(() => setShowMaxError(false), 3000);
          return;
        }
        
        const newSelection = [...internalSelectedCedants, cedant];
        setInternalSelectedCedants(newSelection);
        onSelectionChange?.(newSelection);
        
        // Fermer seulement si on atteint la limite
        if (newSelection.length >= maxSelections) {
          setIsOpen(false);
          setQuery('');
        }
      }
      
      // En sélection multiple : vider le query pour permettre une nouvelle recherche
      if (!isAlreadySelected || internalSelectedCedants.length < maxSelections) {
        setQuery('');
        // Le Popover restera ouvert grâce à la logique dans l'effet de recherche
      }
      setSelectedIndex(-1);
      
      // Maintenir le focus pour continuer la frappe
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      
    } else {
      // Sélection simple : on peut soit fermer soit garder ouvert selon le contexte
      setInternalSelectedCedants([cedant]);
      onSelectionChange?.([cedant]);
      
      // En sélection simple : vider le query mais garder le focus pour une nouvelle recherche
      setQuery('');
      // Garder le Popover ouvert si l'utilisateur veut changer de sélection
      // Il se fermera automatiquement quand il n'y aura plus de suggestions
      setSelectedIndex(-1);
      
      // Maintenir le focus pour permettre une nouvelle recherche immédiate
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleRemoveCedant = (cedantId: string) => {
    const newSelection = internalSelectedCedants.filter(c => c.id !== cedantId);
    setInternalSelectedCedants(newSelection);
    onSelectionChange?.(newSelection);
    setShowMaxError(false);
  };

  const handleClearAll = () => {
    setInternalSelectedCedants([]);
    onSelectionChange?.([]);
    setQuery('');
    setShowMaxError(false);
  };

  const handleRegionChange = async (region: AvailableRegion | null) => {
    setInternalSelectedRegion(region);
    onRegionChange?.(region);
    setQuery(''); // Vider la query pour recharger les suggestions
    setIsRegionDropdownOpen(false);
    
    // Si une région est sélectionnée, ouvrir le popup avec toutes les cédantes
    if (region) {
      await loadRegionCedants(region);
    } else {
      // Aucune région sélectionnée, vider les suggestions
      setSuggestions([]);
      setIsOpen(false);
      setRegionCedants([]);
    }
    
    // Refocus sur l'input après sélection de région
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const loadRegionCedants = async (region: AvailableRegion) => {
    try {
      setIsLoadingRegionCedants(true);
      // Fermer les suggestions pendant que le popup régional est ouvert
      setIsOpen(false);
      setSuggestions([]);
      
      const results = await searchCedantsByRegion(region, undefined, 200); // Charger jusqu'à 200 cédantes
      setRegionCedants(results);
      setIsRegionPopupOpen(true); // Ouvrir le popup
    } catch (error) {
      console.error('Erreur lors du chargement des cédantes de la région:', error);
      setRegionCedants([]);
    } finally {
      setIsLoadingRegionCedants(false);
    }
  };

  const handleSelectFromPopup = (cedant: CedantSuggestion, isMultiSelect = false) => {
    // Réutiliser la logique de handleSelect existante mais sans fermer le popup
    console.log('handleSelectFromPopup called:', { cedant: cedant.name, isMultiSelect });
    setShowMaxError(false);
    
    if (isMultiSelect) {
      // Vérifier si la cédante est déjà sélectionnée
      const isAlreadySelected = internalSelectedCedants.some(c => c.id === cedant.id);
      
      if (isAlreadySelected) {
        // Retirer de la sélection
        const newSelection = internalSelectedCedants.filter(c => c.id !== cedant.id);
        setInternalSelectedCedants(newSelection);
        onSelectionChange?.(newSelection);
      } else {
        // Ajouter à la sélection si limite non atteinte
        if (internalSelectedCedants.length >= maxSelections) {
          setShowMaxError(true);
          setTimeout(() => setShowMaxError(false), 3000);
          return;
        }
        
        const newSelection = [...internalSelectedCedants, cedant];
        setInternalSelectedCedants(newSelection);
        onSelectionChange?.(newSelection);
      }
    } else {
      // Sélection simple : remplacer la sélection mais garder le popup ouvert
      const isAlreadySelected = internalSelectedCedants.some(c => c.id === cedant.id);
      
      if (isAlreadySelected) {
        // Déselectionner si déjà sélectionnée
        const newSelection = internalSelectedCedants.filter(c => c.id !== cedant.id);
        setInternalSelectedCedants(newSelection);
        onSelectionChange?.(newSelection);
      } else {
        // Sélectionner la cédante
        if (internalSelectedCedants.length >= maxSelections) {
          setShowMaxError(true);
          setTimeout(() => setShowMaxError(false), 3000);
          return;
        }
        
        const newSelection = [...internalSelectedCedants, cedant];
        setInternalSelectedCedants(newSelection);
        onSelectionChange?.(newSelection);
      }
    }
    
    // Ne jamais fermer le popup automatiquement - laisser l'utilisateur décider
  };

  const handleOpenRegionPopup = async () => {
    if (internalSelectedRegion) {
      await loadRegionCedants(internalSelectedRegion);
    }
  };

  const handleCloseRegionPopup = () => {
    setIsRegionPopupOpen(false);
    setJustClosedRegionPopup(true); // Marquer qu'on vient de fermer le popup
  };

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="font-medium text-primary">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Message d'erreur de limite */}
      {showMaxError && (
        <Alert className="mb-2 border-destructive bg-destructive/10">
          <AlertDescription className="text-destructive">
            Limite de {maxSelections} cédantes atteinte
          </AlertDescription>
        </Alert>
      )}

      {/* Badge de région sélectionnée */}
      {internalSelectedRegion && (
        <div className="mb-3 flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="flex items-center gap-2 bg-primary/10 text-primary border-primary/20"
          >
            <Filter className="h-3 w-3" />
            <span>Région: {internalSelectedRegion}</span>
            <button
              onClick={() => handleRegionChange(null)}
              className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              aria-label={`Retirer le filtre ${internalSelectedRegion}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenRegionPopup}
            className="h-7 px-3 text-xs"
            disabled={isLoadingRegionCedants}
          >
            {isLoadingRegionCedants ? (
              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-1" />
            ) : null}
            Voir toutes les cédantes ({regionCedants.length || '...'})
          </Button>
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60 cursor-pointer" 
              onClick={(e) => {
                // Cliquer sur l'icône active aussi la recherche
                e.preventDefault();
                inputRef.current?.focus();
                
                const canStillSelect = internalSelectedCedants.length < maxSelections;
                const hasContent = suggestions.length > 0 || query.trim().length >= 2;
                
                if (hasContent || canStillSelect) {
                  setIsOpen(true);
                }
              }}
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                // Réinitialiser l'état de fermeture récente quand l'utilisateur tape
                if (justClosedRegionPopup) {
                  setJustClosedRegionPopup(false);
                }
                setQuery(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              onClick={async (e) => {
                // Ne pas déclencher d'actions si le popup régional est ouvert
                if (isRegionPopupOpen) {
                  e.preventDefault();
                  return;
                }
                
                // Réinitialiser l'état de fermeture récente (interaction manuelle de l'utilisateur)
                if (justClosedRegionPopup) {
                  setJustClosedRegionPopup(false);
                }
                
                // Un seul clic suffit pour ouvrir le Popover et donner le focus
                e.preventDefault();
                
                // S'assurer que l'input a le focus immédiatement
                inputRef.current?.focus();
                
                // Ouvrir le Popover dans tous les cas où c'est pertinent
                const canStillSelect = internalSelectedCedants.length < maxSelections;
                const hasContent = suggestions.length > 0 || query.trim().length >= 2;
                
                if (hasContent || canStillSelect) {
                  setIsOpen(true);
                }
                
                // Si région sélectionnée et pas de suggestions, charger les cédantes
                if (internalSelectedRegion && suggestions.length === 0 && canStillSelect) {
                  try {
                    setIsLoading(true);
                    const results = await searchCedantsByRegion(internalSelectedRegion);
                    setSuggestions(results);
                    setIsOpen(results.length > 0);
                    setSelectedIndex(-1);
                  } catch (error) {
                    console.error('Erreur lors du chargement des cédantes de la région:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              onFocus={async () => {
                // Ne pas déclencher d'actions si le popup régional est ouvert
                if (isRegionPopupOpen) {
                  return;
                }
                
                // Réinitialiser l'état de fermeture récente (interaction manuelle de l'utilisateur)
                if (justClosedRegionPopup) {
                  setJustClosedRegionPopup(false);
                }
                
                // Rouvrir si on a des suggestions, du texte, ou si on peut encore sélectionner
                const canStillSelect = internalSelectedCedants.length < maxSelections;
                if (suggestions.length > 0 || query.trim().length >= 2 || canStillSelect) {
                  setIsOpen(true);
                }
                
                // Si région sélectionnée et pas de suggestions, charger les cédantes automatiquement
                if (internalSelectedRegion && suggestions.length === 0 && canStillSelect && query.trim().length < 2) {
                  try {
                    setIsLoading(true);
                    const results = await searchCedantsByRegion(internalSelectedRegion);
                    setSuggestions(results);
                    setIsOpen(results.length > 0);
                    setSelectedIndex(-1);
                  } catch (error) {
                    console.error('Erreur lors du chargement des cédantes de la région:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              placeholder={
                internalSelectedRegion 
                  ? `Rechercher dans ${internalSelectedRegion}... (Ctrl+clic pour sélection multiple)`
                  : internalSelectedCedants.length > 0 
                    ? "Ajouter une cédante... (Ctrl+clic pour sélection multiple)" 
                    : "Rechercher une cédante... (Ctrl+clic pour sélection multiple)"
              }
              className={`pl-9 pr-16 ${
                query || isLoading
                  ? 'placeholder:opacity-0' 
                  : 'placeholder:text-muted-foreground/60'
              } focus:placeholder:opacity-0 placeholder:transition-opacity placeholder:duration-150`}
              aria-label="Search cedants"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-activedescendant={
                selectedIndex >= 0 ? `cedant-option-${selectedIndex}` : undefined
              }
            />
            {isLoading && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
            
            {/* Bouton de filtre par région */}
            <Popover open={isRegionDropdownOpen} onOpenChange={setIsRegionDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/80 bg-background/80 backdrop-blur-sm border border-border/20 ${
                    internalSelectedRegion ? 'text-primary' : 'text-muted-foreground/60'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRegionDropdownOpen(!isRegionDropdownOpen);
                  }}
                  aria-label="Filtrer par région"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-56 p-0" align="end">
                <Command>
                  <CommandList>
                    <CommandGroup heading="Filtrer par région">
                      <CommandItem
                        className="cursor-pointer"
                        onSelect={() => handleRegionChange(null)}
                      >
                        <div className="flex items-center">
                          <span className={internalSelectedRegion === null ? 'font-medium' : ''}>
                            Toutes les régions
                          </span>
                          {internalSelectedRegion === null && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </CommandItem>
                      
                      {availableRegions.map((region) => (
                        <CommandItem
                          key={region}
                          className="cursor-pointer"
                          onSelect={() => handleRegionChange(region)}
                        >
                          <div className="flex items-center w-full">
                            <span className={internalSelectedRegion === region ? 'font-medium' : ''}>
                              {region}
                            </span>
                            {internalSelectedRegion === region && (
                              <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandList>
              {suggestions.length === 0 ? (
                <CommandEmpty>
                  {isLoading ? 'Recherche en cours...' : 
                   query.trim().length === 0 ? 
                     internalSelectedRegion 
                       ? `Cédantes disponibles en ${internalSelectedRegion} (${internalSelectedCedants.length}/${maxSelections} sélectionnées)`
                       : `Tapez pour rechercher une cédante... (${internalSelectedCedants.length}/${maxSelections} sélectionnées)` :
                     internalSelectedRegion 
                       ? `Aucune cédante trouvée dans ${internalSelectedRegion}`
                       : 'Aucune cédante trouvée'}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  <div className="px-2 py-1 text-xs text-muted-foreground border-b">
                    <strong>Info :</strong> Maintenez Ctrl/Cmd + clic pour sélectionner plusieurs cédantes
                    {internalSelectedRegion && (
                      <div className="mt-1 flex items-center gap-1">
                        <Filter className="h-3 w-3" />
                        <span>Filtrées par région: {internalSelectedRegion}</span>
                      </div>
                    )}
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    {suggestions.map((cedant, index) => {
                      const isSelected = internalSelectedCedants.some(c => c.id === cedant.id);
                      return (
                        <CommandItem
                          key={cedant.id}
                          id={`cedant-option-${index}`}
                          className={`cursor-pointer ${
                            index === selectedIndex ? 'bg-accent' : ''
                          } ${isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                          onSelect={() => {
                            // Ne rien faire - on utilise onMouseDown à la place
                          }}
                          onMouseDown={(e) => {
                            // Utiliser onMouseDown pour capturer correctement les touches modificatrices
                            e.preventDefault();
                            handleSelect(cedant, e.ctrlKey || e.metaKey);
                          }}
                        >
                          <div className="flex flex-col w-full">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">
                                {highlightMatch(cedant.name, query.trim())}
                              </div>
                              {isSelected && (
                                <Badge variant="secondary" className="text-xs">
                                  Sélectionnée
                                </Badge>
                              )}
                            </div>
                            {cedant.region && (
                              <div className="text-sm text-muted-foreground">
                                {cedant.region}
                              </div>
                            )}
                            {cedant.score && (
                              <div className="text-xs text-muted-foreground">
                                Correspondance: {Math.round(cedant.score)}%
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </ScrollArea>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Affichage des cédantes sélectionnées */}
      {internalSelectedCedants.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Cédantes sélectionnées ({internalSelectedCedants.length}/{maxSelections})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Effacer tout
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {internalSelectedCedants.map((cedant) => (
              <Badge
                key={cedant.id}
                variant="secondary"
                className="flex items-center gap-1 py-1 px-2 text-sm"
              >
                <span className="truncate max-w-[200px]" title={cedant.name}>
                  {cedant.name}
                </span>
                {cedant.region && (
                  <span className="text-xs text-muted-foreground">
                    ({cedant.region})
                  </span>
                )}
                <button
                  onClick={() => handleRemoveCedant(cedant.id)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                  aria-label={`Retirer ${cedant.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          {internalSelectedCedants.length === 0 && (
            <div className="text-xs text-muted-foreground">
              <strong>Info :</strong> Maintenez Ctrl/Cmd lors du clic pour sélectionner plusieurs cédantes
            </div>
          )}
        </div>
      )}

      {/* Dialog popup pour afficher toutes les cédantes de la région */}
      <Dialog open={isRegionPopupOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseRegionPopup();
        } else {
          setIsRegionPopupOpen(true);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Cédantes de la région {internalSelectedRegion}
              <Badge variant="secondary" className="ml-2">
                {regionCedants.length} cédante{regionCedants.length > 1 ? 's' : ''}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            {isLoadingRegionCedants ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-3">Chargement des cédantes...</span>
              </div>
            ) : regionCedants.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune cédante trouvée dans cette région</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p>
                    <strong>Sélection :</strong> {internalSelectedCedants.length}/{maxSelections} cédantes sélectionnées
                  </p>
                </div>
                
                <ScrollArea className="h-96 pr-4">
                  <div className="grid grid-cols-3 gap-3">
                    {regionCedants.map((cedant, index) => {
                      const isSelected = internalSelectedCedants.some(c => c.id === cedant.id);
                      return (
                        <div
                          key={cedant.id}
                          className={`group flex flex-col p-4 rounded-md border transition-all cursor-pointer hover:shadow-sm relative ${
                            isSelected 
                              ? 'bg-primary/10 border-primary/30 shadow-sm' 
                              : 'bg-card hover:bg-muted/30 border-border'
                          }`}
                          onClick={(e) => handleSelectFromPopup(cedant, e.ctrlKey || e.metaKey)}
                        >
                          {/* Badge de sélection en haut à droite */}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="default" className="text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                                ✓
                              </Badge>
                            </div>
                          )}
                          
                          {/* Contenu principal avec checkbox à côté du nom */}
                          <div className="flex items-start gap-2 w-full">
                            {/* Checkbox à gauche */}
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground/30 group-hover:border-primary/50'
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            
                            {/* Nom de la cédante */}
                            <div className="font-medium text-sm leading-tight flex-1">
                              {cedant.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {internalSelectedCedants.length} sur {maxSelections} cédantes sélectionnées
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseRegionPopup}
                    >
                      Fermer
                    </Button>
                    
                    {internalSelectedCedants.length > 0 && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleCloseRegionPopup}
                      >
                        Valider la sélection
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CedantSearch;
