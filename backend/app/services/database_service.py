"""Database service layer for saving and querying predictions and training runs."""

import json
import logging
import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from backend.app.database.connection import get_db, init_db
from backend.app.database.models import Prediction, ModelTrainingHistory

logger = logging.getLogger("house_pricing.db_service")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def save_prediction_record(
    location: str,
    property_type: str,
    bedrooms: float,
    bathrooms: float,
    area_sqft: float,
    input_features: Dict[str, Any],
    predicted_price: float,
    model_name: str,
) -> Optional[Dict[str, Any]]:
    """Persists a prediction record into the database."""
    try:
        session_gen = get_db()
        db = next(session_gen)
        try:
            record = Prediction(
                property_location=location,
                property_type=property_type,
                bedrooms=bedrooms,
                bathrooms=bathrooms,
                area_sqft=area_sqft,
                input_features=input_features,
                predicted_price=predicted_price,
                model_name=model_name,
                created_at=utc_now(),
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record.to_dict()
        finally:
            try:
                next(session_gen)
            except StopIteration:
                pass
    except Exception as e:
        logger.error("Failed to save prediction record: %s", e)
        return None


def get_prediction_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves the latest prediction history."""
    try:
        session_gen = get_db()
        db = next(session_gen)
        try:
            records = (
                db.query(Prediction)
                .order_by(Prediction.created_at.desc())
                .limit(limit)
                .all()
            )
            return [r.to_dict() for r in records]
        finally:
            try:
                next(session_gen)
            except StopIteration:
                pass
    except Exception as e:
        logger.error("Failed to fetch prediction history: %s", e)
        return []


def record_training_history(
    model_name: str,
    mae: float,
    mse: float,
    rmse: float,
    r2_score: float,
    dataset_size: int,
    trained_at: Optional[datetime] = None,
) -> Optional[Dict[str, Any]]:
    """Saves a model training run to history."""
    try:
        session_gen = get_db()
        db = next(session_gen)
        try:
            record = ModelTrainingHistory(
                model_name=model_name,
                mae=mae,
                mse=mse,
                rmse=rmse,
                r2_score=r2_score,
                dataset_size=dataset_size,
                trained_at=trained_at or utc_now(),
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record.to_dict()
        finally:
            try:
                next(session_gen)
            except StopIteration:
                pass
    except Exception as e:
        logger.error("Failed to record training history: %s", e)
        return None


def get_model_history(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieves past training runs."""
    try:
        session_gen = get_db()
        db = next(session_gen)
        try:
            records = (
                db.query(ModelTrainingHistory)
                .order_by(ModelTrainingHistory.trained_at.desc())
                .limit(limit)
                .all()
            )
            return [r.to_dict() for r in records]
        finally:
            try:
                next(session_gen)
            except StopIteration:
                pass
    except Exception as e:
        logger.error("Failed to fetch model history: %s", e)
        return []


def seed_training_history_from_metrics():
    """Seeds the training history table from saved metrics.json if empty."""
    try:
        existing = get_model_history(1)
        if existing:
            return

        metrics_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..",
            "..",
            "ml",
            "saved_models",
            "metrics.json",
        )
        if not os.path.exists(metrics_file):
            return

        with open(metrics_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        dataset_size = data.get("dataset_size", 20640)
        all_models = data.get("all_models_comparison", {})
        trained_at_str = data.get("trained_at")
        trained_at = datetime.fromisoformat(trained_at_str) if trained_at_str else utc_now()

        for m_name, m_metrics in all_models.items():
            record_training_history(
                model_name=m_name,
                mae=m_metrics.get("mae", 0.0),
                mse=m_metrics.get("mse", 0.0),
                rmse=m_metrics.get("rmse", 0.0),
                r2_score=m_metrics.get("r2_score", 0.0),
                dataset_size=dataset_size,
                trained_at=trained_at,
            )
        logger.info("Successfully seeded training history from metrics.json.")
    except Exception as e:
        logger.warning("Could not seed training history: %s", e)
