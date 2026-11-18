"""Automated test suite for House Price Prediction REST API and ML pipeline."""

import pytest
from backend.app import create_app
from backend.ml.preprocessing import validate_and_parse_input, convert_to_model_row
from backend.ml.predict import predict_price


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    """Verifies that /api/health responds with healthy status and model flag."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] in ("healthy", "degraded")
    assert data["model_loaded"] is True
    assert "database" in data


def test_model_info_endpoint(client):
    """Verifies /api/model-info returns best model and evaluation metrics."""
    res = client.get("/api/model-info")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "Random Forest" in data["best_model"]
    assert data["metrics"]["r2_score"] > 0.75
    assert "all_models_comparison" in data
    assert len(data["all_models_comparison"]) == 5


def test_locations_endpoint(client):
    """Verifies /api/locations returns dataset-based location stats."""
    res = client.get("/api/locations")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["locations"]) >= 5
    first_loc = data["locations"][0]
    assert "value" in first_loc
    assert "avg_price" in first_loc


def test_predict_endpoint_valid(client):
    """Verifies POST /api/predict produces genuine numeric valuation."""
    payload = {
        "MedInc": 4.5,
        "HouseAge": 25.0,
        "AveRooms": 5.2,
        "AveBedrms": 1.1,
        "Population": 1200.0,
        "AveOccup": 3.0,
        "Latitude": 37.88,
        "Longitude": -122.23,
        "OceanProximity": "NEAR BAY",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["predicted_price"] > 50000.0
    assert data["range_low"] is not None
    assert data["range_high"] is not None
    assert data["confidence"] in ("High", "Medium", "Moderate", "Low")
    assert data["prediction_id"] is not None


def test_predict_endpoint_invalid_values(client):
    """Verifies POST /api/predict rejects out-of-range coordinates or impossible ratios."""
    payload = {
        "MedInc": 4.5,
        "HouseAge": 25.0,
        "AveRooms": 3.0,
        "AveBedrms": 5.0,  # Bedrooms > Rooms
        "Population": 1200.0,
        "AveOccup": 3.0,
        "Latitude": 10.0,  # Outside California
        "Longitude": -122.23,
        "OceanProximity": "NEAR BAY",
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert len(data["errors"]) >= 2


def test_predictions_history_endpoint(client):
    """Verifies GET /api/predictions retrieves previously saved records."""
    res = client.get("/api/predictions?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert isinstance(data["predictions"], list)

