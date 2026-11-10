"""
EcoVision Machine Learning & Environmental Prediction Service
Architecture:
- Scikit-learn RandomForestRegressor for multi-lag temperature forecasting
- Chronological train/test split (no random time-series shuffling)
- Meteorological seasonal-average baseline comparison
- Recursive 6-month autoregressive forecasting
- Per-city in-memory model caching
"""

import time
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

from ..database import get_monthly_history, save_monthly_history, get_or_create_city
from .open_meteo import fetch_5year_monthly_history

# Bounded in-memory cache for trained models and predictions
MAX_ML_CACHE_ENTRIES = 64
_CITY_PREDICTION_CACHE: dict[str, dict] = {}
_LAST_TRAINED_TIMESTAMPS: dict[str, float] = {}
RETRAIN_COOLDOWN_SECONDS = 30.0 # Prevent CPU exhaustion from rapid retrain spam

FEATURE_COLUMNS = [
    "month",
    "year",
    "prev_month_temp",
    "prev_2m_avg_temp",
    "prev_3m_avg_temp",
    "prev_month_rain"
]

FEATURE_DESCRIPTIONS = {
    "month": "Calendar month (1–12) capturing solar declination and seasonal cycles.",
    "year": "Sequential calendar year capturing long-term inter-annual thermal trends.",
    "prev_month_temp": "Lag-1 temperature (t-1) capturing immediate atmospheric thermal inertia.",
    "prev_2m_avg_temp": "Rolling 2-month average (t-1, t-2) reflecting seasonal transition momentum.",
    "prev_3m_avg_temp": "Rolling 3-month average (t-1, t-2, t-3) tracking quarterly climate persistence.",
    "prev_month_rain": "Lag-1 precipitation sum (t-1) capturing soil moisture and evaporative cooling feedback."
}

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

DISCLAIMER_NOTICE = (
    "Machine learning temperature projections are statistical estimates derived from historical atmospheric reanalysis "
    "(ERA5 / ERA5-Land) and seasonal lag dynamics. Designed for educational modeling and urban planning analysis; "
    "not a guaranteed meteorological forecast."
)

def engineer_time_series_features(df_monthly: pd.DataFrame) -> pd.DataFrame:
    """
    Construct multi-step lag and rolling window features for monthly temperature prediction.
    Requires input sorted chronologically by (year, month).
    """
    if df_monthly.empty or len(df_monthly) < 6:
        return pd.DataFrame()

    df = df_monthly.copy().sort_values(["year", "month"]).reset_index(drop=True)

    # 1. Immediate previous month temperature (Lag 1)
    df["prev_month_temp"] = df["temperature_mean"].shift(1)

    # 2. Average of previous 2 months (Lag 1 + Lag 2) / 2
    df["prev_2m_avg_temp"] = (df["temperature_mean"].shift(1) + df["temperature_mean"].shift(2)) / 2.0

    # 3. Average of previous 3 months (Lag 1 + Lag 2 + Lag 3) / 3
    df["prev_3m_avg_temp"] = (
        df["temperature_mean"].shift(1) +
        df["temperature_mean"].shift(2) +
        df["temperature_mean"].shift(3)
    ) / 3.0

    # 4. Immediate previous month rainfall sum (Lag 1)
    df["prev_month_rain"] = df["precipitation_sum"].shift(1)

    # Drop the initial 3 rows where 3-month rolling lags are NaN
    df_features = df.dropna(subset=FEATURE_COLUMNS + ["temperature_mean"]).copy()
    return df_features

def evaluate_model_chronological(df_features: pd.DataFrame, test_months: int = 12) -> dict:
    """
    Train Random Forest Regressor using a strict chronological split and compare against
    a simple seasonal-average baseline.
    """
    n_samples = len(df_features)
    if n_samples < 16:
        return {
            "status": "insufficient_data",
            "message": f"Dataset has only {n_samples} records after lag construction. Minimum 16 required for train/test split."
        }

    # Hold out exactly 12 months (one full seasonal year) when sufficient data is available
    if n_samples >= 32:
        test_size = min(test_months, n_samples - 16)
    else:
        test_size = max(4, min(test_months, int(n_samples * 0.25)))
    train_df = df_features.iloc[:-test_size].copy()
    test_df = df_features.iloc[-test_size:].copy()

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df["temperature_mean"]
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df["temperature_mean"]

    # 1. Train Random Forest Regressor (Scikit-learn)
    rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=6,
        min_samples_split=3,
        random_state=42
    )
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)

    # 2. Baseline Model: Historical average for that specific calendar month in the train set
    monthly_baseline_means = train_df.groupby("month")["temperature_mean"].mean().to_dict()
    # Fallback to global mean if a specific month never appeared in train (rare)
    global_mean = float(y_train.mean())
    y_pred_baseline = np.array([monthly_baseline_means.get(m, global_mean) for m in test_df["month"]])

    # 3. Compute Metrics
    rf_mae = float(mean_absolute_error(y_test, y_pred_rf))
    rf_rmse = float(root_mean_squared_error(y_test, y_pred_rf))
    rf_r2 = float(r2_score(y_test, y_pred_rf))

    base_mae = float(mean_absolute_error(y_test, y_pred_baseline))
    base_rmse = float(root_mean_squared_error(y_test, y_pred_baseline))
    base_r2 = float(r2_score(y_test, y_pred_baseline))

    # Error reduction percentage
    mae_improvement_pct = round(((base_mae - rf_mae) / base_mae) * 100.0, 1) if base_mae > 0 else 0.0

    # 4. Feature Importances
    importances = {
        col: round(float(imp), 3)
        for col, imp in zip(FEATURE_COLUMNS, rf.feature_importances_)
    }

    # 5. Build detailed Test-Split Evaluation Series for charts
    test_records = []
    for idx in range(len(test_df)):
        row = test_df.iloc[idx]
        y_act = float(row["temperature_mean"])
        y_p_rf = float(y_pred_rf[idx])
        y_p_base = float(y_pred_baseline[idx])
        m_num = int(row["month"])
        y_num = int(row["year"])
        m_name = f"{MONTH_NAMES[m_num][:3]} {y_num}"

        test_records.append({
            "year_month": str(row["year_month"]),
            "month_label": m_name,
            "month": m_num,
            "year": y_num,
            "actual_temperature": round(y_act, 1),
            "predicted_temperature": round(y_p_rf, 1),
            "baseline_temperature": round(y_p_base, 1),
            "rf_absolute_error": round(abs(y_act - y_p_rf), 1),
            "baseline_absolute_error": round(abs(y_act - y_p_base), 1)
        })

    return {
        "status": "success",
        "model": rf,
        "train_samples_count": len(train_df),
        "test_samples_count": len(test_df),
        "train_date_range": f"{train_df['year_month'].iloc[0]} to {train_df['year_month'].iloc[-1]}",
        "test_date_range": f"{test_df['year_month'].iloc[0]} to {test_df['year_month'].iloc[-1]}",
        "metrics": {
            "random_forest": {
                "mae": round(rf_mae, 2),
                "rmse": round(rf_rmse, 2),
                "r2_score": round(rf_r2, 3),
                "unit": "°C"
            },
            "seasonal_baseline": {
                "mae": round(base_mae, 2),
                "rmse": round(base_rmse, 2),
                "r2_score": round(base_r2, 3),
                "unit": "°C"
            },
            "improvement": {
                "mae_reduction_pct": mae_improvement_pct,
                "outperforms_baseline": rf_mae < base_mae
            }
        },
        "feature_importances": importances,
        "feature_descriptions": FEATURE_DESCRIPTIONS,
        "test_evaluation_series": test_records
    }

def generate_six_month_forecast(df_monthly: pd.DataFrame, trained_rf_model: RandomForestRegressor, model_mae: float = 1.3) -> list[dict]:
    """
    Generate an autoregressive 6-month monthly temperature forecast.
    Recursively feeds model predictions into lag features for subsequent months.
    Uses historical seasonal average rainfall for future lag rainfall.
    """
    if df_monthly.empty or len(df_monthly) < 4:
        return []

    # Historical monthly baselines across entire dataset
    monthly_temp_baseline = df_monthly.groupby("month")["temperature_mean"].mean().to_dict()
    monthly_rain_baseline = df_monthly.groupby("month")["precipitation_sum"].mean().to_dict()

    # Track sequential temperature buffer
    temp_buffer = list(df_monthly["temperature_mean"].values)
    last_year = int(df_monthly["year"].iloc[-1])
    last_month = int(df_monthly["month"].iloc[-1])
    last_rain = float(df_monthly["precipitation_sum"].iloc[-1])

    forecasts = []
    curr_year = last_year
    curr_month = last_month
    curr_rain = last_rain

    for step in range(1, 7):
        curr_month += 1
        if curr_month > 12:
            curr_month = 1
            curr_year += 1

        t_lag1 = float(temp_buffer[-1])
        t_lag2 = float(temp_buffer[-2])
        t_lag3 = float(temp_buffer[-3])

        t_2m_avg = (t_lag1 + t_lag2) / 2.0
        t_3m_avg = (t_lag1 + t_lag2 + t_lag3) / 3.0

        # Create single-row DataFrame with explicit feature columns
        x_step = pd.DataFrame([{
            "month": curr_month,
            "year": curr_year,
            "prev_month_temp": t_lag1,
            "prev_2m_avg_temp": t_2m_avg,
            "prev_3m_avg_temp": t_3m_avg,
            "prev_month_rain": curr_rain
        }])[FEATURE_COLUMNS]

        pred_temp = float(trained_rf_model.predict(x_step)[0])
        temp_buffer.append(pred_temp)

        # Update rainfall lag using historical seasonal average for that month
        curr_rain = float(monthly_rain_baseline.get(curr_month, 50.0))

        base_temp = float(monthly_temp_baseline.get(curr_month, pred_temp))
        delta_base = round(pred_temp - base_temp, 1)

        # Trend direction compared to preceding month
        if pred_temp > t_lag1 + 0.5:
            trend = "Warming"
            trend_desc = f"+{round(pred_temp - t_lag1, 1)}°C rise from previous month"
        elif pred_temp < t_lag1 - 0.5:
            trend = "Cooling"
            trend_desc = f"{round(pred_temp - t_lag1, 1)}°C drop from previous month"
        else:
            trend = "Stable"
            trend_desc = f"Stable thermal trajectory ({round(pred_temp - t_lag1, 1)}°C)"

        # Empirical confidence bounds based on validated model MAE
        # Bounds slightly widen for further forecast horizon (step uncertainty propagation)
        step_uncertainty = model_mae * (1.0 + (step - 1) * 0.08)
        ci_lower = round(pred_temp - step_uncertainty, 1)
        ci_upper = round(pred_temp + step_uncertainty, 1)

        forecasts.append({
            "step": step,
            "year": curr_year,
            "month": curr_month,
            "year_month": f"{curr_year}-{curr_month:02d}",
            "month_name": f"{MONTH_NAMES[curr_month]} {curr_year}",
            "predicted_temperature": round(pred_temp, 1),
            "historical_baseline_temp": round(base_temp, 1),
            "delta_from_baseline": delta_base,
            "trend": trend,
            "trend_description": trend_desc,
            "confidence_interval": {
                "lower": ci_lower,
                "upper": ci_upper,
                "range_span": round(ci_upper - ci_lower, 1)
            }
        })

    return forecasts

def build_combined_timeline(df_monthly: pd.DataFrame, forecasts: list[dict], recent_months_count: int = 12) -> list[dict]:
    """
    Construct a unified chronological timeline connecting recent historical observations
    directly to the 6-month forecasted trajectory for Recharts visualizers.
    """
    timeline = []
    
    # 1. Recent historical records
    recent_history = df_monthly.iloc[-recent_months_count:] if len(df_monthly) > recent_months_count else df_monthly
    for _, row in recent_history.iterrows():
        m_num = int(row["month"])
        y_num = int(row["year"])
        timeline.append({
            "year_month": str(row["year_month"]),
            "display_label": f"{MONTH_NAMES[m_num][:3]} '{str(y_num)[-2:]}",
            "historical_temperature": round(float(row["temperature_mean"]), 1),
            "predicted_temperature": None,
            "confidence_lower": None,
            "confidence_upper": None,
            "is_forecast": False
        })

    # Anchor point: bridge the last historical point with forecast line
    if timeline and forecasts:
        last_hist = timeline[-1]
        timeline[-1]["predicted_temperature"] = last_hist["historical_temperature"]
        timeline[-1]["confidence_lower"] = last_hist["historical_temperature"]
        timeline[-1]["confidence_upper"] = last_hist["historical_temperature"]

    # 2. Append 6-month forecasts
    for f in forecasts:
        timeline.append({
            "year_month": f["year_month"],
            "display_label": f"{MONTH_NAMES[f['month']][:3]} '{str(f['year'])[-2:]}",
            "historical_temperature": None,
            "predicted_temperature": f["predicted_temperature"],
            "confidence_lower": f["confidence_interval"]["lower"],
            "confidence_upper": f["confidence_interval"]["upper"],
            "is_forecast": True
        })

    return timeline

def get_or_train_city_prediction(
    city_id: int,
    latitude: float,
    longitude: float,
    city_name: str = "Selected City",
    tz_name: str = "auto",
    force_retrain: bool = False
) -> dict:
    """
    Master pipeline:
    1. Checks in-memory cache for existing prediction results (avoids re-training).
    2. Checks SQLite for cached 5-year historical monthly dataset.
    3. If missing in SQLite, retrieves from Open-Meteo Historical Archive and persists.
    4. Constructs multi-lag features.
    5. Performs chronological train/test split and fits Scikit-learn Random Forest.
    6. Computes baseline seasonal comparison and MAE / RMSE metrics.
    7. Generates recursive 6-month forecast.
    8. Caches result and returns JSON-serializable dictionary.
    """
    cache_key = f"{latitude:.3f}_{longitude:.3f}"
    now_ts = time.time()
    
    # 1. Cooldown protection against rapid retrain spam
    last_trained_ts = _LAST_TRAINED_TIMESTAMPS.get(cache_key, 0.0)
    if force_retrain and (now_ts - last_trained_ts < RETRAIN_COOLDOWN_SECONDS) and cache_key in _CITY_PREDICTION_CACHE:
        # Re-use recently trained model payload without re-running CPU-heavy Random Forest
        return _CITY_PREDICTION_CACHE[cache_key]["payload"]

    if not force_retrain and cache_key in _CITY_PREDICTION_CACHE:
        cached = _CITY_PREDICTION_CACHE[cache_key]
        cached_age = (datetime.now(timezone.utc) - cached["cached_at"]).total_seconds()
        # Cache valid for 3 hours
        if cached_age < 10800:
            return cached["payload"]

    # 1. Check SQLite for monthly climate records
    db_records = get_monthly_history(city_id, latitude=latitude, longitude=longitude)
    if len(db_records) >= 36: # At least 3 full years stored
        df_monthly = pd.DataFrame(db_records)
    else:
        # Fetch from Open-Meteo Historical Archive API
        df_monthly = fetch_5year_monthly_history(latitude, longitude, tz_name=tz_name)
        if not df_monthly.empty:
            records_to_save = df_monthly.to_dict(orient="records")
            save_monthly_history(city_id, records_to_save)
        elif db_records:
            df_monthly = pd.DataFrame(db_records)

    if df_monthly.empty or len(df_monthly) < 18:
        return {
            "status": "unavailable",
            "message": f"Historical meteorological reanalysis records are currently unavailable for {city_name} (found {len(df_monthly)} months, minimum 18 required). Click 'Attempt Model Fit' to fetch and train.",
            "city": {"id": city_id, "name": city_name, "latitude": latitude, "longitude": longitude}
        }

    # 2. Build time-series lag features
    df_features = engineer_time_series_features(df_monthly)
    if df_features.empty or len(df_features) < 16:
        return {
            "status": "unavailable",
            "message": f"Feature engineering produced insufficient samples ({len(df_features)}). Need at least 16 chronological records.",
            "city": {"id": city_id, "name": city_name, "latitude": latitude, "longitude": longitude}
        }

    # 3. Train & Evaluate using chronological split
    eval_result = evaluate_model_chronological(df_features, test_months=12)
    if eval_result.get("status") != "success":
        return {
            "status": "error",
            "message": eval_result.get("message", "Model evaluation failed."),
            "city": {"id": city_id, "name": city_name}
        }

    trained_model = eval_result["model"]
    rf_mae = eval_result["metrics"]["random_forest"]["mae"]

    # 4. Generate 6-month recursive forecast
    forecasts = generate_six_month_forecast(df_monthly, trained_model, model_mae=rf_mae)

    # 5. Build combined historical + forecast timeline
    timeline = build_combined_timeline(df_monthly, forecasts, recent_months_count=12)

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    payload = {
        "status": "success",
        "city": {
            "id": city_id,
            "name": city_name,
            "latitude": latitude,
            "longitude": longitude,
            "timezone": tz_name
        },
        "model_info": {
            "name": "Random Forest Regressor",
            "framework": "Scikit-learn",
            "n_estimators": 100,
            "max_depth": 6,
            "target": "Monthly Average Temperature (°C)",
            "features_used": FEATURE_COLUMNS,
            "feature_descriptions": FEATURE_DESCRIPTIONS,
            "methodology": "Chronological time-series split with autoregressive lag features and seasonal baseline comparison."
        },
        "dataset_summary": {
            "total_monthly_records": len(df_monthly),
            "features_samples_count": len(df_features),
            "start_period": str(df_monthly["year_month"].iloc[0]),
            "end_period": str(df_monthly["year_month"].iloc[-1]),
            "data_source": "Open-Meteo Historical Archive (ERA5 / ERA5-Land Reanalysis)",
            "storage": "Persisted in SQLite city_monthly_history"
        },
        "evaluation": {
            "train_samples": eval_result["train_samples_count"],
            "test_samples": eval_result["test_samples_count"],
            "train_period": eval_result["train_date_range"],
            "test_period": eval_result["test_date_range"],
            "metrics": eval_result["metrics"],
            "feature_importances": eval_result["feature_importances"],
            "test_evaluation_series": eval_result["test_evaluation_series"]
        },
        "six_month_forecast": forecasts,
        "projection_timeline": timeline,
        "last_trained_at": now_iso,
        "disclaimer": DISCLAIMER_NOTICE
    }

    # Bounded cache eviction to prevent unbounded memory growth
    if len(_CITY_PREDICTION_CACHE) >= MAX_ML_CACHE_ENTRIES:
        oldest_key = min(_CITY_PREDICTION_CACHE.keys(), key=lambda k: _CITY_PREDICTION_CACHE[k]["cached_at"])
        _CITY_PREDICTION_CACHE.pop(oldest_key, None)

    # Cache payload
    _CITY_PREDICTION_CACHE[cache_key] = {
        "payload": payload,
        "cached_at": datetime.now(timezone.utc)
    }
    _LAST_TRAINED_TIMESTAMPS[cache_key] = now_ts

    return payload
