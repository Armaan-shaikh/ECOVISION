# EcoVision – City Environmental Monitoring, Analysis and Prediction System

EcoVision is an urban environmental intelligence platform engineered for real-time meteorological and air quality telemetry ingestion, atmospheric dispersion analysis, and SQLite-backed environmental persistence.

---

## 🏛️ System Architecture & Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons | Understated dark forest green glassmorphic environmental dashboard |
| **Data Visualization** | Recharts | 24-hour dynamic telemetry (AQI, PM2.5, PM10, Temp, Humidity, Rain, Trace Gases) |
| **Backend API** | Python 3.12, Flask, Flask-CORS | Modular application factory API, REST endpoints |
| **Database** | SQLite3 | Local embedded persistence for cities and historical observations |
| **Data Collection** | Open-Meteo Environmental APIs | Real-time geocoding, meteorological forecasts, and Copernicus CAMS atmospheric data |
| **Data Analysis** | Pandas, NumPy | Statistical variance, rolling metrics, and Z-score outlier detection |
| **Machine Learning** | Scikit-learn | Predictive regression models (prepared for future development phase) |

---

## 📂 Project Structure

```
d:\ECOMETER\
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py                     # /api/health endpoint with SQLite & API diagnostics
│   │   │   ├── metrics.py                    # /api/metrics/summary & timeseries endpoints
│   │   │   └── environmental.py              # /api/cities/search, /api/environmental/data, /api/environmental/analysis
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── cpcb_service.py               # Official CPCB CAAQMS ground station ingestion, breakpoints & completeness validation
│   │   │   ├── open_meteo.py                 # Open-Meteo geocoding, real-time weather, air quality & ERA5 historical archive client
│   │   │   ├── analysis_service.py           # Environmental Indicator Scoring, Pandas historical trends, insights & recommendations
│   │   │   ├── data_service.py               # Statistical variance, rolling metrics, and outlier detection
│   │   │   └── ml_service.py                 # Scikit-learn RandomForestRegressor time-series climate forecasting & recursive projection
│   │   ├── __init__.py                       # Flask app factory & CORS configuration
│   │   ├── config.py                         # Environment configuration
│   │   └── database.py                       # SQLite connection manager, schema, and deduplication
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_cpcb_and_aqi.py              # Automated test suite for CPCB calculation, categories & completeness
│   ├── venv/                                 # Python 3.12 virtual environment
│   ├── requirements.txt                      # Backend dependencies
│   ├── run.py                                # Server entry point (http://127.0.0.1:5000)
│   ├── ecovision.db                          # SQLite database storing cities, observations, and monthly reanalysis
│   └── .env.example                          # Environment configuration template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.jsx                        # Header with live Flask & SQLite status indicator
│   │   │   └── dashboard/
│   │   │       ├── CitySearch.jsx                    # Global city search with Open-Meteo geocoding
│   │   │       ├── CityHeader.jsx                    # Active municipality header, coords & data source
│   │   │       ├── MetricCard.jsx                    # Environmental KPI cards with health benchmarks
│   │   │       ├── EnvironmentalChart.jsx            # 24-hr Recharts area & line series with multi-tab selector
│   │   │       ├── PollutantBreakdown.jsx            # Trace gases grid (NO2, SO2, CO, Ozone, European AQI)
│   │   │       ├── EnvironmentalScoringCard.jsx      # Overall Environmental Indicator Score (0-100) & criteria breakdown
│   │   │       ├── HistoricalTrendsView.jsx          # Multi-day trends (7d/14d/30d) with Recharts charts & weekly table
│   │   │       ├── InsightsAndRecommendations.jsx    # Rule-based findings & targeted action advisories
│   │   │       ├── PredictionCenter.jsx              # Machine learning 6-month forecast, RF vs baseline charts & KPI metrics
│   │   │       ├── DatabaseSavedCities.jsx           # SQLite persisted cities viewer
│   │   │       ├── BackendStatusPanel.jsx            # System engine diagnostics
│   │   │       └── UnavailableDataAlert.jsx          # Clear message when telemetry is missing
│   │   ├── services/
│   │   │   └── api.js                                # Frontend-to-backend API client
│   │   ├── App.jsx                                   # Main dashboard page
│   │   ├── index.css                                 # Tailwind styling & dark forest aesthetic
│   │   └── main.jsx                                  # React DOM entry point
│   ├── index.html                                    # Document header & EcoVision branding
│   ├── vite.config.js                                # Vite config with /api proxy to Flask
│   └── package.json                                  # Frontend dependencies
│
├── .gitignore                                        # Git ignore rules for Python & Node.js
├── README.md                                         # Project documentation
├── run_backend.bat                                   # One-click launcher for Flask backend
└── run_frontend.bat                                  # One-click launcher for React Vite frontend
```

---

## 🌐 External APIs Integrated

1. **Open-Meteo Geocoding API**
   - Endpoint: `https://geocoding-api.open-meteo.com/v1/search?name={name}&count=5&language=en&format=json`
   - Purpose: Resolves city names worldwide into latitude, longitude, country, state/region, and local timezone.
2. **Open-Meteo Weather Forecast API**
   - Endpoint: `https://api.open-meteo.com/v1/forecast`
   - Purpose: Real-time and hourly ambient temperature, relative humidity, precipitation, rainfall, and wind speed.
3. **Open-Meteo Air Quality (Copernicus CAMS) API**
   - Endpoint: `https://air-quality-api.open-meteo.com/v1/air-quality`
   - Purpose: Standard US EPA Air Quality Index (0–500 scale), European AQI, PM2.5, PM10, Nitrogen Dioxide (NO2), Sulphur Dioxide (SO2), Carbon Monoxide (CO), and Ozone (O3).
4. **Open-Meteo Historical Weather Archive API**
   - Endpoint: `https://archive-api.open-meteo.com/v1/archive`
   - Purpose: Multi-year atmospheric reanalysis (ERA5 / ERA5-Land) delivering daily temperature and precipitation records aggregated into monthly climate training datasets.

> **Standard AQI Scale Compliance:** The dashboard strictly reports the **US EPA Air Quality Index** (0–500 scale) as the primary benchmark and identifies it clearly. Modelled Copernicus CAMS data is transparently attributed and never misrepresented as local on-site physical hardware sensors.

---

## 🗄️ SQLite Database Schema

### `cities` Table
Stores unique municipalities searched or selected by users:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `state` (TEXT)
- `country` (TEXT NOT NULL)
- `country_code` (TEXT)
- `latitude` (REAL NOT NULL)
- `longitude` (REAL NOT NULL)
- `timezone` (TEXT)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **Constraint:** `UNIQUE(name, state, country)` prevents duplicate city entries.

### `environmental_observations` Table
Stores timestamped environmental observations:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `city_id` (INTEGER NOT NULL, FOREIGN KEY REFERENCES cities(id))
- `observation_time` (TEXT NOT NULL)
- `temperature`, `relative_humidity`, `precipitation`, `rain`, `wind_speed` (REAL)
- `aqi` (INTEGER - US EPA scale), `aqi_scale` (TEXT DEFAULT 'US EPA')
- `european_aqi` (INTEGER)
- `pm25`, `pm10`, `no2`, `so2`, `co`, `ozone` (REAL)
- `data_source` (TEXT)
- `recorded_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **Constraint:** `UNIQUE(city_id, observation_time)` prevents duplicate API records.

### `city_monthly_history` Table
Stores 5-year aggregated historical climate reanalysis for ML training:
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `city_id` (INTEGER NOT NULL, FOREIGN KEY REFERENCES cities(id))
- `year` (INTEGER NOT NULL)
- `month` (INTEGER NOT NULL)
- `year_month` (TEXT NOT NULL)
- `temperature_mean`, `temperature_min`, `temperature_max`, `precipitation_sum` (REAL)
- `data_source` (TEXT DEFAULT 'Open-Meteo Historical Archive (ERA5 Reanalysis)')
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **Constraint:** `UNIQUE(city_id, year, month)` prevents duplicate monthly downloads and serves as an offline climate cache.

---

## 📊 Step 3: Environmental Analysis Module

EcoVision includes a transparent, rule-based environmental analysis engine designed without opaque AI black boxes or external LLM dependencies.

### 1. Environmental Indicator Scoring (EIS)
All valid parameters are normalized onto an intuitive **0–100 scale** (where 100 represents optimal environmental quality):

| Indicator | Weight | Raw Ideal Range | Scoring Normalization Logic |
|---|---|---|---|
| **Air Quality (US EPA AQI)** | 35% | 0–50 (Good) | Piecewise linear mapping from EPA AQI breakpoints: AQI ≤ 50 $\rightarrow$ 90–100; AQI 51–100 $\rightarrow$ 70–89.9; AQI 101–150 $\rightarrow$ 50–69.9; AQI > 300 $\rightarrow$ 0–19.9. |
| **Ambient Temperature** | 25% | 18–24°C | Human-thermal comfort curve: 18–24°C scores 100; mild summer warmth (24–28°C) scores 78–90 (not penalized as bad); extreme heat (>36°C) or freezing (<0°C) scores < 40. |
| **Relative Humidity** | 20% | 40–60% | Gaussian-style bell curve centered at 50%: drops gently as air becomes overly arid (< 30%) or muggy (> 75%). |
| **Rainfall / Precipitation** | 20% | 0.5–8.0 mm | Cleansing shower rain scores 90–100; dry days score 75 (stable/neutral); severe storm runoff (> 25 mm) scores down to 25 due to urban flooding risks. |

#### Composite Score & Missing Data Rules:
- **Strict Data Sufficiency:** A composite overall score is calculated **only when at least 3 of the 4 indicators are valid**. If fewer than 3 valid indicators exist, the system returns `None` and reports `"Insufficient Data"`.
- **Never Treat Missing Data as Zero:** When an indicator is missing, its value remains `None` and its weight is dynamically re-allocated proportionally among available valid indicators. Missing data is never substituted with 0.
- **Transparency Disclaimer:** The score is explicitly labeled as a *project-defined environmental indicator*, not an official statutory health index.

### 2. Historical Trend Analysis
- **Periods Supported:** 7 Days, 14 Days, and 30 Days.
- **Data Ingestion:** Retrieved from Open-Meteo Weather Forecast/Archive and Copernicus CAMS Air Quality APIs without fabricating missing values.
- **Pandas & NumPy Processing:**
  - Daily mean, min, and max temperatures, precipitation sums, and mean US EPA AQI.
  - 7-day calendar rolling weekly aggregations.
  - Temperature trend direction ($\Delta T = T_{\text{recent}} - T_{\text{baseline}}$).
  - Rainfall pattern analysis (total rainfall, wet days count, precipitation frequency).
  - AQI trend classification (improving, degrading, or stable).
  - Exact data coverage reporting (e.g. 7/7 days, 100% coverage).

### 3. Rule-Based Insights Engine
Produces data-backed environmental insights linked directly to observed telemetry:
- **Air Quality Assessment:** US EPA AQI classification with health category.
- **Thermal Dynamics:** Historical mean temperature and period temperature delta.
- **Precipitation Profile:** Cumulative precipitation volume and wet days count.
- **Particulate Health Exposure:** PM2.5 assessment against WHO guidelines (15 µg/m³ 24-hr threshold).

### 4. Targeted Action Recommendations
Generates municipal and citizen advisories mapped to measured conditions:
- **Active Transit & Recreation:** Safe windows for outdoor activities when AQI is favorable.
- **Sensitive Group Alerts:** Guidance for vulnerable populations when PM2.5 or AQI is elevated.
- **Urban Heat Mitigation:** Shade, hydration, and green canopy recommendations during warming trends.
- **Stormwater & Catchment:** Infrastructure drainage advisories during high rainfall periods.

---

## 🤖 Step 4: Machine Learning & Environmental Prediction Module

EcoVision features an explainable, time-series machine learning prediction engine built using **Scikit-learn** and historical atmospheric reanalysis from the **Open-Meteo Historical Archive (ERA5 / ERA5-Land)**.

### 1. Model Architecture & Input Features
* **Model Type:** `sklearn.ensemble.RandomForestRegressor`
  * `n_estimators = 100`, `max_depth = 6`, `random_state = 42`
  * Explainable ensemble tree structure optimized for non-linear lag relationships.
* **Target Variable:** Monthly average surface temperature (`temperature_mean`, °C).
* **Engineered Feature Set (6 Lags):**
  1. `month`: Calendar month (1–12) capturing solar declination and seasonal cycles.
  2. `year`: Calendar year capturing long-term inter-annual warming trends.
  3. `prev_month_temp`: Lag 1 ($T_{t-1}$) capturing immediate atmospheric thermal inertia.
  4. `prev_2m_avg_temp`: Rolling 2-month average ($\frac{T_{t-1} + T_{t-2}}{2}$) reflecting seasonal transition momentum.
  5. `prev_3m_avg_temp`: Rolling 3-month average ($\frac{T_{t-1} + T_{t-2} + T_{t-3}}{3}$) tracking quarterly persistence.
  6. `prev_month_rain`: Lag 1 precipitation sum ($R_{t-1}$) capturing soil moisture and evaporative cooling feedback.

### 2. Training & Testing Methodology
* **Chronological Time-Series Split:**
  * Strict temporal split: the model trains on earlier chronological months and tests on the final 12-month holdout window.
  * **Zero data leakage:** No random shuffling is performed, preserving the natural forward arrow of time.
* **Seasonal-Average Baseline Benchmark:**
  * Every model is benchmarked against a seasonal meteorological baseline ($\bar{T}_m = \text{historical mean for month } m$).
  * Calculates both Random Forest and Baseline **MAE** (Mean Absolute Error) and **RMSE** (Root Mean Squared Error).
  * Validates whether machine learning outperforms naive seasonal repetition.

### 3. Autoregressive Six-Month Forecast
* **Recursive Lag Update:**
  * Predicts month $t+1$ using observed lags.
  * For months $t+2$ through $t+6$, dynamically feeds preceding predicted temperatures back into the lag features ($T_{t-1}, T_{t-2}, T_{t-3}$).
  * Uses historical seasonal rainfall averages for future precipitation inputs.
* **Outputs per Forecast Month:**
  * Predicted Mean Temperature (°C)
  * Historical Baseline Benchmark Temperature (°C)
  * Delta from Baseline ($\pm$ °C)
  * Trend Direction (*Warming*, *Cooling*, *Stable*)
  * Empirical Confidence Interval Corridor derived from validated holdout MAE ($\pm \text{MAE}$).

### 4. Dual-Layer Caching Architecture
* **Layer 1 (Database):** Raw 5-year monthly historical records (e.g. 69 records) are persisted in SQLite table `city_monthly_history`. Once ingested, subsequent model fits for that municipality run entirely offline without re-hitting external APIs.
* **Layer 2 (In-Memory):** Fitted model parameters, evaluation metrics, and 6-month projections are cached in memory keyed by geographical coordinates, serving repeat dashboard queries in **~2 ms**.

---

## 🚀 Exact Instructions to Run the Application

### Option A: Quick Launch Scripts (Windows)
1. Double-click `run_backend.bat` to start the Flask API on `http://127.0.0.1:5000`.
2. Double-click `run_frontend.bat` to start the React Vite dev server on `http://localhost:5173`.
3. Open `http://localhost:5173` in your browser.

### Option B: Terminal Commands

#### 1. Start the Flask Backend
```powershell
# From project root (d:\ECOMETER)
.\backend\venv\Scripts\python.exe backend\run.py
```
* Backend starts on `http://127.0.0.1:5000`.
* Check health: `http://127.0.0.1:5000/api/health`.

#### 2. Start the React Frontend
```powershell
# In a separate terminal
cd frontend
npm run dev
```
* Open `http://localhost:5173` in any browser.
* Search for any city worldwide (e.g. London, Tokyo, New York, Delhi, Paris, Berlin) to inspect live telemetry and verified SQLite persistence.

---

## 🔍 Verified API Endpoints

- `GET /api/health` — System status, SQLite diagnostics, registered APIs.
- `GET /api/cities/search?q={query}` — Worldwide city search via Open-Meteo Geocoding.
- `GET /api/environmental/data?lat={lat}&lon={lon}&name={city}` — Live weather & air quality ingestion and SQLite persistence.
- `GET /api/environmental/analysis?lat={lat}&lon={lon}&days={7|14|30}&name={city}` — Step 3 Environmental scoring, historical trend analysis, insights, and recommendations.
- `GET /api/environmental/prediction?lat={lat}&lon={lon}&name={city}` — Step 4 Scikit-learn Random Forest climate prediction, 6-month forecast, and baseline comparison.
- `GET /api/cities/saved` — List of stored cities in SQLite with recent observations.
- `GET /api/metrics/summary` — Default location environmental summary.
- `GET /api/metrics/timeseries` — Default 24-hour environmental trend series.
