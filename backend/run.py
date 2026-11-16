import os
import sys
import socket
import logging
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.config import get_config_by_name

config_class = get_config_by_name()
app = create_app(config_class)

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check whether a TCP port is already in use by another application."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False

if __name__ == "__main__":
    port = int(os.environ.get("PORT", app.config.get("PORT", 5001)))
    host = os.environ.get("HOST", app.config.get("HOST", "127.0.0.1"))
    
    # Check for port collisions
    if is_port_in_use(port, host):
        print("=" * 70, flush=True)
        print(f"[CRITICAL WARNING] Port {port} is ALREADY IN USE by another process!", flush=True)
        print("On macOS, AirPlay Receiver frequently occupies port 5000.", flush=True)
        print("On Windows, another server or background task may be running.", flush=True)
        print(f"Please terminate the process on port {port} or configure PORT in backend/.env.", flush=True)
        print("=" * 70, flush=True)

    # Never enable debug if environment is production
    is_prod = app.config.get("ENV") == "production"
    debug = False if is_prod else app.config.get("DEBUG", False)
    
    logging.info("Starting EcoVision Backend API on http://%s:%d (env=%s, debug=%s)", host, port, app.config.get("ENV"), debug)
    print(f"Starting EcoVision Backend API on http://{host}:{port} [Environment: {app.config.get('ENV')}]", flush=True)
    app.run(host=host, port=port, debug=debug, use_reloader=False)
