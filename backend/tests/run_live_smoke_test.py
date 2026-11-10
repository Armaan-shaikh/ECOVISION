"""
EcoVision Live End-to-End HTTP Smoke Test
Starts the actual Flask application in a background server and executes real HTTP requests
over TCP loopback to test live communication, Open-Meteo external APIs, CPCB ingestion,
ML forecasting, and SQLite database persistence.
"""

import json
import os
import sys
import time
import threading
import urllib.request
import urllib.error

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.config import DevelopmentConfig

def start_server():
    app = create_app(DevelopmentConfig)
    # Run without debug or reloader
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)

def run_tests():
    base_url = "http://127.0.0.1:5000"
    results = {}

    # Wait for server to come online
    max_wait = 10
    online = False
    start_time = time.time()
    while time.time() - start_time < max_wait:
        try:
            with urllib.request.urlopen(f"{base_url}/api/health", timeout=2) as resp:
                if resp.status == 200:
                    online = True
                    break
        except Exception:
            time.sleep(0.5)

    if not online:
        print("FAIL: Server did not start within 10 seconds.")
        sys.exit(1)

    print("Server online. Executing live smoke test queries...\n")

    # 1. Health check
    try:
        t0 = time.time()
        with urllib.request.urlopen(f"{base_url}/api/health", timeout=5) as resp:
            data = json.loads(resp.read().decode())
            results["health"] = {
                "status_code": resp.status,
                "status": data.get("status"),
                "db_status": data.get("database", {}).get("status"),
                "latency_ms": round((time.time() - t0) * 1000, 1)
            }
            print(f"[OK] Health Check: Status {resp.status}, DB: {data.get('database', {}).get('status')}")
    except Exception as e:
        results["health"] = {"error": str(e)}
        print(f"[FAIL] Health Check: {e}")

    # 2. City search (Live Open-Meteo Geocoding)
    try:
        t0 = time.time()
        req_url = f"{base_url}/api/cities/search?q=Bengaluru"
        with urllib.request.urlopen(req_url, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            first_city = data.get("results", [{}])[0]
            results["city_search"] = {
                "status_code": resp.status,
                "count": data.get("count"),
                "top_result": first_city.get("name"),
                "country": first_city.get("country"),
                "lat": first_city.get("latitude"),
                "lon": first_city.get("longitude"),
                "latency_ms": round((time.time() - t0) * 1000, 1)
            }
            print(f"[OK] City Search (Bengaluru): Found {data.get('count')} results | Top: {first_city.get('name')}, {first_city.get('country')}")
    except Exception as e:
        results["city_search"] = {"error": str(e)}
        print(f"[FAIL] City Search: {e}")

    # 3. Live Environmental Telemetry (Open-Meteo Weather + CAMS Air Quality)
    try:
        t0 = time.time()
        req_url = f"{base_url}/api/environmental/data?lat=12.9716&lon=77.5946&name=Bengaluru&country=India"
        with urllib.request.urlopen(req_url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            curr = data.get("current", {})
            cpcb = data.get("ground_monitoring", {})
            results["environmental_data"] = {
                "status_code": resp.status,
                "temp": curr.get("temperature"),
                "humidity": curr.get("relative_humidity"),
                "aqi": curr.get("aqi"),
                "aqi_scale": data.get("aqi_scale"),
                "cpcb_status": cpcb.get("status"),
                "cpcb_station": cpcb.get("station", {}).get("name") if cpcb.get("station") else "N/A",
                "hourly_points": len(data.get("hourly_series", [])),
                "stored_in_sqlite": data.get("city", {}).get("stored_in_sqlite"),
                "latency_ms": round((time.time() - t0) * 1000, 1)
            }
            print(f"[OK] Live Telemetry (Bengaluru): Temp={curr.get('temperature')}°C, Humidity={curr.get('relative_humidity')}%, AQI={curr.get('aqi')} ({data.get('aqi_scale')})")
    except Exception as e:
        results["environmental_data"] = {"error": str(e)}
        print(f"[FAIL] Environmental Data: {e}")

    # 4. Delhi CPCB Ground Station Telemetry
    try:
        t0 = time.time()
        req_url = f"{base_url}/api/environmental/data?lat=28.6139&lon=77.2090&name=Delhi&country=India"
        with urllib.request.urlopen(req_url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            cpcb = data.get("ground_monitoring", {})
            results["delhi_cpcb"] = {
                "status_code": resp.status,
                "cpcb_status": cpcb.get("status"),
                "station_name": cpcb.get("station", {}).get("name") if cpcb.get("station") else None,
                "hourly_aqi": cpcb.get("real_time_hourly_aqi"),
                "dominant_pollutant": cpcb.get("predominant_pollutant"),
                "latency_ms": round((time.time() - t0) * 1000, 1)
            }
            print(f"[OK] Delhi CPCB Ground Data: Station={results['delhi_cpcb']['station_name']}, AQI={results['delhi_cpcb']['hourly_aqi']} ({results['delhi_cpcb']['dominant_pollutant']})")
    except Exception as e:
        results["delhi_cpcb"] = {"error": str(e)}
        print(f"[FAIL] Delhi CPCB: {e}")

    # 5. Environmental Analysis (EIS Scoring, Trends, Insights)
    try:
        t0 = time.time()
        req_url = f"{base_url}/api/environmental/analysis?lat=12.9716&lon=77.5946&days=7&name=Bengaluru"
        with urllib.request.urlopen(req_url, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            overall = data.get("scoring", {}).get("overall", {})
            results["analysis"] = {
                "status_code": resp.status,
                "overall_score": overall.get("overall_score"),
                "tier": overall.get("tier"),
                "insights_count": len(data.get("insights", [])),
                "recommendations_count": len(data.get("recommendations", [])),
                "latency_ms": round((time.time() - t0) * 1000, 1)
            }
            print(f"[OK] Environmental Analysis (7-day): Overall Score={overall.get('overall_score')}/100 ({overall.get('tier')}), Insights={len(data.get('insights', []))}")
    except Exception as e:
        results["analysis"] = {"error": str(e)}
        print(f"[FAIL] Environmental Analysis: {e}")

    # 6. Machine Learning Prediction (6-Month Random Forest Forecast)
    try:
        t0 = time.time()
        req_url = f"{base_url}/api/environmental/prediction?lat=12.9716&lon=77.5946&name=Bengaluru"
        with urllib.request.urlopen(req_url, timeout=25) as resp:
            data = json.loads(resp.read().decode())
            rf_metrics = data.get("evaluation", {}).get("metrics", {}).get("random_forest", {})
            baseline = data.get("evaluation", {}).get("metrics", {}).get("seasonal_baseline", {})
            forecasts = data.get("six_month_forecast", [])
            results["prediction"] = {
                "status_code": resp.status,
                "rf_mae": rf_metrics.get("mae"),
                "baseline_mae": baseline.get("mae"),
                "forecast_months_count": len(forecasts),
                "first_month": forecasts[0].get("month_name") if forecasts else None,
                "first_temp": forecasts[0].get("predicted_temperature") if forecasts else None,
                "latency_ms": round((time.time() - t0) * 1000, 1)
            }
            print(f"[OK] ML Prediction: RF MAE={rf_metrics.get('mae')}°C, Forecast Months={len(forecasts)}, Next: {results['prediction']['first_month']} ({results['prediction']['first_temp']}°C)")
    except Exception as e:
        results["prediction"] = {"error": str(e)}
        print(f"[FAIL] ML Prediction: {e}")

    # 7. Saved Cities
    try:
        t0 = time.time()
        req_url = f"{base_url}/api/cities/saved"
        with urllib.request.urlopen(req_url, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            cities = data.get("cities", [])
            results["saved_cities"] = {
                "status_code": resp.status,
                "cities_count": len(cities),
                "city_names": [c.get("name") for c in cities[:3]],
                "latency_ms": round((time.time() - t0) * 1000, 1)
            }
            print(f"[OK] Saved Cities: {len(cities)} cities persisted in SQLite ({results['saved_cities']['city_names']})")
    except Exception as e:
        results["saved_cities"] = {"error": str(e)}
        print(f"[FAIL] Saved Cities: {e}")

    print("\n--- SMOKE TEST SUMMARY ---")
    print(json.dumps(results, indent=2))
    
    # Assert all passed
    failed = [k for k, v in results.items() if "error" in v or v.get("status_code") != 200]
    if failed:
        print(f"\nTEST SUITE FAILED for: {failed}")
        sys.exit(1)
    else:
        print("\nALL 7 LIVE SMOKE TESTS PASSED CLEANLY!")
        sys.exit(0)

if __name__ == "__main__":
    # Start server thread in daemon mode
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    run_tests()
