from fastapi.responses import PlainTextResponse
from fastapi.requests import Request
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional, Tuple, Any, Union
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import logging
import unicodedata
import re
from rapidfuzz import process, fuzz
import os

# MODE TEST : Active le chargement d'un échantillon de cédantes pour des tests rapides
# Pour activer : mettre TEST_MODE = True
# Pour désactiver : mettre TEST_MODE = False
TEST_MODE = False  # Mettre à True pour ne charger que l'échantillon de cédantes (tests rapides)

# Source des données : un jeu de démonstration anonymisé est utilisé par défaut.
# Pour utiliser vos propres données : définir la variable d'environnement DATA_FILE
# (fichier .xlsx avec une feuille "data", ou fichier .csv / .csv.gz avec les mêmes colonnes).
DATA_FILE = os.getenv("DATA_FILE", os.path.join("data", "demo_dataset.csv.gz"))


def read_source_data(usecols):
    """Lit les colonnes demandées du fichier de données (Excel ou CSV)."""
    if DATA_FILE.lower().endswith((".csv", ".csv.gz")):
        return pd.read_csv(DATA_FILE, usecols=usecols)
    return pd.read_excel(DATA_FILE, sheet_name="data", usecols=usecols)


# Règles de classement des cédantes (meilleures / moins bonnes) :
# - seules les années matures sont retenues (toutes sauf la dernière année de souscription, dont les sinistres
#   sont encore peu développés) ;
# - une cédante doit avoir au moins RANKING_MIN_YEARS années d'activité, sinon les cédantes récentes à S/P proche de 0
#   dominent artificiellement le haut du classement.
RANKING_MIN_YEARS = 3

# Liste des cédantes à charger en mode test (échantillon représentatif)
TEST_CEDANTS = [
    'Cédante 001',  # Plus grandes cédantes du jeu de démonstration
    'Cédante 002',
    'Cédante 003',
    'Cédante 004',
    'Cédante 005',
]

# Configuration des logs avec format détaillé
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)
from enum import Enum

# Mapping des LOB
LOB_MAPPING = {
    '31 - AUTO-AT-RC': 'Auto-at-rc',
    '32 - INCENDIE': 'Incendie',
    '34 - MARITIME-TRANSPORT': 'Maritime-transport',
    '30 - ACCIDENTS CORPORELS': 'Accidents corporels',
    '51 - V I E': 'Vie',
    '33 - ENGINEERING': 'Engineering',
    '35 - RISQUES DIVERS': 'Risques divers',
    '38 - GRELE': 'Grele',
    '39 - V O L': 'Vol',
    '37 - CREDIT CAUTION': 'Credit caution',
    '40 - AVIATION': 'Aviation',
    '36 - ASSISTANCE': 'Assistance',
    '90 - WHOLE ACCOUNTS': 'Whole accounts',
    ' - ': '',
    '80 - Garantie contre Evenements Catastrophiq.': 'Garantie contre evenements catastrophiques'
}

# Modèles Pydantic correspondant aux structures TypeScript
class KPIData(BaseModel):
    value: Optional[float] = None   # None = non disponible (dénominateur nul)
    trend: Optional[float] = None  # None = tendance non calculée

class RegionData(BaseModel):
    name: str
    profitability: float
    coordinates: Tuple[float, float]

class ProductTypeData(BaseModel):
    name: str
    value: float

class BusinessTypeData(BaseModel):
    name: str
    value: float

class MonthlyProfitabilityData(BaseModel):
    name: str
    value: float

class RegionalPerformanceData(BaseModel):
    name: str
    nonLife: Optional[float] = None
    life: Optional[float] = None
    health: Optional[float] = None

class AnnualPerformanceData(BaseModel):
    year: str
    profitability: Optional[float] = None
    growth: float

class LineOfBusinessData(BaseModel):
    id: str
    name: str
    value: float

class CedantPerformanceData(BaseModel):
    id: str
    name: str
    region: str
    averageSP: float
    averageBusinessCount: float
    averagePremiumVolume: float
    trend: Optional[float] = None

class ContractYearlyData(BaseModel):
    year: int
    premium: float
    claims: float
    provisions: float
    sp: float
    commissionRate: float

class CedantContract(BaseModel):
    contractNumber: str
    yearRange: str
    yearsCount: int
    type: str
    lineOfBusiness: str
    premium: float
    claims: float
    sp: float
    provisions: float
    retentionRate: float
    commissionRate: float
    yearlyHistory: List[ContractYearlyData]

class CedantDetails(BaseModel):
    id: str
    name: str
    region: str
    averageSP: float
    averagePremiumVolume: float
    averageBusinessCount: float
    trend: Optional[float] = None
    retentionRate: float
    growthRate: float
    contracts: List[CedantContract]

class CedantSuggestion(BaseModel):
    id: str
    name: str
    region: Optional[str] = None
    score: Optional[float] = None

class BranchAnalytics(BaseModel):
    branchName: str
    insuredName: str
    year: int
    epiMoyen: float
    ssMoyen: Optional[float] = None
    ratioTechnique: Optional[float] = None
    sp2016: Optional[float] = None
    sp2017: Optional[float] = None
    sp2018: Optional[float] = None
    sp2019: Optional[float] = None
    sp2020: Optional[float] = None
    sp2021: Optional[float] = None
    sp2022: Optional[float] = None
    sp2023: Optional[float] = None
    sp2024: Optional[float] = None

class CedantAnalytics(BaseModel):
    annualSeries: List[Dict[str, Union[int, float]]]
    lobDistribution: List[Dict[str, Union[str, float]]]
    contractMix: Optional[List[Dict[str, Union[str, float]]]] = None
    contractNature: Optional[List[Dict[str, Union[str, float]]]] = None
    riskCountries: List[Dict[str, Union[str, float]]]
    branchAnalytics: Optional[List[BranchAnalytics]] = None

class KPIs(BaseModel):
    combined: KPIData
    life: KPIData
    nonLife: KPIData
    health: KPIData
    profitability: KPIData
    ca_global: KPIData
    ca_volume: KPIData
    ca_life: KPIData
    ca_non_life: KPIData
    ca_health: KPIData

class SubscriptionDataResponse(BaseModel):
    kpis: KPIs
    regions: List[RegionData]
    productTypes: List[ProductTypeData]
    businessType: List[BusinessTypeData]
    regionalPerformance: List[RegionalPerformanceData]
    annualPerformance: List[AnnualPerformanceData]
    linesOfBusiness: List[LineOfBusinessData]
    topCedants: List[CedantPerformanceData]
    bottomCedants: List[CedantPerformanceData]

def _round1(value: Optional[float]) -> Optional[float]:
    """Arrondit à 1 décimale en conservant None (valeur non disponible)."""
    return None if value is None else round(float(value), 1)


def create_empty_response() -> SubscriptionDataResponse:
    """Crée une réponse vide mais valide quand les filtres ne retournent aucune donnée."""
    return SubscriptionDataResponse(
        kpis=KPIs(
            combined=KPIData(value=None, trend=None),
            life=KPIData(value=None, trend=None),
            nonLife=KPIData(value=None, trend=None),
            health=KPIData(value=None, trend=None),
            profitability=KPIData(value=None, trend=None),
            ca_global=KPIData(value=0.0, trend=None),
            ca_volume=KPIData(value=0.0, trend=None),
            ca_life=KPIData(value=0.0, trend=None),
            ca_non_life=KPIData(value=0.0, trend=None),
            ca_health=KPIData(value=0.0, trend=None)
        ),
        regions=[],
        productTypes=[],
        businessType=[],
        regionalPerformance=[],
        annualPerformance=[],
        linesOfBusiness=[],
        topCedants=[],
        bottomCedants=[]
    )

# Mapping des régions
REGION_MAPPING = {
    # MAROC
    'MAROC': 'MAROC',
    
    # AFRIQUE
    'AFRIQUE': 'AFRIQUE',
    'AFRIQUE DE L\'EST': 'AFRIQUE',
    'AFRIQUE DE L\'OUEST': 'AFRIQUE',
    'AFRIQUE DU NORD': 'AFRIQUE',
    'EGYPT': 'AFRIQUE',
    
    # ASIE
    'ASIE AUTRES': 'ASIE',
    'ASIE': 'ASIE',
    'EXTREME ORIENT - ASIE': 'ASIE',  # Ajoutons cette ligne
    
    # MOYEN-ORIENT
    'AUTRES GOLFE': 'MOYEN-ORIENT',
    'GCC': 'MOYEN-ORIENT',
    'ISRAEL': 'MOYEN-ORIENT',
    'LE LEVANT': 'MOYEN-ORIENT',
    'TURQUIE': 'MOYEN-ORIENT',
    'MOYEN ORIENT': 'MOYEN-ORIENT',
    
    # AUTRE
    'EUROPE': 'AUTRE',
    'MONDE': 'AUTRE',
    'MONDE ENTIER': 'AUTRE',
    'AUSTRALIE': 'AUTRE',
    'AMERIQUE DU NORD': 'AUTRE',
    'AMERIQUE DU SUD': 'AUTRE'
}

def get_region_coordinates(region_id: str) -> Tuple[float, float]:
    """
    Retourne les coordonnées géographiques pour une région donnée.
    Coordonnées ajustées pour correspondre à la projection de l'image de fond.
    """
    coordinates_map = {
        'MAROC':        (31.7917,  -7.0926),     # Maroc - Position correcte ✅
        'AFRIQUE':      (-25.0,    25.0),        # Afrique du Sud - beaucoup plus au sud
        'ASIE':         (20.0,     100.0),       # Asie - Position correcte ✅
        'MOYEN-ORIENT': (25.0,     75.0),        # Golfe Persique - plus à l'est
        'AUTRE':        (52.5200,  13.4050),     # Europe - Position correcte ✅
    }
    return coordinates_map.get(region_id, (0, 0))

# Création de l'application FastAPI
app = FastAPI(
    title="API de Données de Souscription",
    description="API pour les données de rentabilité et d'analyse des cédantes",
    version="1.0.0"
)
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = ''.join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    print(tb)
    return PlainTextResponse(str(tb), status_code=500)

# Configuration CORS pour permettre les requêtes depuis le frontend
ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:8080,http://localhost:3000,http://localhost:5173,http://localhost:5174",
).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # URLs du frontend (variable d'environnement ALLOWED_ORIGINS, séparées par des virgules)
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Fonction helper pour charger les données Excel et effectuer les calculs initiaux
def load_and_process_excel():
    """
    Charge et prétraite les données du fichier Excel.
    """
    try:
        columns_to_keep = [
            "PROFIT_CENTRE_CODE", "LOB", "BRANCH_NAME", "INSURED_NAME", "DOMICILE_REGION", "RISK_COUNTRY",
            "CONTRACT_NUMBER", "UNDERWRITING_YEAR", "CONTRACT_STATUS", "PORTFOLIO_TYPE",
            "TYPE_OF_CONTRACT", "TYPE_OF_BUSINESS","CEDANT", "LAST_CLAIMS_N",
            "LAST_CLAIM_RES_LATEST_N", "LAST_EPI_N", "LAST_GBP_N", "COMMISSION_RATE", "LAST_COMMISSION_N", 
            "BROKERAGE_RATE", "LAST_BROKERAGE_N", "LAST_OTHER_CHARGE_N", "LAST_OVERRIDER_COMMISSION_N"
        ]
        
        df = read_source_data(columns_to_keep)
        
        # MODE TEST : Filtrer sur un échantillon de cédantes
        if TEST_MODE:
            original_count = len(df)
            df = df[df['CEDANT'].isin(TEST_CEDANTS)]
            logger.info(f"MODE TEST ACTIVE : {len(df)} lignes chargées sur {original_count} (cédantes : {', '.join(TEST_CEDANTS)})")
        
        # Vérifier si les colonnes de commission et charges existent
        commission_cols = ['COMMISSION_RATE', 'LAST_COMMISSION_N', 'BROKERAGE_RATE', 'LAST_BROKERAGE_N', 
                          'LAST_OTHER_CHARGE_N', 'LAST_OVERRIDER_COMMISSION_N']
        missing_cols = [col for col in commission_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f"Colonnes de commission/charges manquantes: {missing_cols}")
            # Créer des colonnes avec des valeurs par défaut
            for col in missing_cols:
                df[col] = 0.0
        else:
            logger.info(f"Toutes les colonnes de commission sont présentes")
            # Remplacer les NaN par 0 seulement
            for col in commission_cols:
                df[col] = df[col].fillna(0)
        
        # Filtrer les années
        df = df[(df["UNDERWRITING_YEAR"] <= 2024) & (df["UNDERWRITING_YEAR"] >= 2016)]
        df["UNDERWRITING_YEAR"] = df["UNDERWRITING_YEAR"].astype(int)  # évite les années affichées "2022.0"
        
        # Avant mapping
        logger.debug("Régions contenant 'ASIE' avant mapping:")
        logger.debug(df[df['DOMICILE_REGION'].str.contains('ASIE', na=False)]['DOMICILE_REGION'].unique())
        
        # Nettoyer et standardiser les régions
        df['DOMICILE_REGION'] = df['DOMICILE_REGION'].str.strip().str.upper()

        # Appliquer le mapping des régions (en gardant le libellé d'origine pour le contrôle)
        raw_region = df['DOMICILE_REGION']
        df['DOMICILE_REGION'] = raw_region.map(REGION_MAPPING)

        # Après mapping
        logger.debug("Nombre d'entrées pour ASIE après mapping:")
        logger.debug(len(df[df['DOMICILE_REGION'] == 'ASIE']))

        # Vérifier les régions non mappées (libellés d'origine, valeur renseignée mais absente du dictionnaire)
        unmapped_mask = df['DOMICILE_REGION'].isna() & raw_region.notna()
        non_mapped = raw_region[unmapped_mask].unique()
        if len(non_mapped) > 0:
            logger.warning(f"Régions non mappées ({int(unmapped_mask.sum())} lignes exclues): {non_mapped}")
        
        # Supprimer les lignes où DOMICILE_REGION est NaN
        df = df.dropna(subset=['DOMICILE_REGION'])
        
        # Autres transformations existantes - avec valeurs standardisées pour le frontend
        df["product_type"] = np.where(df["BRANCH_NAME"] == "V I E", "life", "nonLife")
        # Règle unique de segmentation (utilisée par toutes les pages) :
        # FAC = facultative ou FACOB open cover (TYPE_OF_BUSINESS) ou portefeuille déclaré facultatif ;
        # TRAITES = tout le reste (y compris les contrats non classés).
        type_of_business = df["TYPE_OF_BUSINESS"].fillna("").astype(str).str.upper()
        is_fac = type_of_business.str.contains("FACULTATIVE|FACOB") | (df["PORTFOLIO_TYPE"] == "2 - FACULTATIVE")
        df["segment"] = np.where(is_fac, "FAC", "TRAITES")
        df["business_type"] = np.where(is_fac, "facultative", "treaties")
        # Appliquer le mapping des LOB
        df['line_of_business'] = df['LOB'].map(LOB_MAPPING)
        
        # Vérifier les LOB non mappées
        non_mapped_lob = df[df['line_of_business'].isna()]['LOB'].unique()
        if len(non_mapped_lob) > 0:
            logger.warning(f"LOB non mappées: {non_mapped_lob}")
        
        logger.debug(f"Fichier Excel chargé avec succès. Colonnes: {df.columns.tolist()}")
        logger.debug(f"Régions uniques après mapping: {df['DOMICILE_REGION'].unique().tolist()}")
        
        return df
        
    except Exception as e:
        logger.error(f"Erreur lors du chargement du fichier Excel: {e}")
        return pd.DataFrame()

# Les données seront chargées à la demande via load_data_once()

# Cache global pour les taux de rétention (calculé une seule fois au démarrage)
cedant_retention_cache = {}



def calculate_subscription_data(
    df: pd.DataFrame,
    region: Optional[str] = None,
    product_type: Optional[str] = None,
    business_type: Optional[str] = None,
    line_of_business: Optional[str] = None,
    min_premium_threshold: Optional[float] = None,
    min_premium_threshold_bottom: Optional[float] = None
) -> SubscriptionDataResponse:
    logger.debug(f"calculate_subscription_data appelée avec region='{region}'")
    logger.debug(f"Taille initiale du DataFrame: {len(df)} lignes")
    logger.debug(f"Valeurs uniques dans DOMICILE_REGION: {df['DOMICILE_REGION'].unique().tolist()}")
    
    filtered_df = df.copy()

    if region and region != 'all':
        logger.debug(f"Application du filtre région '{region}'")
        logger.debug(f"Valeurs uniques dans DOMICILE_REGION avant filtre: {filtered_df['DOMICILE_REGION'].unique().tolist()}")
        logger.debug(f"Recherche de '{region.upper()}' dans les valeurs")
        filtered_df = filtered_df[filtered_df['DOMICILE_REGION'].str.upper() == region.upper()]
        logger.debug(f"Taille après filtre région: {len(filtered_df)} lignes")
        if filtered_df.empty:
            logger.debug("⚠️ AUCUNE DONNÉE TROUVÉE pour cette région!")
            logger.debug(f"Valeurs disponibles: {filtered_df['DOMICILE_REGION'].unique().tolist()}")
    
    if product_type and product_type != 'all':
        logger.debug(f"Application du filtre type de produit '{product_type}'")
        logger.debug(f"Valeurs uniques dans product_type avant filtre: {filtered_df['product_type'].unique().tolist()}")
        filtered_df = filtered_df[filtered_df['product_type'] == product_type]
        logger.debug(f"Taille après filtre product_type: {len(filtered_df)} lignes")
    if business_type and business_type != 'all':
        logger.debug(f"Application du filtre type d'affaires '{business_type}'")
        logger.debug(f"Valeurs uniques dans business_type avant filtre: {filtered_df['business_type'].unique().tolist()}")
        filtered_df = filtered_df[filtered_df['business_type'] == business_type]
        logger.debug(f"Taille après filtre business_type: {len(filtered_df)} lignes")
    if line_of_business and line_of_business != 'all':
        filtered_df = filtered_df[filtered_df['line_of_business'] == line_of_business]

    print(f"DEBUG: Taille de filtered_df après filtres: {len(filtered_df)} lignes")

    if filtered_df.empty:
        print("DEBUG: filtered_df est vide, retourne une réponse vide.")
        return create_empty_response()

    # --- AJOUTEZ CES LIGNES DE DEBUGGING ---
    print("DEBUG: Début du calcul des KPIs...")
    kpis = calculate_kpis(df, filtered_df, region, product_type, business_type, line_of_business)
    print("DEBUG: KPIs calculés.")

    print("DEBUG: Début du calcul des régions...")
    regions_data = calculate_regions_data(df, filtered_df)
    print("DEBUG: Régions calculées.")

    print("DEBUG: Début du calcul des types de produits...")
    product_types_data = calculate_product_types(df, filtered_df)
    print("DEBUG: Types de produits calculés.")

    print("DEBUG: Début du calcul des types d'affaires...")
    business_type_data = calculate_business_types(df, filtered_df)
    print("DEBUG: Types d'affaires calculés.")

    print("DEBUG: Début du calcul de la performance régionale...")
    regional_performance = calculate_regional_performance(df, filtered_df)
    print("DEBUG: Performance régionale calculée.")

    print("DEBUG: Début du calcul de la performance annuelle...")
    annual_performance = calculate_annual_performance(df, filtered_df)
    print("DEBUG: Performance annuelle calculée.")

    print("DEBUG: Début du calcul des lignes d'affaires...")
    lines_of_business = calculate_lines_of_business(df, filtered_df)
    print("DEBUG: Lignes d'affaires calculées.")

    print("DEBUG: Début du calcul des cédants...")
    top_cedants, bottom_cedants = calculate_cedants_performance(df, filtered_df, 
                                                                 region, product_type, 
                                                                 business_type, line_of_business,
                                                                 min_premium_threshold,
                                                                 min_premium_threshold_bottom)
    print("DEBUG: Cédants calculés.")

    print("DEBUG: Assemblage de la réponse finale...")
    response = SubscriptionDataResponse(
        kpis=kpis,
        regions=regions_data,
        productTypes=product_types_data,
        businessType=business_type_data,
        regionalPerformance=regional_performance,
        annualPerformance=annual_performance,
        linesOfBusiness=lines_of_business,
        topCedants=top_cedants,
        bottomCedants=bottom_cedants
    )
    print("DEBUG: Réponse finale assemblée.")

    return response

def calculate_kpis(
    original_df: pd.DataFrame,
    filtered_df: pd.DataFrame,
    region: Optional[str] = None,
    product_type: Optional[str] = None,
    business_type: Optional[str] = None,
    line_of_business: Optional[str] = None
) -> KPIs:
    """
    Calcule les KPIs basés sur les données filtrées sur 8 ans (2016-2024).
    Utilise la moyenne pondérée par le volume de primes sur toute la période.
    Toutes les tendances sont fixées à 0.
    """
    # Utiliser toutes les données filtrées (8 ans : 2016-2024)
    # Calculer la moyenne pondérée par le volume de primes
    
    # Calculer les KPIs combinés selon la formule métier du ratio technique sur 8 ans
    # Formule : (claims + claim_reserves + brokerage + other_charges + overrider_commission + commission) / EPI * 100
    # Optimisation : calcul vectorisé en une seule opération
    total_charges = (filtered_df['LAST_CLAIMS_N'] + 
                    filtered_df['LAST_CLAIM_RES_LATEST_N'] + 
                    filtered_df['LAST_BROKERAGE_N'] + 
                    filtered_df['LAST_OTHER_CHARGE_N'] + 
                    filtered_df['LAST_OVERRIDER_COMMISSION_N'] + 
                    filtered_df['LAST_COMMISSION_N']).sum()
    total_epi = filtered_df['LAST_EPI_N'].sum()
    
    combined_value = (total_charges / total_epi * 100) if total_epi > 0 else None
    
    # Calculer les KPIs par type de produit (Vie, Non-Vie) sur 8 ans
    life_data = filtered_df[filtered_df['BRANCH_NAME'] == 'V I E']
    nonlife_data = filtered_df[filtered_df['BRANCH_NAME'] != 'V I E']
    
    # Calculer les KPIs par type de produit avec la formule métier sur 8 ans (optimisé)
    if not life_data.empty:
        life_charges = (life_data['LAST_CLAIMS_N'] + 
                       life_data['LAST_CLAIM_RES_LATEST_N'] + 
                       life_data['LAST_BROKERAGE_N'] + 
                       life_data['LAST_OTHER_CHARGE_N'] + 
                       life_data['LAST_OVERRIDER_COMMISSION_N'] + 
                       life_data['LAST_COMMISSION_N']).sum()
        life_epi = life_data['LAST_EPI_N'].sum()
        life_value = (life_charges / life_epi * 100) if life_epi > 0 else None
    else:
        life_value = None
        
    if not nonlife_data.empty:
        nonlife_charges = (nonlife_data['LAST_CLAIMS_N'] + 
                          nonlife_data['LAST_CLAIM_RES_LATEST_N'] + 
                          nonlife_data['LAST_BROKERAGE_N'] + 
                          nonlife_data['LAST_OTHER_CHARGE_N'] + 
                          nonlife_data['LAST_OVERRIDER_COMMISSION_N'] + 
                          nonlife_data['LAST_COMMISSION_N']).sum()
        nonlife_epi = nonlife_data['LAST_EPI_N'].sum()
        nonlife_value = (nonlife_charges / nonlife_epi * 100) if nonlife_epi > 0 else None
    else:
        nonlife_value = None
    
    
    # Ajustements spécifiques en fonction des filtres
    
    # Si un type de produit spécifique est sélectionné
    if product_type and product_type != 'all':
        if product_type == 'life':
            combined_value = life_value
        elif product_type == 'nonLife':
            combined_value = nonlife_value
    
    # Calculer les KPIs santé (pour l'instant à 0 car pas de données santé)
    health_value = None
    
    # ✨ NOUVEAUX KPIs
    # Rentabilité globale (%)
    profitability_value = (100 - combined_value) if combined_value is not None else None
    
    # CA Global (en Millions MAD)
    ca_global_value = total_epi / 1_000_000
    
    # Volume CA (identique au CA Global pour cette plateforme)
    ca_volume_value = ca_global_value
    
    # CA par segment (en Millions MAD)
    ca_life_value = life_data['LAST_EPI_N'].sum() / 1_000_000 if not life_data.empty else 0.0
    ca_non_life_value = nonlife_data['LAST_EPI_N'].sum() / 1_000_000 if not nonlife_data.empty else 0.0
    ca_health_value = 0.0  # Pas de données Santé dans le système
    
    # Construire l'objet KPIs avec toutes les tendances à 0
    kpis = KPIs(
        combined=KPIData(value=_round1(combined_value), trend=None),
        life=KPIData(value=_round1(life_value), trend=None),
        nonLife=KPIData(value=_round1(nonlife_value), trend=None),
        health=KPIData(value=None, trend=None),
        profitability=KPIData(value=_round1(profitability_value), trend=None),
        ca_global=KPIData(value=round(ca_global_value, 1), trend=None),
        ca_volume=KPIData(value=round(ca_volume_value, 1), trend=None),
        ca_life=KPIData(value=round(ca_life_value, 1), trend=None),
        ca_non_life=KPIData(value=round(ca_non_life_value, 1), trend=None),
        ca_health=KPIData(value=round(ca_health_value, 1), trend=None)
    )
    
    return kpis


def calculate_regions_data(original_df: pd.DataFrame, filtered_df: pd.DataFrame) -> List[RegionData]:
    """Calcule les données de profitabilité par région."""
    regions = []
    regions_name = filtered_df['DOMICILE_REGION'].unique().tolist()
    
    # Ajouter des logs pour le débogage
    logger.debug(f"Régions uniques trouvées: {regions_name}")
    
    for region_name in regions_name:
        # Filtrer les données pour la région en cours
        region_data = filtered_df[filtered_df['DOMICILE_REGION'] == region_name]
        logger.debug(f"Traitement de la région {region_name} avec {len(region_data)} entrées")
        
        # Obtenir les coordonnées de la région
        coordinates = get_region_coordinates(region_name)
        
        # Profitabilité = (primes - sinistres - provisions) / primes * 100
        # (et non le S/P : la carte considère qu'une valeur élevée est favorable)
        profitability = calculate_profitability(region_data)
        if profitability is None:
            continue  # région sans prime : rien à afficher sur la carte

        logger.debug(f"Région {region_name}: profitabilité = {profitability}")
        
        regions.append(RegionData(
            name=region_name,
            profitability=round(profitability, 1),
            coordinates=coordinates
        ))
    
    return regions



def get_product_name(product_type: str) -> str:
    """Convertit le code du type de produit en nom lisible."""
    product_names = {
        'life': 'Vie',
        'nonLife': 'Non-Vie',
        'health': 'Santé'
    }   
    
    return product_names.get(product_type, product_type)


def calculate_product_types(original_df: pd.DataFrame, filtered_df: pd.DataFrame) -> List[ProductTypeData]:
    """Calcule la répartition du volume de primes par type de produit."""
    product_types = []
    product_type_names = filtered_df['product_type'].unique().tolist()

    # Calcul du volume total pour la pondération
    total_premium = filtered_df['LAST_EPI_N'].sum()

    for product_type in product_type_names:
        # Filtrer les données correspondant au type de produit
        product_data = filtered_df[filtered_df['product_type'] == product_type]

        # Calcul du pourcentage
        product_sum = product_data['LAST_EPI_N'].sum()
        value = (product_sum / total_premium * 100) if total_premium > 0 else 0

        product_types.append(ProductTypeData(
            name=get_product_name(product_type),
            value=round(value, 0)
        ))

    return product_types


def get_business_name(business_type: str) -> str:
    """Convertit le code du type d'affaires en nom lisible."""
    business_names = {
        'treaties': 'Traités',
        'facultative': 'Facultatives'
    }
    
    return business_names.get(business_type, business_type)


def calculate_business_types(original_df: pd.DataFrame, filtered_df: pd.DataFrame) -> List[BusinessTypeData]:
    """Calcule la répartition par type d'affaires."""
    business_types = []
    
    # Grouper par type d'affaires et calculer la somme des valeurs
    business_groups = filtered_df['business_type'].unique().tolist()
    
    total_value = filtered_df['LAST_EPI_N'].sum()
    
    for business_type in business_groups:
        business_name = get_business_name(business_type)
        business_type_data = filtered_df[filtered_df['business_type'] == business_type]
        business_value = (business_type_data['LAST_EPI_N'].sum() / total_value * 100) if total_value else 0
        
        business_types.append(BusinessTypeData(
            name=business_name,
            value=round(business_value, 0)
        ))
    
    return business_types


def calculate_regional_performance(original_df: pd.DataFrame, filtered_df: pd.DataFrame) -> List[RegionalPerformanceData]:
    """Calcule les performances par région et par type de produit."""
    regional_performances = []
    
    region_groups = filtered_df['DOMICILE_REGION'].unique().tolist()
    logger.debug(f"Calcul de la performance régionale pour les régions: {region_groups}")
    
    for region_group in region_groups:
        # Filtrer les données pour cette région spécifique
        region_data = filtered_df[filtered_df['DOMICILE_REGION'] == region_group]
        logger.debug(f"Région {region_group}: {len(region_data)} entrées")
        
        # Calculer la performance pour chaque type de produit dans cette région
        life_data = region_data[region_data['product_type'] == 'life']
        nonlife_data = region_data[region_data['product_type'] == 'nonLife']
        health_data = region_data[region_data['product_type'] == 'health']
        
        # Calculer la profitabilité pour chaque type
        life_profitability = calculate_profitability(life_data)
        nonlife_profitability = calculate_profitability(nonlife_data)
        health_profitability = calculate_profitability(health_data)
        
        logger.debug(f"Région {region_group} - Vie: {life_profitability}, Non-Vie: {nonlife_profitability}")
        
        regional_performances.append(RegionalPerformanceData(
            name=region_group,
            nonLife=_round1(nonlife_profitability),
            life=_round1(life_profitability),
            health=None
        ))
    
    return regional_performances

def calculate_profitability(data: pd.DataFrame) -> Optional[float]:
    """Calcule la profitabilité : (primes - sinistres - provisions) / primes * 100
    Une profitabilité positive signifie un profit, négative signifie une perte.
    """
    if data.empty:
        return None
    
    total_epi = data['LAST_EPI_N'].sum()
    total_claims = data['LAST_CLAIMS_N'].sum()
    total_reserve = data['LAST_CLAIM_RES_LATEST_N'].sum()
    
    if total_epi > 0:
        # Profitabilité = (Primes - Coûts) / Primes * 100
        return (total_epi - (total_claims + total_reserve)) / total_epi * 100
    # Pas de primes : le ratio n'est pas défini (et non égal à 0 %)
    return None

def calculate_loss_ratio(data: pd.DataFrame) -> Optional[float]:
    """Calcule le ratio S/P : (sinistres + provisions) / primes * 100
    Un ratio S/P inférieur à 100% est bon (profitable), supérieur à 100% est mauvais.
    """
    if data.empty:
        return None
    
    total_epi = data['LAST_EPI_N'].sum()
    total_claims = data['LAST_CLAIMS_N'].sum()
    total_reserve = data['LAST_CLAIM_RES_LATEST_N'].sum()
    
    if total_epi > 0:
        # Ratio S/P = (Sinistres + Provisions) / Primes * 100
        return (total_claims + total_reserve) / total_epi * 100
    # Pas de primes : le ratio n'est pas défini (et non égal à 0 %)
    return None

def calculate_annual_performance(original_df: pd.DataFrame, filtered_df: pd.DataFrame) -> List[AnnualPerformanceData]:
    """Calcule les performances annuelles avec la croissance du chiffre d'affaires."""
    annual_performances = []
    
    # Grouper par année et calculer la profitabilité moyenne
    year_groups = filtered_df.groupby('UNDERWRITING_YEAR')
    yearly_profitability = {}
    yearly_turnover = {}
    
    for year, group in year_groups:
        yearly_profitability[year] = calculate_profitability(group)
        # Calculer le chiffre d'affaires (primes) pour chaque année
        yearly_turnover[year] = group['LAST_EPI_N'].sum()
    
    # Calculer la croissance année par année
    sorted_years = sorted(yearly_profitability.keys())
    
    for i, year in enumerate(sorted_years):
        profitability = yearly_profitability[year]
        
        # Calculer la croissance du CA par rapport à l'année précédente
        if i > 0:
            prev_year = sorted_years[i-1]
            current_turnover = yearly_turnover[year]
            prev_turnover = yearly_turnover[prev_year]
            turnover_growth = ((current_turnover - prev_turnover) / prev_turnover * 100) if prev_turnover > 0 else 0
        else:
            turnover_growth = 0
        
        annual_performances.append(AnnualPerformanceData(
            year=str(year),
            profitability=_round1(profitability),
            growth=round(turnover_growth, 1)
        ))
    
    return annual_performances

def calculate_lines_of_business(original_df: pd.DataFrame, filtered_df: pd.DataFrame) -> List[LineOfBusinessData]:
    """Calcule la répartition par ligne d'affaires."""
    lines_of_business = []
    
    # Utiliser TOUTES les lignes d'affaires disponibles (pas seulement celles filtrées)
    lob_groups = original_df['line_of_business'].dropna().unique().tolist()
    
    total_premium = filtered_df['LAST_EPI_N'].sum()
    
    for line_name in lob_groups:
        # Calculer la valeur (pourcentage du volume total de primes) à partir des données filtrées
        group = filtered_df[filtered_df['line_of_business'] == line_name]
        line_value = (group['LAST_EPI_N'].sum() / total_premium * 100) if total_premium else 0
        
        lines_of_business.append(LineOfBusinessData(
            id=line_name,
            name=line_name,
            value=round(line_value, 0)
        ))
    
    return lines_of_business

def calculate_cedants_performance(
    original_df: pd.DataFrame,
    filtered_df: pd.DataFrame,
    region: Optional[str] = None,
    product_type: Optional[str] = None,
    business_type: Optional[str] = None,
    line_of_business: Optional[str] = None,
    min_premium_threshold: Optional[float] = None,
    min_premium_threshold_bottom: Optional[float] = None
) -> Tuple[List[CedantPerformanceData], List[CedantPerformanceData]]:
    logger.debug("-"*50)
    logger.debug("Début du calcul des performances des cédantes")
    logger.debug(f"Taille du DataFrame original : {len(original_df)}")
    logger.debug(f"Taille du DataFrame filtré : {len(filtered_df)}")
    logger.debug(f"Régions présentes : {filtered_df['DOMICILE_REGION'].unique().tolist()}")
    logger.debug("-"*50)
    """
    Calcule les performances des cédantes et retourne les 10 meilleures et les 10 pires.
    Applique les facteurs d'ajustement en fonction des filtres.
    """
    # Grouper par cédante
    cedants_data = []
    
    # Si une région est spécifiée, on s'assure que le filtrage est correct
    if region and region != 'all':
        logger.debug(f"Filtrage pour la région: {region}")
        logger.debug(f"Régions disponibles avant filtrage: {filtered_df['DOMICILE_REGION'].unique().tolist()}")
        logger.debug(f"Nombre total de cédantes avant filtrage: {len(filtered_df['CEDANT'].unique())}")
        
        filtered_df = filtered_df[filtered_df['DOMICILE_REGION'].str.upper() == region.upper()]
        
        logger.debug(f"Nombre de cédantes après filtrage par région {region}: {len(filtered_df['CEDANT'].unique())}")
        logger.debug(f"Exemple de cédantes filtrées: {filtered_df['CEDANT'].unique().tolist()[:5]}")
        
        if filtered_df.empty:
            logger.warning(f"ATTENTION: Aucune donnée trouvée pour la région {region}")
    
    # Années matures uniquement : on écarte la dernière année de souscription (sinistres peu développés)
    last_year = int(original_df['UNDERWRITING_YEAR'].max())
    ranking_df = filtered_df[filtered_df['UNDERWRITING_YEAR'] < last_year]
    
    # Grouper par cédante
    cedant_groups = ranking_df.groupby('CEDANT')
    
    for cedant_name, group in cedant_groups:
        # Ancienneté minimale : évite que des cédantes récentes (S/P proche de 0) dominent le classement
        if group['UNDERWRITING_YEAR'].nunique() < RANKING_MIN_YEARS:
            continue
        # Région de la cédante (première occurrence)
        region_name = group['DOMICILE_REGION'].iloc[0]
        # Calculer le S/P moyen (ratio de perte)
        avg_sp = calculate_loss_ratio(group)
        if avg_sp is None:
            continue  # aucune prime : le S/P n'est pas défini
        
        # Calculer le nombre moyen d'affaires par an
        years_count = group['UNDERWRITING_YEAR'].nunique()
        avg_business_count = group.shape[0] / years_count if years_count else 0
        
        # Calculer le volume moyen de primes par an
        avg_premium_volume = group['LAST_EPI_N'].sum() / years_count if years_count else 0
        
        # Calculer la tendance
        recent_years = sorted(group['UNDERWRITING_YEAR'].unique())[-2:] if len(group['UNDERWRITING_YEAR'].unique()) >= 2 else [group['UNDERWRITING_YEAR'].max()]
        
        if len(recent_years) == 2:
            current_year_data = group[group['UNDERWRITING_YEAR'] == recent_years[1]]
            previous_year_data = group[group['UNDERWRITING_YEAR'] == recent_years[0]]
            
            current_sp = calculate_loss_ratio(current_year_data)
            previous_sp = calculate_loss_ratio(previous_year_data)
            
            # Tendance du S/P : une augmentation du S/P est mauvaise (tendance négative)
            # Une diminution du S/P est bonne (tendance positive)
            if previous_sp is not None and current_sp is not None and previous_sp > 0:
                trend = -(current_sp - previous_sp)  # Inverse car baisse du S/P = amélioration
            else:
                trend = None
        else:
            trend = None
        
        # Les filtres (produit, type d'affaires, ligne d'affaires) sont déjà appliqués à
        # filtered_df : le S/P, le volume et le nombre d'affaires sont donc calculés sur
        # les données réelles du sous-ensemble, sans coefficient d'ajustement.

        cedants_data.append(CedantPerformanceData(
            id=cedant_name,  # Utiliser le nom comme ID
            name=cedant_name,
            region=region_name,
            averageSP=round(avg_sp, 1),
            averageBusinessCount=round(avg_business_count),
            averagePremiumVolume=round(avg_premium_volume, 1),
            trend=_round1(trend)
        ))
    
    # Ajouter des logs pour le debugging
    logger.debug(f"Nombre total de cédantes avant tri : {len(cedants_data)}")
    logger.debug(f"Exemple de cédantes avant tri : {[(c.name, c.region, c.averageSP) for c in cedants_data[:5]]}")
    
    # Filtrer les cédantes avec S/P > 0 pour éviter les valeurs nulles
    valid_cedants = [c for c in cedants_data if c.averageSP > 0]
    
    logger.debug(f"Nombre de cédantes valides après filtrage S/P > 0 : {len(valid_cedants)}")
    logger.debug(f"Exemple de cédantes valides : {[(c.name, c.region, c.averageSP) for c in valid_cedants[:5]]}")
    
    # Appliquer le filtre de prime minimale pour les top cédantes si spécifié
    if min_premium_threshold is not None:
        # Convertir le seuil de K DH en DH
        threshold_dh = min_premium_threshold * 1000
        logger.info(f"🔍 FILTRAGE PAR PRIME MINIMALE ACTIVÉ: {min_premium_threshold}K DH = {threshold_dh} DH")
        logger.debug(f"Filtrage par prime minimale: {min_premium_threshold}K DH = {threshold_dh} DH")
        
        # Filtrer les cédantes avec des primes >= seuil
        top_cedants_candidates = [c for c in valid_cedants if c.averagePremiumVolume >= threshold_dh]
        logger.debug(f"Nombre de cédantes après filtrage par prime minimale: {len(top_cedants_candidates)}")
        logger.debug(f"Exemple de cédantes après filtrage: {[(c.name, c.region, c.averageSP, c.averagePremiumVolume) for c in top_cedants_candidates[:5]]}")
        
        # Trier par S/P parmi celles qui respectent le seuil et prendre les 10 meilleures
        top_cedants_candidates_sorted = sorted(top_cedants_candidates, key=lambda x: x.averageSP if x.averageSP > 0 else float('inf'))
        top_cedants = top_cedants_candidates_sorted[:10] if len(top_cedants_candidates_sorted) >= 10 else top_cedants_candidates_sorted
    else:
        # Trier les cédantes par S/P et prendre les 10 meilleures
        sorted_cedants = sorted(valid_cedants, key=lambda x: x.averageSP if x.averageSP > 0 else float('inf'))
        top_cedants = sorted_cedants[:10] if len(sorted_cedants) >= 10 else sorted_cedants
    
    logger.debug(f"Top cédantes sélectionnées: {[(c.name, c.region, c.averageSP) for c in top_cedants]}")
    
    # Prendre les 10 pires (S/P le plus haut) avec filtre de prime si spécifié
    if min_premium_threshold_bottom is not None:
        # Convertir le seuil de K DH en DH
        threshold_bottom_dh = min_premium_threshold_bottom * 1000
        logger.info(f"🔍 FILTRAGE PAR PRIME MINIMALE BOTTOM ACTIVÉ: {min_premium_threshold_bottom}K DH = {threshold_bottom_dh} DH")
        logger.debug(f"Filtrage par prime minimale pour bottom: {min_premium_threshold_bottom}K DH = {threshold_bottom_dh} DH")
        
        # Filtrer les cédantes avec des primes >= seuil
        bottom_cedants_candidates = [c for c in valid_cedants if c.averagePremiumVolume >= threshold_bottom_dh]
        logger.debug(f"Nombre de cédantes après filtrage par prime minimale (bottom): {len(bottom_cedants_candidates)}")
        logger.debug(f"Exemple de cédantes après filtrage: {[(c.name, c.region, c.averageSP, c.averagePremiumVolume) for c in bottom_cedants_candidates[:5]]}")
        
        # Trier par S/P parmi celles qui respectent le seuil et prendre les 10 pires
        bottom_cedants_candidates_sorted = sorted(bottom_cedants_candidates, key=lambda x: -x.averageSP)
        bottom_cedants = bottom_cedants_candidates_sorted[:10] if len(bottom_cedants_candidates_sorted) >= 10 else bottom_cedants_candidates_sorted
    else:
        # Trier les cédantes par S/P et prendre les 10 pires (S/P le plus haut)
        bottom_cedants = sorted(valid_cedants, key=lambda x: -x.averageSP)[:10] if len(valid_cedants) >= 10 else sorted(valid_cedants, key=lambda x: -x.averageSP)
    
    logger.debug(f"Bottom cédantes sélectionnées: {[(c.name, c.region, c.averageSP) for c in bottom_cedants]}")
    
    return top_cedants, bottom_cedants

# Les données sont maintenant gérées par load_data_once()
cached_data = None

@app.get("/api/subscription-data", response_model=SubscriptionDataResponse)
async def get_subscription_data(
    region: str = Query('all', description="Filtre par région"),
    product_type: str = Query('all', description="Filtre par type de produit"),
    business_type: str = Query('all', description="Filtre par type d'affaires"),
    line_of_business: str = Query('all', description="Filtre par ligne d'affaires"),
    min_premium_threshold: Optional[float] = Query(None, description="Seuil minimum de prime en K DH pour filtrer les top cédantes"),
    min_premium_threshold_bottom: Optional[float] = Query(None, description="Seuil minimum de prime en K DH pour filtrer les bottom cédantes")
):
    logger.debug("="*50)
    logger.debug(f"API appelée avec les paramètres:")
    logger.debug(f"- région: {region}")
    logger.debug(f"- type de produit: {product_type}")
    logger.debug(f"- type d'affaires: {business_type}")
    logger.debug(f"- ligne d'affaires: {line_of_business}")
    logger.debug(f"- seuil minimum de prime (top): {min_premium_threshold}")
    logger.debug(f"- seuil minimum de prime (bottom): {min_premium_threshold_bottom}")
    logger.debug("="*50)
    """
    Récupère les données de souscription avec filtrage optionnel.
    
    - **region**: Filtre par région (ex: 'MAROC', 'AFRIQUE', etc.)
    - **product_type**: Filtre par type de produit (ex: 'life', 'nonLife', 'health')
    - **business_type**: Filtre par type d'affaires (ex: 'treaties', 'facultative')
    - **line_of_business**: Filtre par ligne d'affaires (ex: 'AUTO-AT-RC', etc.)
    - **min_premium_threshold**: Seuil minimum de prime en K DH pour filtrer les top cédantes
    - **min_premium_threshold_bottom**: Seuil minimum de prime en K DH pour filtrer les bottom cédantes
    """
    
    # Utiliser les données globales (déjà chargées au démarrage)
    logger.debug("Utilisation des données globales")
    response_data = calculate_subscription_data(
        df, 
        region=region, 
        product_type=product_type, 
        business_type=business_type, 
        line_of_business=line_of_business,
        min_premium_threshold=min_premium_threshold,
        min_premium_threshold_bottom=min_premium_threshold_bottom
    )
    logger.debug("calculate_subscription_data terminée")
    
    return response_data

@app.get("/api/cedant-details/{cedant_id}", response_model=CedantDetails)
async def get_cedant_details(cedant_id: str):
    """
    Récupère les détails détaillés d'une cédante spécifique.
    """
    # Utiliser le DataFrame global déjà chargé en mémoire
    cedant_data = df[df['CEDANT'] == cedant_id]
    
    if cedant_data.empty:
        raise HTTPException(status_code=404, detail="Cédante non trouvée")
    
    # Calculer les métriques agrégées
    latest_year = cedant_data['UNDERWRITING_YEAR'].max()
    previous_year = latest_year - 1
    
    # Données de l'année en cours et précédente pour le calcul des tendances
    current_year_data = cedant_data[cedant_data['UNDERWRITING_YEAR'] == latest_year]
    previous_year_data = cedant_data[cedant_data['UNDERWRITING_YEAR'] == previous_year]
    
    # Calculer le S/P moyen
    avg_sp = calculate_loss_ratio(cedant_data)
    avg_sp = avg_sp if avg_sp is not None else 0.0  # fiche : champ numérique obligatoire
    
    # Calculer la tendance (None si l'une des deux années n'a pas de primes)
    current_sp = calculate_loss_ratio(current_year_data)
    previous_sp = calculate_loss_ratio(previous_year_data)
    trend = -(current_sp - previous_sp) if (previous_sp is not None and current_sp is not None and previous_sp > 0) else None
    
    # Calculer le taux de conservation
    current_contracts = len(current_year_data)
    previous_contracts = len(previous_year_data)
    retention_rate = (current_contracts / previous_contracts * 100) if previous_contracts > 0 else 100
    
    # Calculer le taux de croissance du volume de primes
    current_premium = current_year_data['LAST_EPI_N'].sum()
    previous_premium = previous_year_data['LAST_EPI_N'].sum()
    growth_rate = ((current_premium - previous_premium) / previous_premium * 100) if previous_premium > 0 else 0
    
    # Récupérer le taux de rétention depuis le cache (calculé au démarrage)
    cedant_retention_rate = cedant_retention_cache.get(cedant_id, 0.0)
    
    # Préparer les données des contrats (agrégés par numéro de contrat)
    contracts = []
    grouped = cedant_data.groupby('CONTRACT_NUMBER')
    
    for contract_number, group in grouped:
        group = group.sort_values('UNDERWRITING_YEAR')
        first_row = group.iloc[0]
        contract_type = first_row['business_type']
        lob = first_row['line_of_business'] if pd.notna(first_row['line_of_business']) else 'N/A'
        
        total_premium = group['LAST_EPI_N'].sum()
        total_claims = group['LAST_CLAIMS_N'].sum()
        total_provisions = group['LAST_CLAIM_RES_LATEST_N'].sum()
        sp_total = ((total_claims + total_provisions) / total_premium * 100) if total_premium > 0 else 0
        avg_commission = group['COMMISSION_RATE'].mean() if group['COMMISSION_RATE'].notna().any() else 0.0
        
        # Calculer le taux de rétention SPÉCIFIQUE à ce contrat
        # Formule : (Prime Nette Retenue / Prime Brute) * 100
        # LAST_EPI_N = Prime Nette Retenue (Net Premium Retained)
        # LAST_GBP_N = Prime Brute (Gross Premium)
        # Retention Rate = EPI_N / GBP_N
        total_gbp = group['LAST_GBP_N'].sum()
        contract_retention_rate = (total_premium / total_gbp * 100) if total_gbp > 0 else 0.0
        
        min_year = int(group['UNDERWRITING_YEAR'].min())
        max_year = int(group['UNDERWRITING_YEAR'].max())
        year_range = f"{min_year}-{max_year}" if min_year != max_year else str(min_year)
        years_count = len(group)
        
        yearly_history = []
        for _, row in group.iterrows():
            year_premium = float(row['LAST_EPI_N'])
            year_claims = float(row['LAST_CLAIMS_N'])
            year_provisions = float(row['LAST_CLAIM_RES_LATEST_N'])
            year_sp = ((year_claims + year_provisions) / year_premium * 100) if year_premium > 0 else 0
            year_commission = float(row['COMMISSION_RATE']) if pd.notna(row['COMMISSION_RATE']) else 0.0
            
            yearly_history.append(ContractYearlyData(
                year=int(row['UNDERWRITING_YEAR']),
                premium=year_premium / 1_000,
                claims=year_claims / 1_000,
                provisions=year_provisions / 1_000,
                sp=year_sp,
                commissionRate=year_commission
            ))
        
        contracts.append(CedantContract(
            contractNumber=str(contract_number),
            yearRange=year_range,
            yearsCount=years_count,
            type=contract_type,
            lineOfBusiness=lob,
            premium=total_premium / 1_000,
            claims=total_claims / 1_000,
            sp=sp_total,
            provisions=total_provisions / 1_000,
            retentionRate=contract_retention_rate,
            commissionRate=avg_commission,
            yearlyHistory=yearly_history
        ))
    
    # Trier les contrats par prime décroissante
    contracts.sort(key=lambda x: x.premium, reverse=True)
    
    return CedantDetails(
        id=cedant_id,
        name=cedant_data['CEDANT'].iloc[0],
        region=cedant_data['DOMICILE_REGION'].iloc[0],
        averageSP=avg_sp,
        averagePremiumVolume=cedant_data['LAST_EPI_N'].mean(),
        averageBusinessCount=len(cedant_data) / cedant_data['UNDERWRITING_YEAR'].nunique(),
        trend=trend,
        retentionRate=retention_rate,
        growthRate=growth_rate,
        contracts=contracts
    )

def calculate_branch_analytics_facultative(
    df_data: pd.DataFrame,
    cedant_ids: List[str],
    segment: str = "FAC",
    branch_filter: Optional[str] = None
) -> List[Dict]:
    """
    Calcule les analytics par branche pour les facultatives (FAC) ou traités (TRAITES).
    Retourne une liste de BranchAnalytics avec toutes les métriques nécessaires.
    
    Args:
        df_data: DataFrame avec les données
        cedant_ids: Liste des IDs de cédantes
        segment: "FAC" ou "TRAITES"
        branch_filter: Filtre par branche optionnel
        
    Returns:
        Liste de dictionnaires BranchAnalytics
    """
    # Filtrer par segment
    if segment == 'FAC':
        # FAC = FACULTATIVE et FACOB OPEN COVER
        filtered_df = df_data[df_data['segment'] == 'FAC']
    else:
        # TRAITES = tout sauf FACULTATIVE et FACOB
        filtered_df = df_data[df_data['segment'] == 'TRAITES']
    
    # Filtrer par cédantes sélectionnées
    if cedant_ids:
        filtered_df = filtered_df[filtered_df['CEDANT'].isin(cedant_ids)]
    
    # Filtrer par branche si spécifié
    if branch_filter and branch_filter != 'all':
        filtered_df = filtered_df[filtered_df['line_of_business'] == branch_filter]
    
    # Garder une copie NON filtrée par année pour les S/P individuels 2024
    df_all_years = filtered_df.copy()
    
    # Filtrer années 2016-2023 (8 ans) pour les calculs globaux (S/P moyen, Ratio technique)
    filtered_df = filtered_df[filtered_df['UNDERWRITING_YEAR'].between(2016, 2023)]
    
    if filtered_df.empty:
        return []
    
    branch_analytics = []
    
    # Pour TRAITES : grouper par LOB (branches)
    # Pour FAC : grouper par CEDANT (assurés)
    
    if segment == 'TRAITES':
        # Grouper par LOB (pour tableau par branche)
        for lob in filtered_df['line_of_business'].unique():
            if pd.isna(lob) or not str(lob).strip():
                continue
                
            lob_data = filtered_df[filtered_df['line_of_business'] == lob]
            
            # Calculer les métriques
            epi_moyen = lob_data['LAST_EPI_N'].mean()
            
            # S/P moyen global
            total_sinistres = lob_data['LAST_CLAIMS_N'].sum()
            total_provisions = lob_data['LAST_CLAIM_RES_LATEST_N'].sum()
            total_primes = lob_data['LAST_EPI_N'].sum()
            
            # Si pas de primes, pas de S/P calculable
            if total_primes > 0:
                sp_moyen = ((total_sinistres + total_provisions) / total_primes * 100)
            else:
                sp_moyen = None
            
            # Ratio technique
            total_commissions = lob_data['LAST_COMMISSION_N'].sum()
            total_brokerage = lob_data['LAST_BROKERAGE_N'].sum()
            total_other = lob_data['LAST_OTHER_CHARGE_N'].sum()
            total_overrider = lob_data['LAST_OVERRIDER_COMMISSION_N'].sum()
            
            if total_primes > 0:
                ratio_technique = ((total_sinistres + total_provisions + total_commissions + 
                                   total_brokerage + total_other + total_overrider) / total_primes * 100)
            else:
                ratio_technique = None
            
            # S/P par année (2016-2024) - utiliser df_all_years pour inclure 2024
            sp_by_year = {}
            lob_data_all_years = df_all_years[df_all_years['line_of_business'] == lob]
            for year in [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]:
                year_data = lob_data_all_years[lob_data_all_years['UNDERWRITING_YEAR'] == year]
                if not year_data.empty:
                    year_sinistres = year_data['LAST_CLAIMS_N'].sum()
                    year_provisions = year_data['LAST_CLAIM_RES_LATEST_N'].sum()
                    year_primes = year_data['LAST_EPI_N'].sum()
                    # Seulement si on a des primes, on peut calculer le S/P
                    if year_primes > 0:
                        sp_by_year[f'sp{year}'] = ((year_sinistres + year_provisions) / year_primes * 100)
                    # Si primes = 0, on ne définit pas la clé (sera None, affichera N/A)
                # Si pas de données pour l'année, on ne définit pas la clé (sera None dans le résultat)
            
            branch_analytics.append({
                'branchName': str(lob),
                'insuredName': str(lob),  # Pour compatibilité
                'year': 0,  # Ne pas utiliser année
                'epiMoyen': float(epi_moyen),
                'ssMoyen': float(sp_moyen) if sp_moyen is not None else None,
                'ratioTechnique': float(ratio_technique) if ratio_technique is not None else None,
                'sp2016': float(sp_by_year['sp2016']) if 'sp2016' in sp_by_year else None,
                'sp2017': float(sp_by_year['sp2017']) if 'sp2017' in sp_by_year else None,
                'sp2018': float(sp_by_year['sp2018']) if 'sp2018' in sp_by_year else None,
                'sp2019': float(sp_by_year['sp2019']) if 'sp2019' in sp_by_year else None,
                'sp2020': float(sp_by_year['sp2020']) if 'sp2020' in sp_by_year else None,
                'sp2021': float(sp_by_year['sp2021']) if 'sp2021' in sp_by_year else None,
                'sp2022': float(sp_by_year['sp2022']) if 'sp2022' in sp_by_year else None,
                'sp2023': float(sp_by_year['sp2023']) if 'sp2023' in sp_by_year else None,
                'sp2024': float(sp_by_year['sp2024']) if 'sp2024' in sp_by_year else None
            })
    
    else:  # segment == 'FAC'
        # Grouper par INSURED_NAME (pour tableau par assuré)
        for insured_name in filtered_df['INSURED_NAME'].unique():
            if pd.isna(insured_name) or not str(insured_name).strip():
                continue
                
            insured_data = filtered_df[filtered_df['INSURED_NAME'] == insured_name]
            
            # Mêmes calculs que pour LOB
            epi_moyen = insured_data['LAST_EPI_N'].mean()
            total_sinistres = insured_data['LAST_CLAIMS_N'].sum()
            total_provisions = insured_data['LAST_CLAIM_RES_LATEST_N'].sum()
            total_primes = insured_data['LAST_EPI_N'].sum()
            
            # Si pas de primes, pas de S/P calculable
            if total_primes > 0:
                sp_moyen = ((total_sinistres + total_provisions) / total_primes * 100)
            else:
                sp_moyen = None
            
            total_commissions = insured_data['LAST_COMMISSION_N'].sum()
            total_brokerage = insured_data['LAST_BROKERAGE_N'].sum()
            total_other = insured_data['LAST_OTHER_CHARGE_N'].sum()
            total_overrider = insured_data['LAST_OVERRIDER_COMMISSION_N'].sum()
            
            if total_primes > 0:
                ratio_technique = ((total_sinistres + total_provisions + total_commissions + 
                                   total_brokerage + total_other + total_overrider) / total_primes * 100)
            else:
                ratio_technique = None
            
            # S/P par année (2016-2024) - utiliser df_all_years pour inclure 2024
            sp_by_year = {}
            insured_data_all_years = df_all_years[df_all_years['INSURED_NAME'] == insured_name]
            for year in [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]:
                year_data = insured_data_all_years[insured_data_all_years['UNDERWRITING_YEAR'] == year]
                if not year_data.empty:
                    year_sinistres = year_data['LAST_CLAIMS_N'].sum()
                    year_provisions = year_data['LAST_CLAIM_RES_LATEST_N'].sum()
                    year_primes = year_data['LAST_EPI_N'].sum()
                    # Seulement si on a des primes, on peut calculer le S/P
                    if year_primes > 0:
                        sp_by_year[f'sp{year}'] = ((year_sinistres + year_provisions) / year_primes * 100)
                    # Si primes = 0, on ne définit pas la clé (sera None, affichera N/A)
                # Si pas de données pour l'année, on ne définit pas la clé (sera None dans le résultat)
            
            branch_analytics.append({
                'branchName': '',  # Pas de branche pour assuré
                'insuredName': str(insured_name),
                'year': 0,
                'epiMoyen': float(epi_moyen),
                'ssMoyen': float(sp_moyen) if sp_moyen is not None else None,
                'ratioTechnique': float(ratio_technique) if ratio_technique is not None else None,
                'sp2016': float(sp_by_year['sp2016']) if 'sp2016' in sp_by_year else None,
                'sp2017': float(sp_by_year['sp2017']) if 'sp2017' in sp_by_year else None,
                'sp2018': float(sp_by_year['sp2018']) if 'sp2018' in sp_by_year else None,
                'sp2019': float(sp_by_year['sp2019']) if 'sp2019' in sp_by_year else None,
                'sp2020': float(sp_by_year['sp2020']) if 'sp2020' in sp_by_year else None,
                'sp2021': float(sp_by_year['sp2021']) if 'sp2021' in sp_by_year else None,
                'sp2022': float(sp_by_year['sp2022']) if 'sp2022' in sp_by_year else None,
                'sp2023': float(sp_by_year['sp2023']) if 'sp2023' in sp_by_year else None,
                'sp2024': float(sp_by_year['sp2024']) if 'sp2024' in sp_by_year else None
            })
    
    return branch_analytics

# Fonction de normalisation du texte
def normalize_text(text: str) -> str:
    """Normalise un texte pour la recherche fuzzy."""
    if not text:
        return ""
    
    # Normalisation Unicode et suppression des accents
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(c for c in text if not unicodedata.combining(c))
    
    # Conversion en minuscules et suppression des espaces multiples
    text = text.lower().strip()
    text = re.sub(r'\s+', ' ', text)
    
    # Suppression de la ponctuation commune
    text = re.sub(r'[.,;:!?()"\'-]', '', text)
    
    return text

# Cache des cédantes pour la recherche fuzzy avec optimisations
cedants_cache = []
cedants_by_region_cache = {}  # Cache optimisé par région

def prepare_cedants_cache():
    """Prépare le cache des cédantes pour la recherche fuzzy avec optimisations."""
    global cedants_cache, cedants_by_region_cache
    
    if df is None or df.empty:
        logger.warning("DataFrame vide, impossible de préparer le cache des cédantes")
        return
    
    # Extraire les cédantes uniques avec leurs régions
    # Les lignes sans nom de cédante sont ignorées (sinon une cédante fictive "nan" apparaît dans chaque région)
    cedants_df = df[['CEDANT', 'DOMICILE_REGION']].dropna(subset=['CEDANT']).drop_duplicates()
    
    cedants_cache = []
    cedants_by_region_cache = {}
    
    # Grouper par région pour un accès plus rapide
    for _, row in cedants_df.iterrows():
        cedant_name = str(row['CEDANT'])
        region = str(row['DOMICILE_REGION']) if pd.notna(row['DOMICILE_REGION']) else 'AUTRE'
        
        cedant_obj = {
            'id': cedant_name,
            'name': cedant_name,
            'region': region,
            'name_norm': normalize_text(cedant_name)
        }
        
        cedants_cache.append(cedant_obj)
        
        # Optimisation : index par région pour /api/cedants/by-region
        if region not in cedants_by_region_cache:
            cedants_by_region_cache[region] = []
        cedants_by_region_cache[region].append(cedant_obj)
    
    # Trier les cédantes par région pour un accès plus rapide
    for region in cedants_by_region_cache:
        cedants_by_region_cache[region].sort(key=lambda x: x['name'])
    
    logger.info(f"Cache des cédantes préparé: {len(cedants_cache)} cédantes")
    logger.info(f"Répartition par région: {[(region, len(cedants)) for region, cedants in cedants_by_region_cache.items()]}")

@app.get("/api/cedants/suggest")
async def suggest_cedants(
    q: str = Query(..., min_length=1), 
    limit: int = Query(8, ge=1, le=20),
    region: Optional[str] = Query(None, description="Filtre par région")
):
    """
    Recherche de cédantes avec correspondance floue (fuzzy matching).
    Peut être filtrée par région.
    """
    try:
        # Normaliser la query
        q_norm = normalize_text(q)
        
        if len(q_norm) < 2:
            return {"suggestions": []}
        
        if not cedants_cache:
            logger.warning("Cache des cédantes vide")
            return {"suggestions": []}
        
        # Filtrer par région si spécifié (utilisation du cache optimisé)
        if region and region.upper() != 'ALL':
            # Utiliser le cache par région pour un accès plus rapide
            region_upper = region.upper()
            filtered_cedants = cedants_by_region_cache.get(region_upper, [])
        else:
            filtered_cedants = cedants_cache
            
        if not filtered_cedants:
            return {"suggestions": []}
        
        # Extraire les noms normalisés pour la recherche fuzzy
        choices = [cedant['name_norm'] for cedant in filtered_cedants]
        
        # Recherche fuzzy avec RapidFuzz
        results = process.extract(
            q_norm, 
            choices, 
            scorer=fuzz.WRatio,
            limit=limit,
            score_cutoff=30  # Score minimum pour être considéré comme pertinent
        )
        
        # Construire les suggestions avec les données complètes
        suggestions = []
        for match_text, score, index in results:
            cedant = filtered_cedants[index]
            suggestions.append(CedantSuggestion(
                id=cedant['id'],
                name=cedant['name'],
                region=cedant['region'],
                score=round(score, 1)
            ))
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Erreur lors de la recherche de cédantes: {e}")
        return {"suggestions": []}

# Constantes des régions disponibles pour validation
AVAILABLE_REGIONS = ['MAROC', 'AFRIQUE', 'ASIE', 'MOYEN-ORIENT', 'AUTRE']

@app.get("/api/cedants/by-region")
async def get_cedants_by_region(
    region: str = Query(..., description="Région à filtrer"), 
    limit: int = Query(50, ge=1, le=200)
):
    """
    Récupère toutes les cédantes d'une région spécifique.
    Optimisé avec un cache indexé par région pour des performances améliorées.
    
    - **region**: Région à filtrer (MAROC, AFRIQUE, ASIE, MOYEN-ORIENT, AUTRE)
    - **limit**: Nombre maximum de cédantes à retourner (1-200, défaut: 50)
    
    Returns: Liste des cédantes triées alphabétiquement par nom
    """
    try:
        # Validation de la région
        region_upper = region.upper()
        if region_upper not in AVAILABLE_REGIONS:
            logger.warning(f"Région invalide demandée: {region}. Régions disponibles: {AVAILABLE_REGIONS}")
            return {"cedants": [], "error": f"Région '{region}' non supportée. Régions disponibles: {AVAILABLE_REGIONS}"}
        
        if not cedants_by_region_cache:
            logger.warning("Cache des cédantes par région vide")
            return {"cedants": []}
        
        # Utiliser le cache optimisé par région (accès direct, plus rapide)
        region_cedants = cedants_by_region_cache.get(region_upper, [])
        
        if not region_cedants:
            logger.debug(f"🔍 Aucune cédante trouvée pour la région '{region}'")
            return {"cedants": []}
        
        # Limiter le nombre de résultats (déjà triés alphabétiquement)
        limited_cedants = region_cedants[:limit]
        
        # Construire la réponse
        cedants = []
        for cedant in limited_cedants:
            cedants.append(CedantSuggestion(
                id=cedant['id'],
                name=cedant['name'],
                region=cedant['region'],
                score=100.0  # Score maximal car pas de recherche textuelle
            ))
        
        logger.info(f"🔍 Région '{region}' - {len(cedants)} cédantes trouvées sur {len(region_cedants)} disponibles (limite: {limit})")
        return {"cedants": cedants}
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des cédantes par région: {e}")
        return {"cedants": []}

@app.get("/api/regions/stats")
async def get_regions_stats():
    """
    Récupère les statistiques des régions disponibles.
    Utile pour les interfaces de filtrage et les dashboards.
    """
    try:
        if not cedants_by_region_cache:
            logger.warning("Cache des cédantes par région vide")
            return {"regions": []}
        
        regions_stats = []
        for region, cedants in cedants_by_region_cache.items():
            regions_stats.append({
                "region": region,
                "cedant_count": len(cedants),
                "is_available": len(cedants) > 0
            })
        
        # Trier par nombre de cédantes décroissant
        regions_stats.sort(key=lambda x: x['cedant_count'], reverse=True)
        
        logger.debug(f"🌍 Statistiques des régions: {regions_stats}")
        return {
            "regions": regions_stats,
            "total_cedants": len(cedants_cache),
            "available_regions": AVAILABLE_REGIONS
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques des régions: {e}")
        return {"regions": []}

def calculate_branch_analytics(cedant_data: pd.DataFrame, full_cedant_data: pd.DataFrame = None) -> List[BranchAnalytics]:
    """
    Calcule les analytics des branches avec les S/P des 8 années antérieures.
    """
    branch_analytics = []
    
    # Grouper par LOB, INSURED_NAME et année pour les FAC
    if 'INSURED_NAME' in cedant_data.columns:
        grouped = cedant_data.groupby(['line_of_business', 'INSURED_NAME', 'UNDERWRITING_YEAR'])
    else:
        grouped = cedant_data.groupby(['line_of_business', 'UNDERWRITING_YEAR'])
    
    for group_key, group in grouped:
        if len(group_key) == 3:  # (lob, insured_name, year)
            lob, insured_name, year = group_key
        else:  # (lob, year)
            lob, year = group_key
            insured_name = None
            
        if pd.isna(lob) or not lob.strip():
            continue
            
        # Calculer les métriques de base
        total_epi = group['LAST_EPI_N'].sum()
        total_claims = group['LAST_CLAIMS_N'].sum()
        total_provisions = group['LAST_CLAIM_RES_LATEST_N'].sum()
        total_commission = group['LAST_COMMISSION_N'].sum()
        total_brokerage = group['LAST_BROKERAGE_N'].sum()
        total_other_charges = group['LAST_OTHER_CHARGE_N'].sum()
        total_overrider_commission = group['LAST_OVERRIDER_COMMISSION_N'].sum()
        
        # Calculer le S/P moyen pour l'année courante
        ss_moyen = ((total_claims + total_provisions) / total_epi * 100) if total_epi > 0 else 0
        
        # Calculer le ratio technique
        ratio_technique = calculate_technical_ratio(
            total_claims, total_provisions, total_brokerage, 
            total_other_charges, total_overrider_commission, 
            total_commission, total_epi
        )
        
        # Calculer les S/P pour chaque année (2016-2024)
        # Utiliser les données complètes de la cédante pour le calcul des S/P par année
        sp_by_year = {}
        data_for_sp = full_cedant_data if full_cedant_data is not None else cedant_data
        for target_year in range(2016, 2025):
            year_data = data_for_sp[
                (data_for_sp['line_of_business'] == lob) & 
                (data_for_sp['UNDERWRITING_YEAR'] == target_year)
            ]
            
            if not year_data.empty:
                year_epi = year_data['LAST_EPI_N'].sum()
                year_claims = year_data['LAST_CLAIMS_N'].sum()
                year_provisions = year_data['LAST_CLAIM_RES_LATEST_N'].sum()
                sp_by_year[f'sp{target_year}'] = ((year_claims + year_provisions) / year_epi * 100) if year_epi > 0 else 0.0
            else:
                sp_by_year[f'sp{target_year}'] = 0.0
        
        # Récupérer le nom de l'assuré
        if insured_name is None:
            insured_name = group['INSURED_NAME'].dropna().iloc[0] if not group['INSURED_NAME'].dropna().empty else "N/A"
        else:
            insured_name = str(insured_name)
        
        # Créer l'objet BranchAnalytics
        branch_data = BranchAnalytics(
            branchName=str(lob),
            insuredName=str(insured_name),
            year=int(year),
            epiMoyen=float(total_epi),
            ssMoyen=float(ss_moyen),
            ratioTechnique=float(ratio_technique),
            sp2016=sp_by_year['sp2016'],
            sp2017=sp_by_year['sp2017'],
            sp2018=sp_by_year['sp2018'],
            sp2019=sp_by_year['sp2019'],
            sp2020=sp_by_year['sp2020'],
            sp2021=sp_by_year['sp2021'],
            sp2022=sp_by_year['sp2022'],
            sp2023=sp_by_year['sp2023'],
            sp2024=sp_by_year['sp2024']
        )
        
        branch_analytics.append(branch_data)
    
    # Trier par ratio technique décroissant
    branch_analytics.sort(key=lambda x: x.ratioTechnique, reverse=True)
    
    return branch_analytics

def calculate_technical_ratio(claims: float, provisions: float, brokerage: float, 
                            other_charges: float, overrider_commission: float, 
                            commission: float, epi: float) -> float:
    """Calcule le ratio technique selon la formule métier."""
    if epi <= 0:
        return 0.0
    
    total_charges = claims + provisions + brokerage + other_charges + overrider_commission + commission
    return (total_charges / epi) * 100

@app.get("/api/cedants/{cedant_id}/analytics", response_model=CedantAnalytics)
async def get_cedant_analytics(
    cedant_id: str, 
    segment: Optional[str] = Query(None),
    branch: Optional[str] = Query(None)
):
    """
    Récupère les analytics détaillées d'une cédante spécifique.
    Supporte plusieurs cédantes (IDs séparées par des virgules).
    """
    try:
        # Support pour plusieurs cédantes (IDs séparées par des virgules)
        cedant_ids = [cid.strip() for cid in cedant_id.split(',')]
        
        # Filtrer les données pour les cédantes spécifiques
        cedant_data = df[df['CEDANT'].isin(cedant_ids)]
        
        if cedant_data.empty:
            raise HTTPException(status_code=404, detail="Cédante(s) non trouvée(s)")
        
        # Appliquer le filtre de segment si spécifié
        if segment:
            if segment == "TRAITES":
                # TRAITES = tout sauf FACULTATIVE et FACOB OPEN COVER
                cedant_data = cedant_data[cedant_data['segment'] == 'TRAITES']
            elif segment == "FAC":
                # FAC = FACULTATIVE et FACOB OPEN COVER
                cedant_data = cedant_data[cedant_data['segment'] == 'FAC']
        
        logger.debug(f"Données après filtrage segment '{segment}': {len(cedant_data)} lignes")
        
        # Appliquer le filtre de branche si spécifié
        if branch and branch != 'all':
            cedant_data = cedant_data[cedant_data['line_of_business'] == branch]
            logger.debug(f"Données après filtrage branche '{branch}': {len(cedant_data)} lignes")
        
        # 1. Séries annuelles (primes et S/P par année)
        annual_series = []
        yearly_groups = cedant_data.groupby('UNDERWRITING_YEAR')
        
        for year, group in yearly_groups:
            total_premium = group['LAST_EPI_N'].sum()
            total_claims = group['LAST_CLAIMS_N'].sum()
            total_provisions = group['LAST_CLAIM_RES_LATEST_N'].sum()
            total_commission = group['LAST_COMMISSION_N'].sum()
            
            sp_ratio = ((total_claims + total_provisions) / total_premium * 100) if total_premium > 0 else 0
            commission_ratio = (total_commission / total_premium * 100) if total_premium > 0 else 0
            total_ratio = sp_ratio + commission_ratio
            
            
            annual_series.append({
                'year': int(year),
                'premium': float(total_premium),
                'sp': float(sp_ratio),
                'commission': float(commission_ratio),
                'total': float(total_ratio)
            })
        
        annual_series = sorted(annual_series, key=lambda x: x['year'])
        
        # 2. Distribution par LOB
        lob_distribution = []
        lob_groups = cedant_data.groupby('line_of_business')
        
        for lob, group in lob_groups:
            if pd.notna(lob) and lob.strip():
                total_premium = group['LAST_EPI_N'].sum()
                lob_distribution.append({
                    'lob': str(lob),
                    'premium': float(total_premium)
                })
        
        lob_distribution = sorted(lob_distribution, key=lambda x: x['premium'], reverse=True)
        
        # 3. Mix contractuel (segment × nature)
        contract_mix = []
        
        nature_mapping = {
            'PRO-RATA': 'PROP',
            'XL': 'NON-PROP',
            '?': 'NON-PROP'
        }
        
        # Grouper par segment et nature
        for _, row in cedant_data.iterrows():
            segment_key = row['segment']
            nature_key = nature_mapping.get(row['TYPE_OF_CONTRACT'], 'NON-PROP')  # Par défaut NON-PROP
            
            premium = row['LAST_EPI_N'] if pd.notna(row['LAST_EPI_N']) else 0
            
            # Chercher si cette combinaison existe déjà
            existing = next((item for item in contract_mix 
                           if item['segment'] == segment_key and item['nature'] == nature_key), None)
            
            if existing:
                existing['premium'] += premium
            else:
                contract_mix.append({
                    'segment': segment_key,
                    'nature': nature_key,
                    'premium': float(premium)
                })
        
        # 4. Pays risques
        risk_countries = []
        
        # Utiliser la colonne RISK_COUNTRY pour les pays risques
        country_groups = cedant_data.groupby('RISK_COUNTRY')
        
        for country, group in country_groups:
            if pd.notna(country) and country.strip():
                total_premium = group['LAST_EPI_N'].sum()
                total_claims = group['LAST_CLAIMS_N'].sum()
                total_provisions = group['LAST_CLAIM_RES_LATEST_N'].sum()
                
                sp_ratio = ((total_claims + total_provisions) / total_premium * 100) if total_premium > 0 else 0
                
                risk_countries.append({
                    'country': str(country),
                    'premium': float(total_premium),
                    'sp': float(sp_ratio)
                })
        
        risk_countries = sorted(risk_countries, key=lambda x: x['premium'], reverse=True)
        
        # 5. Calculer les analytics des branches avec la nouvelle fonction
        branch_analytics_data = []
        if segment in ['FAC', 'TRAITES']:
            branch_analytics_data = calculate_branch_analytics_facultative(
                df_data=df,
                cedant_ids=cedant_ids,
                segment=segment,
                branch_filter=branch
            )
        
        # Convertir en objets BranchAnalytics
        branch_analytics = [BranchAnalytics(**item) for item in branch_analytics_data] if branch_analytics_data else None
        
        logger.debug(f"🔍 DEBUG - branch_analytics calculées: {len(branch_analytics) if branch_analytics else 0} éléments")
        if branch_analytics and len(branch_analytics) > 0:
            logger.debug(f"🔍 DEBUG - Première branche: {branch_analytics[0].branchName} - {branch_analytics[0].insuredName}")
        else:
            logger.warning("⚠️ DEBUG - Aucune branch_analytics calculée")
        
        # Retourner les bonnes données selon le segment
        if segment:
            # Pour les segments spécifiques, retourner contractNature au lieu de contractMix
            contract_nature = []
            for item in contract_mix:
                nature_item = {
                    'nature': item['nature'],
                    'premium': item['premium']
                }
                # Chercher si cette nature existe déjà
                existing = next((n for n in contract_nature if n['nature'] == nature_item['nature']), None)
                if existing:
                    existing['premium'] += nature_item['premium']
                else:
                    contract_nature.append(nature_item)
            
            result = CedantAnalytics(
                annualSeries=annual_series,
                lobDistribution=lob_distribution,
                contractNature=contract_nature,
                riskCountries=risk_countries,
                branchAnalytics=branch_analytics
            )
            logger.debug(f"🔍 DEBUG - Résultat segment {segment}: branchAnalytics={len(result.branchAnalytics) if result.branchAnalytics else 0}")
            return result
        else:
            # Pour le volet général, retourner contractMix
            result = CedantAnalytics(
                annualSeries=annual_series,
                lobDistribution=lob_distribution,
                contractMix=contract_mix,
                riskCountries=risk_countries,
                branchAnalytics=branch_analytics
            )
            logger.debug(f"🔍 DEBUG - Résultat général: branchAnalytics={len(result.branchAnalytics) if result.branchAnalytics else 0}")
            return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des analytics pour {cedant_id}: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@app.get("/api/cedants/{cedant_id}/branches")
async def get_available_branches(
    cedant_id: str,
    segment: Optional[str] = Query(None)
):
    """
    Récupère la liste des branches disponibles pour une ou plusieurs cédantes.
    Supporte plusieurs cédantes (IDs séparées par des virgules).
    """
    try:
        # Support pour plusieurs cédantes (IDs séparées par des virgules)
        cedant_ids = [cid.strip() for cid in cedant_id.split(',')]
        
        # Filtrer les données pour les cédantes spécifiques
        cedant_data = df[df['CEDANT'].isin(cedant_ids)]
        
        if cedant_data.empty:
            raise HTTPException(status_code=404, detail="Cédante(s) non trouvée(s)")
        
        # Appliquer le filtre de segment si spécifié
        if segment:
            if segment == "TRAITES":
                cedant_data = cedant_data[cedant_data['segment'] == 'TRAITES']
            elif segment == "FAC":
                cedant_data = cedant_data[cedant_data['segment'] == 'FAC']
        
        # Extraire les branches uniques
        branches = cedant_data['line_of_business'].dropna().unique().tolist()
        branches = [str(b).strip() for b in branches if str(b).strip()]
        branches.sort()
        
        logger.debug(f"Branches disponibles pour {cedant_id} (segment {segment}): {len(branches)} branches")
        
        return {
            "branches": branches
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des branches pour {cedant_id}: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@app.get("/")
async def root():
    """Page d'accueil de l'API."""
    return {
        "message": "Bienvenue sur l'API de données de souscription",
        "documentation": "/docs",
        "endpoint": "/api/subscription-data"
    }

# Variable globale pour éviter les rechargements multiples
_data_loaded = False
df = None

def prepare_retention_cache():
    """Calcule les taux de rétention pour toutes les cédantes au démarrage."""
    global cedant_retention_cache
    
    if TEST_MODE:
        logger.info(f"📊 Calcul des taux de rétention (MODE TEST : {len(TEST_CEDANTS)} cédantes)...")
    else:
        logger.info("📊 Calcul des taux de rétention (toutes les cédantes)...")
    
    try:
        # Charger uniquement les colonnes nécessaires pour le calcul
        df_gbp = read_source_data(['CEDANT', 'LAST_GBP_N', 'LAST_EPI_N'])
        
        # MODE TEST : Filtrer sur les cédantes de test uniquement
        if TEST_MODE:
            df_gbp = df_gbp[df_gbp['CEDANT'].isin(TEST_CEDANTS)]
        
        # Calculer le taux de rétention pour chaque cédante
        for cedant in df_gbp['CEDANT'].unique():
            cedant_data = df_gbp[df_gbp['CEDANT'] == cedant]
            total_epi = cedant_data['LAST_EPI_N'].sum()
            total_gbp = cedant_data['LAST_GBP_N'].sum()
            
            retention_rate = (total_epi / total_gbp * 100) if total_gbp != 0 else 0.0
            cedant_retention_cache[cedant] = round(retention_rate, 2)
        
        logger.info(f"✅ Taux de rétention calculés pour {len(cedant_retention_cache)} cédantes")
    except Exception as e:
        logger.error(f"❌ Erreur lors du calcul des taux de rétention: {e}")
        cedant_retention_cache = {}

def load_data_once():
    """Charge les données une seule fois même en cas de reload."""
    global df, _data_loaded
    
    if not _data_loaded:
        logger.info("🔄 Chargement initial des données...")
        df = load_and_process_excel()
        logger.info(f"✅ Données chargées: {len(df)} lignes")
        
        # Préparer le cache des cédantes
        prepare_cedants_cache()
        
        # Préparer le cache des taux de rétention
        prepare_retention_cache()
        
        _data_loaded = True
        logger.info("🎯 Chargement terminé - prêt à servir")
    else:
        logger.info("⚡ Données déjà en mémoire, rechargement évité")

# Charger les données au démarrage du serveur pour éviter l'attente sur la première requête web
try:
    logger.info("🚀 Chargement des données au démarrage du serveur...")
    load_data_once()
    logger.info("✅ Serveur prêt avec données en mémoire")
except Exception as e:
    logger.error(f"❌ Erreur lors du chargement initial: {e}")
    df = pd.DataFrame()

# Point d'entrée pour démarrer l'application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("subscription_backend:app", host="0.0.0.0", port=8000, reload=False)

