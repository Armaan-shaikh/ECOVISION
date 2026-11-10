"""
EcoVision Lightweight In-Memory Rate Limiter
Features:
- Thread-safe sliding window tracking per client IP
- Memory-safe automatic cleanup of expired IP timestamps
- Zero external service dependencies (no Redis required for college project)
- Respects RATELIMIT_ENABLED configuration for automated testing
"""

import time
import threading
from functools import wraps
from flask import request, jsonify, current_app

_LOCK = threading.Lock()
_IP_REQUEST_LOGS: dict[str, list[float]] = {}
_LAST_CLEANUP_TIME = time.time()
_CLEANUP_INTERVAL_SECONDS = 300 # Clean stale records every 5 minutes

def reset_rate_limiters() -> None:
    """Clear all rate limiting state (used for testing)."""
    with _LOCK:
        _IP_REQUEST_LOGS.clear()

def _get_client_ip() -> str:
    """Extract real client IP safely, considering reverse proxies."""
    # Check X-Forwarded-For if behind a trusted proxy
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.remote_addr or "127.0.0.1"

def _cleanup_expired_records(now: float, max_window: float = 300.0) -> None:
    """Remove IPs that have no requests within the max window."""
    global _LAST_CLEANUP_TIME
    if now - _LAST_CLEANUP_TIME < _CLEANUP_INTERVAL_SECONDS:
        return

    _LAST_CLEANUP_TIME = now
    stale_ips = []
    for ip, timestamps in _IP_REQUEST_LOGS.items():
        while timestamps and timestamps[0] < (now - max_window):
            timestamps.pop(0)
        if not timestamps:
            stale_ips.append(ip)

    for ip in stale_ips:
        _IP_REQUEST_LOGS.pop(ip, None)

def check_rate_limit(key: str, max_requests: int, window_seconds: float) -> tuple[bool, int]:
    """
    Check if a key (IP or identifier) has exceeded the max_requests in window_seconds.
    Returns:
        tuple[bool, int]: (is_allowed, retry_after_seconds)
    """
    now = time.time()
    with _LOCK:
        _cleanup_expired_records(now, max_window=window_seconds * 2)

        if key not in _IP_REQUEST_LOGS:
            _IP_REQUEST_LOGS[key] = []

        timestamps = _IP_REQUEST_LOGS[key]
        # Purge timestamps outside the active sliding window
        window_start = now - window_seconds
        while timestamps and timestamps[0] < window_start:
            timestamps.pop(0)

        if len(timestamps) >= max_requests:
            earliest = timestamps[0]
            retry_after = max(1, int(window_seconds - (now - earliest)))
            return False, retry_after

        timestamps.append(now)
        return True, 0

def rate_limit(max_requests: int = 60, window_seconds: float = 60.0):
    """
    Flask route decorator to enforce rate limits.
    Returns standard HTTP 429 when quota is exceeded.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Bypass rate limiting if disabled in config (e.g. testing)
            if not current_app.config.get("RATELIMIT_ENABLED", True):
                return fn(*args, **kwargs)

            client_ip = _get_client_ip()
            endpoint_key = f"{request.endpoint}:{client_ip}"
            
            allowed, retry_after = check_rate_limit(endpoint_key, max_requests, window_seconds)
            if not allowed:
                response = jsonify({
                    "status": "error",
                    "code": 429,
                    "message": f"Rate limit exceeded. Too many requests. Please wait {retry_after} seconds before retrying.",
                    "retry_after_seconds": retry_after
                })
                response.status_code = 429
                response.headers["Retry-After"] = str(retry_after)
                return response

            return fn(*args, **kwargs)
        return wrapper
    return decorator
