"""Database Initialization & Migration Script.

Creates tables if they don't exist, ensures safe idempotent initialization,
seeds default users (admin and demo), and seeds initial benchmark property
records for dashboard analytics.
"""

import os
import sys
import pandas as pd
from datetime import datetime
from werkzeug.security import generate_password_hash

# Ensure project root is on path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from database.db import engine, db_session, Base
from database.models import User, HousePrice, PredictionHistory
from config import Config

def init_database():
    """Create all tables and seed initial data safely."""
    print("Connecting to PostgreSQL and creating tables if not exists...")
    Base.metadata.create_all(bind=engine)
    print("Tables verified / created successfully.")

    session = db_session()
    try:
        # 1. Seed Users if table is empty
        user_count = session.query(User).count()
        if user_count == 0:
            print("Seeding default users...")
            admin = User(
                full_name="Admin User",
                email="admin@houseprice.com",
                password_hash=generate_password_hash("Admin123!"),
                role="admin",
                created_at=datetime.utcnow()
            )
            demo = User(
                full_name="Kalpesh Demo",
                email="kalpesh@example.com",
                password_hash=generate_password_hash("Kalpesh123!"),
                role="user",
                created_at=datetime.utcnow()
            )
            session.add_all([admin, demo])
            session.commit()
            print("Default users seeded (admin@houseprice.com and kalpesh@example.com).")
        else:
            print(f"Users table already has {user_count} records.")

        # 2. Seed initial property records if table is empty
        prop_count = session.query(HousePrice).count()
        if prop_count == 0:
            csv_path = Config.DATA_PATH
            if os.path.exists(csv_path):
                print(f"Seeding initial property records from {csv_path}...")
                df = pd.read_csv(csv_path)
                # Seed first 120 properties for initial rich dashboard analytics
                seed_df = df.head(120)
                
                demo_user = session.query(User).filter_by(role="user").first()
                user_id = demo_user.id if demo_user else None

                for _, row in seed_df.iterrows():
                    actual = float(row["price"])
                    # Simulated initial predicted price with realistic slight variance
                    pred = round(actual * (1.0 + (float(row.name % 7 - 3) * 0.015)), -3)
                    
                    hp = HousePrice(
                        city=row["city"],
                        locality=row["locality"],
                        state=row["state"],
                        area_sqft=float(row["area_sqft"]),
                        bedrooms=int(row["bedrooms"]),
                        bathrooms=int(row["bathrooms"]),
                        floors=int(row["floors"]),
                        parking=int(row["parking"]),
                        property_age=int(row["property_age"]),
                        furnishing_status=row["furnishing_status"],
                        property_type=row["property_type"],
                        actual_price=actual,
                        predicted_price=pred,
                        model_name="RandomForestRegressor",
                        prediction_date=datetime.utcnow()
                    )
                    session.add(hp)
                    session.flush() # Populate hp.id
                    
                    # Also create a history entry
                    hist = PredictionHistory(
                        user_id=user_id,
                        house_id=hp.id,
                        predicted_price=pred,
                        model_name="RandomForestRegressor",
                        prediction_date=datetime.utcnow()
                    )
                    session.add(hist)
                    
                session.commit()
                print("Seeded 120 initial benchmark properties and prediction history.")
            else:
                print(f"Warning: Dataset file not found at {csv_path}.")
        else:
            print(f"House prices table already has {prop_count} records.")

    except Exception as e:
        session.rollback()
        print(f"Error during database initialization: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    init_database()

