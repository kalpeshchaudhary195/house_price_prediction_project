"""Prediction History & Export Blueprint.

Supports querying historical predictions with search, filters, sorting,
pagination, CSV export streaming, and on-demand PDF report generation.
"""

import csv
from io import StringIO
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, Response, send_file
from sqlalchemy import or_, desc, asc
from database.db import db_session
from database.models import HousePrice, PredictionHistory
from ml.predict import format_inr, format_inr_exact
from reports.pdf_generator import generate_property_pdf

history_bp = Blueprint("history", __name__)

@history_bp.route("/api/predictions", methods=["GET"])
def get_predictions():
    """Query predictions with search, filters, sorting, and pagination."""
    db = db_session()
    try:
        search = request.args.get("search", "").strip()
        city = request.args.get("city", "").strip()
        property_type = request.args.get("property_type", "").strip()
        sort_by = request.args.get("sort_by", "date_desc").strip()
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, max(5, int(request.args.get("per_page", 10))))

        query = db.query(HousePrice)

        # Filters
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    HousePrice.city.ilike(search_pattern),
                    HousePrice.locality.ilike(search_pattern),
                    HousePrice.state.ilike(search_pattern),
                    HousePrice.property_type.ilike(search_pattern)
                )
            )

        if city:
            query = query.filter(HousePrice.city == city)

        if property_type:
            query = query.filter(HousePrice.property_type == property_type)

        # Sorting
        if sort_by == "date_asc":
            query = query.order_by(asc(HousePrice.prediction_date))
        elif sort_by == "price_desc":
            query = query.order_by(desc(HousePrice.predicted_price))
        elif sort_by == "price_asc":
            query = query.order_by(asc(HousePrice.predicted_price))
        else: # date_desc default
            query = query.order_by(desc(HousePrice.prediction_date))

        total_records = query.count()
        total_pages = max(1, (total_records + per_page - 1) // per_page)

        records = query.offset((page - 1) * per_page).limit(per_page).all()

        items = []
        for r in records:
            d = r.to_dict()
            d["predicted_price_formatted"] = format_inr(r.predicted_price)
            d["predicted_price_exact"] = format_inr_exact(r.predicted_price)
            d["formatted_date"] = r.prediction_date.strftime("%d %b %Y, %I:%M %p")
            items.append(d)

        return jsonify({
            "success": True,
            "data": items,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_records": total_records,
                "total_pages": total_pages,
                "has_prev": page > 1,
                "has_next": page < total_pages
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Query error: {str(e)}"}), 500


@history_bp.route("/api/predictions/<int:id>", methods=["GET"])
def get_prediction_detail(id):
    """Retrieve full details of a specific prediction."""
    db = db_session()
    record = db.get(HousePrice, id)
    if not record:
        return jsonify({"success": False, "message": "Prediction record not found"}), 404

    d = record.to_dict()
    d["predicted_price_formatted"] = format_inr(record.predicted_price)
    d["predicted_price_exact"] = format_inr_exact(record.predicted_price)
    d["formatted_date"] = record.prediction_date.strftime("%d %b %Y, %I:%M %p")
    sqft_rate = record.predicted_price / max(1.0, record.area_sqft)
    d["price_per_sqft_formatted"] = f"₹ {sqft_rate:,.0f} / sq.ft."
    d["lower_bound_formatted"] = format_inr(record.predicted_price * 0.935)
    d["upper_bound_formatted"] = format_inr(record.predicted_price * 1.065)

    return jsonify({"success": True, "data": d}), 200


@history_bp.route("/api/predictions/<int:id>", methods=["DELETE"])
def delete_prediction(id):
    """Delete a prediction record upon explicit user action."""
    db = db_session()
    try:
        record = db.get(HousePrice, id)
        if not record:
            return jsonify({"success": False, "message": "Record not found"}), 404

        db.delete(record)
        db.commit()
        return jsonify({"success": True, "message": f"Prediction #{id} deleted successfully."}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"success": False, "message": f"Delete error: {str(e)}"}), 500


@history_bp.route("/api/predictions/export/csv", methods=["GET"])
def export_csv():
    """Export all property predictions as a downloadable CSV."""
    db = db_session()
    try:
        records = db.query(HousePrice).order_by(desc(HousePrice.prediction_date)).all()

        si = StringIO()
        writer = csv.writer(si)
        writer.writerow([
            "Prediction_ID", "City", "Locality", "State", "Area_SqFt",
            "Bedrooms", "Bathrooms", "Floors", "Parking", "Property_Age",
            "Furnishing_Status", "Property_Type", "Predicted_Price_INR",
            "ML_Model", "Prediction_Date"
        ])

        for r in records:
            writer.writerow([
                r.id, r.city, r.locality, r.state, r.area_sqft,
                r.bedrooms, r.bathrooms, r.floors, r.parking, r.property_age,
                r.furnishing_status, r.property_type, r.predicted_price,
                r.model_name, r.prediction_date.strftime("%Y-%m-%d %H:%M:%S")
            ])

        output = si.getvalue()
        filename = f"house_predictions_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            output,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return jsonify({"success": False, "message": f"CSV export error: {str(e)}"}), 500


@history_bp.route("/api/predictions/<int:id>/pdf", methods=["GET"])
def export_pdf(id):
    """Generate and stream a professional PDF valuation report for prediction ID."""
    db = db_session()
    try:
        record = db.get(HousePrice, id)
        if not record:
            return jsonify({"success": False, "message": "Record not found"}), 404

        sqft_rate = record.predicted_price / max(1.0, record.area_sqft)
        pred_dict = {
            "id": record.id,
            "city": record.city,
            "locality": record.locality,
            "state": record.state,
            "area_sqft": record.area_sqft,
            "bedrooms": record.bedrooms,
            "bathrooms": record.bathrooms,
            "floors": record.floors,
            "parking": record.parking,
            "property_age": record.property_age,
            "furnishing_status": record.furnishing_status,
            "property_type": record.property_type,
            "predicted_price": record.predicted_price,
            "predicted_price_formatted": format_inr(record.predicted_price),
            "predicted_price_exact": format_inr_exact(record.predicted_price),
            "price_per_sqft_formatted": f"Rs. {sqft_rate:,.0f} / sq.ft.",
            "lower_bound_formatted": format_inr(record.predicted_price * 0.935),
            "upper_bound_formatted": format_inr(record.predicted_price * 1.065),
            "model_name": record.model_name,
            "prediction_date": record.prediction_date.strftime("%d %b %Y, %I:%M %p"),
            "key_drivers": [
                f"Prime real estate valuation zone: {record.locality}, {record.city}",
                f"{record.bedrooms} BHK residential configuration ({record.property_type})",
                f"{record.furnishing_status} interior condition adjustment",
                f"Dedicated parking ({record.parking} vehicle spaces) & {record.floors}th floor specification"
            ]
        }

        pdf_buffer = generate_property_pdf(pred_dict)
        filename = f"Property_Valuation_Report_{record.city}_{record.id}.pdf"

        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return jsonify({"success": False, "message": f"PDF generation error: {str(e)}"}), 500
