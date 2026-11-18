"""FastAPI Microservice for California House Price Prediction."""

import json
import os
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from predict import predict_price, load_artifacts
from train import train_and_evaluate_all, load_dataset
from dataset_analytics import compute_charts_data

app = FastAPI(
    title="House Price ML Prediction Service",
    description="Python FastAPI service serving Scikit-Learn regression predictions to Node.js backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

_location_stats = None


class PredictionInput(BaseModel):
    MedInc: float = Field(..., ge=0.1, le=25.0)
    HouseAge: float = Field(..., ge=0.0, le=120.0)
    AveRooms: float = Field(..., ge=0.5, le=50.0)
    AveBedrms: float = Field(..., ge=0.5, le=25.0)
    Population: float = Field(..., ge=1.0, le=100000.0)
    AveOccup: float = Field(..., ge=0.5, le=50.0)
    Latitude: float = Field(..., ge=32.0, le=42.5)
    Longitude: float = Field(..., ge=-124.5, le=-114.0)
    OceanProximity: str = Field(...)


@app.get("/health")
def health():
    model_loaded = False
    model_name = "None"
    try:
        _, m = load_artifacts()
        model_loaded = True
        model_name = getattr(m, "__class__", type(m)).__name__
    except Exception:
        pass

    return {
        "status": "healthy",
        "service": "Python ML Service (FastAPI)",
        "model_loaded": model_loaded,
        "active_model": model_name,
    }


@app.post("/predict")
def predict(payload: PredictionInput):
    data = payload.model_dump()
    result, errors = predict_price(data)
    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})
    return {"success": True, **result}


@app.get("/model-info")
def model_info():
    metrics_path = os.path.join(SAVED_MODELS_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Model metrics not found. Train first.")
    with open(metrics_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"success": True, **data}


@app.get("/locations")
def locations():
    global _location_stats
    if _location_stats is not None:
        return {"success": True, "locations": _location_stats}

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
        return {"success": True, "locations": _location_stats}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.get("/dataset-charts")
def dataset_charts(location: str = None, min_price: float = None, max_price: float = None):
    try:
        data = compute_charts_data(location=location, min_price=min_price, max_price=max_price)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retrain")
def retrain():
    global _location_stats
    try:
        best_name, metadata, _ = train_and_evaluate_all()
        _location_stats = None
        return {
            "success": True,
            "message": f"Retrained successfully. Best model: {best_name}",
            "retrained_model": best_name,
            "metrics": metadata["metrics"],
            "all_models_comparison": metadata["all_models_comparison"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

