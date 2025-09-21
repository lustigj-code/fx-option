"""Seed demo data for the FX option platform."""
from __future__ import annotations

import json
from pathlib import Path

SAMPLE_EXPOSURES = [
    {
        "id": "exp-usd-mxn-1",
        "currency_pair": "USD/MXN",
        "notional": 1_000_000,
        "strike": 17.45,
        "tenor_days": 30,
        "market_data": {
            "spot": 17.42,
            "implied_volatility": 0.18,
            "interest_rate": 0.045,
        },
    },
    {
        "id": "exp-eur-usd-1",
        "currency_pair": "EUR/USD",
        "notional": 750_000,
        "strike": 1.08,
        "tenor_days": 45,
        "market_data": {
            "spot": 1.075,
            "implied_volatility": 0.21,
            "interest_rate": 0.023,
        },
    },
]

OUTPUT_DIR = Path("demo_data")
OUTPUT_DIR.mkdir(exist_ok=True)

with (OUTPUT_DIR / "exposures.json").open("w", encoding="utf-8") as handle:
    json.dump(SAMPLE_EXPOSURES, handle, indent=2)

print(f"Seeded {len(SAMPLE_EXPOSURES)} exposures to {OUTPUT_DIR / 'exposures.json'}")
