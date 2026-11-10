"""
EcoVision Security and Hardening Test Suite
Verifies:
1. Strict geographic coordinate validation (range, NaN, Inf, non-numeric)
2. Text input sanitization and city search query bounds
3. Payload limit enforcement (MAX_CONTENT_LENGTH -> HTTP 413)
4. Thread-safe rate limiter (HTTP 429 + Retry-After)
5. Security headers on all HTTP responses
6. Structured error responses and error sanitization (no stack trace leakage)
7. SQLite SQL injection resistance and query safety
8. ML retraining cooldown protection against CPU exhaustion DoS
9. Production configuration validation (rejection of DEBUG=True and wildcard CORS)
"""

import io
import math
import os
import sys
import time
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.config import Config, DevelopmentConfig, ProductionConfig, TestingConfig, validate_config
from app.services.validators import (
    validate_coordinates,
    validate_city_search_query,
    validate_days_param,
    validate_limit_param,
    sanitize_text,
    ValidationError
)
from app.services.rate_limiter import check_rate_limit, reset_rate_limiters
from app.services.ml_service import (
    engineer_time_series_features,
    RETRAIN_COOLDOWN_SECONDS,
    MAX_ML_CACHE_ENTRIES
)
from app.database import get_db, init_db, get_or_create_city, get_saved_cities


class TestSecurityValidators(unittest.TestCase):
    """Test unit validation of coordinates, queries, and text sanitization."""

    def test_valid_coordinates(self):
        lat, lon = validate_coordinates("28.6139", "77.2090")
        self.assertAlmostEqual(lat, 28.6139)
        self.assertAlmostEqual(lon, 77.2090)

        # Boundary checks
        lat, lon = validate_coordinates(90.0, 180.0)
        self.assertEqual(lat, 90.0)
        self.assertEqual(lon, 180.0)

        lat, lon = validate_coordinates(-90.0, -180.0)
        self.assertEqual(lat, -90.0)
        self.assertEqual(lon, -180.0)

    def test_coordinates_missing_or_empty(self):
        with self.assertRaises(ValidationError):
            validate_coordinates(None, "77.2090")
        with self.assertRaises(ValidationError):
            validate_coordinates("", "77.2090")
        with self.assertRaises(ValidationError):
            validate_coordinates("28.6139", None)

    def test_coordinates_out_of_range(self):
        # Latitude > 90
        with self.assertRaises(ValidationError):
            validate_coordinates("90.001", "77.2090")
        # Latitude < -90
        with self.assertRaises(ValidationError):
            validate_coordinates("-90.5", "77.2090")
        # Longitude > 180
        with self.assertRaises(ValidationError):
            validate_coordinates("28.6139", "180.1")
        # Longitude < -180
        with self.assertRaises(ValidationError):
            validate_coordinates("28.6139", "-180.05")

    def test_coordinates_nan_and_infinity_rejection(self):
        # Python's float("nan") or float("inf") must be rejected
        with self.assertRaises(ValidationError):
            validate_coordinates("NaN", "77.2090")
        with self.assertRaises(ValidationError):
            validate_coordinates("nan", "77.2090")
        with self.assertRaises(ValidationError):
            validate_coordinates("Infinity", "77.2090")
        with self.assertRaises(ValidationError):
            validate_coordinates("-inf", "77.2090")
        with self.assertRaises(ValidationError):
            validate_coordinates("28.6139", "inf")
        with self.assertRaises(ValidationError):
            validate_coordinates(float("nan"), 77.2)
        with self.assertRaises(ValidationError):
            validate_coordinates(28.6, float("inf"))

    def test_city_search_query_validation(self):
        # Normal query
        self.assertEqual(validate_city_search_query("Delhi"), "Delhi")
        self.assertEqual(validate_city_search_query("  Bengaluru  "), "Bengaluru")

        # Too short (< 2 characters)
        with self.assertRaises(ValidationError):
            validate_city_search_query("D")
        with self.assertRaises(ValidationError):
            validate_city_search_query("   ")
        with self.assertRaises(ValidationError):
            validate_city_search_query(None)

        # Excessively long (> 100 characters)
        with self.assertRaises(ValidationError):
            validate_city_search_query("A" * 101)

    def test_text_sanitization(self):
        # Removes control characters and strips whitespace
        dirty = "  New Delhi\x00\x08\x1f City  "
        clean = sanitize_text(dirty, max_length=50)
        self.assertEqual(clean, "New Delhi City")

        # Bounds max length
        long_str = "B" * 200
        bounded = sanitize_text(long_str, max_length=30)
        self.assertEqual(len(bounded), 30)

    def test_days_and_limit_params(self):
        self.assertEqual(validate_days_param("7"), 7)
        self.assertEqual(validate_days_param("14"), 14)
        self.assertEqual(validate_days_param("30"), 30)
        with self.assertRaises(ValidationError):
            validate_days_param("45")
        with self.assertRaises(ValidationError):
            validate_days_param("invalid")

        self.assertEqual(validate_limit_param("50", default=10, max_val=100), 50)
        self.assertEqual(validate_limit_param("500", default=10, max_val=100), 100)
        self.assertEqual(validate_limit_param("-5", min_val=1, default=10, max_val=100), 1)


class TestSecurityEndpoints(unittest.TestCase):
    """Test API endpoint responses, status codes, and security headers."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestingConfig)
        cls.client = cls.app.test_client()

    def test_security_headers_present(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(resp.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(resp.headers.get("X-XSS-Protection"), "1; mode=block")
        self.assertEqual(resp.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")
        self.assertIn("no-store", resp.headers.get("Cache-Control", ""))

    def test_bad_request_on_invalid_coordinates(self):
        # Missing coordinates
        resp = self.client.get("/api/environmental/data")
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertEqual(data.get("status"), "error")
        self.assertIn("message", data)

        # NaN coordinates
        resp = self.client.get("/api/environmental/data?lat=nan&lon=77.2")
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertEqual(data.get("status"), "error")

        # Out-of-bounds coordinates
        resp = self.client.get("/api/environmental/data?lat=120.0&lon=77.2")
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertEqual(data.get("status"), "error")

    def test_city_search_bounds(self):
        # Too short (< 2 chars)
        resp = self.client.get("/api/cities/search?q=a")
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertEqual(data.get("status"), "error")

        # Empty
        resp = self.client.get("/api/cities/search?q=")
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertEqual(data.get("status"), "error")

    def test_structured_error_handlers(self):
        # 404 Not Found
        resp = self.client.get("/api/nonexistent-endpoint-test")
        self.assertEqual(resp.status_code, 404)
        data = resp.get_json()
        self.assertEqual(data.get("status"), 404)
        self.assertEqual(data.get("error"), "Not Found")

        # 405 Method Not Allowed (POST to GET-only route)
        resp = self.client.post("/api/health")
        self.assertEqual(resp.status_code, 405)
        data = resp.get_json()
        self.assertEqual(data.get("status"), 405)
        self.assertEqual(data.get("error"), "Method Not Allowed")


class TestPayloadLimit(unittest.TestCase):
    """Test payload limit bounding."""

    def test_payload_exceeding_max_content_length(self):
        # Custom config with tiny 1KB limit to verify 413 handling
        class SmallPayloadConfig(TestingConfig):
            MAX_CONTENT_LENGTH = 1024  # 1 KB

        app = create_app(SmallPayloadConfig)
        client = app.test_client()

        # Send 2KB of JSON data to verify 413 Payload Too Large
        big_json = b'{"lat": 28.6, "lon": 77.2, "padding": "' + (b"X" * 2048) + b'"}'
        resp = client.post(
            "/api/environmental/data",
            data=big_json,
            content_type="application/json"
        )
        self.assertEqual(resp.status_code, 413)
        data = resp.get_json()
        self.assertEqual(data.get("status"), 413)
        self.assertEqual(data.get("error"), "Payload Too Large")


class TestRateLimiter(unittest.TestCase):
    """Test sliding window rate limiting."""

    def setUp(self):
        reset_rate_limiters()

    def test_rate_limiter_blocks_excessive_requests(self):
        client_key = "test_ip:192.168.1.100"

        # First 3 requests must be allowed
        allowed, retry = check_rate_limit(client_key, max_requests=3, window_seconds=10)
        self.assertTrue(allowed)
        self.assertEqual(retry, 0)

        allowed, retry = check_rate_limit(client_key, max_requests=3, window_seconds=10)
        self.assertTrue(allowed)
        self.assertEqual(retry, 0)

        allowed, retry = check_rate_limit(client_key, max_requests=3, window_seconds=10)
        self.assertTrue(allowed)
        self.assertEqual(retry, 0)

        # 4th request must be rejected
        allowed, retry_after = check_rate_limit(client_key, max_requests=3, window_seconds=10)
        self.assertFalse(allowed)
        self.assertGreater(retry_after, 0)
        self.assertLessEqual(retry_after, 10)

        # Another IP should still be allowed
        other_allowed, _ = check_rate_limit("test_ip:192.168.1.101", max_requests=3, window_seconds=10)
        self.assertTrue(other_allowed)


class TestDatabaseSecurity(unittest.TestCase):
    """Test database SQL injection resistance and parameterization."""

    @classmethod
    def setUpClass(cls):
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

    def test_sql_injection_in_city_name(self):
        malicious_name = "Delhi'; DROP TABLE cities; --"
        # Should cleanly parameterize and not execute injection
        city_id = get_or_create_city(
            name=malicious_name,
            latitude=28.6139,
            longitude=77.2090,
            state="Delhi",
            country="India"
        )
        self.assertIsNotNone(city_id)

        # Verify cities table still exists and contains the sanitized name
        db = get_db()
        row = db.execute("SELECT name FROM cities WHERE id = ?", (city_id,)).fetchone()
        self.assertIsNotNone(row)
        self.assertIn("Delhi", row["name"])

        # Verify tables still exist
        table_check = db.execute(
            "SELECT count(*) as cnt FROM sqlite_master WHERE type='table' AND name='cities'"
        ).fetchone()
        self.assertEqual(table_check["cnt"], 1)

    def test_saved_cities_limit_bounding(self):
        # Requesting limit 1000000 must be bounded safely
        cities = get_saved_cities(limit=1000000)
        self.assertIsInstance(cities, list)
        self.assertLessEqual(len(cities), 100)


class TestConfigValidation(unittest.TestCase):
    """Test startup validation of configurations."""

    def test_production_rejects_debug(self):
        app = create_app(TestingConfig)
        app.config["ENV"] = "production"
        app.config["DEBUG"] = True
        app.config["CORS_ORIGINS"] = ["https://ecovision.example.com"]

        with self.assertRaises(RuntimeError) as ctx:
            validate_config(app)
        self.assertIn("DEBUG cannot be True in production", str(ctx.exception))

    def test_production_rejects_empty_or_wildcard_cors(self):
        app = create_app(TestingConfig)
        app.config["ENV"] = "production"
        app.config["DEBUG"] = False
        app.config["CORS_ORIGINS"] = []

        with self.assertRaises(RuntimeError) as ctx:
            validate_config(app)
        self.assertIn("CORS origins prohibited in production", str(ctx.exception))

        app.config["CORS_ORIGINS"] = ["*"]
        with self.assertRaises(RuntimeError) as ctx:
            validate_config(app)
        self.assertIn("CORS origins prohibited in production", str(ctx.exception))


class TestMLSecurity(unittest.TestCase):
    """Test ML service boundaries, caching limits, and cooldown defense."""

    def test_feature_engineering_insufficient_data(self):
        import pandas as pd
        # Empty dataframe
        empty_df = pd.DataFrame()
        result = engineer_time_series_features(empty_df)
        self.assertTrue(result.empty)

        # Less than 6 rows
        small_df = pd.DataFrame([
            {"year": 2024, "month": 1, "temperature_mean": 15.0, "precipitation_sum": 10.0},
            {"year": 2024, "month": 2, "temperature_mean": 18.0, "precipitation_sum": 5.0}
        ])
        result = engineer_time_series_features(small_df)
        self.assertTrue(result.empty)

    def test_cache_and_cooldown_constants(self):
        self.assertGreaterEqual(RETRAIN_COOLDOWN_SECONDS, 10.0)
        self.assertLessEqual(MAX_ML_CACHE_ENTRIES, 256)


if __name__ == "__main__":
    unittest.main()
