# EcoVision – City Environmental Monitoring, Analysis and Prediction System

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.6-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Tests](https://img.shields.io/badge/Tests-36%20Passed-success)](backend/tests/)
[![Vulnerabilities](https://img.shields.io/badge/Vulnerabilities-0%20(pip%20%26%20npm)-brightgreen)](https://github.com/Armaan-shaikh/ECOVISION)

EcoVision is an urban environmental intelligence platform engineered for real-time meteorological and air quality telemetry ingestion, atmospheric dispersion analysis, explainable machine-learning climate forecasting, and SQLite-backed environmental persistence.

---

## 🏛️ System Architecture & Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Presentation** | React 19, Vite 6, Tailwind CSS v4, Lucide Icons | Dark forest emerald glassmorphic environmental dashboard with responsive layouts |
| **Data Visualization** | Recharts | 24-hour hourly telemetry, 7-day rolling trends, and 6-month predictive corridors |
| **Backend REST API** | Python 3.12, Flask, Flask-CORS | Modular application factory API, Blueprints, sliding-window rate limiting |
| **Database Persistence** | SQLite 3 (WAL Mode) | Embedded relational persistence for cities, observations, and monthly reanalysis |
| **Ground Sensor Ingestion** | Central Pollution Control Board (CPCB) | Official CAAQMS XML RSS live telemetry, Haversine matching, statutory Indian NAQI |
| **Meteorological & Grids** | Open-Meteo & Copernicus CAMS | Global geocoding, real-time weather forecasts, and chemical transport reanalysis |
| **Machine Learning** | Scikit-learn (`RandomForestRegressor`) | 5-year ERA5 historical training, chronological holdout split, 6-month recursive forecast |
| **Security & Quality** | Zero-dependency In-Memory Limiter, Validators | IEEE 754 float sanitization, CORS whitelisting, payload caps, exception masking |

---

## 🎓 Academic Thesis & Technical Monograph

EcoVision is accompanied by an engineering thesis and technical monograph documenting the system architecture, mathematical derivations, database design, machine learning pipelines, and file-by-file code analyses:

* 📄 **Complete PDF Thesis (132 Pages):** [`docs/thesis/EcoVision_Complete_Project_Thesis.pdf`](docs/thesis/EcoVision_Complete_Project_Thesis.pdf)
* 📝 **Complete Markdown Source (4,690 Lines):** [`docs/thesis/EcoVision_Thesis_Source.md`](docs/thesis/EcoVision_Thesis_Source.md)

---

## 🛠️ Prerequisites & Required Tools

Before cloning and running EcoVision, ensure your system has the following tools installed:

| Tool | Minimum Version | Recommended | Verification Command | Purpose |
|---|---|---|---|---|
| **Git** | `2.30+` | `2.40+` | `git --version` | Cloning and version control |
| **Python** | `3.10+` | `3.12.x` | `python --version` (or `py --version`) | Backend Flask API & Scikit-learn runtime |
| **Node.js** | `18.x LTS` | `20.x+ LTS` | `node -v` | Frontend React & Vite build tooling |
| **npm** | `9.x+` | `10.x+` | `npm -v` | Node package dependency management |
| **Web Browser** | Any modern | Chrome / Edge / Firefox | N/A | Accessing the React dashboard |

> [!NOTE]
> **Operating System Compatibility:** EcoVision is fully cross-platform and runs on **Windows 10/11**, **Linux** (Ubuntu, Debian, Fedora, Arch), and **macOS** (Apple Silicon / Intel).

---

## 📦 Step-by-Step Installation & Execution Guide

Follow this guide to clone the repository from GitHub and launch both the backend and frontend servers on your local machine.

### Step 1: Clone the Repository

Open your terminal (PowerShell, Command Prompt, or Bash) and clone the repository:

```bash
# Clone the repository from GitHub
git clone https://github.com/Armaan-shaikh/ECOVISION.git

# Navigate into the project root directory
cd ECOVISION
```

---

### Step 2: Backend Setup (Python Flask)

#### 2.1 Navigate to the Backend Directory
```bash
cd backend
```

#### 2.2 Create a Python Virtual Environment
Creating an isolated virtual environment prevents library conflicts with your system Python:

* **On Windows (PowerShell / Command Prompt):**
  ```powershell
  python -m venv venv
  ```
* **On Linux / macOS (Bash / Zsh):**
  ```bash
  python3 -m venv venv
  ```

#### 2.3 Activate the Virtual Environment
* **On Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
  *(If you encounter a script execution restriction, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*
* **On Windows (Command Prompt `cmd.exe`):**
  ```cmd
  venv\Scripts\activate.bat
  ```
* **On Linux / macOS:**
  ```bash
  source venv/bin/activate
  ```

#### 2.4 Upgrade Pip and Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 2.5 Configure the Environment File
Create a local `.env` configuration file from the provided `.env.example`:

* **On Windows:**
  ```cmd
  copy .env.example .env
  ```
* **On Linux / macOS:**
  ```bash
  cp .env.example .env
  ```

*(The default `.env` settings are pre-configured for local development and bind safely to `127.0.0.1:5000` with CORS enabled for `http://localhost:5173`).*

#### 2.6 Start the Flask Backend Server
```bash
python run.py
```

* The backend WSGI server will initialize and report:
  ```
  ======================================================================
  ECOVISION BACKEND SERVER INITIALIZED
  ======================================================================
  * Environment: development
  * Server Host: 127.0.0.1
  * Server Port: 5000
  * Database:    ecovision.db (WAL Mode Enabled)
  ======================================================================
  ```
* **Health Check:** Open your browser or run `curl http://127.0.0.1:5000/api/health` to confirm the backend and SQLite database are active.

---

### Step 3: Frontend Setup (React Vite)

Open a **second terminal window** and navigate to the project root directory (`ECOVISION`).

#### 3.1 Navigate to the Frontend Directory
```bash
cd frontend
```

#### 3.2 Install Node.js Dependencies
```bash
npm install
```

#### 3.3 Start the Vite Development Server
```bash
npm run dev
```

* Vite will compile the React modules and display the local development URL:
  ```
  VITE v6.x.x  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
  ```

#### 3.4 Open EcoVision in Your Browser
Navigate to **`http://localhost:5173`** in your browser.

1. Type any city name into the **City Search** bar (e.g. `Delhi`, `Bengaluru`, `Nagpur`, `London`, `Tokyo`, `New York`).
2. Observe live meteorological KPIs, dual Indian NAQI / Copernicus CAMS air quality telemetry, and trace gases.
3. Scroll to **Prediction Centre** and click **Attempt Model Fit** to train an explainable Scikit-learn `RandomForestRegressor` on 5-year historical reanalysis and view the 6-month recursive forecast corridor.
4. Click the **Bookmark / Save City** button to test SQLite persistence.

---

### Step 4: Quick Launchers (Windows Users)

For Windows users who prefer one-click startup without manually opening multiple terminals:

1. Double-click **`run_backend.bat`** in the repository root to start the Flask API.
2. Double-click **`run_frontend.bat`** in the repository root to start the React Vite server.
3. Open `http://localhost:5173`.

---

## 🧪 Running Automated Tests & Verification

EcoVision includes comprehensive automated test suites covering functional workflows, CPCB station parsing, Haversine matching, input validation, rate limiting, and SQL injection defense.

### 1. Run Backend Automated Test Suite (36 Tests)
Activate the backend virtual environment and execute:

```bash
# Run all 36 test cases across unit, integration, and security suites
python -m unittest discover -s backend/tests -v
```

* **Expected Result:** `Ran 36 tests in ~0.8s ... OK (100% Pass Rate)`.

### 2. Verify Frontend Production Build
```bash
cd frontend
npm run build
```

* **Expected Result:** Vite transforms 2,600+ modules and produces optimized production bundles in `frontend/dist/` with 0 errors.

### 3. Run Security & Vulnerability Audits
```bash
# Backend Python dependency audit
pip-audit

# Frontend Node.js dependency audit
npm --prefix frontend audit
```

* **Expected Result:** `0 known vulnerabilities` across all production dependencies.

---

## 📂 Project Directory Structure

```
ECOVISION/
├── docs/
│   └── thesis/
│       ├── EcoVision_Complete_Project_Thesis.pdf    # 132-page comprehensive academic monograph
│       └── EcoVision_Thesis_Source.md               # 4,690-line unabridged Markdown thesis source
│
├── backend/                                         # Python Flask REST API & Machine Learning
│   ├── app/
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── health.py                            # /api/health probe with SQLite & API diagnostics
│   │   │   ├── metrics.py                           # /api/metrics/summary & timeseries endpoints
│   │   │   └── environmental.py                     # /api/cities/*, /api/environmental/*
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── cpcb_service.py                      # CPCB CAAQMS XML RSS ingestion, Haversine & NAQI
│   │   │   ├── open_meteo.py                        # Open-Meteo weather, air quality & ERA5 client
│   │   │   ├── analysis_service.py                  # EIS scoring, rolling trends, insights engine
│   │   │   ├── data_service.py                      # SQLite persistence & query operations
│   │   │   ├── ml_service.py                        # RandomForestRegressor 6-month climate predictor
│   │   │   ├── rate_limiter.py                      # Thread-safe sliding-window rate limiter
│   │   │   └── validators.py                        # IEEE 754 float & coordinate sanitizers
│   │   ├── __init__.py                              # Flask application factory (create_app)
│   │   ├── config.py                                # Dev, Testing, and Production configs
│   │   └── database.py                              # SQLite connection manager, WAL mode & DDL
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── run_live_smoke_test.py                   # Live HTTP loopback integration runner
│   │   ├── test_cpcb_and_aqi.py                     # CPCB parsing, Haversine & AQI tests (7)
│   │   ├── test_functional_regression.py            # Functional API regression tests (13)
│   │   └── test_security_and_hardening.py           # Security, rate limit & float tests (16)
│   ├── requirements.txt                             # Audited Python dependency manifest
│   ├── run.py                                       # WSGI server entrypoint (http://127.0.0.1:5000)
│   ├── ecovision.db                                 # Embedded SQLite production/dev database
│   └── .env.example                                 # Environment configuration template
│
├── frontend/                                        # React 19 Client Presentation Layer
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.jsx                       # Header with live Flask & SQLite status indicator
│   │   │   └── dashboard/
│   │   │       ├── CitySearch.jsx                   # Debounced autocomplete search dropdown
│   │   │       ├── CityHeader.jsx                   # Active municipality header & data provenance
│   │   │       ├── MetricCard.jsx                   # Environmental KPI cards with health benchmarks
│   │   │       ├── EnvironmentalChart.jsx           # 24-hr Recharts area & line series with multi-tab selector
│   │   │       ├── PollutantBreakdown.jsx           # 7 chemical pollutants & monitoring station tag
│   │   │       ├── EnvironmentalScoringCard.jsx     # Radial EIS gauge (0-100) & sub-criteria breakdown
│   │   │       ├── HistoricalTrendsView.jsx         # 7-day longitudinal telemetry view & weekly table
│   │   │       ├── InsightsAndRecommendations.jsx   # Rule-based health advisories & action guidance
│   │   │       ├── PredictionCenter.jsx             # ML 6-month forecast, RF vs baseline charts & metrics
│   │   │       ├── DatabaseSavedCities.jsx          # SQLite persisted bookmark drawer
│   │   │       ├── BackendStatusPanel.jsx           # Real-time backend engine diagnostics
│   │   │       └── UnavailableDataAlert.jsx         # Informative fallback banner when sensors are offline
│   │   ├── services/
│   │   │   └── api.js                               # Unified Axios/Fetch API client with race-condition guards
│   │   ├── App.jsx                                  # Master dashboard layout & state orchestrator
│   │   ├── index.css                                # Tailwind CSS v4 directives & glassmorphic tokens
│   │   └── main.jsx                                 # React DOM bootstrap mount
│   ├── index.html                                   # HTML5 host document & metadata
│   ├── vite.config.js                               # Vite build configuration with /api reverse proxy
│   └── package.json                                 # Frontend package manifest & scripts
│
├── .gitignore                                       # Exclusion rules for Python, Node, caches, and secrets
├── README.md                                        # Master project manual & getting started guide
├── run_backend.bat                                  # Windows one-click batch launcher for Flask API
└── run_frontend.bat                                 # Windows one-click batch launcher for React Vite
```

---

## 🔍 Verified REST API Endpoints Matrix

| HTTP Method | Endpoint URI | Description | Parameters | Sample Success Response |
|---|---|---|---|---|
| `GET` | `/api/health` | Backend & database health probe | None | `{"status": "healthy", "database": "connected"}` |
| `GET` | `/api/cities/search` | Geocoding city autocomplete | `q` (string, min 2 chars) | `{"cities": [{"name": "Delhi", "lat": 28.61, ...}]}` |
| `GET` | `/api/environmental/data` | Real-time weather, AQI & gases | `lat`, `lon`, `name` | `{"weather": {...}, "air_quality": {...}}` |
| `GET` | `/api/environmental/analysis` | EIS composite score & trends | `lat`, `lon`, `days` (7/14/30) | `{"score": 82.4, "trends": {...}, "insights": [...]}` |
| `GET` | `/api/environmental/prediction`| 6-month Random Forest forecast | `lat`, `lon`, `force_retrain` | `{"projections": [...], "metrics": {"mae": 0.82}}` |
| `GET` | `/api/cities/saved` | List bookmarked cities | None | `{"saved_cities": [{"id": 1, "name": "Delhi"}]}` |
| `POST`| `/api/cities/saved` | Bookmark/persist a city | JSON body: `{name, lat, lon}` | `{"message": "City saved successfully", "id": 1}` |
| `DELETE`| `/api/cities/saved/<id>` | Remove municipal bookmark | `id` (integer) | `{"message": "City removed from saved list"}` |

---

## 🌐 Dual AQI Standard & Data Provenance

EcoVision implements an academically rigorous, dual-standard environmental ingestion architecture:

### 1. Indian Municipalities (CPCB National Air Quality Index)
* **Data Source:** Official Central Pollution Control Board (CPCB) Continuous Ambient Air Quality Monitoring Stations (CAAQMS) XML RSS live feeds.
* **Station Matching:** Haversine great-circle geodesic formula selects the nearest active physical monitoring station within statutory radii.
* **Calculation:** Statutory piecewise linear sub-index interpolation across 8 criteria pollutants ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{SO}_2$, $\text{CO}$, $\text{O}_3$, $\text{NH}_3$, $\text{Pb}$).
* **Completeness Rule:** Requires a minimum of 3 valid pollutant sub-indices, with at least one particulate parameter ($\text{PM}_{2.5}$ or $\text{PM}_{10}$) mandatory.
* **Provenance Tag:** The dashboard explicitly displays `Source: CPCB Ground Station (<Station Name>)` alongside the station's exact physical coordinates.

### 2. International Municipalities (Copernicus CAMS & US EPA AQI)
* **Data Source:** European Centre for Medium-Range Weather Forecasts (ECMWF) Copernicus Atmosphere Monitoring Service (CAMS) 0.4° reanalysis grid via Open-Meteo.
* **Standard:** Standard United States Environmental Protection Agency (US EPA) Air Quality Index (0–500 scale).
* **Provenance Tag:** Explicitly marked as `Copernicus CAMS Atmospheric Reanalysis Model`, prohibiting false claims of on-site physical hardware deployment.

---

## 📊 Environmental Indicator Scoring (EIS) Engine

The Environmental Indicator Score (EIS) is a transparent, multi-criteria normalization framework that maps multi-modal telemetry onto an intuitive **0–100 scale** (where 100 represents optimal environmental quality):

| Indicator | Weight | Raw Ideal Range | Mathematical Normalization Logic |
|---|---|---|---|
| **Air Quality** | 35% | 0–50 (Good) | Piecewise mapping: AQI $\le 50 \rightarrow 90\text{--}100$; AQI $51\text{--}100 \rightarrow 70\text{--}89.9$; AQI $> 300 \rightarrow 0\text{--}19.9$. |
| **Ambient Temperature** | 25% | 18–24°C | Human-thermal comfort curve: $18\text{--}24^\circ\text{C}$ scores 100; mild warmth ($24\text{--}28^\circ\text{C}$) scores $78\text{--}90$; extreme heat ($>36^\circ\text{C}$) scores $< 40$. |
| **Relative Humidity** | 20% | 40–60% | Gaussian-style bell curve centered at 50%: decays gracefully as air becomes arid ($< 30\%$) or excessively muggy ($> 75\%$). |
| **Precipitation** | 20% | 0.5–8.0 mm | Cleansing rain scores $90\text{--}100$; dry conditions score 75 (neutral); severe storm runoff ($> 25\text{ mm}$) scores down to 25 due to urban flooding. |

### Strict Completeness & Dynamic Re-Weighting:
* **Sufficiency Threshold:** A composite score is computed **only when at least 3 of the 4 indicators are valid**. If fewer than 3 indicators exist, the system returns `None` and displays `"Insufficient Data"`.
* **Zero Missing-as-Zero Policy:** Missing parameters are never substituted with 0. The remaining valid indicator weights are dynamically re-allocated:
  $$w_k' = \frac{w_k}{\sum_{j \in \mathcal{K}_{\text{obs}}} w_j}$$

---

## 🤖 Machine Learning Climate Forecasting Architecture

EcoVision features an explainable time-series machine learning model designed with Scikit-learn and historical reanalysis from the **Open-Meteo Historical Archive (ERA5 / ERA5-Land)**.

* **Algorithm:** `sklearn.ensemble.RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)`
* **Input Features:** Calendar `month` (1–12), `year`, 1-month lag temperature ($T_{t-1}$), rolling 2-month average temperature ($\frac{T_{t-1}+T_{t-2}}{2}$), rolling 3-month average temperature ($\frac{T_{t-1}+T_{t-2}+T_{t-3}}{3}$), and 1-month lag precipitation sum ($R_{t-1}$).
* **Chronological Holdout Validation:** Strict temporal holdout (training on earlier months, testing on the final 12 chronological months). Zero random shuffling prevents temporal data leakage.
* **Seasonal Baseline Benchmark:** Benchmark against a naive historical monthly mean ($\bar{T}_m$). The system reports both Random Forest and Baseline **MAE** and **RMSE** to verify that machine learning provides genuine predictive value over seasonal repetition.
* **Autoregressive 6-Month Projection:** Computes step-by-step recursive forecasts ($t+1 \rightarrow t+6$), feeding predicted temperatures back into subsequent lag vectors with expanding confidence corridors:
  $$\text{Corridor}_{t+h} = \hat{y}_{t+h} \pm z_{\alpha/2} \cdot \hat{\sigma} \sqrt{1 + \frac{h}{6}}$$

---

## 🔒 Security Hardening Controls

EcoVision is engineered to enterprise security standards:

1. **Sliding-Window Rate Limiter:** Zero external Redis/Memcached dependencies. In-memory thread-safe sliding windows per client IP protect endpoints against DDoS and CPU-exhaustion attacks.
2. **IEEE 754 Coordinate Sanitization:** Rejects `NaN`, `+Infinity`, `-Infinity`, and non-numeric inputs. Latitude is clamped to $[-90.0, 90.0]$ and longitude to $[-180.0, 180.0]$.
3. **CORS Origin Whitelisting:** Strict origin validation. In production, wildcard `CORS_ORIGINS=*` is rejected on startup.
4. **Global Payload Capping:** `MAX_CONTENT_LENGTH = 1MB` prevents memory-exhaustion attacks.
5. **Database Parameterization:** 100% of SQLite queries utilize parameterized `?` placeholders, eliminating SQL injection.
6. **Exception Masking & Uniform JSON Envelopes:** Internal tracebacks and local file paths are masked behind uniform JSON error payloads (`{"error": "...", "status": 4xx/5xx}`).
7. **Security Response Headers:** Emits `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## ❓ Troubleshooting Guide

| Problem / Symptom | Root Cause | Resolution |
|---|---|---|
| `Port 5000 is already in use` | Another Flask, AirPlay, or Python process is bound to port 5000 | Terminate the occupying process or run `python run.py --port 5001` and update `vite.config.js`. |
| `Failed to fetch prediction models (404)` | Outdated API route called or query parameters malformed | Ensure the frontend is calling `/api/environmental/prediction?lat=...&lon=...`. |
| `PowerShell script execution disabled (PSSecurityException)` | Windows PowerShell default execution policy blocks `activate.ps1` | Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in your PowerShell window. |
| `CORS Error: Origin not allowed` | Frontend port is not listed in `backend/.env` | Verify that `CORS_ORIGINS` in `backend/.env` contains your exact frontend URL (e.g. `http://localhost:5173`). |
| `CPCB Data Unavailable Banner` | Target city is outside India or the physical monitoring station is temporarily offline | Normal behavior. The system gracefully falls back to Open-Meteo CAMS atmospheric reanalysis. |

---

## 📜 Academic Attribution & License

* **Project:** EcoVision — City Environmental Monitoring, Analysis and Prediction System
* **Academic Session:** 2025–2026
* **License:** Educational & Academic Open-Source License
* **External Telemetry Credits:**
  * [Central Pollution Control Board (CPCB), Ministry of Environment, Forest and Climate Change, Govt. of India](https://cpcb.nic.in/)
  * [Open-Meteo Weather API](https://open-meteo.com/) (Open-source weather data via Copernicus ECMWF ERA5)
  * [Copernicus Atmosphere Monitoring Service (CAMS)](https://atmosphere.copernicus.eu/)
