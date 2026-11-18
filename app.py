"""House Price Prediction & Real Estate Analytics Web Application.

Full-stack application powered by Python Flask, PostgreSQL (SQLAlchemy),
and Scikit-learn multi-model regression.
"""

import os
import sys
from flask import Flask, render_template, jsonify, session, redirect, url_for
from sqlalchemy import text

# Ensure base directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from config import Config
from database.db import db_session, engine
from database.init_db import init_database
from routes.auth import auth_bp
from routes.prediction import prediction_bp
from routes.dashboard import dashboard_bp
from routes.history import history_bp
from routes.analytics import analytics_bp
from routes.properties import properties_bp

def create_app():
    """Application factory for Flask."""
    app = Flask(
        __name__,
        template_folder=os.path.join(BASE_DIR, "templates"),
        static_folder=os.path.join(BASE_DIR, "static"),
        static_url_path="/static"
    )

    app.config.from_object(Config)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(properties_bp)

    # Database Session Teardown
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    # Template Context Processor for current user session
    @app.context_processor
    def inject_user():
        return {
            "current_user": {
                "id": session.get("user_id"),
                "name": session.get("user_name"),
                "email": session.get("user_email"),
                "role": session.get("user_role", "user")
            }
        }

    # ================= HTML Page Routes =================
    @app.route("/")
    @app.route("/home")
    def page_home():
        return render_template("home.html")

    @app.route("/dashboard")
    def page_dashboard():
        return render_template("dashboard.html")

    @app.route("/predict")
    def page_prediction():
        return render_template("prediction.html")

    @app.route("/analytics")
    def page_analytics():
        return render_template("analytics.html")

    @app.route("/history")
    def page_history():
        return render_template("history.html")

    @app.route("/compare")
    @app.route("/compare-houses")
    def page_compare_houses():
        return render_template("compare_houses.html")

    @app.route("/compare-cities")
    def page_compare_cities():
        return render_template("compare_cities.html")

    @app.route("/location-intelligence")
    def page_location_intelligence():
        return render_template("location_intelligence.html")

    @app.route("/profile")
    def page_profile():
        return render_template("profile.html")

    @app.route("/login")
    def page_login():
        if session.get("user_id"):
            return redirect(url_for("page_dashboard"))
        return render_template("login.html")

    @app.route("/signup")
    def page_signup():
        if session.get("user_id"):
            return redirect(url_for("page_dashboard"))
        return render_template("signup.html")

    # Informational Pages (Preserved)
    @app.route("/about")
    def page_about():
        return render_template("about.html")

    @app.route("/contact")
    def page_contact():
        return render_template("contact.html")

    @app.route("/features")
    def page_features():
        return render_template("features.html")

    @app.route("/feedback")
    def page_feedback():
        return render_template("feedback.html")

    @app.route("/privacy")
    def page_privacy():
        return render_template("privacy.html")

    @app.route("/terms")
    def page_terms():
        return render_template("terms.html")

    # ================= System Health Endpoint =================
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_ok = False
        db_msg = "Disconnected"
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                db_ok = True
                db_msg = "Connected (PostgreSQL)"
        except Exception as e:
            db_msg = str(e)

        model_path = os.path.join(Config.ARTIFACTS_DIR, "best_model.joblib")
        model_ok = os.path.exists(model_path)

        return jsonify({
            "status": "healthy" if db_ok and model_ok else "degraded",
            "database": {
                "connected": db_ok,
                "message": db_msg,
                "database_name": Config.DB_NAME
            },
            "machine_learning": {
                "model_loaded": model_ok,
                "artifact_path": model_path
            },
            "environment": Config.FLASK_ENV
        }), 200 if db_ok and model_ok else 503

    return app

app = create_app()

if __name__ == "__main__":
    # Ensure database is initialized before starting server
    try:
        init_database()
    except Exception as err:
        print(f"Warning during init_database: {err}")

    print(f"Starting PropValuate AI Server on http://{Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
