"""Training and evaluation pipeline for ML service."""

import json
import os
import time
from datetime import datetime
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeRegressor

from preprocessing import build_preprocessor, FEATURE_COLUMNS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "housing.csv")
SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")


def load_dataset(csv_path: str = DATA_PATH) -> pd.DataFrame:
    if not os.path.exists(csv_path):
        alt = os.path.abspath(os.path.join(BASE_DIR, "..", "dataset", "housing.csv"))
        if os.path.exists(alt):
            csv_path = alt
        else:
            raise FileNotFoundError(f"Dataset not found at {csv_path}")
    df = pd.read_csv(csv_path)
    return df.drop_duplicates()


def train_and_evaluate_all(csv_path: str = DATA_PATH) -> Tuple[str, Dict[str, Any], Any]:
    df = load_dataset(csv_path)
    X = df[FEATURE_COLUMNS]
    y = df["median_house_value"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    models: Dict[str, Any] = {
        "Random Forest Regressor": RandomForestRegressor(
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

    preprocessor = build_preprocessor()

    for name, regressor in models.items():
        t0 = time.time()
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", regressor),
        ])
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

        if r2 > best_r2:
            best_r2 = r2
            best_name = name
            best_pipeline = pipeline

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

    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    with open(os.path.join(SAVED_MODELS_DIR, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    joblib.dump(best_pipeline.named_steps["preprocessor"], os.path.join(SAVED_MODELS_DIR, "pipeline.pkl"))
    joblib.dump(best_pipeline.named_steps["regressor"], os.path.join(SAVED_MODELS_DIR, "model.pkl"))

    return best_name, metadata, best_pipeline


if __name__ == "__main__":
    train_and_evaluate_all()

