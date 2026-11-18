"""SQLAlchemy models for Prediction History and Model Training Tracking."""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, Text
from backend.app.database.connection import Base


class Prediction(Base):
    """Stores individual house price predictions made by users."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    property_location = Column(String(255), nullable=False)
    property_type = Column(String(100), default="Residential Single Family")
    bedrooms = Column(Float, nullable=False, default=1.0)
    bathrooms = Column(Float, nullable=False, default=1.0)
    area_sqft = Column(Float, nullable=False, default=1500.0)
    input_features = Column(JSON, nullable=True)
    predicted_price = Column(Float, nullable=False)
    model_name = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "property_location": self.property_location,
            "property_type": self.property_type,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "area_sqft": self.area_sqft,
            "input_features": self.input_features,
            "predicted_price": self.predicted_price,
            "model_name": self.model_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ModelTrainingHistory(Base):
    """Tracks training runs and evaluation metrics across models."""
    __tablename__ = "model_training_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String(150), nullable=False)
    mae = Column(Float, nullable=False)
    mse = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2_score = Column(Float, nullable=False)
    dataset_size = Column(Integer, nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "model_name": self.model_name,
            "mae": self.mae,
            "mse": self.mse,
            "rmse": self.rmse,
            "r2_score": self.r2_score,
            "dataset_size": self.dataset_size,
            "trained_at": self.trained_at.isoformat() if self.trained_at else None,
        }

