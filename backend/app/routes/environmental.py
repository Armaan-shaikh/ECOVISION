import logging
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
from ..services.validators import (
    validate_coordinates,
    sanitize_text,
    validate_city_search_query,
    validate_days_param,
    validate_limit_param,
    ValidationError
)
from ..services.rate_limiter import rate_limit
from ..database import get_or_create_city, save_observation, get_saved_cities, get_latest_observation

logger = logging.getLogger(__name__)

environmental_bp = Blueprint("environmental", __name__)

@environmental_bp.route("/cities/search", methods=["GET"])
@rate_limit(max_requests=60, window_seconds=60.0)
def search_city_endpoint():
    """
    Search for cities worldwide using Open-Meteo Geocoding API.
    Input sanitized and rate-limited.
    """
    raw_query = request.args.get("q")
    try:
        query = validate_city_search_query(raw_query)
    except ValidationError as val_err:
        return jsonify({
            "status": "error",
            "message": val_err.message
        }), 400

    try:
        results = search_cities(query, limit=7)
        return jsonify({
            "query": query,
            "count": len(results),
            "results": results
        }), 200
    except Exception as e:
        logger.error("Error executing city search for '%s': %s", query, e)
        return jsonify({
            "status": "error",
            "message": "City search service encountered an internal error. Please try again.",
            "results": []
        }), 500

@environmental_bp.route("/cities/saved", methods=["GET"])
@rate_limit(max_requests=60, window_seconds=60.0)
def get_saved_cities_endpoint():
    """
    Retrieve list of saved cities and their latest observation snapshot from SQLite.
    Binds limit parameter safely.
    """
    limit = validate_limit_param(request.args.get("limit"), min_val=1, max_val=50, default=15)
    try:
        cities = get_saved_cities(limit=limit)
        return jsonify({"cities": cities}), 200
    except Exception as e:
        logger.error("Error retrieving saved cities: %s", e)
        return jsonify({"status": "error", "message": "Failed to retrieve stored municipality records.", "cities": []}), 500

@environmental_bp.route("/environmental/data", methods=["GET", "POST"])
@environmental_bp.route("/environmental/city", methods=["GET", "POST"])
@rate_limit(max_requests=60, window_seconds=60.0)
def get_environmental_data_endpoint():
    """
    Fetch live environmental & weather data for a city from Open-Meteo & CPCB.
    Enforces strict coordinate validation and input sanitization.
    """
    if request.method == "POST":
        if request.is_json:
            payload = request.get_json() or {}
        elif request.form:
            payload = request.form.to_dict()
        else:
            payload = request.args.to_dict()
    else:
        payload = request.args.to_dict()

    raw_lat = payload.get("lat") or payload.get("latitude")
    raw_lon = payload.get("lon") or payload.get("longitude")

    try:
        lat, lon = validate_coordinates(raw_lat, raw_lon)
    except ValidationError as val_err:
        return jsonify({
            "status": "error",
            "message": val_err.message
        }), 400

    city_name = sanitize_text(payload.get("name") or payload.get("city"), max_length=100, default="Selected Location")
    state = sanitize_text(payload.get("state") or payload.get("admin1"), max_length=100, default="")
    country = sanitize_text(payload.get("country"), max_length=100, default="")
    country_code = sanitize_text(payload.get("country_code"), max_length=10, default="")
    tz_name = sanitize_text(payload.get("timezone"), max_length=50, default="auto")

    try:
        # Fetch verified telemetry from Open-Meteo APIs
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
            logger.warning("SQLite persistence failed for (%s, %s): %s", lat, lon, db_err)
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

    except Exception as e:
        logger.error("Unhandled error in get_environmental_data_endpoint: %s", e, exc_info=True)
        return jsonify({
            "status": "error",
            "message": "An error occurred while processing environmental observations."
        }), 500

@environmental_bp.route("/environmental/analysis", methods=["GET"])
@environmental_bp.route("/analysis", methods=["GET"])
@rate_limit(max_requests=30, window_seconds=60.0)
def get_environmental_analysis_endpoint():
    """
    Environmental Analysis Module endpoint:
    - Strictly validates coordinates and days period
    - Normalizes supported indicators (AQI, Temp, Humidity, Rain) to scores (0-100)
    - Computes historical trends, rule-based insights and recommendations
    """
    raw_lat = request.args.get("lat") or request.args.get("latitude")
    raw_lon = request.args.get("lon") or request.args.get("longitude")

    try:
        lat, lon = validate_coordinates(raw_lat, raw_lon)
    except ValidationError as val_err:
        return jsonify({
            "status": "error",
            "message": val_err.message
        }), 400

    try:
        days = validate_days_param(request.args.get("days"), allowed=(7, 14, 30), default=7)
    except ValidationError as val_err:
        return jsonify({
            "status": "error",
            "message": val_err.message
        }), 400
    city_name = sanitize_text(request.args.get("name") or request.args.get("city"), max_length=100, default="Selected Location")
    state = sanitize_text(request.args.get("state") or request.args.get("admin1"), max_length=100, default="")
    country = sanitize_text(request.args.get("country"), max_length=100, default="")
    tz_name = sanitize_text(request.args.get("timezone"), max_length=50, default="auto")

    try:
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
        logger.error("Environmental analysis processing error for (%s, %s): %s", lat, lon, e, exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Environmental analysis calculation encountered an internal error. Please try again."
        }), 500

@environmental_bp.route("/environmental/prediction", methods=["GET"])
@environmental_bp.route("/prediction", methods=["GET"])
@rate_limit(max_requests=10, window_seconds=60.0) # Strict rate limiting for CPU-intensive ML training
def get_city_prediction_endpoint():
    """
    Step 4: Machine Learning & Environmental Prediction Endpoint
    - Ingests ~5 years of monthly historical climate data (ERA5 reanalysis).
    - Fits Scikit-learn RandomForestRegressor on chronological time-series lags.
    - Protected with strict rate-limiting, coordinate validation, and retraining cooldown.
    """
    raw_lat = request.args.get("lat") or request.args.get("latitude")
    raw_lon = request.args.get("lon") or request.args.get("longitude")

    try:
        lat, lon = validate_coordinates(raw_lat, raw_lon)
    except ValidationError as val_err:
        return jsonify({
            "status": "error",
            "message": val_err.message
        }), 400

    city_name = sanitize_text(request.args.get("name") or request.args.get("city"), max_length=100, default="Selected Location")
    state = sanitize_text(request.args.get("state") or request.args.get("admin1"), max_length=100, default="")
    country = sanitize_text(request.args.get("country"), max_length=100, default="")
    country_code = sanitize_text(request.args.get("country_code"), max_length=10, default="")
    tz_name = sanitize_text(request.args.get("timezone"), max_length=50, default="auto")
    force_retrain = request.args.get("retrain", "false").lower() in ("true", "1", "yes")

    # Resolve or create city_id in SQLite
    raw_id = request.args.get("city_id") or request.args.get("id")
    try:
        city_id = int(raw_id) if raw_id else None
    except (ValueError, TypeError):
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
        except Exception as e:
            logger.warning("Could not resolve city ID for (%s, %s): %s", lat, lon, e)
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
        logger.error("Machine learning forecasting failed for (%s, %s): %s", lat, lon, e, exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Machine learning climate forecasting encountered an internal processing error."
        }), 500
