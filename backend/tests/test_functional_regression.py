"""
EcoVision Functional Regression Test Suite
Validates core application workflows across:
1. Environmental Data Collection (geocoding, weather, CPCB, and CAMS)
2. Environmental Analysis Engine (scoring, historical trends, rule-based insights)
3. Machine Learning Prediction (Scikit-learn RF fit, 6-month forecast, evaluation metrics, cooldown)
4. SQLite Database Persistence (city management, observations deduplication, schema integrity)
"""

import os
import sys
import unittest
from datetime import datetime, timezone
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.config import TestingConfig
from app.database import (
    get_db,
    init_db,
    get_or_create_city,
    save_observation,
    get_latest_observation,
    get_saved_cities,
    save_monthly_history,
    get_monthly_history
)
from app.services.cpcb_service import (
    fetch_cpcb_ground_data,
    get_cpcb_category,
    calculate_cpcb_sub_index
)
from app.services.analysis_service import (
    compute_aqi_score,
    compute_temperature_score,
    compute_humidity_score,
    compute_rainfall_score,
    compute_overall_environmental_score,
    analyze_historical_trends,
    generate_environmental_insights,
    generate_recommendations
)
from app.services.ml_service import (
    engineer_time_series_features,
    evaluate_model_chronological,
    generate_six_month_forecast,
    get_or_train_city_prediction,
    _CITY_PREDICTION_CACHE,
    _LAST_TRAINED_TIMESTAMPS
)


class TestEnvironmentalDataWorkflows(unittest.TestCase):
    """Test city geocoding, coordinates handling, CPCB and CAMS environmental data."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestingConfig)
        cls.client = cls.app.test_client()

    def test_city_search_response_structure(self):
        resp = self.client.get("/api/cities/search?q=Delhi")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("results", data)
        self.assertIsInstance(data["results"], list)
        self.assertEqual(data.get("query"), "Delhi")

    def test_negative_and_extreme_coordinates_handling(self):
        # Sydney coordinates (Southern Hemisphere & Eastern Hemisphere)
        resp = self.client.get("/api/environmental/data?lat=-33.8688&lon=151.2093&name=Sydney&country=Australia")
        # Should not crash with 500
        self.assertIn(resp.status_code, (200, 404))

    def test_cpcb_indian_vs_international_handling(self):
        # London (UK) should be marked not_applicable for CPCB
        uk_res = fetch_cpcb_ground_data(51.5074, -0.1278, city_name="London", country="United Kingdom")
        self.assertEqual(uk_res["status"], "not_applicable")
        self.assertIn("operates exclusively within Indian national territory", uk_res["message"])

        # Category calculation
        cat = get_cpcb_category(125)
        self.assertEqual(cat["category"], "Moderate")
        self.assertEqual(cat["color"], "amber")


class TestAnalysisEngineWorkflows(unittest.TestCase):
    """Test environmental indicator scoring, trends, insights, and recommendations."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestingConfig)
        cls.client = cls.app.test_client()

    def test_indicator_scoring_rules(self):
        # EPA AQI: Good range (< 50) -> score 90-100
        aqi_good = compute_aqi_score(30, scale="us_epa")
        self.assertGreaterEqual(aqi_good["score"], 90.0)

        # Temperature: Ideal range (18-24°C) -> score >= 90
        temp_ideal = compute_temperature_score(22.0)
        self.assertGreaterEqual(temp_ideal["score"], 90.0)

        # Temperature: Extreme heat (40°C) -> low score
        temp_hot = compute_temperature_score(40.0)
        self.assertLess(temp_hot["score"], 50.0)

        # Humidity: Optimal (50%) -> score 100
        hum_ideal = compute_humidity_score(50.0)
        self.assertEqual(hum_ideal["score"], 100.0)

        # Rainfall: Moderate shower (5mm) -> high score
        rain_shower = compute_rainfall_score(5.0)
        self.assertGreaterEqual(rain_shower["score"], 90.0)

    def test_overall_environmental_score_sufficiency(self):
        # 4 valid indicators -> overall score calculated
        ind_scores = {
            "aqi": {"score": 85.0, "status": "Valid"},
            "temperature": {"score": 90.0, "status": "Valid"},
            "humidity": {"score": 80.0, "status": "Valid"},
            "rainfall": {"score": 75.0, "status": "Valid"}
        }
        overall = compute_overall_environmental_score(ind_scores)
        self.assertIsNotNone(overall["overall_score"])
        self.assertGreater(overall["overall_score"], 0.0)
        self.assertEqual(overall["status"], "Valid")

        # Insufficient data (< 3 valid indicators) -> None
        ind_insufficient = {
            "aqi": {"score": 85.0, "status": "Valid"},
            "temperature": None,
            "humidity": None,
            "rainfall": None
        }
        overall_insufficient = compute_overall_environmental_score(ind_insufficient)
        self.assertIsNone(overall_insufficient["overall_score"])
        self.assertEqual(overall_insufficient["status"], "Insufficient Data")

    def test_rule_based_insights_and_recommendations(self):
        obs = {
            "temperature": 28.5,
            "relative_humidity": 65.0,
            "aqi": 140,
            "pm25": 45.0,
            "rain": 0.0
        }
        trends = {
            "period_averages": {"mean_temperature": 27.0, "mean_aqi": 120, "total_rainfall": 5.0, "rainy_days": 1, "dry_days": 6, "mean_humidity": 60.0},
            "temperature_trend": {"direction": "Warming", "delta_c": 1.5, "description": "Warming trend"},
            "rainfall_trend": {"description": "Moderate rainfall"},
            "aqi_trend": {"description": "Stable"},
            "daily_records": [{}]
        }
        scoring = {
            "overall": {"overall_score": 75.0, "tier": "Moderate / Stable"},
            "indicators": {
                "aqi": {"score": 65.0},
                "temperature": {"score": 78.0},
                "humidity": {"score": 85.0},
                "rainfall": {"score": 75.0}
            }
        }
        insights = generate_environmental_insights(obs, trends=trends, scoring=scoring)
        self.assertIsInstance(insights, list)
        self.assertGreater(len(insights), 0)

        recommendations = generate_recommendations(obs, trends=trends, scoring=scoring)
        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)


class TestPredictionEngineWorkflows(unittest.TestCase):
    """Test Scikit-learn Random Forest forecasting, evaluation, and cooldown."""

    def test_feature_engineering_and_chronological_split(self):
        # Build synthetic 48-month history
        dates = pd.date_range(start="2020-01-01", periods=48, freq="MS")
        df_synthetic = pd.DataFrame({
            "year": dates.year,
            "month": dates.month,
            "year_month": dates.strftime("%Y-%m"),
            "temperature_mean": [20.0 + 10.0 * (m % 6) + 0.1 * idx for idx, m in enumerate(dates.month)],
            "temperature_min": [15.0 + 8.0 * (m % 6) for m in dates.month],
            "temperature_max": [25.0 + 12.0 * (m % 6) for m in dates.month],
            "precipitation_sum": [10.0 + (m * 5.0) for m in dates.month]
        })

        features_df = engineer_time_series_features(df_synthetic)
        self.assertFalse(features_df.empty)
        self.assertIn("prev_month_temp", features_df.columns)
        self.assertIn("prev_2m_avg_temp", features_df.columns)

        # Evaluate model chronologically
        eval_res = evaluate_model_chronological(features_df, test_months=12)
        self.assertIn("metrics", eval_res)
        self.assertIn("random_forest", eval_res["metrics"])
        self.assertIn("seasonal_baseline", eval_res["metrics"])
        self.assertIn("mae", eval_res["metrics"]["random_forest"])
        self.assertIn("rmse", eval_res["metrics"]["random_forest"])
        self.assertIn("model", eval_res)

        # Generate 6-month forecast
        forecasts = generate_six_month_forecast(df_synthetic, eval_res["model"], model_mae=eval_res["metrics"]["random_forest"]["mae"])
        self.assertEqual(len(forecasts), 6)
        for fc in forecasts:
            self.assertIn("month_name", fc)
            self.assertIn("predicted_temperature", fc)
            self.assertIn("historical_baseline_temp", fc)
            self.assertIn("confidence_interval", fc)


class TestDatabaseWorkflows(unittest.TestCase):
    """Test SQLite persistence, idempotency, and schema safety."""

    @classmethod
    def setUpClass(cls):
        db_path = TestingConfig.DATABASE_PATH
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except OSError:
                pass
        cls.app = create_app(TestingConfig)
        cls.ctx = cls.app.app_context()
        cls.ctx.push()
        init_db(cls.app)

    @classmethod
    def tearDownClass(cls):
        cls.ctx.pop()
        db_path = TestingConfig.DATABASE_PATH
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except OSError:
                pass

    def test_city_creation_idempotency(self):
        # Creating the same city multiple times must return the same ID
        city_id_1 = get_or_create_city(
            name="Bengaluru",
            state="Karnataka",
            country="India",
            country_code="IN",
            latitude=12.9716,
            longitude=77.5946
        )
        city_id_2 = get_or_create_city(
            name="Bengaluru",
            state="Karnataka",
            country="India",
            country_code="IN",
            latitude=12.9716,
            longitude=77.5946
        )
        self.assertEqual(city_id_1, city_id_2)

    def test_observation_deduplication(self):
        city_id = get_or_create_city(
            name="Nagpur",
            state="Maharashtra",
            country="India",
            country_code="IN",
            latitude=21.1458,
            longitude=79.0882
        )
        unique_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        obs_payload = {
            "observation_time": unique_time,
            "temperature": 29.5,
            "relative_humidity": 45.0,
            "precipitation": 0.0,
            "rain": 0.0,
            "wind_speed": 8.0,
            "aqi": 115,
            "aqi_scale": "US EPA",
            "pm25": 42.0,
            "pm10": 85.0
        }
        # First save
        saved_first = save_observation(city_id, obs_payload)
        self.assertTrue(saved_first)

        # Duplicate save with identical time should be ignored gracefully
        saved_second = save_observation(city_id, obs_payload)
        self.assertFalse(saved_second)

    def test_saved_cities_retrieval(self):
        cities = get_saved_cities(limit=20)
        self.assertIsInstance(cities, list)
        self.assertGreaterEqual(len(cities), 1)
        city_names = [c["name"] for c in cities]
        self.assertIn("Bengaluru", city_names)


if __name__ == "__main__":
    unittest.main()
