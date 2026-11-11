# Données de démonstration

`demo_dataset.csv.gz` est un jeu de données **anonymisé** (cédantes, assurés, contrats et centres de profit remplacés par
des identifiants génériques ; montants déformés). Il sert uniquement à faire fonctionner l'application et ne reflète aucun
portefeuille réel.

Régénérer le jeu à partir d'un fichier réel (à garder en local, jamais versionné) :

    python scripts/make_demo_dataset.py --source chemin/vers/fichier_reel.xlsx --out data/demo_dataset.csv.gz

Utiliser vos propres données avec l'API :

    # Windows (PowerShell)
    $env:DATA_FILE = "chemin/vers/votre_fichier.xlsx"   # feuille "data", ou fichier .csv / .csv.gz
    uvicorn subscription_backend:app

Colonnes attendues : PROFIT_CENTRE_CODE, LOB, BRANCH_NAME, INSURED_NAME, DOMICILE_REGION, RISK_COUNTRY, CONTRACT_NUMBER,
UNDERWRITING_YEAR, CONTRACT_STATUS, PORTFOLIO_TYPE, TYPE_OF_CONTRACT, TYPE_OF_BUSINESS, CEDANT, LAST_CLAIMS_N,
LAST_CLAIM_RES_LATEST_N, LAST_EPI_N, LAST_GBP_N, COMMISSION_RATE, LAST_COMMISSION_N, BROKERAGE_RATE, LAST_BROKERAGE_N,
LAST_OTHER_CHARGE_N, LAST_OVERRIDER_COMMISSION_N.
