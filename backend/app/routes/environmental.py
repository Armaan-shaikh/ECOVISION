from flask import Blueprint, request, jsonify
from ..services.open_meteo import (
    search_cities, 
    fetch_environmental_data, 
    fetch_historical_environmental_data
)
from ..services.analysis_service import (
    compute_aqi_score,
    compute_temperature_score,
    compute_humidity_score,
    compute_rainfall_score,
    compute_overall_environmental_score,
    analyze_historical_trends,
    generate_environmental_insights,
    generate_recommendations
)
from ..services.ml_service import get_or_train_city_prediction
from ..services.cpcb_service import fetch_cpcb_ground_data
from ..database import get_or_create_city, save_observation, get_saved_cities, get_latest_observation

environmental_bp = Blueprint("environmental", __name__)

@environmental_bp.route("/cities/search", methods=["GET"])
def search_city_endpoint():
    """Search for cities worldwide using Open-Meteo Geocoding API."""
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"results": []}), 200

    results = search_cities(query, limit=7)
    return jsonify({
        "query": query,
        "count": len(results),
        "results": results
    }), 200

@environmental_bp.route("/cities/saved", methods=["GET"])
def get_saved_cities_endpoint():
    """Retrieve list of saved cities and their latest observation snapshot from SQLite."""
    try:
        cities = get_saved_cities(limit=15)
        return jsonify({"cities": cities}), 200
    except Exception as e:
        return jsonify({"error": str(e), "cities": []}), 500

@environmental_bp.route("/environmental/data", methods=["GET", "POST"])
@environmental_bp.route("/environmental/city", methods=["GET", "POST"])
def get_environmental_data_endpoint():
    """
    Fetch live environmental & weather data for a city from Open-Meteo.
    Automatically stores city and observation in SQLite database.
    """
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
    else:
        payload = request.args.to_dict()

    try:
        lat = float(payload.get("lat") or payload.get("latitude"))
        lon = float(payload.get("lon") or payload.get("longitude"))
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Valid latitude and longitude coordinates are required."
        }), 400

    city_name = payload.get("name") or payload.get("city") or "Selected Location"
    state = payload.get("state") or payload.get("admin1") or ""
    country = payload.get("country") or ""
    country_code = payload.get("country_code") or ""
    tz_name = payload.get("timezone") or "auto"

    # Fetch real data from Open-Meteo APIs
    env_data = fetch_environmental_data(lat, lon, tz_name=tz_name)

    if not env_data or not env_data.get("current"):
        return jsonify({
            "status": "unavailable",
            "message": f"Real-time environmental telemetry is currently unavailable for {city_name}. EcoVision does not invent artificial measurements."
        }), 404

    current_obs = env_data["current"]

    # 1. Preserve Copernicus CAMS atmospheric model estimates
    cams_model = {
        "aqi": current_obs.get("aqi"),
        "aqi_scale": "US EPA AQI (0–500)",
        "aqi_category": current_obs.get("aqi_category"),
        "aqi_description": current_obs.get("aqi_description"),
        "pm25": current_obs.get("pm25"),
        "pm10": current_obs.get("pm10"),
        "no2": current_obs.get("no2"),
        "so2": current_obs.get("so2"),
        "co": current_obs.get("co"),
        "ozone": current_obs.get("ozone"),
        "resolution": "0.1° (~11 km grid) atmospheric model",
        "data_source": "Copernicus Atmosphere Monitoring Service (CAMS)"
    }
    current_obs["cams_model"] = cams_model
    current_obs["cams_aqi"] = current_obs.get("aqi")
    current_obs["cams_scale"] = "US EPA AQI"
    current_obs["cams_category"] = current_obs.get("aqi_category")

    # 2. Ingest official Indian Ground Monitoring Network data (CPCB CAAQMS)
    cpcb_data = fetch_cpcb_ground_data(lat, lon, city_name=city_name, country=country)
    current_obs["ground_monitoring"] = cpcb_data

    if cpcb_data.get("status") == "success":
        # India National AQI is active as the primary standard
        current_obs["aqi"] = cpcb_data.get("aqi")
        current_obs["aqi_scale"] = "India National AQI (CPCB)"
        current_obs["aqi_category"] = cpcb_data.get("aqi_category")
        current_obs["aqi_color"] = cpcb_data.get("aqi_color")
        current_obs["aqi_description"] = cpcb_data.get("aqi_description")
        current_obs["predominant_pollutant"] = cpcb_data.get("predominant_pollutant")
        current_obs["hourly_peak_aqi"] = cpcb_data.get("hourly_peak_aqi")
        current_obs["running_24h_aqi"] = cpcb_data.get("running_24h_aqi")

        # Ground-monitored pollutant levels where available from station
        p_indices = cpcb_data.get("pollutant_sub_indices", {})
        if "PM2.5" in p_indices:
            current_obs["ground_pm25"] = p_indices["PM2.5"].get("concentration_hourly") or p_indices["PM2.5"].get("concentration_24h")
            current_obs["ground_pm25_sub_index"] = p_indices["PM2.5"].get("sub_index_hourly") or p_indices["PM2.5"].get("sub_index_24h")
        if "PM10" in p_indices:
            current_obs["ground_pm10"] = p_indices["PM10"].get("concentration_hourly") or p_indices["PM10"].get("concentration_24h")
            current_obs["ground_pm10_sub_index"] = p_indices["PM10"].get("sub_index_hourly") or p_indices["PM10"].get("sub_index_24h")

        active_aqi_scale = "India National AQI (CPCB)"
        active_data_source = f"CPCB CAAQMS ({cpcb_data['station']['name']}) & Open-Meteo"
    elif cpcb_data.get("status") == "insufficient_data":
        # Inside India, but station fails CPCB data completeness (e.g. <3 pollutants)
        current_obs["aqi"] = None
        current_obs["aqi_scale"] = "India National AQI (CPCB)"
        current_obs["aqi_category"] = "AQI Unavailable"
        current_obs["aqi_description"] = cpcb_data.get("message")
        active_aqi_scale = "India National AQI (CPCB)"
        active_data_source = "Central Pollution Control Board (CPCB) & Open-Meteo"
    else:
        # Outside India or CPCB unavailable: keep Open-Meteo CAMS US EPA AQI
        active_aqi_scale = "US EPA (0–500 scale)"
        active_data_source = env_data.get("data_source", "Open-Meteo & Copernicus CAMS")

    # Store city & observation in SQLite database
    try:
        city_id = get_or_create_city(
            name=city_name,
            state=state,
            country=country,
            country_code=country_code,
            latitude=lat,
            longitude=lon,
            tz_name=tz_name
        )
        saved = save_observation(
            city_id=city_id,
            obs_data=current_obs,
            data_source=active_data_source
        )
        city_info = {
            "id": city_id,
            "name": city_name,
            "state": state,
            "country": country,
            "country_code": country_code,
            "latitude": lat,
            "longitude": lon,
            "timezone": tz_name,
            "stored_in_sqlite": True,
            "new_record_saved": saved
        }
    except Exception as db_err:
        print(f"Warning: SQLite persistence failed: {db_err}")
        city_info = {
            "name": city_name,
            "state": state,
            "country": country,
            "country_code": country_code,
            "latitude": lat,
            "longitude": lon,
            "timezone": tz_name,
            "stored_in_sqlite": False
        }

    return jsonify({
        "status": "success",
        "city": city_info,
        "current": current_obs,
        "hourly_series": env_data.get("hourly_series", []),
        "data_source": active_data_source,
        "aqi_scale": active_aqi_scale,
        "ground_monitoring": cpcb_data,
        "cams_model": cams_model,
        "last_updated": env_data.get("last_updated")
    }), 200

@environmental_bp.route("/environmental/analysis", methods=["GET"])
@environmental_bp.route("/analysis", methods=["GET"])
def get_environmental_analysis_endpoint():
    """
    Environmental Analysis Module endpoint:
    - Normalizes supported indicators (AQI, Temp, Humidity, Rain) to understandable scores (0-100).
    - Fetches and analyzes multi-day historical observations (daily, weekly averages & trends).
    - Generates data-supported environmental insights and actionable recommendations.
    - Reports exact data coverage and metadata.
    """
    try:
        lat = float(request.args.get("lat") or request.args.get("latitude"))
        lon = float(request.args.get("lon") or request.args.get("longitude"))
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            return jsonify({
                "status": "error",
                "message": f"Coordinates out of range: latitude must be between -90 and 90, longitude between -180 and 180."
            }), 400
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Valid latitude and longitude coordinates are required for environmental analysis."
        }), 400

    try:
        days_param = request.args.get("days", "7")
        try:
            days = int(days_param)
            if days not in (7, 14, 30):
                days = 7
        except ValueError:
            days = 7

        city_name = request.args.get("name") or request.args.get("city") or "Selected Location"
        state = request.args.get("state") or request.args.get("admin1") or ""
        country = request.args.get("country") or ""
        tz_name = request.args.get("timezone") or "auto"

        # 1. Fetch current observational snapshot
        env_curr = fetch_environmental_data(lat, lon, tz_name=tz_name)
        current_obs = env_curr.get("current", {}) if env_curr else {}

        # Check for Indian ground monitoring (CPCB CAAQMS)
        cpcb_data = fetch_cpcb_ground_data(lat, lon, city_name=city_name, country=country)
        cpcb_active = (cpcb_data.get("status") == "success")

        # 2. Compute individual Environmental Indicator Scores
        if cpcb_active:
            aqi_score = compute_aqi_score(cpcb_data.get("aqi"), scale="cpcb")
        else:
            aqi_score = compute_aqi_score(current_obs.get("aqi"), scale="us_epa")

        temp_score = compute_temperature_score(current_obs.get("temperature"))
        hum_score = compute_humidity_score(current_obs.get("relative_humidity"))
        rain_score = compute_rainfall_score(current_obs.get("rain"))

        indicator_scores = {
            "aqi": aqi_score,
            "temperature": temp_score,
            "humidity": hum_score,
            "rainfall": rain_score
        }

        # 3. Compute overall composite score (requires at least 3 valid indicators)
        overall_score_result = compute_overall_environmental_score(indicator_scores)

        # 4. Fetch historical observations for requested period (7, 14, or 30 days)
        df_history = fetch_historical_environmental_data(lat, lon, days=days, tz_name=tz_name)

        # 5. Analyze historical trends with Pandas and NumPy
        historical_analysis = analyze_historical_trends(df_history)

        # 6. Generate rule-based environmental insights & targeted recommendations
        insights = generate_environmental_insights(current_obs, historical_analysis, overall_score_result)
        recommendations = generate_recommendations(current_obs, historical_analysis, overall_score_result)

        # 7. Coverage Metadata
        retrieved_count = len(historical_analysis.get("daily_records", []))
        start_date = historical_analysis["daily_records"][0]["date"] if retrieved_count > 0 else None
        end_date = historical_analysis["daily_records"][-1]["date"] if retrieved_count > 0 else None
        coverage_pct = round((retrieved_count / days) * 100.0, 1) if days > 0 else 0.0

        coverage_info = {
            "requested_period_days": days,
            "actual_days_retrieved": retrieved_count,
            "coverage_percentage": coverage_pct,
            "start_date": start_date,
            "end_date": end_date,
            "data_sources": "Open-Meteo Weather Forecast, Historical Archive & Copernicus CAMS Air Quality",
            "sqlite_persisted": False,
            "persistence_note": "Real-time telemetry snapshots are stored in SQLite; multi-day historical trends are computed on demand."
        }

        return jsonify({
            "status": "success",
            "city": {
                "name": city_name,
                "state": state,
                "country": country,
                "latitude": lat,
                "longitude": lon,
                "timezone": tz_name
            },
            "scoring": {
                "overall": overall_score_result,
                "indicators": indicator_scores,
                "aqi_standard": "India National AQI (CPCB)" if cpcb_active else "US EPA AQI",
                "ground_station": cpcb_data.get("station") if cpcb_active else None,
                "weights": {
                    "aqi": "35%",
                    "temperature": "25%",
                    "humidity": "20%",
                    "rainfall": "20%"
                },
                "disclaimer": overall_score_result.get("disclaimer")
            },
            "historical_trends": historical_analysis,
            "insights": insights,
            "recommendations": recommendations,
            "coverage": coverage_info
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Environmental analysis failed: {str(e)}"
        }), 500

@environmental_bp.route("/environmental/prediction", methods=["GET"])
@environmental_bp.route("/prediction", methods=["GET"])
def get_city_prediction_endpoint():
    """
    Step 4: Machine Learning & Environmental Prediction Endpoint
    - Ingests ~5 years of monthly historical climate data (ERA5 reanalysis).
    - Fits Scikit-learn RandomForestRegressor on chronological time-series lags.
    - Evaluates against seasonal-average baseline (MAE, RMSE).
    - Generates recursive 6-month temperature projections.
    - Caches model and projections per city to avoid unnecessary re-training.
    """
    try:
        lat = float(request.args.get("lat") or request.args.get("latitude"))
        lon = float(request.args.get("lon") or request.args.get("longitude"))
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            return jsonify({
                "status": "error",
                "message": "Coordinates out of range: latitude must be between -90 and 90, longitude between -180 and 180."
            }), 400
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Valid latitude and longitude coordinates are required for environmental prediction."
        }), 400

    city_name = request.args.get("name") or request.args.get("city") or "Selected Location"
    state = request.args.get("state") or request.args.get("admin1") or ""
    country = request.args.get("country") or ""
    country_code = request.args.get("country_code") or ""
    tz_name = request.args.get("timezone") or "auto"
    force_retrain = request.args.get("retrain", "false").lower() in ("true", "1", "yes")

    # Resolve or create city_id in SQLite
    raw_id = request.args.get("city_id") or request.args.get("id")
    try:
        city_id = int(raw_id) if raw_id else None
    except ValueError:
        city_id = None

    if not city_id:
        try:
            city_id = get_or_create_city(
                name=city_name,
                state=state,
                country=country,
                country_code=country_code,
                latitude=lat,
                longitude=lon,
                tz_name=tz_name
            )
        except Exception:
            city_id = 1

    try:
        prediction_result = get_or_train_city_prediction(
            city_id=city_id,
            latitude=lat,
            longitude=lon,
            city_name=city_name,
            tz_name=tz_name,
            force_retrain=force_retrain
        )

        status_code = 200 if prediction_result.get("status") in ("success", "unavailable") else 500
        return jsonify(prediction_result), status_code

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Machine learning forecasting failed: {str(e)}"
        }), 500
