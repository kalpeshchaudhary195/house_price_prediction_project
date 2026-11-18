from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database.db import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    predictions = relationship("PredictionHistory", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }


class HousePrice(Base):
    __tablename__ = "house_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    city = Column(String(100), nullable=False, index=True)
    locality = Column(String(150), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    area_sqft = Column(Float, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=False)
    floors = Column(Integer, nullable=False, default=1)
    parking = Column(Integer, nullable=False, default=1)
    property_age = Column(Integer, nullable=False, default=0)
    furnishing_status = Column(String(50), nullable=False)
    property_type = Column(String(50), nullable=False)
    actual_price = Column(Float, nullable=True)
    predicted_price = Column(Float, nullable=False)
    model_name = Column(String(100), nullable=False)
    prediction_date = Column(DateTime, default=utc_now, nullable=False, index=True)

    history_records = relationship("PredictionHistory", back_populates="house", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "city": self.city,
            "locality": self.locality,
            "state": self.state,
            "area_sqft": self.area_sqft,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "floors": self.floors,
            "parking": self.parking,
            "property_age": self.property_age,
            "furnishing_status": self.furnishing_status,
            "property_type": self.property_type,
            "actual_price": self.actual_price,
            "predicted_price": self.predicted_price,
            "model_name": self.model_name,
            "prediction_date": self.prediction_date.strftime("%Y-%m-%d %H:%M:%S") if self.prediction_date else None
        }


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    house_id = Column(Integer, ForeignKey("house_prices.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_price = Column(Float, nullable=False)
    model_name = Column(String(100), nullable=False)
    prediction_date = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="predictions")
    house = relationship("HousePrice", back_populates="history_records")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "Anonymous",
            "house_id": self.house_id,
            "house": self.house.to_dict() if self.house else None,
            "predicted_price": self.predicted_price,
            "model_name": self.model_name,
            "prediction_date": self.prediction_date.strftime("%Y-%m-%d %H:%M:%S") if self.prediction_date else None
        }
