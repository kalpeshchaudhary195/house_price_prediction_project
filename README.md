# 🏡 House Price Prediction AI Platform & Real Estate Analytics Studio

An enterprise-grade, full-stack Machine Learning application and real estate intelligence platform built with **React (Vite)**, **Node.js (Express)**, **Python ML Microservice (FastAPI + Scikit-Learn)**, and **PostgreSQL**.

Trained on the genuine **California Housing Dataset (`housing.csv` — 20,640 records)** with full data synchronization, 12 interconnected interactive visualizations powered by Recharts, 7 architectural property showcase categories with unique photography and valuation presets, and live PostgreSQL telemetry.

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           React Frontend (Vite)                             │
│  - 7 Core Navigation Items: Dashboard, Predict, Properties, Analytics,     │
│    Prediction History, Model Performance, Settings                          │
│  - 12 Interconnected Recharts Visualizations with Coordinated Filters      │
│  - 7 Property Categories with Unique High-Res Imagery & Estimation Presets │
│  - Real-Time Model Confidence Spread & Market Context Gauges                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON API (Port 5000)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Node.js Express API Server (:5000)                     │
│  - Database Connection Pool via 'pg' (node-postgres)                        │
│  - Serves API routes: /api/predict, /api/properties, /api/dashboard/...    │
│  - Serves static compiled React SPA (frontend/dist) on single port          │
│  - Parameterized SQL queries to prevent injection                           │
└──────────────────┬──────────────────────────────────┬───────────────────────┘
                   │                                  │
                   │ SQL via pg Pool                  │ HTTP /api/ml (Port 8000)
                   ▼                                  ▼
┌─────────────────────────────────────┐  ┌────────────────────────────────────┐
│      PostgreSQL Database (:5432)    │  │   Python ML FastAPI Service (:8000)│
│  DB: house_price_prediction_db      │  │   - Scikit-Learn Pipeline          │
│  - predictions (user prediction log)│  │   - Random Forest Regressor (R²=82)│
│  - properties (7 seeded categories) │  │   - Dataset Analytics & Filters    │
│  - model_training_history           │  │   - Fast Sub-50ms Inference        │
└─────────────────────────────────────┘  └────────────────────────────────────┘
```

---

## 🌟 Key Application Features

### 1. 12 Interconnected Recharts Visualizations
All 12 charts are connected to a unified data pipeline that dynamically filters across location and price brackets:
1. **Actual vs. Predicted Valuation Scatter**: Validation points comparing ground-truth census prices with ML predictions.
2. **Price Bracket Distribution**: Frequency distribution across 7 price ranges from `< $100k` to `$400k-$500k`.
3. **Location Valuation Comparison**: Horizontal bar ranking mean prices by coastal proximity (`ISLAND`, `NEAR BAY`, `NEAR OCEAN`, `<1H OCEAN`, `INLAND`).
4. **Income vs. Valuation Correlation**: Step curve demonstrating the dominant positive correlation between median household income and house values.
5. **House Age Progression**: Evaluation of property appreciation across vintage eras (`<10 yrs` to `40+ yrs`).
6. **Total Rooms Impact**: Correlation between average room count and home valuation.
7. **Bedroom Ratio Valuation**: Regression showing how bedroom-to-room ratio influences pricing.
8. **Population Density Influence**: Analysis of block group population vs. property prices.
9. **Feature Importance Ranking**: Random Forest feature weights (Median Income leads at 49.1%, followed by Inland Location at 14.1%, Coordinates at 20.8%).
10. **Live Prediction Activity Log**: Real-time evaluation history logged directly into PostgreSQL.
11. **Multi-Model Benchmark**: Cross-algorithm comparison (Random Forest, Gradient Boosting, Decision Tree, Linear Regression).
12. **Monthly Valuation Trends**: Historical valuation request volume and average estimated prices over time.

### 2. 7 Architectural Property Showcase Categories
Each category features distinct, verified photography, architectural specifications, a "View Details" modal, and a "Predict Price" button that pre-populates the ML calculation engine:
1. **Luxury Villas**: *Pacific Panorama Oceanfront Villa* (Malibu Coast, CA) — $1,250,000
2. **Apartments**: *Silicon Valley Horizon High-Rise Apartment* (San Jose, CA) — $540,000
3. **Independent Houses**: *Pasadena Craftsman Independent Estate* (Pasadena, CA) — $685,000
4. **Family Houses**: *Sunnyvale Suburban Garden Family Residence* (Sunnyvale, CA) — $710,000
5. **Modern Houses**: *Berkeley Hills Minimalist Glass Residence* (Berkeley Hills, CA) — $625,000
6. **Small Houses**: *Sonoma Valley Eco-Compact Bungalow* (Sonoma Foothills, CA) — $295,000
7. **Premium Properties**: *Santa Catalina Oceanfront Island Sanctuary* (Avalon, CA) — $1,480,000

### 3. Genuine Machine Learning Pipeline
- **Dataset**: `housing.csv` (20,640 records, 10 columns, target: `median_house_value` in USD $).
- **Ensemble Champion**: Random Forest Regressor ($R^2 = 0.8172$, $\text{MAE} = \$31,628$).
- **Features Handled**: Longitude, Latitude, Housing Median Age, Total Rooms, Total Bedrooms, Population, Households, Median Income, Ocean Proximity.
- **Persistence**: Every prediction is safely recorded into the PostgreSQL `predictions` table.

---

## 🚀 Running the Application

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL (14+)

### 1. Configure Database Credentials
Verify that `backend/.env` or `.env` in the root matches your local PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=house_price_prediction_db
DB_USER=postgres
DB_PASSWORD=
PORT=5000
ML_SERVICE_URL=http://127.0.0.1:8000
```

### 2. Start the Python ML Microservice
```powershell
cd ml-service
python run.py
```
*(Runs FastAPI on http://127.0.0.1:8000)*

### 3. Start the Node.js Express Server
```powershell
cd backend
node src/server.js
```
*(Connects to PostgreSQL, seeds the 7 property categories, and serves both the API and the React frontend on http://127.0.0.1:5000)*

### 4. (Optional) Run React in Vite Dev Mode
If making live frontend changes:
```powershell
cd frontend
npm run dev
```
*(Runs Vite on http://localhost:5173 with proxy to backend port 5000)*

---

## 🧪 Verified API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check verifying Node.js, PostgreSQL pool, and Python ML service |
| `GET` | `/api/dashboard/stats` | 7 Summary telemetry cards and recent evaluation activity |
| `GET` | `/api/dashboard/charts` | Live datasets for all 12 Recharts visualizations with filter support |
| `GET` | `/api/properties` | 7 architectural property showcase categories and specifications |
| `GET` | `/api/predictions` | Query historical valuation requests from PostgreSQL |
| `POST` | `/api/predict` | Calculate continuous ML house valuation and persist to PostgreSQL |
| `DELETE` | `/api/predictions/:id`| Delete an individual prediction from PostgreSQL |
| `GET` | `/api/model/info` | Machine learning model metrics and feature importance weights |

---

## 🌟 Key Application Features

1. **PostgreSQL Database Integration**:
   - Local PostgreSQL cluster connected to `house_price_prediction_db` via SQLAlchemy ORM.
   - Credentials configured securely via `.env` (never hardcoded).
   - Tables created automatically if they do not exist:
     - `house_prices`: Stores full property specs, coordinates, actual/predicted price, model, timestamp.
     - `prediction_history`: Relational history tracking user predictions.
     - `users`: User authentication records with hashed passwords and role management.
   - Parameterized queries to protect against SQL injection.

2. **Genuine Indian Residential Dataset & Machine Learning**:
   - 4,500 clean records covering Ahmedabad, Surat, Vadodara, Mumbai, Pune, Bangalore, Delhi, Hyderabad, Chennai, and Kolkata.
   - Features: City, Locality, State, Super Built-up Area (sq. ft.), Bedrooms (BHK), Bathrooms, Floors, Parking Spaces, Property Age, Furnishing Status, Property Type.
   - Evaluated 5 regression algorithms on 80/20 train/test split:
     - **Gradient Boosting Regressor**: $R^2 = 0.8934$, $\text{MAE} = \text{₹ 39.7 Lakh}$, $\text{RMSE} = \text{₹ 80.0 Lakh}$ **(Champion Model)**
     - **Random Forest Regressor**: $R^2 = 0.8922$, $\text{MAE} = \text{₹ 39.9 Lakh}$, $\text{RMSE} = \text{₹ 80.5 Lakh}$
     - **XGBoost Regressor**: $R^2 = 0.8875$, $\text{MAE} = \text{₹ 40.5 Lakh}$, $\text{RMSE} = \text{₹ 82.2 Lakh}$
     - **Decision Tree Regressor**: $R^2 = 0.8014$, $\text{MAE} = \text{₹ 53.9 Lakh}$, $\text{RMSE} = \text{₹ 1.09 Cr}$
     - **Linear Regression**: $R^2 = 0.7906$, $\text{MAE} = \text{₹ 63.4 Lakh}$, $\text{RMSE} = \text{₹ 1.12 Cr}$
   - Saved champion model pipeline with ColumnTransformer (imputation + scaling + OneHotEncoding) in `ml/artifacts/best_model.joblib`.
   - On-demand retraining endpoint at `POST /api/model/retrain`.

3. **Valuation Engine & Reporting**:
   - Values displayed in Indian Rupees (**₹**), formatted in **Lakhs** and **Crores** as well as exact full digits.
   - Calculates dynamic $\pm 6.5\%$ confidence band.
   - Generates official, downloadable **PDF Valuation Reports** via ReportLab with executive summary, specification table, and legal disclaimers.
   - Exports complete prediction history to **CSV**.

4. **Interactive Analytics Studio (Chart.js)**:
   - Chart 1: City-wise Average House Prices (Bar)
   - Chart 2: Bedroom-wise Price Progression (Line)
   - Chart 3: Area vs. House Price Correlation (Scatter)
   - Chart 4: Actual vs. Predicted Validation Accuracy (Scatter)
   - Chart 5: Multi-Model Regression Benchmarks (Grouped Bar)
   - Chart 6: Property Type Inventory Distribution (Doughnut)

5. **User Security & Authentication**:
   - Registration, login, logout, and protected session state.
   - Secure password hashing with `werkzeug.security.generate_password_hash`.
   - Seeded demo account for quick testing:
     - **Email**: `kalpesh@example.com`
     - **Password**: `Kalpesh123!`

---

## 🚀 Getting Started

### 1. Environment Configuration
Ensure your `.env` file exists in the project root:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=house_price_prediction_db
DB_USER=postgres
DB_PASSWORD=
PORT=5000
FLASK_ENV=development
SECRET_KEY=house_price_prediction_secret_key_2026_adani
```

### 2. Database Initialization
```bash
python database/init_db.py
```

### 3. Model Training
```bash
python ml/train_model.py
```

### 4. Running the Web Application
```bash
python app.py
```
Open your browser at: **`http://127.0.0.1:5000`**

### 5. Running Automated Tests
```bash
python -m pytest tests/test_application.py -v
```
All 12 end-to-end integration tests will verify the database, ML predictions, REST APIs, PDF generation, CSV exports, and HTML page rendering.
