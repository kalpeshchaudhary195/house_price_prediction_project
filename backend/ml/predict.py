"""Prediction service and CLI for California House Price Prediction."""

import os
from typing import Dict, Any, Tuple, Optional, List
import joblib
import numpy as np
import pandas as pd

from backend.ml.preprocessing import (
    validate_and_parse_input,
    convert_to_model_row,
    row_to_dataframe,
    FEATURE_COLUMNS,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))

_pipeline = None
_model = None


def load_artifacts():
    """Lazily loads the saved preprocessing pipeline and regressor model."""
    global _pipeline, _model
    if _pipeline is not None and _model is not None:
        return _pipeline, _model

    pipeline_path = os.path.join(SAVED_MODELS_DIR, "pipeline.pkl")
    model_path = os.path.join(SAVED_MODELS_DIR, "model.pkl")

    if not os.path.exists(pipeline_path) or not os.path.exists(model_path):
        # Fallback to root directory
        pipeline_path = os.path.join(ROOT_DIR, "pipeline.pkl")
        model_path = os.path.join(ROOT_DIR, "model.pkl")

    if not os.path.exists(pipeline_path) or not os.path.exists(model_path):
        raise FileNotFoundError("Trained model or pipeline artifacts not found. Please run train.py first.")

    _pipeline = joblib.load(pipeline_path)
    _model = joblib.load(model_path)
    return _pipeline, _model


def predict_price(
    raw_data: Dict[str, Any]
) -> Tuple[Optional[Dict[str, Any]], Optional[List[str]]]:
    """Runs input validation, feature engineering, and model inference.

    Returns:
        (result_dict, None) on success
        (None, error_list) on validation failure
    """
    values, ocean, errors = validate_and_parse_input(raw_data)
    if errors or values is None or ocean is None:
        return None, errors

    pipeline, model = load_artifacts()

    model_row = convert_to_model_row(values, ocean)
    df_row = row_to_dataframe(model_row)

    # Preprocess
    X_transformed = pipeline.transform(df_row)

    # Predict point estimate
    pred = float(model.predict(X_transformed)[0])
    pred = max(20000.0, pred)  # realistic lower bound

    # Compute confidence interval from tree ensemble spread if available
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


if __name__ == "__main__":
    sample = {
        "MedInc": 5.2,
        "HouseAge": 28,
        "AveRooms": 5.5,
        "AveBedrms": 1.1,
        "Population": 1400,
        "AveOccup": 3.0,
        "Latitude": 37.85,
        "Longitude": -122.25,
        "OceanProximity": "NEAR BAY",
    }
    res, errs = predict_price(sample)
    if errs:
        print("Validation errors:", errs)
    else:
        print("Prediction result:", res)
