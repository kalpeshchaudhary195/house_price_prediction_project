"""Inference module for ML service."""

import os
from typing import Dict, Any, Tuple, Optional, List
import joblib
import numpy as np
import pandas as pd

from preprocessing import (
    validate_and_parse_input,
    convert_to_model_row,
    row_to_dataframe,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

_pipeline = None
_model = None


def load_artifacts():
    global _pipeline, _model
    if _pipeline is not None and _model is not None:
        return _pipeline, _model

    pipeline_path = os.path.join(SAVED_MODELS_DIR, "pipeline.pkl")
    model_path = os.path.join(SAVED_MODELS_DIR, "model.pkl")

    if not os.path.exists(pipeline_path) or not os.path.exists(model_path):
        raise FileNotFoundError("Model or pipeline not found. Run train.py first.")

    _pipeline = joblib.load(pipeline_path)
    _model = joblib.load(model_path)
    return _pipeline, _model


def predict_price(raw_data: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[List[str]]]:
    values, ocean, errors = validate_and_parse_input(raw_data)
    if errors or values is None or ocean is None:
        return None, errors

    pipeline, model = load_artifacts()

    model_row = convert_to_model_row(values, ocean)
    df_row = row_to_dataframe(model_row)

    X_transformed = pipeline.transform(df_row)
    pred = float(model.predict(X_transformed)[0])
    pred = max(20000.0, pred)

    low = None
    high = None
    confidence = "Medium"

    if hasattr(model, "estimators_"):
        tree_preds = np.array([tree.predict(X_transformed)[0] for tree in model.estimators_])
        low_val, high_val = np.percentile(tree_preds, [10, 90])
        low = round(float(max(15000.0, low_val)), 2)
        high = round(float(high_val), 2)
        spread = (high - low) / (2.0 * pred) if pred > 0 else 1.0

        if spread <= 0.25:
            confidence = "High"
        elif spread <= 0.45:
            confidence = "Medium"
        else:
            confidence = "Moderate"

    model_name = getattr(model, "__class__", type(model)).__name__
    if model_name == "RandomForestRegressor":
        model_name = "Random Forest Regressor"
    elif model_name == "ExtraTreesRegressor":
        model_name = "Extra Trees Regressor"

    result = {
        "predicted_price": round(pred, 2),
        "range_low": low,
        "range_high": high,
        "confidence": confidence,
        "model_name": model_name,
        "input_features": {
            "median_income": values["MedInc"],
            "house_age": values["HouseAge"],
            "average_rooms": values["AveRooms"],
            "average_bedrooms": values["AveBedrms"],
            "population": values["Population"],
            "average_occupancy": values["AveOccup"],
            "latitude": values["Latitude"],
            "longitude": values["Longitude"],
            "ocean_proximity": ocean,
        },
        "model_row": model_row,
    }

    return result, None

