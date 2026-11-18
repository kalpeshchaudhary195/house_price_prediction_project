import os
from dotenv import load_dotenv

# Load environment variables from .env file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "house_price_prediction_secret_key_2026_adani")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    PORT = int(os.getenv("PORT", 5000))
    HOST = os.getenv("HOST", "127.0.0.1")
    DEBUG = os.getenv("FLASK_ENV", "development") == "development"
    
    # PostgreSQL Configuration
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "house_price_prediction_db")
    
    # Construct SQLAlchemy Database URI
    pwd_part = f":{DB_PASSWORD}" if DB_PASSWORD else ""
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg2://{DB_USER}{pwd_part}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
    }
    
    # ML & File Paths
    DATA_PATH = os.path.join(BASE_DIR, "data", "house_prices.csv")
    ARTIFACTS_DIR = os.path.join(BASE_DIR, "ml", "artifacts")
    REPORTS_DIR = os.path.join(BASE_DIR, "reports")
