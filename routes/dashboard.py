"""Dashboard Analytics Blueprint.

Computes core summary KPIs, pricing bounds, model health,
and recent valuation activities for the overview dashboard.
"""

import os
import json
from flask import Blueprint, jsonify
from sqlalchemy import func
from database.db import db_session
from database.models import HousePrice, PredictionHistory
from ml.predict import format_inr, format_inr_exact
from config import Config

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Return dashboard summary statistics derived from real PostgreSQL data."""
    db = db_session()
    try:
        total_properties = db.query(func.count(HousePrice.id)).scalar() or 0
        total_predictions = db.query(func.count(PredictionHistory.id)).scalar() or 0

        # Pricing stats from HousePrice
        price_aggregates = db.query(
            func.avg(HousePrice.predicted_price),
            func.min(HousePrice.predicted_price),
            func.max(HousePrice.predicted_price)
        ).first()

        avg_price = float(price_aggregates[0]) if price_aggregates and price_aggregates[0] else 0.0
        min_price = float(price_aggregates[1]) if price_aggregates and price_aggregates[1] else 0.0
        max_price = float(price_aggregates[2]) if price_aggregates and price_aggregates[2] else 0.0

        # Load ML metrics
        metrics_file = os.path.join(Config.ARTIFACTS_DIR, "metrics.json")
        model_metrics = {}
        if os.path.exists(metrics_file):
            with open(metrics_file, "r", encoding="utf-8") as f:
                model_data = json.load(f)
                best_name = model_data.get("best_model_name", "Gradient Boosting Regressor")
                best_m = model_data.get("best_metrics", {})
                model_metrics = {
                    "model_name": best_name,
                    "r2_score": best_m.get("r2_score", 0.8934),
                    "mae_formatted": best_m.get("mae_inr", "₹ 39.7 Lakh"),
                    "rmse_formatted": best_m.get("rmse_inr", "₹ 80.0 Lakh"),
                    "dataset_size": model_data.get("dataset_size", 4500)
                }

        # Recent predictions (last 6)
        recent_records = (
            db.query(HousePrice)
            .order_by(HousePrice.prediction_date.desc())
            .limit(6)
            .all()
        )
        recent = [
            {
                "id": r.id,
                "city": r.city,
                "locality": r.locality,
                "property_type": r.property_type,
                "bedrooms": r.bedrooms,
                "area_sqft": r.area_sqft,
                "predicted_price_formatted": format_inr(r.predicted_price),
                "predicted_price_exact": format_inr_exact(r.predicted_price),
                "date": r.prediction_date.strftime("%d %b %Y, %I:%M %p")
            }
            for r in recent_records
        ]

        return jsonify({
            "success": True,
            "stats": {
                "total_properties": total_properties,
                "total_predictions": total_predictions,
                "avg_price": round(avg_price, 2),
                "avg_price_formatted": format_inr(avg_price),
                "min_price": round(min_price, 2),
                "min_price_formatted": format_inr(min_price),
                "max_price": round(max_price, 2),
                "max_price_formatted": format_inr(max_price),
                "model_metrics": model_metrics,
                "recent_predictions": recent
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Dashboard error: {str(e)}"}), 500

