"""Configuration settings for House Price Prediction application."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
load_dotenv(ROOT_DIR / ".env")

PORT = int(os.getenv("PORT", "5000"))
HOST = os.getenv("HOST", "0.0.0.0")
DEBUG = os.getenv("DEBUG", "true").lower() in ("1", "true", "yes")

# CORS allowed origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "*",
]

# Database settings
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Directory paths
TEMPLATES_DIR = ROOT_DIR / "templates"
STATIC_DIR = ROOT_DIR / "static"
CSS_DIR = ROOT_DIR / "css"
JS_DIR = ROOT_DIR / "js"
FRONTEND_DIST_DIR = ROOT_DIR / "frontend" / "dist"
if not FRONTEND_DIST_DIR.exists():
    FRONTEND_DIST_DIR = ROOT_DIR / "react-app" / "dist"

DATASET_PATH = ROOT_DIR / "dataset" / "housing.csv"
if not DATASET_PATH.exists():
    DATASET_PATH = ROOT_DIR / "housing.csv"

ML_DIR = BASE_DIR / "ml"
SAVED_MODELS_DIR = ML_DIR / "saved_models"

