"""
EcoVision Environmental Analysis Service
Handles:
1. Environmental Indicator Scoring (EIS) across AQI, Temperature, Rainfall, and Humidity.
2. Historical Trend Analysis (Daily, Weekly, Monthly aggregations, deltas, and coverage).
3. Rule-based Environmental Insights Engine (data-supported, no external AI).
4. Targeted Action Recommendations (context-aware municipal and citizen advisories).
"""

from datetime import datetime, timezone
import numpy as np
import pandas as pd

# Scoring Weights
WEIGHTS = {
    "aqi": 0.35,
    "temperature": 0.25,
    "humidity": 0.20,
    "rainfall": 0.20
}

DISCLAIMER_TEXT = (
    "Project-defined composite environmental indicator for comparative analysis and educational modeling. "
    "This is not an official regulatory health or meteorological standard."
)

def compute_aqi_score(aqi_val: float | int | None, scale: str = "us_epa") -> dict:
    """
    Normalize AQI (0-500) into an Environmental Indicator Score (0-100).
    Higher score indicates cleaner, healthier air.
    Supports:
    - "cpcb": India National AQI (0-50 Good, 51-100 Satisfactory, 101-200 Moderate, 201-300 Poor, 301-400 Very Poor, 401-500 Severe)
    - "us_epa": US EPA AQI standard
    Never treats None as 0.
    """
    unit_label = "India National AQI (CPCB)" if scale == "cpcb" else "US EPA AQI"
    if aqi_val is None or pd.isna(aqi_val):
        return {
            "score": None,
            "raw_value": None,
            "unit": unit_label,
            "status": "No Data",
            "tier": "Unavailable",
            "description": "No air quality telemetry available."
        }
    
    aqi = max(0.0, float(aqi_val))
    if scale == "cpcb":
        # Official CPCB Breakpoint normalization
        if aqi <= 50: # Good (0-50) -> Score 90-100
            score = 100.0 - (aqi / 50.0) * 10.0
            tier = "Good (Minimal Health Impact)"
        elif aqi <= 100: # Satisfactory (51-100) -> Score 75-89.9
            score = 90.0 - ((aqi - 50.0) / 50.0) * 15.0
            tier = "Satisfactory (Minor Discomfort to Sensitive Groups)"
        elif aqi <= 200: # Moderate (101-200) -> Score 50-74.9
            score = 75.0 - ((aqi - 100.0) / 100.0) * 25.0
            tier = "Moderate (Discomfort with Lung/Heart Disease)"
        elif aqi <= 300: # Poor (201-300) -> Score 25-49.9
            score = 50.0 - ((aqi - 200.0) / 100.0) * 25.0
            tier = "Poor (Breathing Discomfort on Prolonged Exposure)"
        elif aqi <= 400: # Very Poor (301-400) -> Score 10-24.9
            score = 25.0 - ((aqi - 300.0) / 100.0) * 15.0
            tier = "Very Poor (Respiratory Illness on Exposure)"
        else: # Severe (401-500) -> Score 0-9.9
            score = max(0.0, 10.0 - ((aqi - 400.0) / 100.0) * 10.0)
            tier = "Severe (Severe Health Impact for All)"
    else:
        # Piecewise linear normalization based on US EPA breakpoints
        if aqi <= 50: # EPA Good (0-50) -> Score 90-100
            score = 100.0 - (aqi / 50.0) * 10.0
            tier = "Optimal Air Quality"
        elif aqi <= 100: # EPA Moderate (51-100) -> Score 70-89.9
            score = 90.0 - ((aqi - 50.0) / 50.0) * 20.0
            tier = "Acceptable Air Quality"
        elif aqi <= 150: # EPA Sensitive (101-150) -> Score 50-69.9
            score = 70.0 - ((aqi - 100.0) / 50.0) * 20.0
            tier = "Moderate Concern (Sensitive Groups)"
        elif aqi <= 200: # EPA Unhealthy (151-200) -> Score 30-49.9
            score = 50.0 - ((aqi - 150.0) / 50.0) * 20.0
            tier = "Unhealthy Atmospheric Burden"
        elif aqi <= 300: # EPA Very Unhealthy (201-300) -> Score 10-29.9
            score = 30.0 - ((aqi - 200.0) / 100.0) * 20.0
            tier = "Severe Pollution Alert"
        else: # EPA Hazardous (301+) -> Score 0-9.9
            score = max(0.0, 10.0 - ((aqi - 300.0) / 200.0) * 10.0)
            tier = "Hazardous Emergency Levels"

    return {
        "score": round(score, 1),
        "raw_value": round(aqi, 1),
        "unit": unit_label,
        "scale": "CPCB (National AQI)" if scale == "cpcb" else "US EPA AQI",
        "status": "Valid",
        "tier": tier,
        "description": f"Index value {round(aqi, 1)} mapped to {round(score, 1)}/100 scale."
    }

def compute_temperature_score(temp_c: float | int | None) -> dict:
    """
    Normalize Ambient Temperature (°C) into a Thermal Comfort Score (0-100).
    Optimal range is mild/temperate (18°C - 24°C).
    Extreme heat (>36°C) or extreme freezing (<0°C) reduces thermal favorability.
    Moderate warm weather (e.g. 26-28°C) is not penalized harshly.
    """
    if temp_c is None or pd.isna(temp_c):
        return {
            "score": None,
            "raw_value": None,
            "unit": "°C",
            "status": "No Data",
            "tier": "Unavailable",
            "description": "No temperature telemetry available."
        }

    t = float(temp_c)
    if 18.0 <= t <= 24.0: # Ideal thermal comfort
        score = 90.0 + (1.0 - abs(t - 21.0) / 3.0) * 10.0
        tier = "Optimal Thermal Comfort"
    elif 14.0 <= t < 18.0: # Mildly cool
        score = 75.0 + ((t - 14.0) / 4.0) * 15.0
        tier = "Mildly Cool / Pleasant"
    elif 24.0 < t <= 28.0: # Mildly warm (summer pleasant)
        score = 78.0 + ((28.0 - t) / 4.0) * 12.0
        tier = "Mildly Warm / Pleasant"
    elif 10.0 <= t < 14.0: # Moderate cool
        score = 60.0 + ((t - 10.0) / 4.0) * 15.0
        tier = "Cool Conditions"
    elif 28.0 < t <= 33.0: # Warm / hot
        score = 55.0 + ((33.0 - t) / 5.0) * 23.0
        tier = "Elevated Heat Burden"
    elif 0.0 <= t < 10.0: # Chilly / cold
        score = 35.0 + (t / 10.0) * 25.0
        tier = "Cold Weather Stress"
    elif 33.0 < t <= 38.0: # Very hot
        score = 30.0 + ((38.0 - t) / 5.0) * 25.0
        tier = "Severe Urban Heat Stress"
    elif t < 0.0: # Sub-zero freeze
        score = max(5.0, 35.0 + (t / 10.0) * 15.0)
        tier = "Sub-Zero Freezing Conditions"
    else: # > 38°C extreme heatwave
        score = max(5.0, 30.0 - ((t - 38.0) / 10.0) * 20.0)
        tier = "Extreme Dangerous Heatwave"

    return {
        "score": round(score, 1),
        "raw_value": round(t, 1),
        "unit": "°C",
        "status": "Valid",
        "tier": tier,
        "description": f"Ambient temperature {round(t, 1)}°C evaluated on thermal comfort baseline."
    }

def compute_humidity_score(hum_pct: float | int | None) -> dict:
    """
    Normalize Relative Humidity (%) into a Moisture Balance Score (0-100).
    Healthy/comfortable outdoor range is 40% - 60%.
    Arid (<20%) or sweltering (>80%) conditions reduce favorability.
    """
    if hum_pct is None or pd.isna(hum_pct):
        return {
            "score": None,
            "raw_value": None,
            "unit": "%",
            "status": "No Data",
            "tier": "Unavailable",
            "description": "No humidity telemetry available."
        }

    h = float(hum_pct)
    if 40.0 <= h <= 60.0: # Ideal respiratory balance
        score = 90.0 + (1.0 - abs(h - 50.0) / 10.0) * 10.0
        tier = "Optimal Moisture Balance"
    elif 30.0 <= h < 40.0: # Mildly dry
        score = 75.0 + ((h - 30.0) / 10.0) * 15.0
        tier = "Mildly Dry Air"
    elif 60.0 < h <= 70.0: # Mildly humid
        score = 75.0 + ((70.0 - h) / 10.0) * 15.0
        tier = "Mildly Humid Air"
    elif 20.0 <= h < 30.0: # Dry
        score = 50.0 + ((h - 20.0) / 10.0) * 25.0
        tier = "Dry Air (Irritation Risk)"
    elif 70.0 < h <= 80.0: # Humid / Muggy
        score = 50.0 + ((80.0 - h) / 10.0) * 25.0
        tier = "High Humidity / Muggy"
    elif h < 20.0: # Arid
        score = max(10.0, (h / 20.0) * 50.0)
        tier = "Arid / Severely Dry"
    else: # > 80% saturated
        score = max(15.0, 50.0 - ((h - 80.0) / 20.0) * 35.0)
        tier = "Saturated / Sweltering Humidity"

    return {
        "score": round(score, 1),
        "raw_value": round(h, 1),
        "unit": "%",
        "status": "Valid",
        "tier": tier,
        "description": f"Relative humidity {round(h, 1)}% evaluated on atmospheric moisture comfort."
    }

def compute_rainfall_score(rain_mm: float | int | None) -> dict:
    """
    Normalize Daily Precipitation / Rainfall (mm) into an Environmental Sufficiency Score (0-100).
    Moderate rain (1-8mm) cleanses particulate dust and hydrates soil (Score 90-100).
    Dry days (0mm) are standard weather and scored comfortably (~75).
    Excessive torrential downpours (>25mm) score lower due to urban runoff and flood risks.
    """
    if rain_mm is None or pd.isna(rain_mm):
        return {
            "score": None,
            "raw_value": None,
            "unit": "mm",
            "status": "No Data",
            "tier": "Unavailable",
            "description": "No rainfall telemetry available."
        }

    r = max(0.0, float(rain_mm))
    if 0.5 <= r <= 8.0: # Beneficial cleansing rain
        score = 90.0 + min(10.0, r * 1.25)
        tier = "Beneficial Cleansing Rain"
    elif r == 0.0: # Dry day (normal)
        score = 75.0
        tier = "Dry / Clear Weather"
    elif 0.0 < r < 0.5: # Trace mist/drizzle
        score = 80.0
        tier = "Light Trace Drizzle"
    elif 8.0 < r <= 20.0: # Moderate heavy rain
        score = 70.0 + ((20.0 - r) / 12.0) * 18.0
        tier = "Moderate Rainfall"
    elif 20.0 < r <= 35.0: # Heavy precipitation
        score = 50.0 + ((35.0 - r) / 15.0) * 20.0
        tier = "Heavy Precipitation"
    else: # > 35mm torrential downpour
        score = max(20.0, 50.0 - ((r - 35.0) / 30.0) * 30.0)
        tier = "Torrential Rainfall / Runoff Risk"

    return {
        "score": round(score, 1),
        "raw_value": round(r, 1),
        "unit": "mm",
        "status": "Valid",
        "tier": tier,
        "description": f"Daily rainfall {round(r, 1)} mm evaluated on ecological and urban runoff balance."
    }

def compute_overall_environmental_score(indicator_scores: dict) -> dict:
    """
    Compute weighted Environmental Indicator Score (EIS).
    Requirement: At least 3 of 4 indicators must be valid.
    If valid indicators < 3: Overall score is None with 'Insufficient Data'.
    Weights are re-normalized across available valid indicators.
    """
    valid_scores = {}
    for key, weight in WEIGHTS.items():
        score_obj = indicator_scores.get(key)
        if isinstance(score_obj, dict):
            val = score_obj.get("score")
            if val is not None and score_obj.get("status") == "Valid":
                valid_scores[key] = (val, weight)

    valid_count = len(valid_scores)
    
    if valid_count < 3:
        return {
            "overall_score": None,
            "status": "Insufficient Data",
            "tier": "Data Incomplete",
            "valid_indicators_count": valid_count,
            "total_indicators_count": 4,
            "disclaimer": DISCLAIMER_TEXT,
            "description": f"Only {valid_count} of 4 environmental indicators available. Minimum 3 required for overall score calculation."
        }

    # Re-normalize weights for available indicators
    total_valid_weight = sum(w for _, w in valid_scores.values())
    weighted_sum = sum(score * (w / total_valid_weight) for score, w in valid_scores.values())
    overall = round(weighted_sum, 1)

    if overall >= 80.0:
        overall_tier = "Optimal / Favorable"
        color = "emerald"
    elif overall >= 65.0:
        overall_tier = "Moderate / Stable"
        color = "teal"
    elif overall >= 50.0:
        overall_tier = "Stressed / Sub-Optimal"
        color = "amber"
    else:
        overall_tier = "Adverse Environmental Conditions"
        color = "orange"

    return {
        "overall_score": overall,
        "status": "Valid",
        "tier": overall_tier,
        "color": color,
        "valid_indicators_count": valid_count,
        "total_indicators_count": 4,
        "disclaimer": DISCLAIMER_TEXT,
        "description": f"Composite score {overall}/100 derived from {valid_count} normalized indicators (AQI, Temp, Humidity, Rain)."
    }

def analyze_historical_trends(df_daily: pd.DataFrame) -> dict:
    """
    Analyze historical environmental records using Pandas and NumPy.
    Calculates:
    - Daily statistics
    - Weekly aggregations
    - Period averages
    - Temperature trend (+/- delta)
    - Rainfall accumulation and dry spells
    - Air-quality trends
    """
    if df_daily.empty:
        return {
            "period_averages": {},
            "weekly_averages": [],
            "temperature_trend": {
                "direction": "No Data",
                "delta_c": 0.0,
                "description": "No historical temperature records available."
            },
            "rainfall_trend": {
                "total_mm": 0.0,
                "rain_days": 0,
                "dry_days": 0,
                "pattern": "No Data",
                "description": "No historical precipitation records available."
            },
            "aqi_trend": {
                "direction": "No Data",
                "delta_aqi": 0.0,
                "description": "No historical air quality records available."
            },
            "daily_records": []
        }

    total_records = len(df_daily)
    
    # Clean numerical columns
    df = df_daily.copy()
    num_cols = ["temperature_2m_mean", "temperature_2m_max", "temperature_2m_min", "precipitation_sum", "humidity_mean", "us_aqi", "pm2_5", "pm10"]
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # 1. Period Averages (ignoring NaNs)
    mean_temp = float(df["temperature_2m_mean"].mean()) if "temperature_2m_mean" in df and not df["temperature_2m_mean"].isna().all() else None
    min_temp = float(df["temperature_2m_min"].min()) if "temperature_2m_min" in df and not df["temperature_2m_min"].isna().all() else None
    max_temp = float(df["temperature_2m_max"].max()) if "temperature_2m_max" in df and not df["temperature_2m_max"].isna().all() else None
    
    total_rain = float(df["precipitation_sum"].sum()) if "precipitation_sum" in df and not df["precipitation_sum"].isna().all() else 0.0
    rain_days = int((df["precipitation_sum"] > 0.1).sum()) if "precipitation_sum" in df else 0
    dry_days = total_records - rain_days

    mean_hum = float(df["humidity_mean"].mean()) if "humidity_mean" in df and not df["humidity_mean"].isna().all() else None
    mean_aqi = float(df["us_aqi"].mean()) if "us_aqi" in df and not df["us_aqi"].isna().all() else None
    mean_pm25 = float(df["pm2_5"].mean()) if "pm2_5" in df and not df["pm2_5"].isna().all() else None

    # 2. Temperature Trend (First half vs Second half)
    half_idx = total_records // 2
    temp_trend_info = {"direction": "Stable", "delta_c": 0.0, "description": "Insufficient time span for trend"}
    if half_idx >= 2 and "temperature_2m_mean" in df:
        first_half_temp = df["temperature_2m_mean"].iloc[:half_idx].mean()
        second_half_temp = df["temperature_2m_mean"].iloc[half_idx:].mean()
        if pd.notna(first_half_temp) and pd.notna(second_half_temp):
            delta_t = round(float(second_half_temp - first_half_temp), 1)
            if delta_t > 0.8:
                direction = "Warming"
                desc = f"Average temperature rose by +{delta_t}°C between earlier and recent period."
            elif delta_t < -0.8:
                direction = "Cooling"
                desc = f"Average temperature dropped by {delta_t}°C between earlier and recent period."
            else:
                direction = "Stable"
                desc = f"Temperature trajectory remained stable (variation of {delta_t}°C)."
            temp_trend_info = {"direction": direction, "delta_c": delta_t, "description": desc}

    # 3. Rainfall Trend
    rain_trend_info = {"total_mm": round(total_rain, 1), "rain_days": rain_days, "dry_days": dry_days, "pattern": "Moderate"}
    if rain_days == 0:
        rain_trend_info["pattern"] = "Dry Spell"
        rain_trend_info["description"] = f"No precipitation recorded across the entire {total_records}-day period."
    elif total_rain > 30.0:
        rain_trend_info["pattern"] = "High Precipitation"
        rain_trend_info["description"] = f"Abundant moisture with {round(total_rain, 1)} mm accumulated over {rain_days} wet days."
    else:
        rain_trend_info["pattern"] = "Moderate"
        rain_trend_info["description"] = f"Intermittent precipitation totaling {round(total_rain, 1)} mm over {rain_days} rain days."

    # 4. Air Quality Trend
    aqi_trend_info = {"direction": "Stable", "delta_points": 0.0, "description": "Air quality historical baseline maintained"}
    if half_idx >= 2 and "us_aqi" in df:
        first_aqi = df["us_aqi"].iloc[:half_idx].mean()
        second_aqi = df["us_aqi"].iloc[half_idx:].mean()
        if pd.notna(first_aqi) and pd.notna(second_aqi):
            delta_aqi = round(float(second_aqi - first_aqi), 1)
            if delta_aqi <= -5.0:
                aqi_dir = "Improving"
                aqi_desc = f"Air quality improved by {abs(delta_aqi)} AQI points in recent days."
            elif delta_aqi >= 5.0:
                aqi_dir = "Degrading"
                aqi_desc = f"Air pollution increased by +{delta_aqi} AQI points in recent days."
            else:
                aqi_dir = "Stable"
                aqi_desc = f"Air quality remained stable (variation of {delta_aqi} points)."
            aqi_trend_info = {"direction": aqi_dir, "delta_points": delta_aqi, "description": aqi_desc}

    # 5. Weekly Aggregation (Group by 7-day windows using integer division)
    df["week_num"] = np.arange(total_records) // 7 + 1
    weekly_agg = []
    for week_id, w_group in df.groupby("week_num"):
        w_start = w_group["date"].iloc[0]
        w_end = w_group["date"].iloc[-1]
        w_temp = float(w_group["temperature_2m_mean"].mean()) if "temperature_2m_mean" in w_group and pd.notna(w_group["temperature_2m_mean"].mean()) else None
        w_rain = float(w_group["precipitation_sum"].sum()) if "precipitation_sum" in w_group and pd.notna(w_group["precipitation_sum"].sum()) else 0.0
        w_aqi = float(w_group["us_aqi"].mean()) if "us_aqi" in w_group and pd.notna(w_group["us_aqi"].mean()) else None
        weekly_agg.append({
            "week_label": f"Week {week_id} ({w_start} to {w_end})",
            "mean_temperature": round(w_temp, 1) if w_temp is not None else None,
            "total_rainfall": round(w_rain, 1),
            "mean_aqi": round(w_aqi, 1) if w_aqi is not None else None
        })

    # Prepare clean serializable records for Recharts
    daily_records = []
    for _, row in df.iterrows():
        try:
            dt_obj = datetime.strptime(row["date"], "%Y-%m-%d")
            display_date = dt_obj.strftime("%b %d")
        except Exception:
            display_date = row["date"]

        daily_records.append({
            "date": row["date"],
            "display_date": display_date,
            "temp_mean": round(float(row["temperature_2m_mean"]), 1) if pd.notna(row.get("temperature_2m_mean")) else None,
            "temp_max": round(float(row["temperature_2m_max"]), 1) if pd.notna(row.get("temperature_2m_max")) else None,
            "temp_min": round(float(row["temperature_2m_min"]), 1) if pd.notna(row.get("temperature_2m_min")) else None,
            "rainfall": round(float(row["precipitation_sum"]), 1) if pd.notna(row.get("precipitation_sum")) else 0.0,
            "humidity": round(float(row["humidity_mean"]), 1) if pd.notna(row.get("humidity_mean")) else None,
            "aqi": round(float(row["us_aqi"]), 1) if pd.notna(row.get("us_aqi")) else None,
            "pm25": round(float(row["pm2_5"]), 1) if pd.notna(row.get("pm2_5")) else None,
        })

    return {
        "period_averages": {
            "mean_temperature": round(mean_temp, 1) if mean_temp is not None else None,
            "min_temperature": round(min_temp, 1) if min_temp is not None else None,
            "max_temperature": round(max_temp, 1) if max_temp is not None else None,
            "total_rainfall": round(total_rain, 1),
            "rainy_days": rain_days,
            "dry_days": dry_days,
            "mean_humidity": round(mean_hum, 1) if mean_hum is not None else None,
            "mean_aqi": round(mean_aqi, 1) if mean_aqi is not None else None,
            "mean_pm25": round(mean_pm25, 1) if mean_pm25 is not None else None,
        },
        "temperature_trend": temp_trend_info,
        "rainfall_trend": rain_trend_info,
        "aqi_trend": aqi_trend_info,
        "weekly_averages": weekly_agg,
        "daily_records": daily_records
    }

def generate_environmental_insights(current_obs: dict, trends: dict, scoring: dict) -> list[dict]:
    """
    Generate factual, rule-based environmental insights supported by actual data.
    Does NOT use AI or invent numbers.
    """
    insights = []
    p_avg = trends.get("period_averages") if isinstance(trends.get("period_averages"), dict) else {}
    t_trend = trends.get("temperature_trend") if isinstance(trends.get("temperature_trend"), dict) else {}
    r_trend = trends.get("rainfall_trend") if isinstance(trends.get("rainfall_trend"), dict) else {}
    a_trend = trends.get("aqi_trend") if isinstance(trends.get("aqi_trend"), dict) else {}

    # Insight 1: Air Quality & Particulate Analysis
    curr_aqi = current_obs.get("aqi")
    hist_aqi = p_avg.get("mean_aqi")
    if curr_aqi is not None and hist_aqi is not None:
        delta_pct = round(((curr_aqi - hist_aqi) / hist_aqi) * 100.0, 1) if hist_aqi > 0 else 0
        direction_text = f"+{delta_pct}% elevated" if delta_pct > 0 else f"{abs(delta_pct)}% lower"
        category = current_obs.get("aqi_category", "Moderate")
        insights.append({
            "category": "Air Quality Assessment",
            "type": "positive" if curr_aqi <= 50 else ("warning" if curr_aqi > 100 else "neutral"),
            "headline": f"Air quality currently in the {category} category (US EPA AQI {curr_aqi}).",
            "evidence": f"Current index is {direction_text} compared to the analyzed period average of {hist_aqi} AQI points."
        })
    elif curr_aqi is not None:
        insights.append({
            "category": "Air Quality Assessment",
            "type": "neutral",
            "headline": f"Current Air Quality index is {curr_aqi} ({current_obs.get('aqi_category')}).",
            "evidence": "Historical air quality series baseline is pending further multi-day sensor collection."
        })

    # Insight 2: Temperature & Thermal Dynamics
    curr_temp = current_obs.get("temperature")
    hist_temp = p_avg.get("mean_temperature")
    if hist_temp is not None:
        direction = t_trend.get("direction", "Stable")
        delta = t_trend.get("delta_c", 0.0)
        insights.append({
            "category": "Thermal Dynamics",
            "type": "warning" if (hist_temp > 30 or hist_temp < 0) else "neutral",
            "headline": f"Mean ambient temperature averaged {hist_temp}°C with a {direction.lower()} pattern.",
            "evidence": t_trend.get("description", f"Range spanned from {p_avg.get('min_temperature')}°C to {p_avg.get('max_temperature')}°C.")
        })

    # Insight 3: Precipitation & Hydrological Balance
    total_rain = p_avg.get("total_rainfall", 0.0)
    rain_days = p_avg.get("rainy_days", 0)
    dry_days = p_avg.get("dry_days", 0)
    insights.append({
        "category": "Hydrological & Precipitation Balance",
        "type": "positive" if (1.0 <= total_rain <= 35.0) else ("warning" if total_rain == 0 else "neutral"),
        "headline": f"Recorded {total_rain} mm total precipitation across {rain_days} wet day(s) and {dry_days} dry day(s).",
        "evidence": r_trend.get("description", "Rainfall wash-off contributes to atmospheric particulate mitigation.")
    })

    # Insight 4: Moisture Comfort Index
    curr_hum = current_obs.get("relative_humidity")
    hist_hum = p_avg.get("mean_humidity")
    if hist_hum is not None:
        insights.append({
            "category": "Atmospheric Moisture",
            "type": "positive" if (40 <= hist_hum <= 60) else "neutral",
            "headline": f"Atmospheric humidity maintained a {hist_hum}% historical mean.",
            "evidence": f"Current relative humidity stands at {curr_hum}%. Standard healthy outdoor moisture balance is between 40% and 60%."
        })

    return insights

def generate_recommendations(current_obs: dict, trends: dict, scoring: dict) -> list[dict]:
    """
    Generate straightforward urban and public advisories based on measured conditions.
    Clearly designates them as recommendations derived from findings.
    """
    recommendations = []
    aqi_val = current_obs.get("aqi")
    pm25_val = current_obs.get("pm25")
    temp_val = current_obs.get("temperature")
    total_rain = trends.get("period_averages", {}).get("total_rainfall") if len(trends.get("daily_records", [])) > 0 else None
    hum_val = current_obs.get("relative_humidity")

    # Air Quality Guidance
    if aqi_val is not None and aqi_val > 100:
        recommendations.append({
            "domain": "Public Health & Commuter Advisory",
            "level": "High Priority",
            "recommendation": "Sensitive groups (children, seniors, asthmatic individuals) should limit prolonged outdoor exertion during peak traffic hours.",
            "measured_trigger": f"US EPA AQI ({aqi_val}) exceeds acceptable 100 benchmark."
        })
        recommendations.append({
            "domain": "Municipal Fleet & Emissions",
            "level": "Policy Action",
            "recommendation": "Enforce anti-idling bylaws for municipal diesel transit vehicles and prioritize electrified public transit routes.",
            "measured_trigger": f"Elevated particulate burden (PM2.5: {pm25_val} µg/m³)."
        })
    elif aqi_val is not None:
        recommendations.append({
            "domain": "Recreation & Active Transit",
            "level": "Advisory",
            "recommendation": "Air quality is in a favorable range. Favorable window for outdoor athletic activities, walking, and cycle commuting.",
            "measured_trigger": f"US EPA AQI is {aqi_val} (within safe thresholds)."
        })

    # Thermal / Heat Guidance
    if temp_val is not None and temp_val >= 30.0:
        recommendations.append({
            "domain": "Urban Heat Mitigation",
            "level": "High Priority",
            "recommendation": "Deploy shaded cooling corridors, inspect municipal hydration stations, and promote cool-roof architectural standards.",
            "measured_trigger": f"Ambient temperature {temp_val}°C presents elevated urban heat island stress."
        })
    elif temp_val is not None and temp_val <= 4.0:
        recommendations.append({
            "domain": "Winter Cold Management",
            "level": "Advisory",
            "recommendation": "Ensure public shelter heating availability and monitor road surfaces for localized ice accumulation.",
            "measured_trigger": f"Near-freezing ambient temperature ({temp_val}°C)."
        })

    # Rainfall / Water Management Guidance
    if total_rain is not None:
        if total_rain == 0.0:
            recommendations.append({
                "domain": "Water Conservation & Dust Control",
                "level": "Resource Advisory",
                "recommendation": "Initiate municipal water conservation protocols and utilize non-potable water sprinkling on unpaved construction corridors to suppress dust.",
                "measured_trigger": "Zero precipitation recorded across the active historical period."
            })
        elif total_rain > 30.0:
            recommendations.append({
                "domain": "Stormwater Drainage",
                "level": "Infrastructure",
                "recommendation": "Inspect municipal stormwater catch-basins, clear storm drains of debris, and monitor low-lying transit underpasses for runoff pooling.",
                "measured_trigger": f"Heavy cumulative precipitation ({total_rain} mm)."
            })

    return recommendations
