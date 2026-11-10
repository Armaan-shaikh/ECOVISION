from datetime import datetime, timezone
from flask import Blueprint, jsonify
from ..database import get_saved_cities, get_latest_observation
from ..services.open_meteo import fetch_environmental_data
from ..services.rate_limiter import rate_limit

metrics_bp = Blueprint("metrics", __name__)

# Default location if no city has been searched yet (London, UK)
DEFAULT_CITY = {
    "name": "London",
    "state": "England",
    "country": "United Kingdom",
    "latitude": 51.50853,
    "longitude": -0.12574,
    "timezone": "Europe/London"
}

@metrics_bp.route("/summary", methods=["GET"])
@rate_limit(max_requests=60, window_seconds=60.0)
def get_metrics_summary():
    """
    Return latest verified environmental metrics from SQLite or live Open-Meteo.
    Removes mock telemetry to comply with Project Rules.
    """
    saved_cities = get_saved_cities(limit=1)
    if saved_cities:
        city = saved_cities[0]
        obs = get_latest_observation(city["id"])
        if obs:
            return jsonify({
                "city": {
                    "name": city["name"],
                    "state": city.get("state", ""),
                    "country": city["country"],
                    "latitude": city["latitude"],
                    "longitude": city["longitude"],
                },
                "observation": obs,
                "data_source": obs.get("data_source", "Open-Meteo & CAMS"),
                "last_updated": obs.get("recorded_at")
            }), 200

    # If no saved observations yet, fetch real baseline from Open-Meteo
    data = fetch_environmental_data(DEFAULT_CITY["latitude"], DEFAULT_CITY["longitude"], DEFAULT_CITY["timezone"])
    if not data or not data.get("current"):
        return jsonify({
            "status": "unavailable",
            "message": "Environmental telemetry temporarily unavailable."
        }), 503

    return jsonify({
        "city": DEFAULT_CITY,
        "observation": data["current"],
        "data_source": data.get("data_source"),
        "last_updated": data.get("last_updated")
    }), 200

@metrics_bp.route("/timeseries", methods=["GET"])
@rate_limit(max_requests=60, window_seconds=60.0)
def get_metrics_timeseries():
    """
    Return real 24-hour environmental trend series from Open-Meteo API.
    """
    saved_cities = get_saved_cities(limit=1)
    lat = saved_cities[0]["latitude"] if saved_cities else DEFAULT_CITY["latitude"]
    lon = saved_cities[0]["longitude"] if saved_cities else DEFAULT_CITY["longitude"]
    tz = saved_cities[0].get("timezone", "auto") if saved_cities else DEFAULT_CITY["timezone"]

    data = fetch_environmental_data(lat, lon, tz_name=tz)
    if not data or not data.get("hourly_series"):
        return jsonify({
            "timeframe": "Last 24 Hours",
            "series": []
        }), 200

    return jsonify({
        "timeframe": "24-Hour Environmental Dynamics",
        "city": saved_cities[0]["name"] if saved_cities else DEFAULT_CITY["name"],
        "series": data.get("hourly_series", [])
    }), 200
