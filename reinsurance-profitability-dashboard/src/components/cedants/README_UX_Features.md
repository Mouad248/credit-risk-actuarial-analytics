# Fonctionnalités UX Avancées - Tableau des Branches

Ce document décrit toutes les améliorations UX implémentées dans le composant `CedantSegmentQuadrants` pour le tableau des branches.

## 🎨 Formatage des Données

### EPI en Millions
- **Format** : `X.XXM` avec 2 décimales
- **Fonction** : `formatEPI(value)`
- **Exemple** : `1,250,000` → `1.25M`
- **Gestion des valeurs nulles** : Affichage `N/A` pour les valeurs à 0

### Ratios en Pourcentages
- **Format** : `XX.XX%` avec 2 décimales
- **Fonction** : `formatRatio(value)`
- **Exemple** : `85.5` → `85.50%`
- **Gestion des valeurs nulles** : Affichage `N/A` pour les valeurs à 0

## 🔄 Tri Interactif

### Colonnes Triables
- **Branche** : Tri alphabétique
- **Année** : Tri numérique
- **EPI moyen** : Tri numérique
- **S/S moyen** : Tri numérique
- **Ratio technique** : Tri numérique (par défaut décroissant)

### Cycle de Tri
1. **Premier clic** : Tri décroissant (desc)
2. **Deuxième clic** : Tri croissant (asc)
3. **Troisième clic** : Pas de tri (null)
4. **Quatrième clic** : Retour au tri décroissant

### Icônes Visuelles
- **Pas de tri** : `ArrowUpDown` (gris)
- **Tri croissant** : `ArrowUp` (bleu)
- **Tri décroissant** : `ArrowDown` (bleu)

## 🎨 Thème SCR

### Couleurs des Ratios Techniques
- **≥ 95%** : `text-green-600` (Excellente performance)
- **≥ 90%** : `text-green-500` (Bonne performance)
- **≥ 85%** : `text-yellow-600` (Performance moyenne)
- **≥ 80%** : `text-orange-500` (Performance faible)
- **< 80%** : `text-red-500` (Performance critique)

### Couleurs utilisées
- **Bleu principal** : `#2563eb`
- **Bleu clair** : `#60a5fa`
- **Bleu foncé** : `#1e40af`

## 📱 Design Responsive

### Breakpoints
- **Mobile** : `< 640px` (sm)
- **Tablet** : `640px - 1024px` (sm-lg)
- **Desktop** : `≥ 1024px` (lg)

### Adaptations Mobile
- **Contrôles** : Empilage vertical sur mobile
- **Recherche** : Pleine largeur sur mobile
- **Boutons** : Pleine largeur sur mobile
- **Tableau** : Scroll horizontal automatique

### Scroll et Headers
- **Scroll vertical** : Headers fixes avec `sticky top-0`
- **Scroll horizontal** : Automatique sur petits écrans
- **Z-index** : `z-10` pour les headers

## 📄 Pagination

### Déclenchement
- **Seuil** : Plus de 100 lignes
- **Taille de page** : 100 éléments par page
- **Navigation** : Boutons Précédent/Suivant

### Informations Affichées
- **Compteur** : "Affichage de X à Y sur Z résultats"
- **Page actuelle** : "Page X sur Y"
- **Boutons** : Désactivés aux limites

## 🔍 Filtrage et Recherche

### Recherche Textuelle
- **Champ** : Recherche dans les noms de branches
- **Icône** : `Search` à gauche
- **Placeholder** : "Rechercher une branche..."
- **Filtrage** : Insensible à la casse

### Filtre par Année
- **Composant** : Select avec icône `Filter`
- **Options** : "Toutes" + années disponibles
- **Tri** : Années décroissantes
- **Badge** : Affichage du filtre actif

### Badges de Filtres Actifs
- **Recherche** : Badge secondaire avec terme
- **Année** : Badge outline avec année
- **Position** : À côté du compteur de résultats

## 📊 Export CSV

### Fonctionnalité
- **Bouton** : Avec icône `Download`
- **Format** : CSV avec encodage UTF-8
- **Nom de fichier** : `branches_{segment}_{date}.csv`

### Structure CSV
```csv
Branche,Année,EPI moyen (M),S/S moyen (%),Ratio technique (%)
"AUTO-AT-RC",2024,1.25,65.50,88.75
"INCENDIE",2024,0.50,70.25,85.30
```

### Gestion des Données
- **Valeurs nulles** : `N/A` dans le CSV
- **Guillemets** : Protection des noms de branches
- **Séparateur** : Virgule standard

## ⚡ Performance

### Optimisations
- **useMemo** : Calculs de données mis en cache
- **Filtrage** : Appliqué avant la pagination
- **Tri** : Appliqué sur les données filtrées
- **Re-renders** : Minimisés avec des dépendances précises

### Gestion Mémoire
- **Pagination** : Limite l'affichage à 100 éléments
- **Filtres** : Appliqués en temps réel
- **Export** : Génération à la demande

## 🎯 Interactions Avancées

### Tri Dynamique
- **État** : `sortConfig` avec field et direction
- **Cycle** : desc → asc → null → desc
- **Feedback** : Icônes visuelles immédiates

### Filtrage Temps Réel
- **Recherche** : Débounced implicitement
- **Année** : Mise à jour immédiate
- **Compteurs** : Mise à jour automatique

### Export Intelligent
- **Données** : Export des données filtrées
- **Nommage** : Inclut segment et date
- **Format** : Compatible Excel/LibreOffice

## 🔧 Configuration

### Paramètres Modifiables
```typescript
const itemsPerPage = 100; // Taille de page
const sortConfig = { field: 'ratioTechnique', direction: 'desc' }; // Tri par défaut
```

### Personnalisation
- **Couleurs** : Modifiables dans `getRatioColor()`
- **Formatage** : Fonctions `formatEPI()` et `formatRatio()`
- **Seuils** : Seuils de performance dans les conditions

## 📋 Tests

### Scénarios Testés
- ✅ Tri sur toutes les colonnes
- ✅ Filtrage par recherche
- ✅ Filtrage par année
- ✅ Pagination avec navigation
- ✅ Export CSV
- ✅ Responsive design
- ✅ Gestion des données manquantes

### Cas d'Usage
- **Données vides** : Affichage de l'état vide
- **Erreur** : Affichage de l'état d'erreur
- **Chargement** : Affichage des skeletons
- **Données complètes** : Fonctionnalités complètes


