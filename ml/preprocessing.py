"""ML Preprocessing & Feature Engineering Pipeline.

Defines numerical and categorical transformers, custom feature engineering,
imputation, scaling, and one-hot encoding for Indian real estate features.
"""

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

BASE_NUMERICAL_FEATURES = [
    "area_sqft",
    "bedrooms",
    "bathrooms",
    "floors",
    "parking",
    "property_age"
]

BASE_CATEGORICAL_FEATURES = [
    "city",
    "locality",
    "state",
    "furnishing_status",
    "property_type"
]

ENGINEERED_NUMERICAL_FEATURES = [
    "bhk_density",        # area_sqft / bedrooms
    "bath_to_bed_ratio",  # bathrooms / bedrooms
    "parking_per_bhk",    # parking / bedrooms
    "is_luxury_type"      # 1 if Villa/Penthouse else 0
]

ALL_NUMERICAL_FEATURES = BASE_NUMERICAL_FEATURES + ENGINEERED_NUMERICAL_FEATURES
ALL_CATEGORICAL_FEATURES = BASE_CATEGORICAL_FEATURES

NUMERICAL_FEATURES = BASE_NUMERICAL_FEATURES
CATEGORICAL_FEATURES = BASE_CATEGORICAL_FEATURES

FEATURE_COLUMNS = BASE_NUMERICAL_FEATURES + BASE_CATEGORICAL_FEATURES
TARGET_COLUMN = "price"

class RealEstateFeatureEngineer(BaseEstimator, TransformerMixin):
    """Custom Scikit-Learn transformer to derive real-estate domain features."""
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X_df = X.copy()
        if not isinstance(X_df, pd.DataFrame):
            X_df = pd.DataFrame(X_df, columns=FEATURE_COLUMNS)

        bedrooms = np.maximum(X_df["bedrooms"].values.astype(float), 1.0)
        area = X_df["area_sqft"].values.astype(float)
        bathrooms = X_df["bathrooms"].values.astype(float)
        parking = X_df["parking"].values.astype(float)
        prop_types = X_df["property_type"].values

        X_df["bhk_density"] = np.round(area / bedrooms, 2)
        X_df["bath_to_bed_ratio"] = np.round(bathrooms / bedrooms, 2)
        X_df["parking_per_bhk"] = np.round(parking / bedrooms, 2)
        X_df["is_luxury_type"] = np.isin(prop_types, ["Villa", "Penthouse"]).astype(float)

        return X_df

def build_preprocessor():
    """Build a ColumnTransformer for preprocessing input features."""
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    column_transformer = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, ALL_NUMERICAL_FEATURES),
            ("cat", cat_pipeline, ALL_CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )

    full_preprocessor = Pipeline([
        ("feature_engineer", RealEstateFeatureEngineer()),
        ("column_transformer", column_transformer)
    ])

    return full_preprocessor
