import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Zap, Search, Filter, Download, ArrowUpDown } from 'lucide-react';

/**
 * Composant de démonstration des fonctionnalités du tableau des branches
 * Affiche toutes les améliorations UX implémentées
 */
const BranchTableDemo: React.FC = () => {
  const features = [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: "Formatage des Données",
      description: "EPI en millions avec 2 décimales, ratios en pourcentages",
      examples: ["1.25M", "85.50%", "N/A pour valeurs nulles"]
    },
    {
      icon: <ArrowUpDown className="h-5 w-5 text-blue-500" />,
      title: "Tri Interactif",
      description: "Tri cliquable sur toutes les colonnes avec icônes visuelles",
      examples: ["Cycle: desc → asc → null → desc", "Icônes: ArrowUp, ArrowDown, ArrowUpDown"]
    },
    {
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      title: "Thème SCR",
      description: "Couleurs cohérentes avec le thème de l'application pour les ratios",
      examples: ["≥95%: Vert", "≥90%: Vert clair", "≥85%: Jaune", "<80%: Rouge"]
    },
    {
      icon: <Zap className="h-5 w-5 text-purple-500" />,
      title: "Design Responsive",
      description: "Adaptation mobile, scroll horizontal, headers fixes",
      examples: ["Mobile: Contrôles empilés", "Scroll: Headers fixes", "Responsive: Breakpoints"]
    },
    {
      icon: <Search className="h-5 w-5 text-indigo-500" />,
      title: "Recherche & Filtres",
      description: "Recherche textuelle et filtrage par année",
      examples: ["Recherche: Insensible à la casse", "Filtre: Années disponibles", "Badges: Filtres actifs"]
    },
    {
      icon: <Download className="h-5 w-5 text-orange-500" />,
      title: "Export CSV",
      description: "Export des données filtrées en format CSV",
      examples: ["Format: UTF-8", "Nom: branches_{segment}_{date}.csv", "Données: Filtrées et triées"]
    }
  ];

  const performanceMetrics = [
    { label: "Tri par défaut", value: "Ratio technique décroissant" },
    { label: "Pagination", value: "100 éléments par page" },
    { label: "Performance", value: "useMemo pour optimisations" },
    { label: "Gestion mémoire", value: "Données paginées" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <span>Fonctionnalités UX Avancées - Tableau des Branches</span>
          </CardTitle>
          <CardDescription>
            Toutes les améliorations implémentées pour une expérience utilisateur optimale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start space-x-3">
                  {feature.icon}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                    <div className="space-y-1">
                      {feature.examples.map((example, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-purple-500" />
            <span>Métriques de Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span>États Gérés</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">États de Données</h4>
              <div className="space-y-1">
                <Badge variant="secondary">Loading State</Badge>
                <Badge variant="destructive">Error State</Badge>
                <Badge variant="outline">Empty State</Badge>
                <Badge className="bg-green-100 text-green-800">Data State</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Interactions</h4>
              <div className="space-y-1">
                <Badge variant="outline">Tri dynamique</Badge>
                <Badge variant="outline">Recherche temps réel</Badge>
                <Badge variant="outline">Filtrage par année</Badge>
                <Badge variant="outline">Export CSV</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchTableDemo;


