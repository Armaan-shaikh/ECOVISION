"""
EcoVision Input Validation & Sanitization Service
Protects endpoints against:
- NaN, Infinity, and out-of-range coordinates
- Oversized text fields and buffer exhaustion
- Control characters and script injection
- Invalid parameter types
"""

import math
import re

# Simple regex to strip control characters and dangerous HTML characters
TAG_RE = re.compile(r"<[^>]+>")
UNSAFE_CHARS_RE = re.compile(r"[\x00-\x1f\x7f-\x9f]")

class ValidationError(Exception):
    """Custom exception raised for client input validation failures."""
    def __init__(self, message: str, field: str | None = None):
        super().__init__(message)
        self.message = message
        self.field = field

def validate_coordinates(lat_val, lon_val) -> tuple[float, float]:
    """
    Strictly validates latitude and longitude.
    Rules:
    - Must not be None or empty
    - Must be convertible to finite float (rejects NaN, +Inf, -Inf)
    - Latitude must be between -90.0 and 90.0
    - Longitude must be between -180.0 and 180.0
    Returns:
        tuple[float, float]: validated (latitude, longitude)
    Raises:
        ValidationError: if validation fails
    """
    if lat_val is None or lon_val is None:
        raise ValidationError("Latitude and longitude coordinates are required.", field="coordinates")

    # Handle string representations of special floats
    lat_str = str(lat_val).strip().lower()
    lon_str = str(lon_val).strip().lower()
    if not lat_str or not lon_str:
        raise ValidationError("Latitude and longitude coordinates are required.", field="coordinates")

    if lat_str in ("nan", "inf", "-inf", "+inf") or lon_str in ("nan", "inf", "-inf", "+inf"):
        raise ValidationError("Coordinates cannot be NaN or Infinity.", field="coordinates")

    try:
        lat = float(lat_val)
        lon = float(lon_val)
    except (ValueError, TypeError):
        raise ValidationError("Coordinates must be valid numeric values.", field="coordinates")

    if math.isnan(lat) or math.isinf(lat):
        raise ValidationError("Latitude cannot be NaN or Infinity.", field="latitude")
    if math.isnan(lon) or math.isinf(lon):
        raise ValidationError("Longitude cannot be NaN or Infinity.", field="longitude")

    if not (-90.0 <= lat <= 90.0):
        raise ValidationError("Latitude must be between -90.0 and 90.0 degrees.", field="latitude")
    if not (-180.0 <= lon <= 180.0):
        raise ValidationError("Longitude must be between -180.0 and 180.0 degrees.", field="longitude")

    return round(lat, 6), round(lon, 6)

def sanitize_text(value: any, max_length: int = 100, default: str = "") -> str:
    """
    Sanitize general text input (city names, state names, country names):
    - Trims whitespace
    - Strips HTML tags and unprintable control characters
    - Clamps to max_length
    """
    if value is None:
        return default
    text = str(value).strip()
    text = TAG_RE.sub("", text)
    text = UNSAFE_CHARS_RE.sub("", text)
    if len(text) > max_length:
        text = text[:max_length].strip()
    return text if text else default

def validate_city_search_query(query: any, min_length: int = 2, max_length: int = 100) -> str:
    """
    Validate and sanitize city search query string.
    Enforces non-empty, minimum length (2), and maximum length (100).
    """
    if query is None or not str(query).strip():
        raise ValidationError("Search query cannot be empty.", field="q")
    
    raw_stripped = str(query).strip()
    if len(raw_stripped) < min_length:
        raise ValidationError(f"Search query must be at least {min_length} characters.", field="q")
    if len(raw_stripped) > max_length:
        raise ValidationError(f"Search query cannot exceed {max_length} characters.", field="q")
        
    return sanitize_text(raw_stripped, max_length=max_length)

def validate_days_param(days_val: any, allowed=(7, 14, 30), default: int = 7) -> int:
    """
    Validate historical trend analysis period.
    Raises ValidationError if not in allowed set.
    """
    if days_val is None or days_val == "":
        return default
    try:
        val = int(days_val)
        if val not in allowed:
            raise ValidationError(f"Parameter 'days' must be one of {allowed}.", field="days")
        return val
    except (ValueError, TypeError):
        raise ValidationError(f"Parameter 'days' must be a valid integer ({allowed}).", field="days")

def validate_limit_param(limit_val: any, min_val: int = 1, max_val: int = 50, default: int = 15) -> int:
    """Validate integer limit parameter within safe bounds."""
    if limit_val is None or limit_val == "":
        return default
    try:
        val = int(limit_val)
        return max(min_val, min(val, max_val))
    except (ValueError, TypeError):
        return default
