# 📚 Notions de Réassurance et Formules Utilisées dans le Projet

## 🎯 1. NOTIONS DE RÉASSURANCE

### 1.1. Acteurs
- **Cédante (CEDANT)** : L'assureur qui cède une partie de ses risques au réassureur
- **Réassureur** : L'entreprise qui accepte de prendre en charge une partie des risques cédés
- **Assuré (INSURED_NAME)** : Le client final assuré par la cédante

### 1.2. Types de Contrats
- **Traités (TREATY)** : Contrats automatiques couvrant un portefeuille entier
  - **PRO-RATA (PROP)** : Partage proportionnel des risques et des primes
  - **EXCESS OF LOSS (XL) / NON-PROP** : Couverture au-delà d'un certain montant
- **Facultatives (FACULTATIVE)** : Contrats négociés au cas par cas
- **FACOB OPEN COVER** : Type spécial de facultative

### 1.3. Types de Produits
- **Vie (V I E)** : Assurances vie
- **Non-Vie** : Toutes les autres branches d'assurance (Auto, Incendie, etc.)
- **Santé** : Assurances santé (non utilisé actuellement dans le projet)

### 1.4. Lignes d'Affaires (LOB - Line of Business)
Les différentes branches d'assurance :
- **Auto-at-rc** : Automobile et Responsabilité Civile
- **Incendie** : Assurance incendie
- **Maritime-transport** : Assurance maritime et transport
- **Accidents corporels** : Accidents corporels
- **Vie** : Assurance vie
- **Engineering** : Assurance ingénierie
- **Risques divers** : Autres risques
- **Grele** : Assurance grêle
- **Vol** : Assurance vol
- **Credit caution** : Crédit et caution
- **Aviation** : Assurance aviation
- **Assistance** : Assistance
- **Whole accounts** : Comptes globaux
- **Garantie contre evenements catastrophiques** : Catastrophes naturelles

### 1.5. Régions Géographiques
- **MAROC** : Maroc
- **AFRIQUE** : Afrique (regroupe Afrique de l'Est, Ouest, Nord, Egypte)
- **ASIE** : Asie
- **MOYEN-ORIENT** : Moyen-Orient (GCC, Levant, Turquie, etc.)
- **AUTRE** : Europe, Amérique, Monde

### 1.6. Métriques Financières (DÉTAILLÉ)

#### 1.6.1. Primes (Premiums)

**EPI - Earned Premium Income (LAST_EPI_N)**
- **Définition** : Primes nettes retenues par le réassureur après cession à d'autres réassureurs
- **Signification** : Montant réellement conservé par le réassureur sur le portefeuille
- **Unité** : Dirhams (DH)
- **Calcul** : Prime brute (GBP) - Prime cédée à d'autres réassureurs
- **Utilisation** :
  - Base de calcul pour tous les ratios (S/P, ratio technique, profitabilité)
  - Calcul du chiffre d'affaires (CA)
  - Calcul du taux de rétention
- **Exemple** : Si GBP = 1,000,000 DH et EPI = 850,000 DH, alors 150,000 DH ont été cédés

**GBP - Gross Premium (LAST_GBP_N)**
- **Définition** : Primes brutes reçues de la cédante, avant toute cession
- **Signification** : Montant total des primes souscrites
- **Unité** : Dirhams (DH)
- **Utilisation** :
  - Calcul du taux de rétention : (EPI / GBP) × 100
  - Indicateur du volume total d'affaires
- **Relation** : GBP ≥ EPI (toujours, car on ne peut pas céder plus que ce qu'on reçoit)

#### 1.6.2. Sinistres et Provisions

**Claims - Sinistres Payés (LAST_CLAIMS_N)**
- **Définition** : Montant total des sinistres effectivement payés aux assurés
- **Signification** : Coûts réels déjà réglés pour les sinistres survenus
- **Unité** : Dirhams (DH)
- **Caractéristiques** :
  - Valeur certaine (déjà payée)
  - Impact direct sur la trésorerie
  - Inclut tous les types de sinistres (auto, incendie, etc.)
- **Utilisation** :
  - Calcul du ratio S/P : (Claims + Provisions) / EPI × 100
  - Calcul du ratio technique
  - Analyse de la rentabilité

**Claim Reserves - Provisions pour Sinistres (LAST_CLAIM_RES_LATEST_N)**
- **Définition** : Montant provisionné pour les sinistres déclarés mais non encore payés
- **Signification** : Estimation des coûts futurs liés aux sinistres en cours
- **Unité** : Dirhams (DH)
- **Caractéristiques** :
  - Valeur estimée (peut être révisée)
  - Impact sur les résultats comptables
  - Nécessaire pour la solvabilité
- **Types de provisions** :
  - Provisions pour sinistres à payer (IBNR - Incurred But Not Reported)
  - Provisions pour sinistres déclarés non réglés
- **Utilisation** :
  - Calcul du ratio S/P
  - Calcul du ratio technique
  - Évaluation de la santé financière

**Total Sinistres (Claims + Provisions)**
- **Formule** : `LAST_CLAIMS_N + LAST_CLAIM_RES_LATEST_N`
- **Signification** : Coût total estimé des sinistres (payés + à payer)
- **Utilisation** : Base principale pour le calcul du ratio S/P

#### 1.6.3. Commissions et Charges

**Commission (LAST_COMMISSION_N)**
- **Définition** : Commission versée à la cédante pour la gestion du portefeuille
- **Signification** : Rémunération de la cédante pour ses services
- **Unité** : Dirhams (DH)
- **Taux de Commission (COMMISSION_RATE)** :
  - Pourcentage appliqué sur les primes
  - Formule : `(LAST_COMMISSION_N / LAST_EPI_N) × 100`
  - Typiquement entre 0% et 30%
- **Utilisation** :
  - Calcul du ratio technique
  - Analyse des coûts d'acquisition
  - Comparaison entre cédantes

**Brokerage - Courtage (LAST_BROKERAGE_N)**
- **Définition** : Commission versée aux courtiers en réassurance
- **Signification** : Rémunération des intermédiaires qui ont facilité la transaction
- **Unité** : Dirhams (DH)
- **Taux de Brokerage (BROKERAGE_RATE)** :
  - Pourcentage appliqué sur les primes
  - Formule : `(LAST_BROKERAGE_N / LAST_EPI_N) × 100`
- **Utilisation** :
  - Calcul du ratio technique
  - Analyse des coûts de distribution

**Other Charges - Autres Charges (LAST_OTHER_CHARGE_N)**
- **Définition** : Toutes les autres charges techniques non classées ailleurs
- **Signification** : Frais divers liés à la gestion des contrats
- **Unité** : Dirhams (DH)
- **Exemples** :
  - Frais administratifs
  - Frais de gestion
  - Taxes et impôts spécifiques
  - Frais de réassurance rétrocession
- **Utilisation** :
  - Calcul du ratio technique
  - Analyse complète des coûts

**Overrider Commission - Commission Supplémentaire (LAST_OVERRIDER_COMMISSION_N)**
- **Définition** : Commission supplémentaire versée en plus de la commission de base
- **Signification** : Bonus ou commission additionnelle basée sur la performance
- **Unité** : Dirhams (DH)
- **Caractéristiques** :
  - Souvent liée à des objectifs de performance
  - Peut être variable selon les résultats
  - Moins courante que la commission de base
- **Utilisation** :
  - Calcul du ratio technique
  - Analyse des coûts totaux de commission

#### 1.6.4. Charges Totales Techniques

**Total Charges Techniques**
- **Formule** :
```
Total Charges = LAST_CLAIMS_N + 
                LAST_CLAIM_RES_LATEST_N + 
                LAST_BROKERAGE_N + 
                LAST_OTHER_CHARGE_N + 
                LAST_OVERRIDER_COMMISSION_N + 
                LAST_COMMISSION_N
```
- **Signification** : Tous les coûts techniques supportés par le réassureur
- **Utilisation** : Calcul du ratio technique complet

#### 1.6.5. Flux Financiers dans la Réassurance

**Flux Entrants (Revenus)**
1. **GBP (Primes Brutes)** : Revenus totaux reçus de la cédante
2. **EPI (Primes Nettes)** : Revenus conservés après cession

**Flux Sortants (Charges)**
1. **Claims** : Paiements directs aux assurés
2. **Commissions** : Rémunération de la cédante
3. **Brokerage** : Rémunération des courtiers
4. **Other Charges** : Autres frais
5. **Overrider Commission** : Commissions supplémentaires
6. **Provisions** : Réserves pour sinistres futurs

**Résultat Net**
```
Résultat = EPI - (Claims + Provisions + Commissions + Brokerage + Other Charges + Overrider)
```

#### 1.6.6. Métriques Dérivées

**Ratio S/P (Sinistres/Primes)**
- **Formule** : `(Claims + Provisions) / EPI × 100`
- **Interprétation** :
  - < 100% : Rentable
  - > 100% : Non rentable
  - = 100% : Équilibre

**Ratio Technique**
- **Formule** : `Total Charges / EPI × 100`
- **Interprétation** :
  - < 100% : Rentable
  - > 100% : Non rentable

**Profitabilité**
- **Formule** : `100 - Ratio Technique`
- **Interprétation** :
  - > 0% : Bénéfice
  - < 0% : Perte

**Taux de Rétention**
- **Formule** : `(EPI / GBP) × 100`
- **Interprétation** :
  - 100% : Aucune cession
  - < 100% : Partie cédée
  - > 100% : Anomalie (rare, peut arriver avec ajustements comptables)

#### 1.6.7. Unités et Conversions

**Unités de Base**
- **DH** : Dirhams marocains (unité de base dans les données)
- **KDH** : Kilo-Dirhams = DH × 1,000
- **Millions MAD** : Millions de Dirhams = DH ÷ 1,000,000

**Conversions dans le Code**
```python
# Affichage en KDH
premium_kdh = premium_dh / 1_000

# Affichage en Millions MAD (pour les KPIs)
ca_global_millions = total_epi / 1_000_000
```

#### 1.6.8. Colonnes dans les Données Excel

**Colonnes Principales Utilisées :**
- `LAST_EPI_N` : Primes nettes retenues
- `LAST_GBP_N` : Primes brutes
- `LAST_CLAIMS_N` : Sinistres payés
- `LAST_CLAIM_RES_LATEST_N` : Provisions pour sinistres
- `LAST_COMMISSION_N` : Commission versée
- `COMMISSION_RATE` : Taux de commission (%)
- `LAST_BROKERAGE_N` : Courtage
- `BROKERAGE_RATE` : Taux de courtage (%)
- `LAST_OTHER_CHARGE_N` : Autres charges
- `LAST_OVERRIDER_COMMISSION_N` : Commission supplémentaire

**Préfixe "LAST_"** : Indique que ce sont les dernières valeurs disponibles (les plus récentes)

**Suffixe "_N"** : Indique probablement que les valeurs sont normalisées ou en devise nationale (Dirhams)

### 1.7. Concepts Clés
- **Taux de Rétention** : Pourcentage des primes que le réassureur conserve (ne cède pas)
- **Ratio S/P** : Ratio Sinistres/Primes (indicateur de rentabilité)
- **Ratio Technique** : Ratio incluant tous les coûts techniques
- **Profitabilité** : Marge bénéficiaire
- **Tendance (Trend)** : Évolution des métriques dans le temps

---

## 📐 2. FORMULES UTILISÉES

### 2.1. Ratio S/P (Sinistres/Primes)
**Formule principale :**
```
Ratio S/P = (Sinistres + Provisions) / Primes × 100
```

**Détail :**
```python
total_claims = LAST_CLAIMS_N.sum()
total_provisions = LAST_CLAIM_RES_LATEST_N.sum()
total_epi = LAST_EPI_N.sum()

sp_ratio = (total_claims + total_provisions) / total_epi * 100
```

**Interprétation :**
- **< 100%** : Rentable (les primes couvrent les sinistres)
- **> 100%** : Non rentable (les sinistres dépassent les primes)
- **= 100%** : Équilibre

**Utilisation dans le code :**
- Fonction `calculate_loss_ratio()` (ligne 730-745)
- Calcul du S/P moyen par cédante
- Calcul du S/P par année (2016-2024)
- Calcul du S/P par région

---

### 2.2. Ratio Technique
**Formule complète :**
```
Ratio Technique = (Sinistres + Provisions + Commission + Brokerage + Autres Charges + Overrider Commission) / Primes × 100
```

**Détail :**
```python
total_charges = (
    LAST_CLAIMS_N + 
    LAST_CLAIM_RES_LATEST_N + 
    LAST_BROKERAGE_N + 
    LAST_OTHER_CHARGE_N + 
    LAST_OVERRIDER_COMMISSION_N + 
    LAST_COMMISSION_N
).sum()

total_epi = LAST_EPI_N.sum()

ratio_technique = (total_charges / total_epi) * 100
```

**Utilisation dans le code :**
- Fonction `calculate_technical_ratio()` (ligne 1628-1636)
- Calcul des KPIs combinés (ligne 488-498)
- Calcul par type de produit (Vie/Non-Vie)
- Calcul par branche d'affaires

---

### 2.3. Profitabilité
**Formule :**
```
Profitabilité = (Primes - Sinistres - Provisions) / Primes × 100
```

**Alternative (basée sur le ratio technique) :**
```
Profitabilité = 100 - Ratio Technique
```

**Détail :**
```python
total_epi = LAST_EPI_N.sum()
total_claims = LAST_CLAIMS_N.sum()
total_reserve = LAST_CLAIM_RES_LATEST_N.sum()

profitability = (total_epi - (total_claims + total_reserve)) / total_epi * 100
```

**Utilisation dans le code :**
- Fonction `calculate_profitability()` (ligne 713-728)
- Calcul de la profitabilité par région
- Calcul de la profitabilité annuelle
- KPI de profitabilité globale

---

### 2.4. Taux de Rétention
**Formule :**
```
Taux de Rétention = (Primes Netes Retenues / Primes Brutes) × 100
```

**Détail :**
```python
total_epi = LAST_EPI_N.sum()  # Primes nettes retenues
total_gbp = LAST_GBP_N.sum()  # Primes brutes

retention_rate = (total_epi / total_gbp) * 100
```

**Interprétation :**
- **100%** : Le réassureur garde tout (pas de cession)
- **< 100%** : Le réassureur cède une partie à d'autres réassureurs
- **0%** : Tout est cédé

**Utilisation dans le code :**
- Fonction `prepare_retention_cache()` (ligne 1895-1928)
- Calcul par cédante (ligne 1922)
- Calcul par contrat (ligne 1088)
- Affichage dans les détails des cédantes

---

### 2.5. Taux de Croissance du CA
**Formule :**
```
Taux de Croissance = ((CA Année N - CA Année N-1) / CA Année N-1) × 100
```

**Détail :**
```python
current_premium = current_year_data['LAST_EPI_N'].sum()
previous_premium = previous_year_data['LAST_EPI_N'].sum()

growth_rate = ((current_premium - previous_premium) / previous_premium) * 100
```

**Utilisation dans le code :**
- Calcul de la croissance annuelle (ligne 772)
- Calcul de la croissance des primes par cédante (ligne 1061)

---

### 2.6. Taux de Commission
**Formule :**
```
Taux de Commission = (Commission / Primes) × 100
```

**Détail :**
```python
total_commission = LAST_COMMISSION_N.sum()
total_epi = LAST_EPI_N.sum()

commission_rate = (total_commission / total_epi) * 100
```

**Utilisation dans le code :**
- Calcul du taux de commission par contrat (ligne 1080)
- Affichage dans les détails des contrats

---

### 2.7. Chiffre d'Affaires (CA)
**Formule :**
```
CA Global = Somme des Primes / 1_000_000  (en Millions MAD)
```

**Détail :**
```python
ca_global = total_epi / 1_000_000  # Conversion en millions
```

**Variantes :**
- **CA Vie** : Primes Vie / 1_000_000
- **CA Non-Vie** : Primes Non-Vie / 1_000_000
- **CA Volume** : Identique au CA Global

**Utilisation dans le code :**
- Calcul des KPIs CA (ligne 547-555)
- Affichage dans le dashboard

---

### 2.8. Répartition en Pourcentage
**Formule :**
```
Pourcentage = (Valeur du Segment / Valeur Totale) × 100
```

**Exemples :**
- **Répartition par type de produit :**
```python
product_sum = product_data['LAST_EPI_N'].sum()
total_premium = filtered_df['LAST_EPI_N'].sum()
value = (product_sum / total_premium) * 100
```

- **Répartition par ligne d'affaires :**
```python
line_value = (group['LAST_EPI_N'].sum() / total_premium) * 100
```

**Utilisation dans le code :**
- Calcul de la répartition des types de produits (ligne 638)
- Calcul de la répartition des lignes d'affaires (ligne 796)
- Calcul de la répartition des types d'affaires (ligne 670)

---

### 2.9. Tendance (Trend)
**Formule :**
```
Tendance = -(S/P Année N - S/P Année N-1)
```

**Détail :**
```python
current_sp = calculate_loss_ratio(current_year_data)
previous_sp = calculate_loss_ratio(previous_year_data)

trend = -(current_sp - previous_sp)  # Inverse car baisse du S/P = amélioration
```

**Interprétation :**
- **Positif** : Amélioration (baisse du S/P)
- **Négatif** : Dégradation (hausse du S/P)
- **0** : Stabilité

**Utilisation dans le code :**
- Calcul de la tendance des cédantes (ligne 872)
- Calcul de la tendance dans les détails (ligne 1051)

---

### 2.10. S/P par Année
**Formule :**
```
S/P Année X = (Sinistres Année X + Provisions Année X) / Primes Année X × 100
```

**Détail :**
```python
year_data = data[data['UNDERWRITING_YEAR'] == year]
year_epi = year_data['LAST_EPI_N'].sum()
year_claims = year_data['LAST_CLAIMS_N'].sum()
year_provisions = year_data['LAST_CLAIM_RES_LATEST_N'].sum()

sp_year = ((year_claims + year_provisions) / year_epi) * 100
```

**Utilisation dans le code :**
- Calcul des S/P pour chaque année 2016-2024 (ligne 1582-1594)
- Affichage dans les analytics des branches

---

### 2.11. EPI Moyen
**Formule :**
```
EPI Moyen = Somme des Primes / Nombre d'Années
```

**Détail :**
```python
epi_moyen = lob_data['LAST_EPI_N'].mean()
```

**Utilisation dans le code :**
- Calcul de l'EPI moyen par branche (ligne 1201)
- Affichage dans les analytics des branches

---

### 2.12. Nombre Moyen d'Affaires
**Formule :**
```
Nombre Moyen d'Affaires = Nombre Total de Lignes / Nombre d'Années
```

**Détail :**
```python
years_count = group['UNDERWRITING_YEAR'].nunique()
avg_business_count = group.shape[0] / years_count
```

**Utilisation dans le code :**
- Calcul du nombre moyen d'affaires par cédante (ligne 854)

---

### 2.13. Volume Moyen de Primes
**Formule :**
```
Volume Moyen de Primes = Somme des Primes / Nombre d'Années
```

**Détail :**
```python
years_count = group['UNDERWRITING_YEAR'].nunique()
avg_premium_volume = group['LAST_EPI_N'].sum() / years_count
```

**Utilisation dans le code :**
- Calcul du volume moyen de primes par cédante (ligne 857)

---

## 📊 3. CALCULS SPÉCIFIQUES PAR CONTEXTE

### 3.1. Calculs par Cédante
- **S/P moyen** : Ratio S/P sur toutes les années
- **Tendance** : Évolution du S/P entre les 2 dernières années
- **Taux de rétention** : EPI / GBP × 100
- **Taux de croissance** : Croissance des primes
- **Volume moyen de primes** : Primes totales / Nombre d'années
- **Nombre moyen d'affaires** : Nombre de lignes / Nombre d'années

### 3.2. Calculs par Contrat
- **S/P total** : (Sinistres + Provisions) / Primes × 100
- **Taux de rétention** : EPI / GBP × 100
- **Taux de commission moyen** : Moyenne des taux de commission
- **Historique annuel** : S/P, primes, sinistres, provisions par année

### 3.3. Calculs par Région
- **Profitabilité** : (Primes - Sinistres - Provisions) / Primes × 100
- **Performance par type de produit** : Profitabilité Vie vs Non-Vie

### 3.4. Calculs par Ligne d'Affaires
- **EPI moyen** : Moyenne des primes
- **S/P moyen** : Ratio S/P global
- **Ratio technique** : Ratio technique complet
- **S/P par année** : S/P pour chaque année 2016-2024

---

## 🔢 4. UNITÉS ET CONVERSIONS

### 4.1. Unités Monétaires
- **DH** : Dirhams marocains (unité de base)
- **KDH** : Kilo-Dirhams (× 1,000)
- **Millions MAD** : Millions de Dirhams (÷ 1,000,000)

### 4.2. Conversions dans le Code
```python
# Conversion en KDH pour l'affichage
premium_kdh = premium / 1_000

# Conversion en Millions MAD pour les KPIs
ca_global = total_epi / 1_000_000
```

---

## 📈 5. PÉRIODES D'ANALYSE

### 5.1. Période Globale
- **2016-2024** : 9 années de données
- **2016-2023** : 8 années pour certains calculs (S/P moyen, ratio technique)

### 5.2. Calculs Annuels
- Chaque année est calculée individuellement pour :
  - S/P par année
  - Primes par année
  - Croissance annuelle

---

## 🎯 6. INDICATEURS CLÉS (KPIs)

### 6.1. KPIs Principaux
1. **Ratio Technique Combiné** : Tous produits confondus
2. **Ratio Technique Vie** : Produits vie uniquement
3. **Ratio Technique Non-Vie** : Produits non-vie uniquement
4. **Profitabilité** : 100 - Ratio Technique
5. **CA Global** : Chiffre d'affaires total (en Millions MAD)
6. **CA Vie** : Chiffre d'affaires Vie
7. **CA Non-Vie** : Chiffre d'affaires Non-Vie

### 6.2. Interprétation des KPIs
- **Ratio Technique < 100%** : Rentable
- **Ratio Technique > 100%** : Non rentable
- **Profitabilité > 0%** : Bénéfice
- **Profitabilité < 0%** : Perte

---

## 📝 7. NOTES IMPORTANTES

1. **Protection contre division par zéro** : Toutes les formules vérifient que le dénominateur n'est pas nul
2. **Arrondissement** : Les résultats sont arrondis à 1 ou 2 décimales selon le contexte
3. **Filtrage** : Tous les calculs peuvent être filtrés par :
   - Région
   - Type de produit (Vie/Non-Vie)
   - Type d'affaires (Traités/Facultatives)
   - Ligne d'affaires
   - Seuil de prime minimale

---

## 🔍 8. RÉFÉRENCES DANS LE CODE

### 8.1. Fonctions Principales
- `calculate_kpis()` : Ligne 471-571
- `calculate_loss_ratio()` : Ligne 730-745
- `calculate_profitability()` : Ligne 713-728
- `calculate_technical_ratio()` : Ligne 1628-1636
- `calculate_cedants_performance()` : Ligne 806-977
- `calculate_branch_analytics()` : Ligne 1537-1626

### 8.2. Fichiers Clés
- `subscription_backend.py` : Backend Python avec toutes les formules
- `src/services/subscriptionService.ts` : Service frontend TypeScript

---

**Document généré pour la préparation à l'entretien** 📚

