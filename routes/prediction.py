"""Prediction & Model API Blueprint.

Serves ML prediction inference, persists evaluations to PostgreSQL,
and supports dynamic location metadata & model retraining.
"""

import os
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, session
from database.db import db_session
from database.models import HousePrice, PredictionHistory
from ml.predict import predict_price, format_inr, format_inr_exact
from ml.dataset_generator import CITIES_DATA, PROPERTY_TYPES, FURNISHING_STATUS
from ml.train_model import train_and_evaluate
from config import Config

prediction_bp = Blueprint("prediction", __name__)

@prediction_bp.route("/api/locations", methods=["GET"])
def get_locations():
    """Return structured Indian city, locality, and state metadata."""
    locations = {}
    for city, info in CITIES_DATA.items():
        locations[city] = {
            "state": info["state"],
            "localities": list(info["localities"].keys())
        }

    return jsonify({
        "success": True,
        "cities": locations,
        "property_types": list(PROPERTY_TYPES.keys()),
        "furnishing_options": list(FURNISHING_STATUS.keys())
    }), 200


@prediction_bp.route("/api/predict", methods=["POST"])
def predict():
    """Predict house price, save to database, and return formatted valuation."""
    data = request.get_json() or request.form

    try:
        city = str(data.get("city", "")).strip()
        locality = str(data.get("locality", "")).strip()
        state = str(data.get("state", "")).strip()
        area_sqft = float(data.get("area_sqft", 0))
        bedrooms = int(data.get("bedrooms", 0))
        bathrooms = int(data.get("bathrooms", 0))
        floors = int(data.get("floors", 1))
        parking = int(data.get("parking", 0))
        property_age = int(data.get("property_age", 0))
        furnishing_status = str(data.get("furnishing_status", "")).strip()
        property_type = str(data.get("property_type", "")).strip()

        # Strict validation
        errors = []
        if not city:
            errors.append("City is required.")
        if not locality:
            errors.append("Locality is required.")
        if not state:
            errors.append("State is required.")
        if area_sqft <= 100 or area_sqft > 25000:
            errors.append("Area must be between 100 and 25,000 sq.ft.")
        if bedrooms < 1 or bedrooms > 15:
            errors.append("Bedrooms must be between 1 and 15.")
        if bathrooms < 1 or bathrooms > 15:
            errors.append("Bathrooms must be between 1 and 15.")
        if floors < 1 or floors > 80:
            errors.append("Floors must be between 1 and 80.")
        if parking < 0 or parking > 10:
            errors.append("Parking must be between 0 and 10.")
        if property_age < 0 or property_age > 100:
            errors.append("Property age must be between 0 and 100 years.")
        if furnishing_status not in FURNISHING_STATUS:
            errors.append(f"Furnishing status must be one of: {', '.join(FURNISHING_STATUS.keys())}.")
        if property_type not in PROPERTY_TYPES:
            errors.append(f"Property type must be one of: {', '.join(PROPERTY_TYPES.keys())}.")

        if errors:
            return jsonify({"success": False, "message": "Validation failed", "errors": errors}), 422

        input_payload = {
            "city": city,
            "locality": locality,
            "state": state,
            "area_sqft": area_sqft,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "floors": floors,
            "parking": parking,
            "property_age": property_age,
            "furnishing_status": furnishing_status,
            "property_type": property_type,
        }

        # 1. Run Machine Learning Inference
        pred_result = predict_price(input_payload)
        predicted_price = pred_result["predicted_price"]
        model_name = pred_result["model_name"]

        # 2. Persist to PostgreSQL Database
        db = db_session()
        house_record = HousePrice(
            city=city,
            locality=locality,
            state=state,
            area_sqft=area_sqft,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            floors=floors,
            parking=parking,
            property_age=property_age,
            furnishing_status=furnishing_status,
            property_type=property_type,
            actual_price=None,
            predicted_price=predicted_price,
            model_name=model_name,
            prediction_date=datetime.now(timezone.utc)
        )
        db.add(house_record)
        db.flush() # Populate house_record.id

        user_id = session.get("user_id")
        history_record = PredictionHistory(
            user_id=user_id,
            house_id=house_record.id,
            predicted_price=predicted_price,
            model_name=model_name,
            prediction_date=datetime.now(timezone.utc)
        )
        db.add(history_record)
        db.commit()

        # Augment response with database record ID
        pred_result["id"] = house_record.id
        pred_result["history_id"] = history_record.id
        pred_result["prediction_date"] = house_record.prediction_date.strftime("%d %b %Y, %I:%M %p")
        pred_result["disclaimer"] = (
            "This valuation is an automated statistical estimate generated by machine learning "
            "based on historical comparative transactions and current market rates. "
            "It is not an official appraisal or legal evaluation."
        )

        return jsonify({
            "success": True,
            "message": "House price predicted and saved successfully!",
            "data": pred_result
        }), 200

    except Exception as e:
        db_session.rollback()
        return jsonify({"success": False, "message": f"Prediction error: {str(e)}"}), 500


@prediction_bp.route("/api/model-info", methods=["GET"])
def model_info():
    """Return trained model details, evaluation metrics, and comparison table."""
    metrics_path = os.path.join(Config.ARTIFACTS_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        return jsonify({"success": False, "message": "Model metrics not available. Retrain first."}), 404

    with open(metrics_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return jsonify({"success": True, "metrics": data}), 200


@prediction_bp.route("/api/model/retrain", methods=["POST"])
def retrain():
    """Trigger model training across all regression algorithms and refresh best model."""
    try:
        metrics = train_and_evaluate()
        return jsonify({
            "success": True,
            "message": "Model retrained successfully!",
            "best_model": metrics["best_model_name"],
            "metrics": metrics
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Retraining failed: {str(e)}"}), 500
