"""Pydantic schemas for request validation and response typing."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class HousePredictionRequest(BaseModel):
    """Input payload for property price prediction."""
    MedInc: float = Field(..., ge=0.1, le=25.0, description="Median Income in tens of thousands (e.g. 4.5 = $45,000)")
    HouseAge: float = Field(..., ge=0.0, le=120.0, description="Median age of house in years")
    AveRooms: float = Field(..., ge=0.5, le=50.0, description="Average rooms per household")
    AveBedrms: float = Field(..., ge=0.5, le=25.0, description="Average bedrooms per household")
    Population: float = Field(..., ge=1.0, le=100000.0, description="Block group population")
    AveOccup: float = Field(..., ge=0.5, le=50.0, description="Average occupants per household")
    Latitude: float = Field(..., ge=32.0, le=43.0, description="California latitude (32.0 to 43.0)")
    Longitude: float = Field(..., ge=-125.0, le=-114.0, description="California longitude (-125.0 to -114.0)")
    OceanProximity: str = Field(..., description="Proximity to coast: NEAR BAY, INLAND, NEAR OCEAN, 1H OCEAN, ISLAND")
    
    # Optional metadata fields
    property_type: Optional[str] = Field("Residential", description="Property category")
    area_sqft: Optional[float] = Field(None, description="Optional custom square footage")
    bathrooms: Optional[float] = Field(None, description="Optional number of bathrooms")


class PredictionResponse(BaseModel):
    success: bool
    predicted_price: float
    range_low: Optional[float] = None
    range_high: Optional[float] = None
    confidence: str
    model_name: str
    input_features: Dict[str, Any]
    property_summary: Dict[str, Any]
    prediction_id: Optional[int] = None
    created_at: Optional[str] = None


class ModelInfoResponse(BaseModel):
    success: bool
    model_name: str
    trained_at: str
    dataset_size: int
    train_size: int
    test_size: int
    metrics: Dict[str, Any]
    all_models_comparison: Dict[str, Any]
    features: List[str]
    database: Dict[str, Any]

