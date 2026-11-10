import sqlite3
import os
import logging
from datetime import datetime, timezone
from flask import g, current_app

logger = logging.getLogger(__name__)

def get_db():
    """Get or create database connection for the current request context."""
    if "db" not in g:
        db_path = current_app.config.get("DATABASE_PATH")
        g.db = sqlite3.connect(
            db_path,
            timeout=10.0
        )
        g.db.row_factory = sqlite3.Row
        # Security & Integrity Pragmas
        g.db.execute("PRAGMA foreign_keys = ON;")
        try:
            g.db.execute("PRAGMA journal_mode = WAL;")
        except Exception:
            pass
    return g.db

def close_db(e=None):
    """Close the database connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db(app):
    """Initialize database tables for cities and environmental observations."""
    db_path = app.config.get("DATABASE_PATH")
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        
        # 1. Cities Table (stores geocoded cities searched or selected by users)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                state TEXT,
                country TEXT NOT NULL,
                country_code TEXT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                timezone TEXT DEFAULT 'UTC',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, state, country)
            )
        """)
        
        # 2. Environmental Observations Table (real Open-Meteo weather & air quality records)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS environmental_observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city_id INTEGER NOT NULL,
                observation_time TEXT NOT NULL,
                temperature REAL,
                relative_humidity REAL,
                precipitation REAL,
                rain REAL,
                wind_speed REAL,
                aqi INTEGER,
                aqi_scale TEXT DEFAULT 'US EPA',
                european_aqi INTEGER,
                pm25 REAL,
                pm10 REAL,
                no2 REAL,
                so2 REAL,
                co REAL,
                ozone REAL,
                data_source TEXT DEFAULT 'Open-Meteo',
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE,
                UNIQUE(city_id, observation_time)
            )
        """)
        
        # Create index on city_id and observation_time for fast lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_obs_city_time 
            ON environmental_observations(city_id, observation_time DESC)
        """)

        # 3. Monthly Historical Climate Table (5-year historical dataset for ML forecasting)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS city_monthly_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city_id INTEGER NOT NULL,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                year_month TEXT NOT NULL,
                temperature_mean REAL NOT NULL,
                temperature_min REAL,
                temperature_max REAL,
                precipitation_sum REAL,
                data_source TEXT DEFAULT 'Open-Meteo Historical Archive (ERA5 Reanalysis)',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE,
                UNIQUE(city_id, year, month)
            )
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_monthly_city_time 
            ON city_monthly_history(city_id, year, month)
        """)

        # Preserve legacy stations table if needed for backwards compatibility
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                zone TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()

def get_or_create_city(name: str, state: str = "", country: str = "", country_code: str = "", 
                        latitude: float = 0.0, longitude: float = 0.0, tz_name: str = "UTC") -> int:
    """Retrieve an existing city ID or insert a new city if it doesn't exist."""
    db = get_db()
    cursor = db.cursor()
    
    # Sanitize and bound text lengths
    clean_name = str(name)[:100].strip() if name else "Unknown Location"
    clean_state = str(state)[:100].strip() if state else ""
    clean_country = str(country)[:100].strip() if country else ""
    clean_country_code = str(country_code)[:10].strip() if country_code else ""
    clean_tz = str(tz_name)[:50].strip() if tz_name else "UTC"
    
    # Look for existing city by coordinates or name
    cursor.execute("""
        SELECT id FROM cities 
        WHERE (ABS(latitude - ?) < 0.05 AND ABS(longitude - ?) < 0.05)
           OR (name = ? AND (? = '' OR country = ?))
        ORDER BY id ASC
        LIMIT 1
    """, (latitude, longitude, clean_name, clean_country, clean_country))
    row = cursor.fetchone()
    
    if row:
        return row["id"]
    
    # Insert new city
    cursor.execute("""
        INSERT INTO cities (name, state, country, country_code, latitude, longitude, timezone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (clean_name, clean_state, clean_country, clean_country_code, latitude, longitude, clean_tz))
    db.commit()
    return cursor.lastrowid

def save_observation(city_id: int, obs_data: dict, data_source: str = "Open-Meteo") -> bool:
    """Save an environmental observation record, avoiding duplicates via INSERT OR IGNORE."""
    db = get_db()
    cursor = db.cursor()
    
    observation_time = obs_data.get("time") or obs_data.get("observation_time")
    if not observation_time:
        observation_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
        
    try:
        cursor.execute("""
            INSERT OR IGNORE INTO environmental_observations (
                city_id, observation_time, temperature, relative_humidity,
                precipitation, rain, wind_speed, aqi, aqi_scale,
                european_aqi, pm25, pm10, no2, so2, co, ozone, data_source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            city_id,
            observation_time,
            obs_data.get("temperature"),
            obs_data.get("relative_humidity"),
            obs_data.get("precipitation"),
            obs_data.get("rain"),
            obs_data.get("wind_speed"),
            obs_data.get("aqi"),
            obs_data.get("aqi_scale", "US EPA"),
            obs_data.get("european_aqi"),
            obs_data.get("pm25"),
            obs_data.get("pm10"),
            obs_data.get("no2"),
            obs_data.get("so2"),
            obs_data.get("co"),
            obs_data.get("ozone"),
            data_source
        ))
        db.commit()
        return cursor.rowcount > 0
    except Exception as e:
        logger.error("Error saving observation to SQLite for city_id %s: %s", city_id, e)
        try:
            db.rollback()
        except Exception:
            pass
        return False

def get_latest_observation(city_id: int) -> dict | None:
    """Get the most recent observation stored for a city."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT * FROM environmental_observations
        WHERE city_id = ?
        ORDER BY observation_time DESC
        LIMIT 1
    """, (city_id,))
    row = cursor.fetchone()
    return dict(row) if row else None

def get_saved_cities(limit: int = 15) -> list[dict]:
    """Retrieve saved cities along with their latest observation time, grouped by coordinates to avoid duplicates."""
    try:
        safe_limit = max(1, min(int(limit), 100))
    except (ValueError, TypeError):
        safe_limit = 15

    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT c.*, 
               MAX(o.observation_time) as last_observation_time,
               o.aqi as last_aqi,
               o.temperature as last_temperature
        FROM cities c
        LEFT JOIN environmental_observations o ON c.id = o.city_id
        GROUP BY ROUND(c.latitude, 2), ROUND(c.longitude, 2)
        ORDER BY MAX(COALESCE(o.observation_time, c.created_at)) DESC
        LIMIT ?
    """, (safe_limit,))
    rows = cursor.fetchall()
    return [dict(r) for r in rows]

def check_db_health():
    """Verify SQLite database connection, table status and records count."""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) FROM cities")
        cities_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM environmental_observations")
        obs_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM city_monthly_history")
        monthly_count = cursor.fetchone()[0]
        return {
            "status": "connected",
            "cities_count": cities_count,
            "observations_count": obs_count,
            "monthly_history_count": monthly_count
        }
    except Exception as e:
        logger.error("SQLite health check failure: %s", e)
        return {"status": "error", "message": "Database query execution failed"}

def save_monthly_history(city_id: int, records: list[dict], data_source: str = "Open-Meteo Historical Archive (ERA5 Reanalysis)") -> int:
    """
    Store or update monthly weather records for a city in SQLite.
    Avoids duplicate API downloads and uses INSERT OR REPLACE for idempotence.
    """
    if not records:
        return 0
    db = get_db()
    cursor = db.cursor()
    inserted = 0
    for r in records:
        try:
            t_mean = r.get("temperature_mean") if r.get("temperature_mean") is not None else r.get("temperature_2m_mean")
            if t_mean is None:
                continue
            t_min = r.get("temperature_min") if r.get("temperature_min") is not None else r.get("temperature_2m_min")
            t_max = r.get("temperature_max") if r.get("temperature_max") is not None else r.get("temperature_2m_max")
            p_sum = r.get("precipitation_sum", 0.0)

            cursor.execute("""
                INSERT INTO city_monthly_history (
                    city_id, year, month, year_month,
                    temperature_mean, temperature_min, temperature_max,
                    precipitation_sum, data_source
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(city_id, year, month) DO UPDATE SET
                    temperature_mean = excluded.temperature_mean,
                    temperature_min = excluded.temperature_min,
                    temperature_max = excluded.temperature_max,
                    precipitation_sum = excluded.precipitation_sum,
                    data_source = excluded.data_source
            """, (
                city_id,
                int(r["year"]),
                int(r["month"]),
                str(r["year_month"]),
                float(t_mean),
                float(t_min) if t_min is not None else None,
                float(t_max) if t_max is not None else None,
                float(p_sum) if p_sum is not None else 0.0,
                data_source
            ))
            inserted += 1
        except Exception as err:
            logger.warning("Error saving monthly history record for city_id %s: %s", city_id, err)
    db.commit()
    return inserted
    db.commit()
    return inserted

def get_monthly_history(city_id: int, latitude: float = None, longitude: float = None) -> list[dict]:
    """
    Retrieve chronologically ordered monthly climate records for a city.
    If the direct city_id has fewer than 18 records, falls back to proximity matching
    using the city's coordinates to handle duplicate city entities seamlessly.
    """
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT year, month, year_month, 
               temperature_mean, temperature_min, temperature_max, 
               precipitation_sum, data_source, created_at
        FROM city_monthly_history
        WHERE city_id = ?
        ORDER BY year ASC, month ASC
    """, (city_id,))
    rows = cursor.fetchall()
    if rows and len(rows) >= 18:
        return [dict(r) for r in rows]

    # Proximity fallback using explicit or city coordinates
    c_lat = latitude
    c_lon = longitude
    if c_lat is None or c_lon is None:
        cursor.execute("SELECT latitude, longitude FROM cities WHERE id = ?", (city_id,))
        c_row = cursor.fetchone()
        if c_row:
            c_lat = c_row["latitude"]
            c_lon = c_row["longitude"]

    if c_lat is not None and c_lon is not None:
        cursor.execute("""
            SELECT m.year, m.month, m.year_month, 
                   m.temperature_mean, m.temperature_min, m.temperature_max, 
                   m.precipitation_sum, m.data_source, m.created_at
            FROM city_monthly_history m
            JOIN cities c ON m.city_id = c.id
            WHERE ABS(c.latitude - ?) < 0.05 AND ABS(c.longitude - ?) < 0.05
            GROUP BY m.year, m.month
            ORDER BY m.year ASC, m.month ASC
        """, (c_lat, c_lon))
        prox_rows = cursor.fetchall()
        if prox_rows and len(prox_rows) >= 18:
            return [dict(r) for r in prox_rows]

    return [dict(r) for r in rows]

def get_monthly_history_count(city_id: int) -> int:
    """Return number of cached monthly climate records for a city."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM city_monthly_history WHERE city_id = ?", (city_id,))
    row = cursor.fetchone()
    return row[0] if row else 0
