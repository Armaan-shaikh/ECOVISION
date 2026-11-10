"""
Open-Meteo Environmental Data Service for EcoVision
Fetches real-world city geocoding, meteorological, and air quality telemetry.
Uses Python standard libraries and Pandas for historical aggregation.
"""

import json
import logging
import urllib.request
import urllib.parse
from datetime import datetime, timezone
import pandas as pd

logger = logging.getLogger(__name__)

USER_AGENT = "EcoVision-EnvironmentalSystem/1.0 (Educational College Project)"

# Bounded in-memory cache for live environmental data (TTL 5 minutes)
_LIVE_CACHE: dict[str, dict] = {}
MAX_LIVE_CACHE_ENTRIES = 64
LIVE_CACHE_TTL_SECONDS = 300

def search_cities(query: str, limit: int = 5) -> list[dict]:
    """
    Search for cities matching the name using Open-Meteo Geocoding API.
    Returns city name, state (admin1), country, coordinates, and timezone.
    """
    if not query or len(query.strip()) < 2:
        return []

    encoded_query = urllib.parse.quote(query.strip())
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_query}&count={limit}&language=en&format=json"

    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status != 200:
                return []
            data = json.loads(response.read().decode("utf-8"))
            results = data.get("results", [])
            
            cities = []
            for r in results:
                cities.append({
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "state": r.get("admin1", ""),
                    "country": r.get("country", ""),
                    "country_code": r.get("country_code", ""),
                    "latitude": r.get("latitude"),
                    "longitude": r.get("longitude"),
                    "timezone": r.get("timezone", "UTC"),
                    "elevation": r.get("elevation")
                })
            return cities
    except Exception as e:
        logger.warning("Error calling Open-Meteo Geocoding API: %s", e)
        return []

def get_aqi_category(us_aqi: int | None) -> dict:
    """
    Categorize US EPA Air Quality Index into standard health impact levels.
    AQI Scale: 0-50 Good, 51-100 Moderate, 101-150 Sensitive, 151-200 Unhealthy, etc.
    """
    if us_aqi is None:
        return {"category": "Unavailable", "color": "gray", "description": "No data available"}
    
    if us_aqi <= 50:
        return {"category": "Good", "color": "emerald", "description": "Air quality is satisfactory and poses little or no risk."}
    elif us_aqi <= 100:
        return {"category": "Moderate", "color": "teal", "description": "Air quality is acceptable; very sensitive individuals should monitor symptoms."}
    elif us_aqi <= 150:
        return {"category": "Unhealthy for Sensitive Groups", "color": "amber", "description": "Members of sensitive groups may experience health effects."}
    elif us_aqi <= 200:
        return {"category": "Unhealthy", "color": "orange", "description": "Everyone may begin to experience health effects; sensitive groups may feel serious effects."}
    elif us_aqi <= 300:
        return {"category": "Very Unhealthy", "color": "rose", "description": "Health alert: risk of health effects increased for all residents."}
    else:
        return {"category": "Hazardous", "color": "purple", "description": "Health warning of emergency conditions. Entire population is affected."}

def fetch_environmental_data(latitude: float, longitude: float, tz_name: str = "auto") -> dict | None:
    """
    Fetch live weather and air quality observations from Open-Meteo APIs for given coordinates.
    Merges weather (temperature, humidity, rain) and atmospheric data (US AQI, PM2.5, PM10, etc.).
    Employs 5-minute bounded in-memory caching to avoid redundant external network requests.
    """
    cache_key = f"{round(latitude, 4)}_{round(longitude, 4)}"
    now = datetime.now(timezone.utc)
    
    if cache_key in _LIVE_CACHE:
        entry = _LIVE_CACHE[cache_key]
        if (now - entry["cached_at"]).total_seconds() < LIVE_CACHE_TTL_SECONDS:
            return entry["data"]

    weather_url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m"
        f"&hourly=temperature_2m,relative_humidity_2m,precipitation,rain"
        f"&past_days=1&forecast_days=1"
        f"&timezone={urllib.parse.quote(tz_name or 'auto')}"
    )

    air_quality_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={latitude}&longitude={longitude}"
        f"&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
        f"&hourly=us_aqi,pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone"
        f"&past_days=1&forecast_days=1"
        f"&timezone={urllib.parse.quote(tz_name or 'auto')}"
    )

    weather_data = None
    air_quality_data = None

    # Fetch Weather
    try:
        req_w = urllib.request.Request(weather_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req_w, timeout=10) as res_w:
            if res_w.status == 200:
                weather_data = json.loads(res_w.read().decode("utf-8"))
    except Exception as e:
        logger.warning("Error fetching Open-Meteo weather for (%s, %s): %s", latitude, longitude, e)

    # Fetch Air Quality
    try:
        req_aq = urllib.request.Request(air_quality_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req_aq, timeout=10) as res_aq:
            if res_aq.status == 200:
                air_quality_data = json.loads(res_aq.read().decode("utf-8"))
    except Exception as e:
        logger.warning("Error fetching Open-Meteo air quality for (%s, %s): %s", latitude, longitude, e)

    if not weather_data and not air_quality_data:
        return None

    w_curr = weather_data.get("current", {}) if weather_data else {}
    aq_curr = air_quality_data.get("current", {}) if air_quality_data else {}

    current_time = w_curr.get("time") or aq_curr.get("time") or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
    us_aqi_val = aq_curr.get("us_aqi")
    aqi_category_info = get_aqi_category(us_aqi_val)

    current_snapshot = {
        "observation_time": current_time,
        "temperature": w_curr.get("temperature_2m"),
        "temperature_unit": "°C",
        "relative_humidity": w_curr.get("relative_humidity_2m"),
        "humidity_unit": "%",
        "precipitation": w_curr.get("precipitation"),
        "rain": w_curr.get("rain"),
        "rain_unit": "mm",
        "wind_speed": w_curr.get("wind_speed_10m"),
        "wind_unit": "km/h",
        "weather_code": w_curr.get("weather_code"),
        "aqi": us_aqi_val,
        "aqi_scale": "US EPA AQI",
        "aqi_category": aqi_category_info["category"],
        "aqi_description": aqi_category_info["description"],
        "european_aqi": aq_curr.get("european_aqi"),
        "pm25": aq_curr.get("pm2_5"),
        "pm25_unit": "µg/m³",
        "pm10": aq_curr.get("pm10"),
        "pm10_unit": "µg/m³",
        "no2": aq_curr.get("nitrogen_dioxide"),
        "no2_unit": "µg/m³",
        "so2": aq_curr.get("sulphur_dioxide"),
        "so2_unit": "µg/m³",
        "co": aq_curr.get("carbon_monoxide"),
        "co_unit": "µg/m³",
        "ozone": aq_curr.get("ozone"),
        "ozone_unit": "µg/m³",
        "data_source": "Open-Meteo Weather API & Copernicus Atmosphere Monitoring Service (CAMS)",
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }

    # Build aligned hourly time series for charts
    hourly_series = []
    w_hourly = weather_data.get("hourly", {}) if weather_data else {}
    aq_hourly = air_quality_data.get("hourly", {}) if air_quality_data else {}

    time_list = w_hourly.get("time") or aq_hourly.get("time") or []

    w_temps = w_hourly.get("temperature_2m", [])
    w_hums = w_hourly.get("relative_humidity_2m", [])
    w_precips = w_hourly.get("precipitation", [])
    aq_aqis = aq_hourly.get("us_aqi", [])
    aq_pm25 = aq_hourly.get("pm2_5", [])
    aq_pm10 = aq_hourly.get("pm10", [])
    aq_no2 = aq_hourly.get("nitrogen_dioxide", [])
    aq_so2 = aq_hourly.get("sulphur_dioxide", [])
    aq_o3 = aq_hourly.get("ozone", [])

    for idx, t_str in enumerate(time_list):
        try:
            dt = datetime.fromisoformat(t_str)
            display_label = dt.strftime("%H:00")
            full_date = dt.strftime("%b %d, %H:00")
        except Exception:
            display_label = t_str[-5:]
            full_date = t_str

        hourly_series.append({
            "iso_time": t_str,
            "time": display_label,
            "full_date": full_date,
            "temperature": w_temps[idx] if idx < len(w_temps) else None,
            "humidity": w_hums[idx] if idx < len(w_hums) else None,
            "precipitation": w_precips[idx] if idx < len(w_precips) else None,
            "aqi": aq_aqis[idx] if idx < len(aq_aqis) else None,
            "pm25": aq_pm25[idx] if idx < len(aq_pm25) else None,
            "pm10": aq_pm10[idx] if idx < len(aq_pm10) else None,
            "no2": aq_no2[idx] if idx < len(aq_no2) else None,
            "so2": aq_so2[idx] if idx < len(aq_so2) else None,
            "ozone": aq_o3[idx] if idx < len(aq_o3) else None,
        })

    if len(hourly_series) > 36:
        hourly_series = hourly_series[12:48]

    result = {
        "current": current_snapshot,
        "hourly_series": hourly_series,
        "data_source": "Open-Meteo Weather API & Copernicus Atmosphere (CAMS)",
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

    # Cache with bounded size eviction
    if len(_LIVE_CACHE) >= MAX_LIVE_CACHE_ENTRIES:
        oldest_k = min(_LIVE_CACHE.keys(), key=lambda k: _LIVE_CACHE[k]["cached_at"])
        _LIVE_CACHE.pop(oldest_k, None)

    _LIVE_CACHE[cache_key] = {
        "data": result,
        "cached_at": now
    }

    return result

def fetch_historical_environmental_data(latitude: float, longitude: float, days: int = 7, tz_name: str = "auto") -> pd.DataFrame:
    """
    Fetch daily historical meteorological records and daily aggregated atmospheric observations.
    Supported days: 7, 14, 30.
    Returns a unified Pandas DataFrame with daily temperature, rainfall, humidity, and air quality metrics.
    """
    # Safe bounds
    bounded_days = min(max(int(days), 3), 30)

    weather_url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        f"&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,rain_sum"
        f"&hourly=relative_humidity_2m"
        f"&past_days={bounded_days}&forecast_days=0"
        f"&timezone={urllib.parse.quote(tz_name or 'auto')}"
    )

    air_quality_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality"
        f"?latitude={latitude}&longitude={longitude}"
        f"&hourly=us_aqi,pm2_5,pm10"
        f"&past_days={bounded_days}&forecast_days=0"
        f"&timezone={urllib.parse.quote(tz_name or 'auto')}"
    )

    w_data = None
    aq_data = None

    try:
        req_w = urllib.request.Request(weather_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req_w, timeout=12) as res_w:
            if res_w.status == 200:
                w_data = json.loads(res_w.read().decode("utf-8"))
    except Exception as e:
        logger.warning("Error fetching historical weather for (%s, %s): %s", latitude, longitude, e)

    try:
        req_aq = urllib.request.Request(air_quality_url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req_aq, timeout=12) as res_aq:
            if res_aq.status == 200:
                aq_data = json.loads(res_aq.read().decode("utf-8"))
    except Exception as e:
        logger.warning("Error fetching historical air quality for (%s, %s): %s", latitude, longitude, e)

    if not w_data or "daily" not in w_data:
        return pd.DataFrame()

    # 1. Base daily weather DataFrame
    daily_weather = pd.DataFrame(w_data["daily"])
    daily_weather["date"] = pd.to_datetime(daily_weather["time"]).dt.strftime("%Y-%m-%d")

    # 2. Hourly humidity to daily mean
    if "hourly" in w_data and "relative_humidity_2m" in w_data["hourly"]:
        h_df = pd.DataFrame(w_data["hourly"])
        h_df["date"] = pd.to_datetime(h_df["time"]).dt.strftime("%Y-%m-%d")
        daily_hum = h_df.groupby("date")["relative_humidity_2m"].mean().reset_index()
        daily_hum = daily_hum.rename(columns={"relative_humidity_2m": "humidity_mean"})
        daily_weather = daily_weather.merge(daily_hum, on="date", how="left")
    else:
        daily_weather["humidity_mean"] = None

    # 3. Hourly air quality to daily mean
    if aq_data and "hourly" in aq_data and "time" in aq_data["hourly"]:
        aq_df = pd.DataFrame(aq_data["hourly"])
        aq_df["date"] = pd.to_datetime(aq_df["time"]).dt.strftime("%Y-%m-%d")
        agg_map = {}
        for col in ["us_aqi", "pm2_5", "pm10"]:
            if col in aq_df.columns:
                agg_map[col] = "mean"
            else:
                daily_weather[col] = None

        if agg_map:
            daily_aq = aq_df.groupby("date").agg(agg_map).reset_index()
            daily_weather = daily_weather.merge(daily_aq, on="date", how="left")
        else:
            for col in ["us_aqi", "pm2_5", "pm10"]:
                daily_weather[col] = None
    else:
        daily_weather["us_aqi"] = None
        daily_weather["pm2_5"] = None
        daily_weather["pm10"] = None

    return daily_weather

def fetch_5year_monthly_history(latitude: float, longitude: float, tz_name: str = "auto") -> pd.DataFrame:
    """
    Fetch ~5 years of historical meteorological reanalysis data from Open-Meteo Historical Archive API.
    Aggregates daily records into monthly means (temp) and totals (rainfall).
    ERA5 / ERA5-Land Reanalysis data provides consistent global climate records.
    """
    try:
        now = datetime.now(timezone.utc)
        start_year = now.year - 5
        start_date = f"{start_year}-01-01"

        # Archive data is complete up through the previous month
        first_of_curr_month = now.replace(day=1)
        last_of_prev_month = first_of_curr_month - pd.Timedelta(days=1)
        end_date = last_of_prev_month.strftime("%Y-%m-%d")

        tz_encoded = urllib.parse.quote(tz_name) if tz_name else "auto"
        url = (
            f"https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={latitude}&longitude={longitude}"
            f"&start_date={start_date}&end_date={end_date}"
            f"&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum"
            f"&timezone={tz_encoded}"
        )

        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=35) as response:
            if response.status != 200:
                logger.warning("Open-Meteo archive API returned status %s for (%s, %s)", response.status, latitude, longitude)
                return pd.DataFrame()
            data = json.loads(response.read().decode("utf-8"))

        daily_data = data.get("daily", {})
        if not daily_data or "time" not in daily_data or not daily_data["time"]:
            return pd.DataFrame()

        df = pd.DataFrame(daily_data)
        df["date"] = pd.to_datetime(df["time"])
        df["year"] = df["date"].dt.year
        df["month"] = df["date"].dt.month
        df["year_month"] = df["date"].dt.strftime("%Y-%m")

        # Convert numeric columns
        for col in ["temperature_2m_mean", "temperature_2m_max", "temperature_2m_min", "precipitation_sum"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        monthly_df = df.groupby(["year", "month", "year_month"], as_index=False).agg({
            "temperature_2m_mean": "mean",
            "temperature_2m_min": "min",
            "temperature_2m_max": "max",
            "precipitation_sum": "sum"
        }).sort_values(["year", "month"]).reset_index(drop=True)

        monthly_df = monthly_df.rename(columns={
            "temperature_2m_mean": "temperature_mean",
            "temperature_2m_min": "temperature_min",
            "temperature_2m_max": "temperature_max"
        })

        monthly_df["temperature_mean"] = monthly_df["temperature_mean"].round(1)
        monthly_df["temperature_min"] = monthly_df["temperature_min"].round(1)
        monthly_df["temperature_max"] = monthly_df["temperature_max"].round(1)
        monthly_df["precipitation_sum"] = monthly_df["precipitation_sum"].round(1)

        return monthly_df

    except Exception as e:
        logger.warning("Error fetching 5-year historical monthly climate data for (%s, %s): %s", latitude, longitude, e)
        return pd.DataFrame()
