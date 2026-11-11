# Gestion des États - CedantSegmentQuadrants

Ce composant gère plusieurs états pour offrir une expérience utilisateur optimale lors de l'affichage des données des branches.

## États Gérés

### 1. État de Chargement (Loading State)
- **Déclencheur** : `loading={true}`
- **Composants** : Skeleton components avec animation
- **Fonctionnalités** :
  - Indicateur de chargement avec icône animée
  - Skeleton pour les headers et les lignes de données
  - Message informatif "Chargement des données des branches..."

### 2. État d'Erreur (Error State)
- **Déclencheur** : `error` prop non vide
- **Composants** : Alert avec variant destructive
- **Fonctionnalités** :
  - Message d'erreur personnalisé
  - Bouton "Réessayer" avec icône
  - Design cohérent avec le système d'alertes

### 3. État Vide (Empty State)
- **Déclencheur** : `analytics` undefined ou `lobDistribution` vide
- **Composants** : Icône, titre, description et conseils
- **Fonctionnalités** :
  - Icône Database avec design moderne
  - Message explicatif
  - Conseils d'action pour l'utilisateur
  - Design centré et informatif

### 4. État de Données (Data State)
- **Déclencheur** : `analytics` avec `lobDistribution` non vide
- **Composants** : Tableau avec ScrollArea
- **Fonctionnalités** :
  - Indicateur de statut avec point vert animé
  - Compteur de branches trouvées
  - Headers fixes lors du scroll
  - Tri automatique par ratio technique décroissant
  - Gestion des données manquantes avec "N/A"

## Gestion des Données Manquantes

### Filtrage des Entrées Vides
```typescript
.filter(item => item !== null) // Supprime les entrées nulles
```

### Affichage des Valeurs Manquantes
```typescript
{item.epiMoyen > 0 ? formatCurrency(item.epiMoyen) : (
  <span className="text-gray-400 italic">N/A</span>
)}
```

### Validation des Données
- Vérification de `lob.lob` non vide
- Vérification de `lob.premium` > 0
- Valeurs par défaut appropriées

## Indicateurs Visuels

### État de Chargement
- Icône RefreshCw avec animation spin
- Skeleton components pour le contenu
- Message de statut

### État d'Erreur
- Icône AlertCircle
- Couleur rouge (destructive)
- Bouton d'action avec icône

### État Vide
- Icône Database
- Couleur bleue (informatif)
- Conseils d'action

### État de Données
- Point vert animé (pulse)
- Compteur de résultats
- Headers avec bordure

## Responsive Design

Le composant s'adapte aux différentes tailles d'écran :
- `min-h-[320px] md:min-h-[360px]` pour la hauteur
- `col-span-2` pour occuper l'espace des deux volets
- ScrollArea pour gérer le débordement

## Accessibilité

- Labels appropriés pour les boutons
- Contraste de couleurs respecté
- Messages d'erreur clairs
- Navigation au clavier supportée


