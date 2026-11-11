"""Génère un jeu de données de démonstration ANONYMISÉ à partir d'un fichier réel.

Usage :
    python scripts/make_demo_dataset.py --source chemin/vers/fichier_reel.xlsx --out data/demo_dataset.csv.gz

Ce que fait le script :
  - ne garde que les colonnes utilisées par l'application et les années 2016-2024 ;
  - remplace les noms de cédantes, d'assurés, les numéros de contrat et les centres de profit par des identifiants génériques ;
  - déforme les montants : facteur aléatoire par cédante (les ratios S/P et de commission restent cohérents) puis bruit
    sur les sinistres et les provisions ;
  - la graine est fixée pour que le résultat soit reproductible.

Limite : une anonymisation par pseudonymes et bruit réduit fortement le risque de réidentification mais ne le supprime pas
à coup sûr. N'utilisez le fichier produit publiquement qu'avec l'accord du propriétaire des données.
Le fichier source réel ne doit jamais être versionné.
"""
import argparse
import os

import numpy as np
import pandas as pd

COLS = [
    "PROFIT_CENTRE_CODE", "LOB", "BRANCH_NAME", "INSURED_NAME", "DOMICILE_REGION", "RISK_COUNTRY",
    "CONTRACT_NUMBER", "UNDERWRITING_YEAR", "CONTRACT_STATUS", "PORTFOLIO_TYPE", "TYPE_OF_CONTRACT",
    "TYPE_OF_BUSINESS", "CEDANT", "LAST_CLAIMS_N", "LAST_CLAIM_RES_LATEST_N", "LAST_EPI_N", "LAST_GBP_N",
    "COMMISSION_RATE", "LAST_COMMISSION_N", "BROKERAGE_RATE", "LAST_BROKERAGE_N", "LAST_OTHER_CHARGE_N",
    "LAST_OVERRIDER_COMMISSION_N",
]
AMOUNTS = ["LAST_EPI_N", "LAST_GBP_N", "LAST_CLAIMS_N", "LAST_CLAIM_RES_LATEST_N", "LAST_COMMISSION_N",
           "LAST_BROKERAGE_N", "LAST_OTHER_CHARGE_N", "LAST_OVERRIDER_COMMISSION_N"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, help="Fichier Excel réel (feuille 'data')")
    ap.add_argument("--out", default="data/demo_dataset.csv.gz")
    ap.add_argument("--seed", type=int, default=2026)
    a = ap.parse_args()

    try:
        df = pd.read_excel(a.source, sheet_name="data", usecols=COLS, engine="calamine")
    except Exception:
        df = pd.read_excel(a.source, sheet_name="data", usecols=COLS)

    df = df[(df["UNDERWRITING_YEAR"] >= 2016) & (df["UNDERWRITING_YEAR"] <= 2024)].copy()
    rng = np.random.default_rng(a.seed)

    # 1. Montants : facteur par cédante (log-normal) appliqué à toutes les colonnes de montant
    cedants = df["CEDANT"].dropna().unique()
    scale = pd.Series(np.exp(rng.normal(0, 0.4, len(cedants))) * 0.3, index=cedants)
    f = df["CEDANT"].map(scale).fillna(0.3).to_numpy()
    for c in AMOUNTS:
        df[c] = df[c].astype(float) * f
    # bruit supplémentaire sur la sinistralité (le S/P n'est plus celui du fichier réel)
    for c in ["LAST_CLAIMS_N", "LAST_CLAIM_RES_LATEST_N"]:
        df[c] = df[c] * np.exp(rng.normal(0, 0.10, len(df)))
    df[AMOUNTS] = df[AMOUNTS].round(2)

    # 2. Pseudonymes (numérotés par volume de primes décroissant après déformation)
    order = df.groupby("CEDANT")["LAST_EPI_N"].sum().sort_values(ascending=False).index
    alias = {name: f"Cédante {i:03d}" for i, name in enumerate(order, 1)}
    df["CEDANT"] = df["CEDANT"].map(alias)
    insured = {n: f"Assuré {i:05d}" for i, n in enumerate(df["INSURED_NAME"].dropna().unique(), 1)}
    df["INSURED_NAME"] = df["INSURED_NAME"].map(insured)
    contracts = {n: f"CTR-{i:06d}" for i, n in enumerate(df["CONTRACT_NUMBER"].dropna().unique(), 1)}
    df["CONTRACT_NUMBER"] = df["CONTRACT_NUMBER"].map(contracts)
    centres = {n: f"PC-{i:02d}" for i, n in enumerate(df["PROFIT_CENTRE_CODE"].dropna().unique(), 1)}
    df["PROFIT_CENTRE_CODE"] = df["PROFIT_CENTRE_CODE"].map(centres)

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    df.to_csv(a.out, index=False, compression="gzip")
    print(f"{len(df)} lignes, {df['CEDANT'].nunique()} cédantes -> {a.out} ({os.path.getsize(a.out) // 1024} Ko)")


if __name__ == "__main__":
    main()
