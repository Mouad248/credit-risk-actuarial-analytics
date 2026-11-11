import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import CedantSearch from "@/components/cedants/CedantSearch";
import CedantQuadrants from "@/components/cedants/CedantQuadrants";
import CedantSegmentQuadrants from "@/components/cedants/CedantSegmentQuadrants";
import { CedantSuggestion, CedantAnalytics, MultipleCedantAnalyticsResult, fetchCedantAnalytics, fetchMultipleCedantAnalytics } from "@/services/subscriptionService";

interface LoadingState {
  isLoading: boolean;
  progress: number;
  currentTask?: string;
}

interface ErrorState {
  hasError: boolean;
  message?: string;
  partialSuccess?: boolean;
  successCount?: number;
  totalCount?: number;
  failedCedants?: string[];
}

const Cedantes = () => {
  console.log('🔍 Cedantes component rendering...');
  const [selectedCedants, setSelectedCedants] = useState<CedantSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<CedantAnalytics | null>(null);
  const [analyticsTraites, setAnalyticsTraites] = useState<CedantAnalytics | null>(null);
  const [analyticsFac, setAnalyticsFac] = useState<CedantAnalytics | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, progress: 0 });
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });
  
  // États pour les filtres de branches
  const [selectedBranchTraites, setSelectedBranchTraites] = useState<string>('all');
  const [selectedBranchFac, setSelectedBranchFac] = useState<string>('all');
  
  // États pour stocker les branches disponibles (avant filtrage)
  const [availableBranchesTraites, setAvailableBranchesTraites] = useState<string[]>([]);
  const [availableBranchesFac, setAvailableBranchesFac] = useState<string[]>([]);

  // Charger la sélection depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('cedant-selection');
    if (saved) {
      try {
        const savedCedants = JSON.parse(saved);
        if (Array.isArray(savedCedants) && savedCedants.length > 0) {
          setSelectedCedants(savedCedants);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la sélection depuis localStorage:', error);
      }
    }
  }, []);

  // Validation des cédantes sélectionnées
  const validateSelectedCedants = useCallback(async (cedants: CedantSuggestion[]): Promise<CedantSuggestion[]> => {
    // Pour l'instant, nous supposons que toutes les cédantes sont valides
    // Dans une vraie application, on pourrait vérifier avec l'API
    return cedants;
  }, []);

  const handleCedantSelectionChange = useCallback(async (cedants: CedantSuggestion[]) => {
    // Valider les cédantes avant de les sauvegarder
    const validCedants = await validateSelectedCedants(cedants);
    
    // Si des cédantes ont été filtrées, mettre à jour localStorage
    if (validCedants.length !== cedants.length) {
      localStorage.setItem('cedant-selection', JSON.stringify(validCedants));
    }
    
    setSelectedCedants(validCedants);
  }, [validateSelectedCedants]);

  // Éviter les rechargements inutiles avec useMemo
  const cedantIds = useMemo(() => selectedCedants.map(cedant => cedant.id), [selectedCedants]);
  const cedantIdsKey = useMemo(() => cedantIds.join(','), [cedantIds]);

  // Charger les analytics quand des cédantes sont sélectionnées
  useEffect(() => {
    if (selectedCedants.length === 0) {
      setAnalytics(null);
      setAnalyticsTraites(null);
      setAnalyticsFac(null);
      setErrorState({ hasError: false });
      setLoadingState({ isLoading: false, progress: 0 });
      return;
    }

    const loadAnalytics = async () => {
      try {
        setLoadingState({ isLoading: true, progress: 0, currentTask: `Chargement des données pour ${selectedCedants.length} cédantes...` });
        setErrorState({ hasError: false });
        
        // Charger les 3 volets en parallèle avec gestion d'erreurs robuste
        setLoadingState(prev => ({ ...prev, progress: 10, currentTask: "Chargement des données générales..." }));
        const generalPromise = fetchMultipleCedantAnalytics(cedantIds);
        
        setLoadingState(prev => ({ ...prev, progress: 30, currentTask: "Chargement des données traités..." }));
        const traitesPromise = fetchMultipleCedantAnalytics(cedantIds, { 
          segment: "TRAITES",
          branch: selectedBranchTraites !== 'all' ? selectedBranchTraites : undefined
        });
        
        setLoadingState(prev => ({ ...prev, progress: 50, currentTask: "Chargement des données facultatives..." }));
        const facPromise = fetchMultipleCedantAnalytics(cedantIds, { 
          segment: "FAC",
          branch: selectedBranchFac !== 'all' ? selectedBranchFac : undefined
        });
        
        setLoadingState(prev => ({ ...prev, progress: 70, currentTask: "Finalisation..." }));
        
        const [generalResult, traitesResult, facResult] = await Promise.all([
          generalPromise,
          traitesPromise,
          facPromise
        ]);
        
        // Analyser les résultats pour détecter les erreurs partielles
        const allResults = [generalResult, traitesResult, facResult];
        const hasPartialErrors = allResults.some(result => result.failedCedants.length > 0);
        const totalErrors = new Set(allResults.flatMap(result => result.failedCedants));
        
        if (hasPartialErrors) {
          const successfulCount = cedantIds.length - totalErrors.size;
          setErrorState({
            hasError: true,
            partialSuccess: successfulCount > 0,
            successCount: successfulCount,
            totalCount: cedantIds.length,
            failedCedants: Array.from(totalErrors),
            message: successfulCount > 0 
              ? `Données chargées pour ${successfulCount}/${cedantIds.length} cédantes (${totalErrors.size} ont échoué)`
              : `Impossible de charger les données pour toutes les cédantes sélectionnées`
          });
        }
        
        setAnalytics(generalResult.analytics);
        setAnalyticsTraites(traitesResult.analytics);
        setAnalyticsFac(facResult.analytics);
        
        // Extraire les branches disponibles lors du premier chargement (sans filtre)
        // Pour TRAITES : utiliser branchAnalytics
        if (selectedBranchTraites === 'all' && traitesResult.analytics.branchAnalytics) {
          const branches = [...new Set(traitesResult.analytics.branchAnalytics.map(b => b.branchName))]
            .filter(b => b && b.trim())
            .sort();
          setAvailableBranchesTraites(branches);
        }
        
        // Pour FAC : utiliser lobDistribution
        if (selectedBranchFac === 'all' && facResult.analytics.lobDistribution) {
          const branches = [...new Set(facResult.analytics.lobDistribution.map(lob => lob.lob))]
            .filter(b => b && b.trim())
            .sort();
          setAvailableBranchesFac(branches);
        }
        
        setLoadingState({ isLoading: false, progress: 100 });
        
      } catch (err) {
        console.error('Erreur lors du chargement des analytics:', err);
        setErrorState({
          hasError: true,
          message: 'Erreur critique lors du chargement des données',
          partialSuccess: false
        });
        setAnalytics(null);
        setAnalyticsTraites(null);
        setAnalyticsFac(null);
        setLoadingState({ isLoading: false, progress: 0 });
      }
    };

    loadAnalytics();
  }, [cedantIdsKey, selectedCedants.length, selectedBranchTraites, selectedBranchFac]); // Inclure les filtres de branches

  // Note: Le rechargement des données est maintenant géré par le useEffect principal
  // qui inclut les filtres de branches dans ses dépendances

  // Réinitialiser les filtres de branches quand les cédantes changent
  useEffect(() => {
    setSelectedBranchTraites('all');
    setSelectedBranchFac('all');
    setAvailableBranchesTraites([]);
    setAvailableBranchesFac([]);
  }, [selectedCedants]);
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cédantes</h1>
          <p className="text-xl text-gray-600">
            Analyse détaillée des performances par cédante
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-8">
          <CedantSearch 
            onSelectionChange={handleCedantSelectionChange}
            selectedCedants={selectedCedants}
            className="max-w-md mx-auto"
          />
        </div>

        {/* Message d'état */}
        <div className="mb-8 text-center">
          {selectedCedants.length > 0 ? (
            <div className="glass-card p-6">
              <div className="text-gray-800 text-lg">
                <p>Analyse pour: <span className="font-semibold text-green-700">Cédantes sélectionnées ({selectedCedants.length} cédantes)</span></p>
                <div className="text-sm text-gray-600 mt-2">
                  {selectedCedants.map(cedant => cedant.name).join(', ')}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6">
              <p className="text-gray-600 text-lg">
                Sélectionnez des cédantes pour voir les analyses détaillées
              </p>
            </div>
          )}
        </div>

        {/* Indicateur de chargement */}
        {loadingState.isLoading && (
          <div className="mb-8">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {loadingState.currentTask}
                    </p>
                    <Progress value={loadingState.progress} className="h-2" />
                  </div>
                  <span className="text-sm text-gray-600">{loadingState.progress}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gestion d'erreur */}
        {errorState.hasError && (
          <div className="mb-8">
            <Alert variant={errorState.partialSuccess ? "default" : "destructive"} className="glass-card">
              <div className="flex items-start space-x-2">
                {errorState.partialSuccess ? (
                  <CheckCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="font-medium mb-1">{errorState.message}</div>
                    {errorState.failedCedants && errorState.failedCedants.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Cédantes en échec: {errorState.failedCedants.join(', ')}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Volet 1 - Vue d'ensemble */}
        <div className="glass-card mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedCedants.length > 0 ? "Vue d'ensemble - Cédantes sélectionnées" : "Vue d'ensemble"}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedCedants.length === 1 
                ? "Analyse globale de la cédante sélectionnée - tendances, répartitions et performance"
                : selectedCedants.length > 1
                ? "Analyse globale agrégée des cédantes sélectionnées - tendances, répartitions et performance"
                : "Analyse globale des cédantes - tendances, répartitions et performance"
              }
            </p>
          </div>
          <div className="p-6">
            <CedantQuadrants
              cedantId={
                selectedCedants.length === 0 ? null :
                selectedCedants.length === 1 ? selectedCedants[0].id :
                'multiple'
              }
              analytics={analytics || undefined}
              loading={loadingState.isLoading}
              error={errorState.hasError && !errorState.partialSuccess ? errorState.message : undefined}
            />
          </div>
        </div>

        {/* Volet 2 - Analyse des Traités */}
        <div className="glass-card mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedCedants.length > 0 ? "Analyse des Traités - Cédantes sélectionnées" : "Analyse des Traités"}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedCedants.length === 1 
                ? "Performance détaillée des contrats en traités pour la cédante sélectionnée"
                : selectedCedants.length > 1
                ? "Performance agrégée des contrats en traités pour les cédantes sélectionnées"
                : "Performance des contrats en traités"
              }
            </p>
          </div>
          <div className="p-6">
            {/* Filtre de branches pour Traités */}
            {selectedCedants.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filtrer par branche :</label>
                  <Select value={selectedBranchTraites} onValueChange={setSelectedBranchTraites}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Toutes les branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les branches</SelectItem>
                      {availableBranchesTraites.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBranchTraites !== 'all' && (
                    <button
                      onClick={() => setSelectedBranchTraites('all')}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                {availableBranchesTraites.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Aucune branche disponible pour ce segment
                  </p>
                )}
              </div>
            )}
            <CedantSegmentQuadrants
              cedantId={
                selectedCedants.length === 0 ? null :
                selectedCedants.length === 1 ? selectedCedants[0].id :
                'multiple'
              }
              segment="TRAITES"
              analytics={analyticsTraites || undefined}
              loading={loadingState.isLoading}
              error={errorState.hasError && !errorState.partialSuccess ? errorState.message : undefined}
              selectedBranch={selectedBranchTraites}
            />
          </div>
        </div>

        {/* Volet 3 - Analyse Facultative */}
        <div className="glass-card mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedCedants.length > 0 ? "Analyse Facultative - Cédantes sélectionnées" : "Analyse Facultative"}
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedCedants.length === 1 
                ? "Performance détaillée des contrats facultatifs pour la cédante sélectionnée"
                : selectedCedants.length > 1
                ? "Performance agrégée des contrats facultatifs pour les cédantes sélectionnées"
                : "Performance des contrats facultatifs"
              }
            </p>
          </div>
          <div className="p-6">
            {/* Filtre de branches pour FAC */}
            {selectedCedants.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Filtrer par branche :</label>
                  <Select value={selectedBranchFac} onValueChange={setSelectedBranchFac}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Toutes les branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les branches</SelectItem>
                      {availableBranchesFac.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBranchFac !== 'all' && (
                    <button
                      onClick={() => setSelectedBranchFac('all')}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                {availableBranchesFac.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Aucune branche disponible pour ce segment
                  </p>
                )}
              </div>
            )}
            <CedantSegmentQuadrants
              cedantId={
                selectedCedants.length === 0 ? null :
                selectedCedants.length === 1 ? selectedCedants[0].id :
                'multiple'
              }
              segment="FAC"
              analytics={analyticsFac || undefined}
              loading={loadingState.isLoading}
              error={errorState.hasError && !errorState.partialSuccess ? errorState.message : undefined}
              selectedBranch={selectedBranchFac}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cedantes;
