"""
EcoVision Central Pollution Control Board (CPCB) Ground Monitoring Service
Implements India's National Air Quality Index (NAQI / CPCB) Methodology:
- Ingests official live CAAQMS feeds from https://airquality.cpcb.gov.in/caaqms/rss_feed
- Matches nearest ground monitoring station by geographic coordinates (Haversine distance)
- Extracts individual pollutant sub-indices (PM2.5, PM10, NO2, NH3, SO2, CO, O3)
- Validates CPCB completeness: Minimum 3 pollutants with at least one PM (PM2.5 or PM10)
- Identifies predominant pollutant and reports both Real-Time Hourly Peak and 24-Hour Average
- Clearly distinguishes ground station observations from numerical atmospheric models (CAMS)
"""

from datetime import datetime, timezone
import math
import urllib.request
import xml.etree.ElementTree as ET

USER_AGENT = "EcoVision/1.0 (Environmental Analytics; +https://ecovision.local)"
CPCB_RSS_URL = "https://airquality.cpcb.gov.in/caaqms/rss_feed"

# Cache CPCB XML feed in memory to prevent repeated 400KB downloads
_CPCB_FEED_CACHE = {
    "root": None,
    "timestamp": None,
    "ttl_seconds": 900 # 15 minutes TTL
}

# Official CPCB Breakpoints and Health Impact Categories
CPCB_CATEGORIES = [
    (0, 50, "Good", "emerald", "Minimal health impact. Air quality is considered safe."),
    (51, 100, "Satisfactory", "teal", "Minor breathing discomfort to sensitive people."),
    (101, 200, "Moderate", "amber", "Breathing discomfort to people with lungs, asthma, and heart diseases."),
    (201, 300, "Poor", "orange", "Breathing discomfort to most people on prolonged exposure."),
    (301, 400, "Very Poor", "rose", "Respiratory illness on prolonged exposure. Significant health risks."),
    (401, 500, "Severe", "purple", "Affects healthy people and seriously impacts those with existing medical conditions.")
]

# Official CPCB Pollutant Breakpoint Table (Concentration -> Sub-Index 0-500)
# (C_lo, C_hi, I_lo, I_hi)
CPCB_BREAKPOINTS = {
    "PM2.5": [(0, 30, 0, 50), (30.1, 60, 51, 100), (60.1, 90, 101, 200), (90.1, 120, 201, 300), (120.1, 250, 301, 400), (250.1, 500, 401, 500)],
    "PM10": [(0, 50, 0, 50), (50.1, 100, 51, 100), (100.1, 250, 101, 200), (250.1, 350, 201, 300), (350.1, 430, 301, 400), (430.1, 600, 401, 500)],
    "NO2": [(0, 40, 0, 50), (40.1, 80, 51, 100), (80.1, 180, 101, 200), (180.1, 280, 201, 300), (280.1, 400, 301, 400), (400.1, 600, 401, 500)],
    "SO2": [(0, 40, 0, 50), (40.1, 80, 51, 100), (80.1, 380, 101, 200), (380.1, 800, 201, 300), (801.1, 1600, 301, 400), (1600.1, 2000, 401, 500)],
    "CO": [(0, 1.0, 0, 50), (1.01, 2.0, 51, 100), (2.01, 10.0, 101, 200), (10.01, 17.0, 201, 300), (17.01, 34.0, 301, 400), (34.01, 50.0, 401, 500)],
    "OZONE": [(0, 50, 0, 50), (50.1, 100, 51, 100), (100.1, 168, 101, 200), (168.1, 208, 201, 300), (208.1, 748, 301, 400), (748.1, 1000, 401, 500)],
    "NH3": [(0, 200, 0, 50), (200.1, 400, 51, 100), (400.1, 800, 101, 200), (800.1, 1200, 201, 300), (1200.1, 1800, 301, 400), (1800.1, 2400, 401, 500)]
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two geographic coordinates."""
    R = 6371.0 # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def get_cpcb_category(aqi_val: int | float | None) -> dict:
    """Classify CPCB AQI value into official National Air Quality Index category."""
    if aqi_val is None or pd_is_nan(aqi_val):
        return {"category": "Unavailable", "color": "emerald", "description": "Insufficient monitored pollutants to compute official CPCB AQI."}
    
    val = round(float(aqi_val))
    if val <= 50:
        return {"category": "Good", "color": "emerald", "description": "Minimal health impact. Clean ambient air."}
    elif val <= 100:
        return {"category": "Satisfactory", "color": "teal", "description": "Minor breathing discomfort to sensitive individuals."}
    elif val <= 200:
        return {"category": "Moderate", "color": "amber", "description": "Breathing discomfort to people with asthma, lung, and heart diseases."}
    elif val <= 300:
        return {"category": "Poor", "color": "orange", "description": "Breathing discomfort to most people on prolonged outdoor exposure."}
    elif val <= 400:
        return {"category": "Very Poor", "color": "rose", "description": "Respiratory illness to people on prolonged exposure. Pronounced in sensitive groups."}
    else:
        return {"category": "Severe", "color": "purple", "description": "Severe respiratory effects on healthy people; serious risk for vulnerable populations."}

def pd_is_nan(val) -> bool:
    """Check if value is NaN or None without requiring external imports."""
    if val is None:
        return True
    try:
        return math.isnan(float(val))
    except (ValueError, TypeError):
        return False

def sub_index_to_concentration(pollutant: str, sub_index: int | float | None) -> float | None:
    """
    Invert CPCB piecewise linear sub-index formula to estimate pollutant concentration.
    C = C_lo + ((I - I_lo) / (I_hi - I_lo)) * (C_hi - C_lo)
    """
    if sub_index is None:
        return None
    p_key = pollutant.upper().replace(".", "")
    matched_key = None
    for k in CPCB_BREAKPOINTS:
        if k.upper().replace(".", "") == p_key:
            matched_key = k
            break
    if not matched_key:
        return None

    breakpoints = CPCB_BREAKPOINTS[matched_key]
    val = float(sub_index)
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if i_lo <= val <= i_hi:
            if i_hi == i_lo:
                return round(c_lo, 1)
            conc = c_lo + ((val - i_lo) / (i_hi - i_lo)) * (c_hi - c_lo)
            return round(conc, 1)

    if val > breakpoints[-1][3]:
        return round(breakpoints[-1][1], 1)
    return 0.0

def calculate_cpcb_sub_index(pollutant: str, conc: float) -> int | None:
    """Calculate CPCB sub-index for a pollutant concentration using official breakpoints."""
    if conc is None or conc < 0:
        return None
    
    p_key = pollutant.upper().replace(".", "")
    matched_key = None
    for k in CPCB_BREAKPOINTS:
        if k.upper().replace(".", "") == p_key:
            matched_key = k
            break
            
    if not matched_key:
        return None

    breakpoints = CPCB_BREAKPOINTS[matched_key]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= conc <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (conc - c_lo) + i_lo)

    if conc > breakpoints[-1][1]:
        return 500
    return 0

def fetch_cpcb_live_xml() -> ET.Element | None:
    """Fetch live CPCB RSS feed, utilizing a 15-minute in-memory cache to conserve bandwidth."""
    now = datetime.now(timezone.utc)
    if _CPCB_FEED_CACHE["root"] is not None and _CPCB_FEED_CACHE["timestamp"] is not None:
        age = (now - _CPCB_FEED_CACHE["timestamp"]).total_seconds()
        if age < _CPCB_FEED_CACHE["ttl_seconds"]:
            return _CPCB_FEED_CACHE["root"]

    try:
        req = urllib.request.Request(
            CPCB_RSS_URL,
            headers={"User-Agent": USER_AGENT}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status == 200:
                raw_xml = response.read()
                root = ET.fromstring(raw_xml)
                _CPCB_FEED_CACHE["root"] = root
                _CPCB_FEED_CACHE["timestamp"] = now
                return root
    except Exception as e:
        print(f"Warning: Failed to retrieve live CPCB CAAQMS feed: {e}")
        # If cache exists even if expired, use as fallback during temporary network hiccup
        if _CPCB_FEED_CACHE["root"] is not None:
            return _CPCB_FEED_CACHE["root"]

    return None

def parse_station_sub_indices(station_elem: ET.Element) -> tuple[dict, int | None, str | None, int | None, str | None]:
    """
    Extract individual pollutant sub-indices from a CPCB station element.
    Returns:
    - pollutants dict
    - max_hourly_sub_index
    - dominant_hourly_param
    - max_24h_sub_index
    - dominant_24h_param
    """
    pollutants = {}
    hourly_max = None
    hourly_dominant = None
    avg_24h_max = None
    avg_24h_dominant = None

    for p in station_elem.findall("Pollutant_Index"):
        p_id = p.attrib.get("id")
        if not p_id:
            continue

        raw_avg = p.attrib.get("Avg")
        raw_hr = p.attrib.get("Hourly_sub_index")
        raw_min = p.attrib.get("Min")
        raw_max = p.attrib.get("Max")

        # Parse numeric sub-indices
        sub_avg = int(raw_avg) if raw_avg and raw_avg.isdigit() else None
        sub_hr = int(raw_hr) if raw_hr and raw_hr.isdigit() else None
        sub_min = int(raw_min) if raw_min and raw_min.isdigit() else None
        sub_max = int(raw_max) if raw_max and raw_max.isdigit() else None

        unit = "mg/m³" if p_id.upper() == "CO" else "µg/m³"
        conc_hr = sub_index_to_concentration(p_id, sub_hr)
        conc_24h = sub_index_to_concentration(p_id, sub_avg)

        pollutant_names = {
            "PM2.5": "Fine Particulate Matter (PM2.5)",
            "PM10": "Respirable Suspended Particulate Matter (PM10)",
            "NO2": "Nitrogen Dioxide (NO2)",
            "NH3": "Ammonia (NH3)",
            "SO2": "Sulphur Dioxide (SO2)",
            "CO": "Carbon Monoxide (CO)",
            "OZONE": "Ozone (O3)"
        }

        pollutants[p_id] = {
            "pollutant": p_id,
            "name": pollutant_names.get(p_id, p_id),
            "sub_index_24h": sub_avg,
            "sub_index_hourly": sub_hr,
            "min_sub_index": sub_min,
            "max_sub_index": sub_max,
            "concentration_hourly": conc_hr,
            "concentration_24h": conc_24h,
            "unit": unit,
            "category_hourly": get_cpcb_category(sub_hr)["category"] if sub_hr is not None else "Unavailable",
            "category_24h": get_cpcb_category(sub_avg)["category"] if sub_avg is not None else "Unavailable"
        }

        # Track dominant hourly parameter
        if sub_hr is not None:
            if hourly_max is None or sub_hr > hourly_max:
                hourly_max = sub_hr
                hourly_dominant = p_id

        # Track dominant 24h average parameter
        if sub_avg is not None:
            if avg_24h_max is None or sub_avg > avg_24h_max:
                avg_24h_max = sub_avg
                avg_24h_dominant = p_id

    return pollutants, hourly_max, hourly_dominant, avg_24h_max, avg_24h_dominant

def fetch_cpcb_ground_data(latitude: float, longitude: float, city_name: str = "", country: str = "") -> dict:
    """
    Primary interface for Indian Ground Monitoring Air Quality (CPCB / State Boards).
    - Checks geographic validity (India territory)
    - Retrieves live CPCB CAAQMS stations
    - Matches closest monitoring station within radius
    - Computes official CPCB AQI, hourly sub-index, and checks completeness criteria
    """
    # 1. Geographic check: only Indian coordinates (approx 6°N - 38°N, 68°E - 98°E) or explicit country
    is_india = (
        (country and "india" in country.lower()) or
        (6.0 <= latitude <= 38.0 and 68.0 <= longitude <= 98.0)
    )
    if not is_india:
        return {
            "status": "not_applicable",
            "message": "CPCB ground monitoring network operates exclusively within Indian national territory.",
            "data_source": "Central Pollution Control Board (CPCB)"
        }

    root = fetch_cpcb_live_xml()
    if root is None:
        return {
            "status": "unavailable",
            "message": f"Real-time CPCB ground telemetry server is temporarily unreachable for {city_name}.",
            "data_source": "Central Pollution Control Board (CPCB)"
        }

    # 2. Find matching stations within 50km
    matching_stations = []
    clean_city_hint = city_name.strip().lower() if city_name else ""

    for station in root.findall(".//Station"):
        try:
            s_lat = float(station.attrib.get("latitude", 0))
            s_lon = float(station.attrib.get("longitude", 0))
            st_id = station.attrib.get("id", "")
            if not s_lat or not s_lon or not st_id:
                continue

            dist = haversine_distance(latitude, longitude, s_lat, s_lon)
            if dist <= 50.0: # within 50 km radius
                matching_stations.append((dist, station))
        except (ValueError, TypeError):
            continue

    if not matching_stations:
        return {
            "status": "unavailable",
            "message": f"No active CPCB / DPCC continuous monitoring station (CAAQMS) found within 50 km of {city_name}.",
            "data_source": "Central Pollution Control Board (CPCB)"
        }

    # Sort stations by distance (closest first)
    matching_stations.sort(key=lambda x: x[0])

    # 3. Select nearest station with valid CPCB completeness
    # CPCB rule: at least 3 pollutants monitored, with at least one PM (PM2.5 or PM10)
    selected_station = None
    selected_dist = 0.0

    for dist, st in matching_stations:
        pollutants, _, _, _, _ = parse_station_sub_indices(st)
        has_pm = "PM2.5" in pollutants or "PM10" in pollutants
        valid_count = sum(1 for p in pollutants.values() if p["sub_index_hourly"] is not None or p["sub_index_24h"] is not None)
        if has_pm and valid_count >= 3:
            selected_station = st
            selected_dist = dist
            break

    # If no station with complete data, take closest reporting station
    if not selected_station and matching_stations:
        selected_dist, selected_station = matching_stations[0]

    if not selected_station:
        return {
            "status": "unavailable",
            "message": f"No active ground monitoring stations currently reporting valid data near {city_name}.",
            "data_source": "Central Pollution Control Board (CPCB)"
        }

    st_name = selected_station.attrib.get("id", "Unknown Station")
    last_update = selected_station.attrib.get("lastupdate", "Recent")
    st_lat = float(selected_station.attrib.get("latitude", latitude))
    st_lon = float(selected_station.attrib.get("longitude", longitude))

    aqi_el = selected_station.find("Air_Quality_Index")
    official_24h_val = None
    official_predom = None
    if aqi_el is not None:
        v_str = aqi_el.attrib.get("Value")
        if v_str and v_str.isdigit():
            official_24h_val = int(v_str)
        official_predom = aqi_el.attrib.get("Predominant_Parameter")

    # Parse all pollutant sub-indices
    pollutants, hr_max, hr_dom, avg_max, avg_dom = parse_station_sub_indices(selected_station)

    # 4. Enforce CPCB Completeness Requirement:
    # Minimum 3 valid pollutants, with at least one PM (PM2.5 or PM10)
    has_pm25 = "PM2.5" in pollutants and (pollutants["PM2.5"]["sub_index_hourly"] is not None or pollutants["PM2.5"]["sub_index_24h"] is not None)
    has_pm10 = "PM10" in pollutants and (pollutants["PM10"]["sub_index_hourly"] is not None or pollutants["PM10"]["sub_index_24h"] is not None)
    valid_pollutant_count = sum(1 for p in pollutants.values() if p["sub_index_hourly"] is not None or p["sub_index_24h"] is not None)

    completeness_satisfied = (has_pm25 or has_pm10) and valid_pollutant_count >= 3

    if not completeness_satisfied:
        return {
            "status": "insufficient_data",
            "message": f"Data completeness criteria not met at station {st_name}. CPCB requires minimum 3 valid pollutants with PM2.5 or PM10 (found {valid_pollutant_count} pollutants).",
            "station": {
                "name": st_name,
                "distance_km": round(selected_dist, 1),
                "latitude": st_lat,
                "longitude": st_lon,
                "last_updated": last_update
            },
            "pollutant_sub_indices": pollutants,
            "data_source": "Central Pollution Control Board (CPCB)"
        }

    # Extract primary ground AQI
    # Note: CPCB reports 24-hr average as official daily value, while Indian real-time dashboards
    # report the real-time hourly peak sub-index (e.g. 130-160+ during evening peaks).
    # We provide both clearly:
    final_hourly_aqi = hr_max
    final_24h_aqi = official_24h_val if official_24h_val is not None else avg_max

    # Primary displayed AQI is the real-time hourly peak sub-index (or 24h average if hourly unavailable)
    primary_aqi = final_hourly_aqi if final_hourly_aqi is not None else final_24h_aqi
    primary_predom = hr_dom if final_hourly_aqi is not None else (official_predom or avg_dom or "PM2.5")

    cat_info = get_cpcb_category(primary_aqi)

    # Parse operator agency
    operator = "CPCB / State Pollution Control Board"
    if "DPCC" in st_name:
        operator = "Delhi Pollution Control Committee (DPCC)"
    elif "KSPCB" in st_name:
        operator = "Karnataka State Pollution Control Board (KSPCB)"
    elif "MPCB" in st_name:
        operator = "Maharashtra Pollution Control Board (MPCB)"
    elif "UPPCB" in st_name:
        operator = "Uttar Pradesh Pollution Control Board (UPPCB)"
    elif "APPCB" in st_name:
        operator = "Andhra Pradesh Pollution Control Board (APPCB)"
    elif "IITM" in st_name:
        operator = "Indian Institute of Tropical Meteorology (IITM / SAFAR)"
    elif "CPCB" in st_name:
        operator = "Central Pollution Control Board (CPCB)"

    return {
        "status": "success",
        "aqi": primary_aqi,
        "aqi_scale": "India National AQI (CPCB)",
        "aqi_category": cat_info["category"],
        "aqi_color": cat_info["color"],
        "aqi_description": cat_info["description"],
        "predominant_pollutant": primary_predom,
        "hourly_peak_aqi": final_hourly_aqi,
        "running_24h_aqi": final_24h_aqi,
        "station": {
            "name": st_name,
            "operator": operator,
            "distance_km": round(selected_dist, 1),
            "latitude": st_lat,
            "longitude": st_lon,
            "monitoring_type": "Continuous Ambient Air Quality Monitoring Station (CAAQMS)",
            "last_updated": f"{last_update} IST"
        },
        "pollutant_sub_indices": pollutants,
        "completeness": {
            "valid_pollutants_count": valid_pollutant_count,
            "has_particulate_matter": has_pm25 or has_pm10,
            "standard_met": True
        },
        "data_source": "Central Pollution Control Board (CPCB) Official Ground Network",
        "timestamp": f"{last_update} IST"
    }
