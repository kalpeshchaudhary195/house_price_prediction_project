"""Application factory for House Price Prediction."""

import logging
from flask import Flask, jsonify, request
from flask_cors import CORS

from backend.config import TEMPLATES_DIR, STATIC_DIR, CORS_ORIGINS
from backend.app.database.connection import init_db
from backend.app.services.database_service import seed_training_history_from_metrics
from backend.app.routes.api import api_bp
from backend.app.routes.web import web_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("house_pricing")


def create_app() -> Flask:
    """Creates and configures the Flask application."""
    app = Flask(
        __name__,
        template_folder=str(TEMPLATES_DIR),
        static_folder=str(STATIC_DIR),
    )

    # Enable CORS for modern SPA frontend
    CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})

    # Initialize database tables and seed initial metrics
    try:
        init_db()
        seed_training_history_from_metrics()
    except Exception as e:
        logger.error("Database initialization error: %s", e)

    # Context processor for templates
    @app.context_processor
    def template_defaults():
        return {
            "ocean_options": ["NEAR BAY", "INLAND", "NEAR OCEAN", "1H OCEAN", "ISLAND"],
            "form": {},
            "errors": [],
        }

    # Register blueprints
    app.register_blueprint(api_bp)
    app.register_blueprint(web_bp)

    # Error handlers
    @app.errorhandler(404)
    def handle_404(e):
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": "API route not found"}), 404
        return jsonify({"error": "Page not found"}), 404

    @app.errorhandler(500)
    def handle_500(e):
        logger.error("Internal Server Error: %s", e)
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": "Internal server error"}), 500
        return jsonify({"error": "An unexpected server error occurred."}), 500

    return app

