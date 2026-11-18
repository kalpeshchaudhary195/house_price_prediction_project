"""Preprocessing module for California House Price Prediction."""

import math
from typing import Dict, Any, Tuple, List, Optional
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

FEATURE_COLUMNS: List[str] = [
    "longitude",
    "latitude",
    "housing_median_age",
    "total_rooms",
    "total_bedrooms",
    "population",
    "households",
    "median_income",
    "ocean_proximity",
]

NUMERIC_COLUMNS: List[str] = [
    "longitude",
    "latitude",
    "housing_median_age",
    "total_rooms",
    "total_bedrooms",
    "population",
    "households",
    "median_income",
]

CATEGORICAL_COLUMNS: List[str] = ["ocean_proximity"]

OCEAN_PROXIMITY_MAP: Dict[str, str] = {
    "NEAR BAY": "NEAR BAY",
    "INLAND": "INLAND",
    "NEAR OCEAN": "NEAR OCEAN",
    "1H OCEAN": "<1H OCEAN",
    "<1H OCEAN": "<1H OCEAN",
    "ISLAND": "ISLAND",
}

LAT_RANGE: Tuple[float, float] = (32.0, 42.5)
LON_RANGE: Tuple[float, float] = (-124.5, -114.0)

NUMERIC_FIELD_LABELS = {
    "MedInc": "Median Income",
    "HouseAge": "House Age",
    "AveRooms": "Average Rooms",
    "AveBedrms": "Average Bedrooms",
    "Population": "Population",
    "AveOccup": "Average Occupancy",
    "Latitude": "Latitude",
    "Longitude": "Longitude",
}


def build_preprocessor() -> ColumnTransformer:
    num_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    cat_pipeline = Pipeline(
        steps=[
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERIC_COLUMNS),
            ("cat", cat_pipeline, CATEGORICAL_COLUMNS),
        ]
    )


def validate_and_parse_input(data: Dict[str, Any]) -> Tuple[Optional[Dict[str, float]], Optional[str], List[str]]:
    errors: List[str] = []
    values: Dict[str, float] = {}

    field_alias = {
        "MedInc": ["MedInc", "median_income"],
        "HouseAge": ["HouseAge", "housing_median_age", "house_age"],
        "AveRooms": ["AveRooms", "rooms_per_household", "average_rooms"],
        "AveBedrms": ["AveBedrms", "bedrooms_per_household", "average_bedrooms"],
        "Population": ["Population", "population"],
        "AveOccup": ["AveOccup", "occupancy", "average_occupancy"],
        "Latitude": ["Latitude", "latitude"],
        "Longitude": ["Longitude", "longitude"],
    }

    for canonical, aliases in field_alias.items():
        val = None
        for alias in aliases:
            if alias in data and data[alias] is not None and str(data[alias]).strip() != "":
                val = data[alias]
                break

        if val is None:
            errors.append(f"{NUMERIC_FIELD_LABELS.get(canonical, canonical)} is required.")
            continue

        try:
            num = float(str(val).strip())
            if not math.isfinite(num):
                raise ValueError
            values[canonical] = num
        except (ValueError, TypeError):
            errors.append(f"{NUMERIC_FIELD_LABELS.get(canonical, canonical)} must be a valid number.")

    raw_ocean = str(data.get("OceanProximity", data.get("ocean_proximity", data.get("location", "")))).strip().upper()
    # Normalize ocean proximity if it has extra text
    for k in OCEAN_PROXIMITY_MAP:
        if k in raw_ocean:
            raw_ocean = k
            break

    ocean_mapped = OCEAN_PROXIMITY_MAP.get(raw_ocean)
    if not ocean_mapped:
        errors.append(
            f"Please choose a valid Ocean Proximity (NEAR BAY, INLAND, NEAR OCEAN, 1H OCEAN, ISLAND)."
        )

    if errors:
        return None, ocean_mapped, errors

    for key in ("MedInc", "Population"):
        if values.get(key, 0) <= 0:
            errors.append(f"{NUMERIC_FIELD_LABELS[key]} must be greater than 0.")

    if values.get("AveRooms", 0) <= 0:
        errors.append("Average Rooms must be greater than 0.")
    if values.get("AveBedrms", 0) <= 0:
        errors.append("Average Bedrooms must be greater than 0.")
    if values.get("AveOccup", 0) <= 0:
        errors.append("Average Occupancy must be greater than 0.")

    if values.get("HouseAge", 0) < 0:
        errors.append("House Age cannot be negative.")

    lat = values.get("Latitude", 0)
    lon = values.get("Longitude", 0)
    if not (LAT_RANGE[0] <= lat <= LAT_RANGE[1]):
        errors.append(f"Latitude must be between {LAT_RANGE[0]} and {LAT_RANGE[1]} (California boundary).")
    if not (LON_RANGE[0] <= lon <= LON_RANGE[1]):
        errors.append(f"Longitude must be between {LON_RANGE[0]} and {LON_RANGE[1]} (California boundary).")

    if values.get("AveBedrms", 0) > values.get("AveRooms", 0):
        errors.append("Average Bedrooms cannot exceed Average Rooms.")
    if values.get("AveOccup", 0) > values.get("Population", 0):
        errors.append("Average Occupancy cannot exceed Population.")

    return (None if errors else values), ocean_mapped, errors


def convert_to_model_row(values: Dict[str, float], ocean: str) -> Dict[str, Any]:
    households = values["Population"] / values["AveOccup"]
    return {
        "longitude": values["Longitude"],
        "latitude": values["Latitude"],
        "housing_median_age": values["HouseAge"],
        "total_rooms": values["AveRooms"] * households,
        "total_bedrooms": values["AveBedrms"] * households,
        "population": values["Population"],
        "households": households,
        "median_income": values["MedInc"],
        "ocean_proximity": ocean,
    }


def row_to_dataframe(row: Dict[str, Any]) -> pd.DataFrame:
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)

