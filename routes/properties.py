"""Properties Catalog Blueprint.

Provides endpoints to query property listings with city, BHK, and price filters.
"""

from flask import Blueprint, request, jsonify, render_template
from sqlalchemy import desc
from database.db import db_session
from database.models import HousePrice
from ml.predict import format_inr, format_inr_exact

properties_bp = Blueprint("properties", __name__)

FEATURED_PROPERTY_IMAGES = {
    "Ahmedabad": [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    ],
    "Mumbai": [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    ],
    "Bangalore": [
        "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
    ],
    "Pune": [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    ],
    "Delhi": [
        "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=800&q=80",
    ]
}

DEFAULT_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"

@properties_bp.route("/properties")
def page_properties():
    """Render the properties showcase page."""
    return render_template("properties.html")

@properties_bp.route("/api/properties", methods=["GET"])
def get_properties():
    """Return filtered property listings from PostgreSQL."""
    db = db_session()
    city = request.args.get("city", "").strip()
    property_type = request.args.get("property_type", "").strip()
    bedrooms = request.args.get("bedrooms", "").strip()
    limit = min(50, max(6, int(request.args.get("limit", 18))))

    query = db.query(HousePrice)
    if city:
        query = query.filter(HousePrice.city == city)
    if property_type:
        query = query.filter(HousePrice.property_type == property_type)
    if bedrooms:
        try:
            query = query.filter(HousePrice.bedrooms == int(bedrooms))
        except ValueError:
            pass

    records = query.order_by(desc(HousePrice.id)).limit(limit).all()

    items = []
    for idx, r in enumerate(records):
        city_imgs = FEATURED_PROPERTY_IMAGES.get(r.city, [DEFAULT_IMAGE])
        img_url = city_imgs[idx % len(city_imgs)]

        items.append({
            "id": r.id,
            "city": r.city,
            "locality": r.locality,
            "state": r.state,
            "area_sqft": r.area_sqft,
            "bedrooms": r.bedrooms,
            "bathrooms": r.bathrooms,
            "property_type": r.property_type,
            "furnishing_status": r.furnishing_status,
            "predicted_price_formatted": format_inr(r.predicted_price),
            "predicted_price_exact": format_inr_exact(r.predicted_price),
            "price_per_sqft": f"₹ {round(r.predicted_price / max(1.0, r.area_sqft)):,}/sq.ft.",
            "image_url": img_url
        })

    return jsonify({"success": True, "data": items}), 200

