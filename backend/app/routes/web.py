"""Web route handler serving HTML templates, static files, and the React frontend SPA."""

import os
from pathlib import Path
from flask import Blueprint, render_template, send_from_directory, redirect, url_for, request, jsonify, abort

from backend.config import TEMPLATES_DIR, STATIC_DIR, CSS_DIR, JS_DIR, FRONTEND_DIST_DIR
from backend.ml.predict import predict_price
from backend.app.services.database_service import save_prediction_record

web_bp = Blueprint("web", __name__)

PAGES = {
    "home", "prediction", "login", "signup", "forgot-password",
    "profile", "about", "features", "feedback", "contact", "privacy", "terms", "model-performance"
}


@web_bp.route("/css/<path:filename>")
def serve_css(filename):
    return send_from_directory(str(CSS_DIR), filename)


@web_bp.route("/js/<path:filename>")
def serve_js(filename):
    return send_from_directory(str(JS_DIR), filename)


@web_bp.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(str(STATIC_DIR), filename)


@web_bp.route("/assets/<path:filename>")
def serve_dist_assets(filename):
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        return send_from_directory(str(assets_dir), filename)
    abort(404)


@web_bp.route("/<name>.html", methods=["GET", "POST"])
def page(name):
    """Legacy HTML page routing with backward-compatible template rendering."""
    if name not in PAGES:
        abort(404)
    if request.method == "POST":
        return redirect(url_for("web.page", name=name), code=303)
    if name == "prediction" and not request.args:
        return redirect(url_for("web.page", name="home", _anchor="predict-section"))

    template_file = f"{name}.html"
    if (TEMPLATES_DIR / template_file).exists():
        return render_template(template_file)
    abort(404)


@web_bp.route("/predict", methods=["POST"])
def legacy_predict():
    """Form submission endpoint for HTML templates, running real ML prediction."""
    data = request.form.to_dict()
    res, errors = predict_price(data)

    if errors:
        return render_template("home.html", errors=errors, form=data), 400

    features = res["input_features"]
    price = res["predicted_price"]
    low = res["range_low"]
    high = res["range_high"]

    # Save to database
    save_prediction_record(
        location=f"{features['ocean_proximity']}, CA",
        property_type="Single Family Home",
        bedrooms=features["average_bedrooms"],
        bathrooms=max(1.0, round(features["average_bedrooms"] * 1.1, 1)),
        area_sqft=round(features["average_rooms"] * 380.0, 1),
        input_features=res["model_row"],
        predicted_price=price,
        model_name=res["model_name"],
    )

    result_payload = {
        "price": f"${price:,.0f}",
        "low": f"${low:,.0f}" if low is not None else None,
        "high": f"${high:,.0f}" if high is not None else None,
        "confidence": res["confidence"],
        "location": f"{features['latitude']:.2f}, {features['longitude']:.2f}",
        "house_age": f"{features['house_age']:g} years",
        "rooms": f"{features['average_rooms']:g}",
        "bedrooms": f"{features['average_bedrooms']:g}",
        "population": f"{features['population']:,.0f}",
        "occupancy": f"{features['average_occupancy']:g}",
        "ocean": features["ocean_proximity"],
    }
    return render_template("prediction.html", r=result_payload)


@web_bp.route("/", defaults={"path": ""})
@web_bp.route("/<path:path>")
def serve_spa_or_templates(path):
    """Serves built React SPA if available, or redirects to home.html."""
    dist_index = FRONTEND_DIST_DIR / "index.html"
    if dist_index.exists():
        # If path looks like a static asset inside dist
        target_file = FRONTEND_DIST_DIR / path
        if path and target_file.exists() and not target_file.is_dir():
            return send_from_directory(str(FRONTEND_DIST_DIR), path)
        return send_from_directory(str(FRONTEND_DIST_DIR), "index.html")

    # Otherwise fallback to template home.html
    return redirect(url_for("web.page", name="home"))

