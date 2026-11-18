"""Analytics & Visualizations Blueprint.

Provides aggregate real-estate metrics, model evaluation benchmarks,
Location Intelligence data, and City Comparison data for 12 Chart.js visualizations.
"""

import os
import json
from flask import Blueprint, jsonify, request
from sqlalchemy import func
from database.db import db_session
from database.models import HousePrice
from config import Config
from ml.predict import format_inr, format_inr_exact

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/api/analytics/charts", methods=["GET"])
def get_charts_data():
    """Return aggregated data for all 12 Chart.js visualizations."""
    db = db_session()
    try:
        # 1. City-wise average price (in Lakhs)
        city_rows = (
            db.query(
                HousePrice.city,
                func.avg(HousePrice.predicted_price).label("avg_price"),
                func.count(HousePrice.id).label("count")
            )
            .group_by(HousePrice.city)
            .order_by(func.avg(HousePrice.predicted_price).desc())
            .all()
        )
        city_labels = [r[0] for r in city_rows]
        city_avg_lakhs = [round(float(r[1]) / 100000.0, 2) for r in city_rows]

        # 2. Locality-wise pricing for Ahmedabad (highlighting Bopal!)
        ahmedabad_locality_rows = (
            db.query(
                HousePrice.locality,
                func.avg(HousePrice.predicted_price).label("avg_price"),
                func.count(HousePrice.id).label("count")
            )
            .filter(HousePrice.city == "Ahmedabad")
            .group_by(HousePrice.locality)
            .order_by(func.avg(HousePrice.predicted_price).desc())
            .all()
        )
        ahmedabad_loc_labels = [r[0] for r in ahmedabad_locality_rows]
        ahmedabad_loc_avg_lakhs = [round(float(r[1]) / 100000.0, 2) for r in ahmedabad_locality_rows]

        # 3. Area vs Price (sample points for scatter plot)
        scatter_rows = (
            db.query(HousePrice.area_sqft, HousePrice.predicted_price, HousePrice.city, HousePrice.locality)
            .order_by(func.random())
            .limit(100)
            .all()
        )
        scatter_points = [
            {
                "x": round(float(r[0]), 0),
                "y": round(float(r[1]) / 100000.0, 2), # In Lakhs
                "city": r[2],
                "locality": r[3]
            }
            for r in scatter_rows
        ]

        # 4. Bedroom-wise average price
        bhk_rows = (
            db.query(
                HousePrice.bedrooms,
                func.avg(HousePrice.predicted_price).label("avg_price"),
                func.count(HousePrice.id).label("count")
            )
            .group_by(HousePrice.bedrooms)
            .order_by(HousePrice.bedrooms.asc())
            .all()
        )
        bhk_labels = [f"{r[0]} BHK" for r in bhk_rows]
        bhk_avg_lakhs = [round(float(r[1]) / 100000.0, 2) for r in bhk_rows]

        # 5. Property type distribution
        type_rows = (
            db.query(
                HousePrice.property_type,
                func.count(HousePrice.id).label("count")
            )
            .group_by(HousePrice.property_type)
            .order_by(func.count(HousePrice.id).desc())
            .all()
        )
        type_labels = [r[0] for r in type_rows]
        type_counts = [int(r[1]) for r in type_rows]

        # 10. Price per sq.ft. comparison across top cities and Ahmedabad localities
        rate_city_rows = (
            db.query(
                HousePrice.city,
                func.avg(HousePrice.predicted_price / func.greatest(HousePrice.area_sqft, 100)).label("avg_rate")
            )
            .group_by(HousePrice.city)
            .order_by(func.avg(HousePrice.predicted_price / func.greatest(HousePrice.area_sqft, 100)).desc())
            .all()
        )
        rate_labels = [r[0] for r in rate_city_rows]
        rate_values = [round(float(r[1]), 0) for r in rate_city_rows]

        # 11. City-to-city multi-metric radar benchmark
        # Metrics: [Price Index, Space Index, Affordability Index, Growth Rate, Demand Index]
        radar_benchmark = {
            "categories": ["Avg Price Index", "Space per Rupee", "Affordability Score", "Annual Appreciation", "Rental Yield Demand"],
            "Ahmedabad": [65, 88, 85, 82, 80],
            "Mumbai": [95, 35, 40, 75, 92],
            "Bangalore": [80, 70, 68, 88, 89],
            "Pune": [72, 75, 74, 80, 84],
            "Surat": [58, 90, 89, 78, 76]
        }

        # 12. Property Age vs Predicted Price trend
        age_rows = (
            db.query(
                HousePrice.property_age,
                func.avg(HousePrice.predicted_price).label("avg_price"),
                func.count(HousePrice.id).label("count")
            )
            .group_by(HousePrice.property_age)
            .order_by(HousePrice.property_age.asc())
            .all()
        )
        age_labels = [f"{r[0]} yrs" if r[0] > 0 else "New (0 yr)" for r in age_rows]
        age_avg_lakhs = [round(float(r[1]) / 100000.0, 2) for r in age_rows]

        # Load Metrics & Distributions from metrics.json
        metrics_file = os.path.join(Config.ARTIFACTS_DIR, "metrics.json")
        model_comparison = {}
        actual_vs_pred = []
        feature_importances = []
        price_histogram = {}
        monthly_trend = {}

        if os.path.exists(metrics_file):
            with open(metrics_file, "r", encoding="utf-8") as f:
                ml_data = json.load(f)
                model_comparison = ml_data.get("all_models_comparison", {})
                feature_importances = ml_data.get("feature_importances", [])
                price_histogram = ml_data.get("price_histogram", {})
                monthly_trend = ml_data.get("monthly_trend", {})

                raw_avp = ml_data.get("actual_vs_predicted_sample", [])
                actual_vs_pred = [
                    {
                        "x": round(p["actual"] / 100000.0, 2),
                        "y": round(p["predicted"] / 100000.0, 2),
                        "city": p.get("city", ""),
                        "locality": p.get("locality", "")
                    }
                    for p in raw_avp
                ]

        return jsonify({
            "success": True,
            "data": {
                # 1. City-wise average price
                "city_prices": {
                    "labels": city_labels,
                    "avg_price_lakhs": city_avg_lakhs
                },
                # 2. Locality-wise pricing (Ahmedabad default)
                "locality_prices_ahmedabad": {
                    "labels": ahmedabad_loc_labels,
                    "avg_price_lakhs": ahmedabad_loc_avg_lakhs
                },
                # 3. Area vs Price
                "area_vs_price": scatter_points,
                # 4. Bedrooms vs Price
                "bedroom_prices": {
                    "labels": bhk_labels,
                    "avg_price_lakhs": bhk_avg_lakhs
                },
                # 5. Property type distribution
                "property_types": {
                    "labels": type_labels,
                    "counts": type_counts
                },
                # 6. Monthly trends
                "monthly_trend": monthly_trend,
                # 7. Actual vs predicted
                "actual_vs_predicted": actual_vs_pred,
                # 8. ML model comparison
                "model_comparison": model_comparison,
                # 9. Feature importances
                "feature_importances": feature_importances,
                # 10. Price per sq.ft.
                "price_per_sqft": {
                    "labels": rate_labels,
                    "rates": rate_values
                },
                # 11. City-to-city radar
                "radar_benchmark": radar_benchmark,
                # 12. Property Age vs Price
                "age_vs_price": {
                    "labels": age_labels,
                    "avg_price_lakhs": age_avg_lakhs
                },
                "price_histogram": price_histogram
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Analytics error: {str(e)}"}), 500


@analytics_bp.route("/api/location-intelligence", methods=["GET"])
def get_location_intelligence():
    """Return detailed Location Intelligence metrics for a selected city/locality."""
    db = db_session()
    try:
        city = request.args.get("city", "Ahmedabad").strip()
        locality = request.args.get("locality", "Bopal").strip()

        # Aggregate stats for the city
        city_stats = db.query(
            func.count(HousePrice.id).label("total_props"),
            func.avg(HousePrice.predicted_price).label("avg_price"),
            func.min(HousePrice.predicted_price).label("min_price"),
            func.max(HousePrice.predicted_price).label("max_price"),
            func.avg(HousePrice.predicted_price / func.greatest(HousePrice.area_sqft, 100)).label("avg_rate"),
            func.avg(HousePrice.area_sqft).label("avg_area")
        ).filter(HousePrice.city == city).first()

        # Locality breakdown in this city
        locality_rows = (
            db.query(
                HousePrice.locality,
                func.count(HousePrice.id).label("count"),
                func.avg(HousePrice.predicted_price).label("avg_price"),
                func.avg(HousePrice.predicted_price / func.greatest(HousePrice.area_sqft, 100)).label("avg_rate"),
                func.avg(HousePrice.area_sqft).label("avg_area")
            )
            .filter(HousePrice.city == city)
            .group_by(HousePrice.locality)
            .order_by(func.avg(HousePrice.predicted_price).desc())
            .all()
        )

        localities = []
        target_loc_data = None
        for r in locality_rows:
            loc_dict = {
                "locality": r[0],
                "count": r[1],
                "avg_price": round(float(r[2]), 2),
                "avg_price_formatted": format_inr(r[2]),
                "avg_rate_sqft": round(float(r[3]), 0),
                "avg_rate_formatted": f"₹ {round(float(r[3])):,}/sq.ft.",
                "avg_area_sqft": round(float(r[4]), 0),
                "is_active": (r[0].lower() == locality.lower())
            }
            localities.append(loc_dict)
            if r[0].lower() == locality.lower():
                target_loc_data = loc_dict

        # If specific locality was not matched in rows, use first or anchor
        if not target_loc_data and localities:
            target_loc_data = localities[0]

        # Preset infrastructure and growth metrics for top locations
        amenities_data = {
            "Ahmedabad": {
                "Bopal": {
                    "connectivity_score": 92,
                    "metro_status": "Phase 2 Connectivity underway via Thaltej-Bopal corridor",
                    "highway_access": "Direct access to S.P. Ring Road & SG Highway",
                    "schools_colleges": ["DPS Bopal", "Tulip International", "Adani University nearby"],
                    "healthcare": ["Krishna Heart & Super Speciality", "Zydus Hospital corridor"],
                    "appreciation_1yr": "+11.4%",
                    "demand_index": "Very High (88/100)",
                    "livability_rating": "4.6 / 5.0"
                },
                "Satellite": {
                    "connectivity_score": 95,
                    "metro_status": "Close to Jodhpur Gam / Shivranjani feeder",
                    "highway_access": "132 Feet Ring Road access",
                    "schools_colleges": ["Anand Niketan", "St. Kabir"],
                    "healthcare": ["Shalby Multi-specialty"],
                    "appreciation_1yr": "+9.2%",
                    "demand_index": "High (84/100)",
                    "livability_rating": "4.7 / 5.0"
                },
                "Prahlad Nagar": {
                    "connectivity_score": 96,
                    "metro_status": "Direct access to Corporate Road feeder",
                    "highway_access": "SG Highway arterial connection",
                    "schools_colleges": ["JG International", "Cosmos Castle"],
                    "healthcare": ["Zydus Hospital", "Saraswati"],
                    "appreciation_1yr": "+10.8%",
                    "demand_index": "High (86/100)",
                    "livability_rating": "4.8 / 5.0"
                }
            }
        }

        specific_amenity = amenities_data.get(city, {}).get(locality, {
            "connectivity_score": 85,
            "metro_status": "Rapid transit & arterial road coverage",
            "highway_access": "Access to major arterial roads",
            "schools_colleges": ["Top CBSE & State Board Institutions"],
            "healthcare": ["Multi-speciality clinics & hospital access"],
            "appreciation_1yr": "+8.5%",
            "demand_index": "Steady (80/100)",
            "livability_rating": "4.4 / 5.0"
        })

        return jsonify({
            "success": True,
            "city": city,
            "locality": locality,
            "city_summary": {
                "total_properties": city_stats[0] if city_stats else 0,
                "avg_price": round(float(city_stats[1]), 2) if city_stats and city_stats[1] else 0,
                "avg_price_formatted": format_inr(city_stats[1]) if city_stats and city_stats[1] else "₹ 0",
                "avg_rate_sqft": round(float(city_stats[4]), 0) if city_stats and city_stats[4] else 0,
                "avg_rate_formatted": f"₹ {round(float(city_stats[4])):,}/sq.ft." if city_stats and city_stats[4] else "₹ 0/sq.ft.",
                "avg_area_sqft": round(float(city_stats[5]), 0) if city_stats and city_stats[5] else 0
            },
            "selected_locality": target_loc_data,
            "localities": localities,
            "amenities": specific_amenity
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Location Intelligence error: {str(e)}"}), 500


@analytics_bp.route("/api/compare-cities", methods=["GET"])
def compare_cities():
    """Return comparative metrics for 2 or more cities."""
    db = db_session()
    try:
        cities_param = request.args.get("cities", "Ahmedabad,Mumbai,Bangalore,Pune,Surat")
        city_list = [c.strip() for c in cities_param.split(",") if c.strip()]
        if not city_list:
            city_list = ["Ahmedabad", "Surat"]

        results = []
        for city in city_list:
            stats = db.query(
                func.count(HousePrice.id).label("total"),
                func.avg(HousePrice.predicted_price).label("avg_price"),
                func.avg(HousePrice.predicted_price / func.greatest(HousePrice.area_sqft, 100)).label("avg_rate"),
                func.avg(HousePrice.area_sqft).label("avg_area"),
                func.avg(HousePrice.bedrooms).label("avg_bhk")
            ).filter(HousePrice.city == city).first()

            # Top locality in this city
            top_loc = (
                db.query(HousePrice.locality, func.count(HousePrice.id))
                .filter(HousePrice.city == city)
                .group_by(HousePrice.locality)
                .order_by(func.count(HousePrice.id).desc())
                .first()
            )

            # Property type breakdown
            type_rows = (
                db.query(HousePrice.property_type, func.count(HousePrice.id))
                .filter(HousePrice.city == city)
                .group_by(HousePrice.property_type)
                .all()
            )
            type_dist = {r[0]: r[1] for r in type_rows}

            avg_p = float(stats[1]) if stats and stats[1] else 0.0
            avg_r = float(stats[2]) if stats and stats[2] else 0.0
            avg_a = float(stats[3]) if stats and stats[3] else 0.0
            avg_b = float(stats[4]) if stats and stats[4] else 0.0

            results.append({
                "city": city,
                "total_records": stats[0] if stats else 0,
                "avg_price": round(avg_p, 2),
                "avg_price_formatted": format_inr(avg_p),
                "avg_rate_sqft": round(avg_r, 0),
                "avg_rate_formatted": f"₹ {round(avg_r):,}/sq.ft.",
                "avg_area_sqft": round(avg_a, 0),
                "avg_bhk": round(avg_b, 1),
                "top_locality": top_loc[0] if top_loc else "Central",
                "property_types": type_dist
            })

        return jsonify({
            "success": True,
            "cities": results
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"City comparison error: {str(e)}"}), 500
