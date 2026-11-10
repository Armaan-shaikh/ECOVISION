from datetime import datetime, timezone
import sys
import flask
import pandas as pd
import numpy as np
import sklearn
from flask import Blueprint, jsonify, current_app
from ..database import check_db_health
from ..services.rate_limiter import rate_limit

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
@health_bp.route("/healthz", methods=["GET"])
@rate_limit(max_requests=120, window_seconds=60.0)
def health_check():
    """Health check endpoint to verify backend status, SQLite database, and API reachability."""
    db_status = check_db_health()
    is_healthy = db_status.get("status") == "connected"
    
    response = {
        "status": "healthy" if is_healthy else "degraded",
        "service": current_app.config.get("PROJECT_NAME", "EcoVision"),
        "description": current_app.config.get("DESCRIPTION", ""),
        "version": current_app.config.get("VERSION", "0.2.0"),
        "environment": current_app.config.get("ENV", "development"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "type": "SQLite",
            "status": db_status.get("status"),
            "cities_registered": db_status.get("cities_count", 0),
            "observations_recorded": db_status.get("observations_count", 0),
            "monthly_history_records": db_status.get("monthly_history_count", 0)
        },
        "environmental_apis": {
            "geocoding": "Open-Meteo Geocoding API",
            "weather": "Open-Meteo Weather Forecast API",
            "air_quality": "Open-Meteo Air Quality (CAMS) API",
            "cpcb_ground_network": "Central Pollution Control Board (CAAQMS)",
            "primary_aqi_scale": "India National AQI (CPCB) & US EPA (0–500)"
        },
        "analytics_stack": {
            "python": sys.version.split(" ")[0],
            "flask": flask.__version__,
            "pandas": pd.__version__,
            "numpy": np.__version__,
            "scikit_learn": sklearn.__version__
        }
    }
    
    status_code = 200 if is_healthy else 503
    return jsonify(response), status_code
