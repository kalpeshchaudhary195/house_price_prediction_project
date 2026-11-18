"""End-to-End Application & API Test Suite.

Tests database models, machine learning predictions, all REST API endpoints,
properties catalogue, session authentication, CSV export, and PDF generation.
"""

import os
import sys
import json
import pytest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app
from database.db import db_session
from database.models import User, HousePrice, PredictionHistory
from ml.predict import predict_price

@pytest.fixture(scope="module")
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test /api/health endpoint returns 200 and healthy status."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["database"]["connected"] is True
    assert data["machine_learning"]["model_loaded"] is True

def test_locations_endpoint(client):
    """Test /api/locations returns Ahmedabad, Bopal, Gujarat as primary."""
    res = client.get("/api/locations")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "Ahmedabad" in data["cities"]
    assert "Bopal" in data["cities"]["Ahmedabad"]["localities"]
    assert data["cities"]["Ahmedabad"]["state"] == "Gujarat"

def test_properties_catalog_endpoint(client):
    """Test /api/properties returns property cards with valid prices and images."""
    res = client.get("/api/properties?city=Ahmedabad&limit=6")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]) > 0
    first = data["data"][0]
    assert "predicted_price_formatted" in first
    assert "image_url" in first

def test_ml_prediction_direct():
    """Test the direct Python ML prediction service for Ahmedabad Bopal."""
    payload = {
        "city": "Ahmedabad",
        "locality": "Bopal",
        "state": "Gujarat",
        "area_sqft": 1350,
        "bedrooms": 3,
        "bathrooms": 2,
        "floors": 4,
        "parking": 1,
        "property_age": 2,
        "furnishing_status": "Semi-Furnished",
        "property_type": "Apartment"
    }
    result = predict_price(payload)
    assert result["predicted_price"] > 1000000
    assert "Cr" in result["predicted_price_formatted"] or "Lakh" in result["predicted_price_formatted"]
    assert result["lower_bound"] < result["predicted_price"] < result["upper_bound"]
    assert result["confidence_score"] >= 80

def test_predict_api_valid(client):
    """Test /api/predict saves to PostgreSQL and returns valuation with confidence."""
    payload = {
        "city": "Ahmedabad",
        "locality": "Bopal",
        "state": "Gujarat",
        "area_sqft": 1500,
        "bedrooms": 3,
        "bathrooms": 3,
        "floors": 5,
        "parking": 2,
        "property_age": 1,
        "furnishing_status": "Furnished",
        "property_type": "Apartment"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    assert "id" in json_data["data"]
    assert "confidence_rating" in json_data["data"]
    assert json_data["data"]["predicted_price"] > 1000000

def test_predict_api_validation_error(client):
    """Test /api/predict rejects invalid area and bedrooms."""
    payload = {
        "city": "Ahmedabad",
        "locality": "Bopal",
        "state": "Gujarat",
        "area_sqft": 20, # Too small
        "bedrooms": 0,   # Invalid
        "bathrooms": 1,
        "floors": 1,
        "parking": 0,
        "property_age": 0,
        "furnishing_status": "Furnished",
        "property_type": "Apartment"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 422
    data = res.get_json()
    assert data["success"] is False
    assert len(data["errors"]) > 0

def test_dashboard_stats_endpoint(client):
    """Test /api/dashboard/stats returns real aggregations."""
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    stats = data["stats"]
    assert stats["total_properties"] > 0
    assert stats["total_predictions"] > 0
    assert stats["avg_price"] > 0

def test_history_and_pagination(client):
    """Test /api/predictions supports search and pagination."""
    res = client.get("/api/predictions?page=1&per_page=5&sort_by=price_desc")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["data"]) <= 5
    assert data["pagination"]["total_records"] > 0

def test_csv_export(client):
    """Test /api/predictions/export/csv returns valid CSV download."""
    res = client.get("/api/predictions/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.content_type
    assert b"Prediction_ID,City,Locality" in res.data

def test_pdf_report_generation(client):
    """Test /api/predictions/<id>/pdf returns generated PDF stream."""
    history_res = client.get("/api/predictions?page=1&per_page=1")
    items = history_res.get_json()["data"]
    assert len(items) > 0
    record_id = items[0]["id"]

    pdf_res = client.get(f"/api/predictions/{record_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.content_type == "application/pdf"
    assert len(pdf_res.data) > 1000

def test_analytics_charts_endpoint(client):
    """Test /api/analytics/charts returns all 12 chart datasets."""
    res = client.get("/api/analytics/charts")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    charts = data["data"]
    # 1. City prices
    assert len(charts["city_prices"]["labels"]) > 0
    # 2. Locality prices (Ahmedabad)
    assert len(charts["locality_prices_ahmedabad"]["labels"]) > 0
    # 3. Area vs price
    assert len(charts["area_vs_price"]) > 0
    # 4. Bedroom prices
    assert len(charts["bedroom_prices"]["labels"]) > 0
    # 5. Property types
    assert len(charts["property_types"]["labels"]) > 0
    # 6. Monthly trends
    assert len(charts["monthly_trend"]["labels"]) > 0
    # 7. Actual vs predicted
    assert len(charts["actual_vs_predicted"]) > 0
    # 8. Model comparison (5 models)
    assert len(charts["model_comparison"]) == 5
    # 9. Feature importances
    assert len(charts["feature_importances"]) > 0
    # 10. Price per sq.ft.
    assert len(charts["price_per_sqft"]["labels"]) > 0
    # 11. Radar benchmark
    assert "Ahmedabad" in charts["radar_benchmark"]
    # 12. Property age vs price
    assert len(charts["age_vs_price"]["labels"]) > 0

def test_location_intelligence_endpoint(client):
    """Test /api/location-intelligence returns metrics for Ahmedabad, Bopal."""
    res = client.get("/api/location-intelligence?city=Ahmedabad&locality=Bopal")
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    assert json_data["city"] == "Ahmedabad"
    assert json_data["locality"] == "Bopal"
    assert "city_summary" in json_data
    assert "selected_locality" in json_data
    assert "amenities" in json_data
    assert "localities" in json_data
    assert len(json_data["localities"]) > 0

def test_compare_cities_endpoint(client):
    """Test /api/compare-cities returns comparative metrics for selected cities."""
    res = client.get("/api/compare-cities?cities=Ahmedabad,Surat,Mumbai")
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["success"] is True
    assert len(json_data["cities"]) >= 2
    city_names = [c["city"] for c in json_data["cities"]]
    assert "Ahmedabad" in city_names
    assert "Surat" in city_names

def test_about_page_sections(client):
    """Test /about page has all required sections and content."""
    res = client.get("/about")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    assert "About House Price Prediction AI" in html
    assert "Project Objectives" in html
    assert "Technology Stack" in html
    assert "How It Works" in html
    assert "Gradient Boosting" in html
    assert "Adani University" in html

def test_html_pages_rendering(client):
    """Test all Jinja2 HTML page routes render successfully (HTTP 200)."""
    endpoints = [
        "/",
        "/home",
        "/dashboard",
        "/predict",
        "/properties",
        "/analytics",
        "/history",
        "/compare",
        "/compare-houses",
        "/compare-cities",
        "/location-intelligence",
        "/profile",
        "/login",
        "/signup",
        "/about",
        "/features",
        "/contact",
        "/privacy",
        "/terms"
    ]
    for url in endpoints:
        res = client.get(url)
        assert res.status_code in [200, 302], f"Failed rendering {url}"

def test_user_authentication_flow(client):
    """Test registering a new user and logging in."""
    import time
    unique_email = f"upgrade_tester_{int(time.time())}@example.com"
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Kalpesh Upgrade",
        "email": unique_email,
        "password": "Password123!"
    })
    assert reg_res.status_code == 201

    login_res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert login_data["success"] is True
    assert login_data["user"]["email"] == unique_email
