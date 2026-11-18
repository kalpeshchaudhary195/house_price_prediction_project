"""Machine Learning Model Training Pipeline for California House Price Prediction.

Trains multiple regression models:
  - Linear Regression
  - Decision Tree Regressor
  - Random Forest Regressor
  - Gradient Boosting Regressor
  - Extra Trees Regressor

Evaluates on unseen test data using MAE, MSE, RMSE, and R2 score.
Selects the best model and serializes the complete pipeline.
"""

import json
import os
import time
from datetime import datetime
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeRegressor

from backend.ml.preprocessing import build_preprocessor, FEATURE_COLUMNS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "housing.csv")
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))


def load_dataset(csv_path: str = DATA_PATH) -> pd.DataFrame:
    """Loads and inspects the housing dataset, ensuring existence and dropping duplicates."""
    if not os.path.exists(csv_path):
        # Fallback to root or dataset/ directory if needed
        alt_paths = [
            os.path.join(ROOT_DIR, "dataset", "housing.csv"),
            os.path.join(ROOT_DIR, "housing.csv"),
        ]
        for p in alt_paths:
            if os.path.exists(p):
                csv_path = p
                break
        else:
            raise FileNotFoundError(f"Housing dataset not found at {csv_path} or alternative paths.")

    df = pd.read_csv(csv_path)
    initial_len = len(df)
    df = df.drop_duplicates()
    dropped = initial_len - len(df)
    if dropped > 0:
        print(f"Removed {dropped} duplicate records.")
    return df


def train_and_evaluate_all(csv_path: str = DATA_PATH) -> Tuple[str, Dict[str, Any], Any]:
    """Trains all 5 candidate models, compares metrics, and selects the best model."""
    df = load_dataset(csv_path)
    print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns.")

    X = df[FEATURE_COLUMNS]
    y = df["median_house_value"]

    # Reproducible train-test split (80/20) without data leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    models: Dict[str, Any] = {
        "Random Forest Regressor": RandomForestRegressor(
            n_estimators=100, random_state=42, n_jobs=-1
        ),
        "Extra Trees Regressor": ExtraTreesRegressor(
            n_estimators=100, random_state=42, n_jobs=-1
        ),
        "Gradient Boosting Regressor": GradientBoostingRegressor(
            n_estimators=100, random_state=42
        ),
        "Decision Tree Regressor": DecisionTreeRegressor(
            max_depth=15, random_state=42
        ),
        "Linear Regression": LinearRegression(),
    }

    results: Dict[str, Dict[str, Any]] = {}
    best_name: str = ""
    best_r2: float = -float("inf")
    best_pipeline = None

    print("\n--- Training and Evaluating Models ---")
    start_time = time.time()

    preprocessor = build_preprocessor()

    for name, regressor in models.items():
        t0 = time.time()
        pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("regressor", regressor),
            ]
        )
        pipeline.fit(X_train, y_train)
        fit_time = round(time.time() - t0, 2)

        preds = pipeline.predict(X_test)
        mae = float(mean_absolute_error(y_test, preds))
        mse = float(mean_squared_error(y_test, preds))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test, preds))

        results[name] = {
            "name": name,
            "mae": round(mae, 2),
            "mse": round(mse, 2),
            "rmse": round(rmse, 2),
            "r2_score": round(r2, 4),
            "fit_time_seconds": fit_time,
        }
        print(f"[{name}] MAE: ${mae:,.2f} | RMSE: ${rmse:,.2f} | R²: {r2:.4f} ({fit_time}s)")

        if r2 > best_r2:
            best_r2 = r2
            best_name = name
            best_pipeline = pipeline

    total_time = round(time.time() - start_time, 2)
    print(f"\nBest Model Selected: {best_name} with R²: {best_r2:.4f} (Total training time: {total_time}s)")

    metadata = {
        "best_model": best_name,
        "trained_at": datetime.now().isoformat(),
        "dataset_size": int(len(df)),
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "features": FEATURE_COLUMNS,
        "metrics": results[best_name],
        "all_models_comparison": results,
    }

    # Persist artifacts
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    metrics_path = os.path.join(SAVED_MODELS_DIR, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Save full pipeline as well as preprocessor and model objects
    pipeline_path = os.path.join(SAVED_MODELS_DIR, "pipeline.pkl")
    model_path = os.path.join(SAVED_MODELS_DIR, "model.pkl")

    joblib.dump(best_pipeline.named_steps["preprocessor"], pipeline_path)
    joblib.dump(best_pipeline.named_steps["regressor"], model_path)

    # Copy to root directory for backward compatibility
    try:
        joblib.dump(best_pipeline.named_steps["preprocessor"], os.path.join(ROOT_DIR, "pipeline.pkl"))
        joblib.dump(best_pipeline.named_steps["regressor"], os.path.join(ROOT_DIR, "model.pkl"))
    except Exception as e:
        print(f"Warning: could not copy to root directory: {e}")

    print(f"Model and metrics saved successfully to {SAVED_MODELS_DIR}.")
    return best_name, metadata, best_pipeline


if __name__ == "__main__":
    train_and_evaluate_all()

