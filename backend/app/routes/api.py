"""REST API endpoints for House Price Prediction Web Application."""

import json
import logging
import os
from typing import Dict, Any, List
from flask import Blueprint, request, jsonify

from backend.ml.predict import predict_price, load_artifacts
from backend.ml.train import train_and_evaluate_all, load_dataset
from backend.app.database.connection import get_db_status
from backend.app.services.database_service import (
    save_prediction_record,
    get_prediction_history,
    record_training_history,
    get_model_history,
    seed_training_history_from_metrics,
)

logger = logging.getLogger("house_pricing.api")
api_bp = Blueprint("api", __name__, url_prefix="/api")

# Cached dataset location statistics
_location_stats = None


def get_cached_location_stats() -> List[Dict[str, Any]]:
    """Calculates summary statistics per ocean proximity from actual dataset."""
    global _location_stats
    if _location_stats is not None:
        return _location_stats

    try:
        df = load_dataset()
        grouped = df.groupby("ocean_proximity")["median_house_value"].agg(
            count="count",
            avg_price="mean",
            median_price="median",
            min_price="min",
            max_price="max",
        ).reset_index()

        descriptions = {
            "NEAR BAY": "< 5 miles to San Francisco Bay area",
            "<1H OCEAN": "Within 1 hour drive of Pacific Coastline",
            "INLAND": "Interior valleys and inland regions (>30 miles from coast)",
            "NEAR OCEAN": "Immediate coastal corridors (<5 miles to Pacific Ocean)",
            "ISLAND": "Channel / Catalina Islands waterfront sanctuary",
        }

        display_names = {
            "NEAR BAY": "Near Bay, CA",
            "<1H OCEAN": "< 1 Hour to Ocean, CA",
            "INLAND": "Inland Valley, CA",
            "NEAR OCEAN": "Near Ocean, CA",
            "ISLAND": "Island Coastal, CA",
        }

        stats = []
        for _, row in grouped.iterrows():
            cat = str(row["ocean_proximity"])
            stats.append({
                "value": "1H OCEAN" if cat == "<1H OCEAN" else cat,
                "dataset_category": cat,
                "name": display_names.get(cat, cat),
                "description": descriptions.get(cat, "California region"),
                "total_records": int(row["count"]),
                "avg_price": round(float(row["avg_price"]), 2),
                "median_price": round(float(row["median_price"]), 2),
                "min_price": round(float(row["min_price"]), 2),
                "max_price": round(float(row["max_price"]), 2),
            })

        _location_stats = sorted(stats, key=lambda x: x["avg_price"], reverse=True)
        return _location_stats
    except Exception as e:
        logger.error("Error computing location statistics: %s", e)
        return [
            {"value": "NEAR BAY", "name": "Near Bay, CA", "avg_price": 259212.31},
            {"value": "1H OCEAN", "name": "< 1 Hour Ocean, CA", "avg_price": 240084.29},
            {"value": "INLAND", "name": "Inland, CA", "avg_price": 124805.39},
            {"value": "NEAR OCEAN", "name": "Near Ocean, CA", "avg_price": 249433.98},
            {"value": "ISLAND", "name": "Island, CA", "avg_price": 380440.00},
        ]


@api_bp.route("/health", methods=["GET"])
def health_check():
    """GET /api/health - Check whether backend, ML model, and database are running."""
    model_loaded = False
    try:
        load_artifacts()
        model_loaded = True
    except Exception:
        model_loaded = False

    db_status = get_db_status()

    return jsonify({
        "status": "healthy" if model_loaded else "degraded",
        "service": "House Price Prediction API",
        "version": "2.0.0",
        "model_loaded": model_loaded,
        "database": db_status,
    }), 200


@api_bp.route("/predict", methods=["POST"])
def predict():
    """POST /api/predict - Receive house details and return ML predicted price."""
    data = request.get_json(silent=True)
    if not data:
        # Fallback to form data if JSON wasn't passed
        data = request.form.to_dict()

    if not data:
        return jsonify({
            "success": False,
            "errors": ["Request body is empty or not valid JSON."],
        }), 400

    result, errors = predict_price(data)
    if errors:
        return jsonify({
            "success": False,
            "errors": errors,
        }), 400

    # Extract or infer property details for presentation and database logging
    features = result["input_features"]
    ocean = features["ocean_proximity"]
    rooms = features["average_rooms"]
    bedrms = features["average_bedrooms"]
    lat = features["latitude"]
    lon = features["longitude"]

    # Calculate realistic estimated square footage and bathrooms based on rooms
    estimated_sqft = round(float(data.get("area_sqft") or (rooms * 380.0)), 1)
    estimated_baths = round(float(data.get("bathrooms") or max(1.0, round(bedrms * 1.1, 1))), 1)
    prop_type = str(data.get("property_type") or "Single Family Home")

    location_str = f"{ocean}, CA ({lat:.2f}°, {lon:.2f}°)"

    # Save to database
    db_record = save_prediction_record(
        location=location_str,
        property_type=prop_type,
        bedrooms=bedrms,
        bathrooms=estimated_baths,
        area_sqft=estimated_sqft,
        input_features=result["model_row"],
        predicted_price=result["predicted_price"],
        model_name=result["model_name"],
    )

    result["prediction_id"] = db_record["id"] if db_record else None
    result["created_at"] = db_record["created_at"] if db_record else None
    result["property_summary"] = {
        "location": location_str,
        "property_type": prop_type,
        "bedrooms": bedrms,
        "bathrooms": estimated_baths,
        "area_sqft": estimated_sqft,
        "ocean_proximity": ocean,
        "house_age": features["house_age"],
    }
    result["success"] = True

    return jsonify(result), 200


@api_bp.route("/model-info", methods=["GET"])
def model_info():
    """GET /api/model-info - Return active model name, training info, and evaluation metrics."""
    metrics_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "..",
        "ml",
        "saved_models",
        "metrics.json",
    )

    if not os.path.exists(metrics_path):
        return jsonify({
            "success": False,
            "message": "Model metrics not found. Please train the model.",
        }), 404

    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics_data = json.load(f)

    db_status = get_db_status()
    metrics_data["database"] = db_status
    metrics_data["success"] = True

    return jsonify(metrics_data), 200


@api_bp.route("/locations", methods=["GET"])
def locations():
    """GET /api/locations - Return available locations and dataset-driven valuation statistics."""
    stats = get_cached_location_stats()
    return jsonify({
        "success": True,
        "total_locations": len(stats),
        "locations": stats,
    }), 200


@api_bp.route("/predictions", methods=["GET"])
def predictions():
    """GET /api/predictions - Return prediction history from database."""
    limit = request.args.get("limit", default=50, type=int)
    limit = min(max(1, limit), 200)

    records = get_prediction_history(limit=limit)
    return jsonify({
        "success": True,
        "count": len(records),
        "predictions": records,
        "database": get_db_status(),
    }), 200


@api_bp.route("/retrain", methods=["POST"])
def retrain():
    """POST /api/retrain - Retrain the model on the California housing dataset and update artifacts."""
    global _location_stats
    try:
        best_name, metadata, _ = train_and_evaluate_all()
        # Invalidate location cache
        _location_stats = None

        # Record in training history table
        record_training_history(
            model_name=best_name,
            mae=metadata["metrics"]["mae"],
            mse=metadata["metrics"]["mse"],
            rmse=metadata["metrics"]["rmse"],
            r2_score=metadata["metrics"]["r2_score"],
            dataset_size=metadata["dataset_size"],
        )

        return jsonify({
            "success": True,
            "message": f"Successfully retrained models. Best model: {best_name}",
            "retrained_model": best_name,
            "metrics": metadata["metrics"],
            "all_models_comparison": metadata["all_models_comparison"],
        }), 200
    except Exception as e:
        logger.error("Retraining failed: %s", e)
        return jsonify({
            "success": False,
            "error": f"Model retraining failed: {str(e)}",
        }), 500

